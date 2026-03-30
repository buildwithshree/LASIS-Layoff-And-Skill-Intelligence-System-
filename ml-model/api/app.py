from flask import Flask, request, jsonify
import joblib
import numpy as np
import os
import logging
from waitress import serve

# ── Setup ─────────────────────────────────────────────────────
app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")

# ── Load models on startup ────────────────────────────────────
try:
    model = joblib.load(os.path.join(MODEL_DIR, "risk_model.pkl"))
    le_industry = joblib.load(os.path.join(MODEL_DIR, "le_industry.pkl"))
    le_stage = joblib.load(os.path.join(MODEL_DIR, "le_stage.pkl"))
    le_country = joblib.load(os.path.join(MODEL_DIR, "le_country.pkl"))
    logger.info("All models loaded successfully")
except Exception as e:
    logger.error(f"Failed to load models: {e}")
    raise

# ── Helper: safe label encode ─────────────────────────────────
def safe_encode(encoder, value):
    if value in encoder.classes_:
        return encoder.transform([value])[0]
    return 0  # fallback for unseen labels

# ── Route: Health check ───────────────────────────────────────
@app.route("/ml/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "message": "LASIS ML API is running"})

# ── Route: Predict risk ───────────────────────────────────────
@app.route("/ml/predict-risk", methods=["POST"])
def predict_risk():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "Request body is required"}), 400

        required = ["total_laid_off", "funds_raised", "industry", "stage", "country"]
        for field in required:
            if field not in data:
                return jsonify({"success": False, "message": f"Missing field: {field}"}), 400

        total_laid_off = float(data["total_laid_off"])
        funds_raised = float(data["funds_raised"])
        industry_enc = safe_encode(le_industry, data["industry"])
        stage_enc = safe_encode(le_stage, data["stage"])
        country_enc = safe_encode(le_country, data["country"])

        features = np.array([[total_laid_off, funds_raised, industry_enc, stage_enc, country_enc]])
        prediction = model.predict(features)[0]

        prediction = float(np.clip(prediction, 0.0, 1.0))

        if prediction >= 0.7:
            risk_level = "critical"
        elif prediction >= 0.5:
            risk_level = "high"
        elif prediction >= 0.25:
            risk_level = "medium"
        else:
            risk_level = "low"

        logger.info(f"Prediction: {prediction:.4f} → {risk_level}")

        return jsonify({
            "success": True,
            "predicted_layoff_percentage": round(prediction, 4),
            "risk_level": risk_level,
            "input_received": data
        })

    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

# ── Route: Skill match ────────────────────────────────────────
@app.route("/ml/skill-match", methods=["POST"])
def skill_match():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "Request body is required"}), 400

        required = ["student_skills", "required_skills"]
        for field in required:
            if field not in data:
                return jsonify({"success": False, "message": f"Missing field: {field}"}), 400

        student_skills = [s.lower().strip() for s in data["student_skills"]]
        required_skills = [s.lower().strip() for s in data["required_skills"]]

        if not required_skills:
            return jsonify({"success": False, "message": "required_skills cannot be empty"}), 400

        matched = [s for s in required_skills if s in student_skills]
        missing = [s for s in required_skills if s not in student_skills]
        match_score = round(len(matched) / len(required_skills) * 100, 2)

        logger.info(f"Skill match: {match_score}% ({len(matched)}/{len(required_skills)})")

        return jsonify({
            "success": True,
            "match_score": match_score,
            "matched_skills": matched,
            "missing_skills": missing,
            "total_required": len(required_skills),
            "total_matched": len(matched)
        })

    except Exception as e:
        logger.error(f"Skill match error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

# ── Run ───────────────────────────────────────────────────────
if __name__ == "__main__":
    logger.info("Starting LASIS ML API with Waitress (production server)...")
    serve(app, host="0.0.0.0", port=5000, threads=4)
