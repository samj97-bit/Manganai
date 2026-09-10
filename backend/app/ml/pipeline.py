"""
MANGANAI - ML Pipeline
Random Forest + XGBoost prospectivity models
"""
import numpy as np
import pandas as pd
import json
import os
import joblib
from datetime import datetime
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import f1_score, recall_score, precision_score, accuracy_score
from sklearn.preprocessing import StandardScaler
from typing import Dict, Any, Tuple, List, Optional

try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False

MODEL_DIR = os.path.join(os.path.dirname(__file__), "../../data/models")
os.makedirs(MODEL_DIR, exist_ok=True)

FEATURE_NAMES = [
    "geology_score",
    "spectral_fe_mn_ratio",
    "spectral_ndvi",
    "spectral_clay_index",
    "elevation",
    "slope",
    "terrain_roughness",
    "dist_to_fault_km",
    "dist_to_occurrence_km",
    "magnetic_anomaly",
    "em_response",
    "drilling_evidence",
]


def generate_demo_training_data(n_samples: int = 1200, seed: int = 42) -> Tuple[np.ndarray, np.ndarray]:
    """
    Generate realistic demo training data for manganese prospectivity.
    DEMO DATA — not real geological surveys.
    """
    np.random.seed(seed)
    X = np.zeros((n_samples, len(FEATURE_NAMES)))
    y = np.zeros(n_samples, dtype=int)

    # Positive samples (~30%)
    n_pos = int(n_samples * 0.30)
    n_neg = n_samples - n_pos

    # Positive: high geology score, high spectral anomaly, near faults/occurrences
    X[:n_pos, 0] = np.random.beta(5, 2, n_pos)       # geology_score: high
    X[:n_pos, 1] = np.random.beta(4, 2, n_pos)       # fe_mn_ratio: high
    X[:n_pos, 2] = np.random.uniform(0.1, 0.4, n_pos)  # ndvi: low-moderate
    X[:n_pos, 3] = np.random.beta(4, 3, n_pos)       # clay_index: moderate-high
    X[:n_pos, 4] = np.random.uniform(200, 900, n_pos)  # elevation
    X[:n_pos, 5] = np.random.uniform(2, 25, n_pos)   # slope
    X[:n_pos, 6] = np.random.uniform(0.1, 0.6, n_pos)  # roughness
    X[:n_pos, 7] = np.random.uniform(0.5, 12, n_pos)   # dist to fault (close)
    X[:n_pos, 8] = np.random.uniform(1, 20, n_pos)     # dist to occurrence (close)
    X[:n_pos, 9] = np.random.uniform(0.3, 1.0, n_pos)  # magnetic anomaly
    X[:n_pos, 10] = np.random.uniform(0.2, 0.9, n_pos) # em_response
    X[:n_pos, 11] = np.random.choice([0, 1], n_pos, p=[0.4, 0.6])  # drilling evidence
    y[:n_pos] = 1

    # Negative: low geology score, far from known zones
    X[n_pos:, 0] = np.random.beta(2, 5, n_neg)
    X[n_pos:, 1] = np.random.beta(2, 4, n_neg)
    X[n_pos:, 2] = np.random.uniform(0.3, 0.8, n_neg)
    X[n_pos:, 3] = np.random.beta(2, 5, n_neg)
    X[n_pos:, 4] = np.random.uniform(50, 1500, n_neg)
    X[n_pos:, 5] = np.random.uniform(0, 45, n_neg)
    X[n_pos:, 6] = np.random.uniform(0.0, 1.0, n_neg)
    X[n_pos:, 7] = np.random.uniform(15, 100, n_neg)
    X[n_pos:, 8] = np.random.uniform(20, 150, n_neg)
    X[n_pos:, 9] = np.random.uniform(0.0, 0.4, n_neg)
    X[n_pos:, 10] = np.random.uniform(0.0, 0.3, n_neg)
    X[n_pos:, 11] = np.random.choice([0, 1], n_neg, p=[0.85, 0.15])
    y[n_pos:] = 0

    # Shuffle
    idx = np.random.permutation(n_samples)
    return X[idx], y[idx]


