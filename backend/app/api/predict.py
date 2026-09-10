"""
MANGANAI - Predict API
Run ML model to generate prospectivity layer and targets.
"""
import numpy as np
from datetime import datetime
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from ..database.connection import get_db
from ..database.models import PredictionRun, Target as TargetDB, ModelVersion
from ..geospatial.demo_data import get_prospectivity_grid, get_demo_targets
from ..geospatial.earth_engine import extract_features
from ..ml.pipeline import load_model, FEATURE_NAMES
import random

router = APIRouter(prefix="/api/predict", tags=["predict"])


def _get_active_version(db: Session) -> str:
    mv = db.query(ModelVersion).filter(ModelVersion.is_active == True).first()
    return mv.version if mv else "v1.0"


@router.post("")
def run_prediction(db: Session = Depends(get_db)):
    """Run prospectivity prediction over study area. Returns prospectivity grid + targets."""
    active_version = _get_active_version(db)

    # Log prediction run
    run = PredictionRun(
        model_version=active_version,
        status="running",
    )
    db.add(run)
    db.commit()

    try:
        # Get demo prospectivity grid (pre-computed for speed)
        grid = get_prospectivity_grid()

        # Generate targets from high-prospectivity zones
        targets = get_demo_targets()

        # Update target count in run log
        high_priority = sum(1 for t in targets if t["priority"] == "HIGH")
        run.status = "complete"
        run.target_count = len(targets)
        run.high_priority_count = high_priority
        run.completed_at = datetime.utcnow()
        db.commit()

        return {
            "success": True,
            "model_version": active_version,
            "grid_cells": len(grid),
            "target_count": len(targets),
            "high_priority_count": high_priority,
            "prospectivity_grid": grid[:500],  # return first 500 cells for performance
            "targets": targets,
            "note": "DEMO DATA — For system demonstration only. Not certified reserve estimates.",
            "timestamp": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        run.status = "failed"
        db.commit()
        return {"success": False, "error": str(e)}


@router.get("/grid")
def get_prospectivity_grid_endpoint():
    """Return full prospectivity grid."""
    grid = get_prospectivity_grid()
    return {
        "grid": grid,
        "count": len(grid),
        "note": "DEMO DATA — Prospectivity estimates for decision support only.",
    }


@router.post("/gee-extract")
def run_gee_extraction(lon: float = 80.18, lat: float = 21.80, radius: int = 5000):
    """
    Execute Google Earth Engine feature extraction pipeline as described in instructions.
    """
    result = extract_features(longitude=lon, latitude=lat, radius_m=radius)
    return result

