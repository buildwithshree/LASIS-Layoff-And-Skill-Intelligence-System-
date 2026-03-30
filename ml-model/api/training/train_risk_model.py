import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import os

# ── 1. Load data ──────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "layoffs.csv")
MODEL_DIR = os.path.join(BASE_DIR, "..", "models")
os.makedirs(MODEL_DIR, exist_ok=True)

print("Loading data...")
df = pd.read_csv(DATA_PATH)
print(f"Raw rows: {len(df)}")
print(f"Columns: {list(df.columns)}")

# ── 2. Clean data ─────────────────────────────────────────────
df = df.dropna(subset=["percentage_laid_off"])

df["total_laid_off"] = pd.to_numeric(df["total_laid_off"], errors="coerce").fillna(0)
df["funds_raised"] = pd.to_numeric(df["funds_raised"], errors="coerce").fillna(0)

df["industry"] = df["industry"].fillna("Unknown").str.strip()
df["stage"] = df["stage"].fillna("Unknown").str.strip()
df["country"] = df["country"].fillna("Unknown").str.strip()

print(f"Rows after cleaning: {len(df)}")

# ── 3. Encode categoricals ────────────────────────────────────
le_industry = LabelEncoder()
le_stage = LabelEncoder()
le_country = LabelEncoder()

df["industry_enc"] = le_industry.fit_transform(df["industry"])
df["stage_enc"] = le_stage.fit_transform(df["stage"])
df["country_enc"] = le_country.fit_transform(df["country"])

# ── 4. Define features & target ───────────────────────────────
FEATURES = [
    "total_laid_off",
    "funds_raised",
    "industry_enc",
    "stage_enc",
    "country_enc"
]

TARGET = "percentage_laid_off"

X = df[FEATURES]
y = df[TARGET].astype(float)

print(f"\nFeatures: {FEATURES}")
print(f"Target: {TARGET}")
print(f"X shape: {X.shape}, y shape: {y.shape}")

# ── 5. Train / test split ─────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
print(f"\nTrain size: {len(X_train)}, Test size: {len(X_test)}")

# ── 6. Train model ────────────────────────────────────────────
print("\nTraining Random Forest model...")
model = RandomForestRegressor(
    n_estimators=100,
    max_depth=10,
    random_state=42,
    n_jobs=-1
)
model.fit(X_train, y_train)

# ── 7. Evaluate ───────────────────────────────────────────────
y_pred = model.predict(X_test)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
r2 = r2_score(y_test, y_pred)

print(f"\nModel Evaluation:")
print(f"  RMSE : {rmse:.4f}")
print(f"  R²   : {r2:.4f}")

print("\nFeature Importances:")
for feat, imp in sorted(zip(FEATURES, model.feature_importances_), key=lambda x: -x[1]):
    print(f"  {feat}: {imp:.4f}")

# ── 8. Save model + encoders ──────────────────────────────────
joblib.dump(model, os.path.join(MODEL_DIR, "risk_model.pkl"))
joblib.dump(le_industry, os.path.join(MODEL_DIR, "le_industry.pkl"))
joblib.dump(le_stage, os.path.join(MODEL_DIR, "le_stage.pkl"))
joblib.dump(le_country, os.path.join(MODEL_DIR, "le_country.pkl"))

print(f"\nModel and encoders saved to: {MODEL_DIR}")
print("Done!")