def train_random_forest(
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_val: np.ndarray,
    y_val: np.ndarray,
    n_estimators: int = 200,
) -> Tuple[RandomForestClassifier, Dict[str, float], Dict[str, float]]:
    model = RandomForestClassifier(
        n_estimators=n_estimators,
        max_depth=12,
        min_samples_split=5,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)
    y_pred = model.predict(X_val)
    y_proba = model.predict_proba(X_val)[:, 1]

    metrics = {
        "f1_score": round(f1_score(y_val, y_pred), 4),
        "recall": round(recall_score(y_val, y_pred), 4),
        "precision": round(precision_score(y_val, y_pred), 4),
        "accuracy": round(accuracy_score(y_val, y_pred), 4),
    }

    importance = dict(zip(FEATURE_NAMES, [round(v, 4) for v in model.feature_importances_]))
    return model, metrics, importance


def train_xgboost(
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_val: np.ndarray,
    y_val: np.ndarray,
) -> Tuple[Any, Dict[str, float], Dict[str, float]]:
    if not XGBOOST_AVAILABLE:
        return None, {}, {}

    model = xgb.XGBClassifier(
        n_estimators=150,
        max_depth=6,
        learning_rate=0.1,
        scale_pos_weight=sum(y_train == 0) / max(sum(y_train == 1), 1),
        random_state=42,
        eval_metric="logloss",
        use_label_encoder=False,
    )
    model.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)
    y_pred = model.predict(X_val)

    metrics = {
        "f1_score": round(f1_score(y_val, y_pred), 4),
        "recall": round(recall_score(y_val, y_pred), 4),
        "precision": round(precision_score(y_val, y_pred), 4),
        "accuracy": round(accuracy_score(y_val, y_pred), 4),
    }

    importance = dict(zip(FEATURE_NAMES, [round(v, 4) for v in model.feature_importances_]))
    return model, metrics, importance


def run_training_pipeline(
    version: str,
    extra_samples: Optional[List[Dict]] = None,
    seed: int = 42,
) -> Dict[str, Any]:
    """Full training pipeline. Returns version info and metrics."""
    X, y = generate_demo_training_data(n_samples=1200, seed=seed)

    # Incorporate validated field samples
    if extra_samples:
        for sample in extra_samples:
            feat = _validation_to_features(sample)
            label = 1 if sample.get("result") == "confirmed" else 0
            X = np.vstack([X, feat])
            y = np.append(y, label)

    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=seed, stratify=y)

    rf_model, rf_metrics, rf_importance = train_random_forest(X_train, y_train, X_val, y_val)

    # Save model
    model_path = os.path.join(MODEL_DIR, f"rf_{version}.joblib")
    joblib.dump(rf_model, model_path)

    return {
        "version": version,
        "algorithm": "Random Forest",
        "training_samples": len(X_train),
        "validated_samples": len(extra_samples) if extra_samples else 0,
        "feature_count": len(FEATURE_NAMES),
        "features": FEATURE_NAMES,
        "feature_importance": rf_importance,
        "metrics": rf_metrics,
        "model_path": model_path,
        "created_at": datetime.utcnow().isoformat(),
    }


def _validation_to_features(sample: Dict) -> np.ndarray:
    """Convert a field validation record to feature vector."""
    return np.array([
        sample.get("geology_score", 0.5),
        sample.get("spectral_fe_mn", 0.5),
        sample.get("ndvi", 0.3),
        sample.get("clay_index", 0.4),
        sample.get("elevation", 400),
        sample.get("slope", 10),
        sample.get("roughness", 0.3),
        sample.get("dist_fault", 8),
        sample.get("dist_occurrence", 15),
        sample.get("magnetic", 0.5),
        sample.get("em", 0.4),
        1 if sample.get("result") == "confirmed" else 0,
    ])


def load_model(version: str) -> Optional[Any]:
    model_path = os.path.join(MODEL_DIR, f"rf_{version}.joblib")
    if os.path.exists(model_path):
        return joblib.load(model_path)
    return None


def predict_prospectivity(model: Any, features: np.ndarray) -> np.ndarray:
    """Return prospectivity probability for each cell."""
    return model.predict_proba(features)[:, 1]
