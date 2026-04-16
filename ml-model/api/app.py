from flask import Flask, request, jsonify
import joblib
import numpy as np
import os
import logging
import requests
from waitress import serve

# ── Setup ─────────────────────────────────────────────────────
app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")

GNEWS_API_KEY = "6b7d201fd899e64722e8700c1bcdb70e"
GNEWS_BASE_URL = "https://gnews.io/api/v4/search"

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

# ── Helper: classify signal severity from headline ────────────
def classify_severity(headline):
    headline_lower = headline.lower()
    if any(word in headline_lower for word in ["mass layoff", "bankruptcy", "collapse", "shut down", "shuts down", "closing down"]):
        return 0.9
    if any(word in headline_lower for word in ["layoff", "laid off", "job cuts", "workforce reduction", "retrenchment", "downsizing"]):
        return 0.75
    if any(word in headline_lower for word in ["hiring freeze", "cost cutting", "restructuring", "losses", "revenue decline"]):
        return 0.5
    if any(word in headline_lower for word in ["slowdown", "challenges", "uncertainty", "cautious"]):
        return 0.3
    return 0.2

# ── Helper: classify signal type from headline ────────────────
def classify_signal_type(headline):
    headline_lower = headline.lower()
    if any(word in headline_lower for word in ["layoff", "laid off", "job cuts", "retrenchment", "workforce reduction", "downsizing"]):
        return "LAYOFF"
    if any(word in headline_lower for word in ["hiring freeze", "hiring halt", "pause hiring"]):
        return "HIRING_FREEZE"
    if any(word in headline_lower for word in ["restructur", "reorganiz"]):
        return "RESTRUCTURING"
    if any(word in headline_lower for word in ["revenue", "losses", "profit", "earnings", "financial"]):
        return "FINANCIAL_DISTRESS"
    if any(word in headline_lower for word in ["automat", "ai replac", "robot"]):
        return "AUTOMATION_RISK"
    return "NEWS"

# ── Helper: extract affected count from headline ──────────────
def extract_affected_count(headline):
    import re
    patterns = [
        r'(\d[\d,]*)\s*(employees|workers|jobs|staff|people)',
        r'(\d[\d,]*)\s*(?:job\s*cuts|layoffs|positions)',
    ]
    for pattern in patterns:
        match = re.search(pattern, headline, re.IGNORECASE)
        if match:
            try:
                return int(match.group(1).replace(",", ""))
            except ValueError:
                pass
    return 0

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

# ── Route: Scrape news for a single company (manual, Live Feed)
@app.route("/ml/scrape-news", methods=["POST"])
def scrape_news():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "Request body is required"}), 400

        company_name = data.get("company_name", "").strip()
        if not company_name:
            return jsonify({"success": False, "message": "company_name is required"}), 400

        api_key = data.get("api_key") or GNEWS_API_KEY

        query = f"{company_name} layoff OR \"job cuts\" OR restructuring OR \"hiring freeze\""
        params = {
            "q": query,
            "token": api_key,
            "lang": "en",
            "max": 10,
            "sortby": "publishedAt"
        }

        response = requests.get(GNEWS_BASE_URL, params=params, timeout=15)
        if response.status_code != 200:
            logger.error(f"GNews API error {response.status_code}: {response.text}")
            return jsonify({"success": False, "message": f"GNews API returned status {response.status_code}"}), 502

        articles = response.json().get("articles", [])

        signals = []
        for article in articles:
            headline = article.get("title", "").strip()
            if not headline:
                continue
            signals.append({
                "headline": headline,
                "signal_type": classify_signal_type(headline),
                "signal_source": article.get("source", {}).get("name", "Unknown"),
                "severity_score": classify_severity(headline),
                "affected_count": extract_affected_count(headline),
                "signal_date": article.get("publishedAt", "")[:10] if article.get("publishedAt") else "",
                "url": article.get("url", "")
            })

        logger.info(f"scrape-news: {len(signals)} signals for '{company_name}'")

        return jsonify({
            "success": True,
            "company_name": company_name,
            "signals_found": len(signals),
            "signals": signals
        })

    except requests.exceptions.Timeout:
        logger.error("GNews request timed out")
        return jsonify({"success": False, "message": "News API timed out. Try again."}), 504
    except Exception as e:
        logger.error(f"Scrape news error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

# ── Route: Auto-scan all companies (called by Spring scheduler) ─
@app.route("/ml/auto-scan", methods=["POST"])
def auto_scan():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "Request body is required"}), 400

        company_names = data.get("company_names", [])
        if not company_names or not isinstance(company_names, list):
            return jsonify({"success": False, "message": "company_names must be a non-empty list"}), 400

        api_key = data.get("api_key") or GNEWS_API_KEY

        results = []

        for company_name in company_names:
            company_name = str(company_name).strip()
            if not company_name:
                continue

            try:
                query = f"{company_name} layoff OR \"job cuts\" OR restructuring OR \"hiring freeze\""
                params = {
                    "q": query,
                    "token": api_key,
                    "lang": "en",
                    "max": 5,
                    "sortby": "publishedAt"
                }

                response = requests.get(GNEWS_BASE_URL, params=params, timeout=15)

                if response.status_code != 200:
                    logger.warning(f"auto-scan: GNews returned {response.status_code} for '{company_name}'")
                    results.append({
                        "company_name": company_name,
                        "signals": [],
                        "error": f"GNews API returned status {response.status_code}"
                    })
                    continue

                articles = response.json().get("articles", [])
                signals = []

                for article in articles:
                    headline = article.get("title", "").strip()
                    if not headline:
                        continue
                    signals.append({
                        "headline": headline,
                        "signal_type": classify_signal_type(headline),
                        "signal_source": article.get("source", {}).get("name", "Unknown"),
                        "severity_score": classify_severity(headline),
                        "affected_count": extract_affected_count(headline),
                        "signal_date": article.get("publishedAt", "")[:10] if article.get("publishedAt") else "",
                        "url": article.get("url", "")
                    })

                logger.info(f"auto-scan: {len(signals)} signals for '{company_name}'")

                results.append({
                    "company_name": company_name,
                    "signals": signals
                })

            except requests.exceptions.Timeout:
                logger.warning(f"auto-scan: timeout for '{company_name}'")
                results.append({
                    "company_name": company_name,
                    "signals": [],
                    "error": "Request timed out"
                })
            except Exception as e:
                logger.warning(f"auto-scan: error for '{company_name}': {e}")
                results.append({
                    "company_name": company_name,
                    "signals": [],
                    "error": str(e)
                })

        logger.info(f"auto-scan complete: {len(results)} companies processed")

        return jsonify({
            "success": True,
            "companies_scanned": len(results),
            "results": results
        })

    except Exception as e:
        logger.error(f"Auto-scan error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

# ── Route: Parse resume ───────────────────────────────────────
@app.route("/ml/parse-resume", methods=["POST"])
def parse_resume():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "Request body is required"}), 400

        resume_text = data.get("resume_text", "").strip()
        if not resume_text:
            return jsonify({"success": False, "message": "resume_text is required"}), 400

        known_skills = [
            "python", "java", "javascript", "typescript", "react", "angular", "vue",
            "node.js", "spring boot", "django", "flask", "fastapi",
            "sql", "postgresql", "mysql", "mongodb", "redis",
            "docker", "kubernetes", "aws", "azure", "gcp",
            "git", "linux", "rest api", "graphql",
            "machine learning", "deep learning", "tensorflow", "pytorch", "scikit-learn",
            "pandas", "numpy", "data analysis", "tableau", "power bi",
            "c", "c++", "c#", "go", "rust", "kotlin", "swift",
            "html", "css", "tailwind", "bootstrap",
            "kafka", "rabbitmq", "elasticsearch",
            "jenkins", "ci/cd", "terraform", "ansible"
        ]

        resume_lower = resume_text.lower()
        detected = [skill for skill in known_skills if skill in resume_lower]

        logger.info(f"parse-resume: detected {len(detected)} skills")

        return jsonify({
            "success": True,
            "detected_skills": detected,
            "total_detected": len(detected)
        })

    except Exception as e:
        logger.error(f"Parse resume error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

# ── Run ───────────────────────────────────────────────────────
if __name__ == "__main__":
    logger.info("Starting LASIS ML API with Waitress (production server)...")
    serve(app, host="0.0.0.0", port=5000, threads=4)