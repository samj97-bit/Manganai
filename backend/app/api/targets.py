"""
MANGANAI - Targets API
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database.connection import get_db
from ..database.models import Target as TargetDB
from ..geospatial.demo_data import get_demo_targets, get_study_area

router = APIRouter(prefix="/api/targets", tags=["targets"])


def _seed_targets_if_empty(db: Session):
    """Seed demo targets into DB if table is empty."""
    count = db.query(TargetDB).count()
    if count == 0:
        for t in get_demo_targets():
            db_target = TargetDB(
                target_id=t["target_id"],
                name=t["name"],
                priority=t["priority"],
                prospectivity=t["prospectivity"],
                confidence=t["confidence"],
                risk=t["risk"],
                lat=t["lat"],
                lng=t["lng"],
                area_km2=t["area_km2"],
                depth_min=t["depth_min"],
                depth_max=t["depth_max"],
                geology=t["geology"],
                state=t["state"],
                evidence=t["evidence"],
                feature_contributions=t["feature_contributions"],
                model_version="v1.0",
            )
            db.add(db_target)
        db.commit()


@router.get("")
def get_targets(db: Session = Depends(get_db)):
    _seed_targets_if_empty(db)
    targets = db.query(TargetDB).order_by(TargetDB.prospectivity.desc()).all()
    result = []
    for t in targets:
        result.append({
            "target_id": t.target_id,
            "name": t.name,
            "priority": t.priority,
            "prospectivity": t.prospectivity,
            "confidence": t.confidence,
            "risk": t.risk,
            "lat": t.lat,
            "lng": t.lng,
            "area_km2": t.area_km2,
            "depth_min": t.depth_min,
            "depth_max": t.depth_max,
            "geology": t.geology,
            "state": t.state,
            "evidence": t.evidence or [],
            "feature_contributions": t.feature_contributions or {},
            "model_version": t.model_version,
        })
    return {
        "targets": result,
        "count": len(result),
        "study_area": get_study_area(),
        "note": "DEMO DATA — For system demonstration only. Not geological reserve estimates.",
    }


@router.get("/{target_id}")
def get_target(target_id: str, db: Session = Depends(get_db)):
    _seed_targets_if_empty(db)
    t = db.query(TargetDB).filter(TargetDB.target_id == target_id).first()
    if not t:
        raise HTTPException(status_code=404, detail=f"Target {target_id} not found")

    return {
        "target_id": t.target_id,
        "name": t.name,
        "priority": t.priority,
        "prospectivity": t.prospectivity,
        "confidence": t.confidence,
        "risk": t.risk,
        "lat": t.lat,
        "lng": t.lng,
        "area_km2": t.area_km2,
        "depth_min": t.depth_min,
        "depth_max": t.depth_max,
        "geology": t.geology,
        "state": t.state,
        "evidence": t.evidence or [],
        "feature_contributions": t.feature_contributions or {},
        "model_version": t.model_version,
        "recommended_action": "FIELD VALIDATION" if t.prospectivity > 0.75 else "ADDITIONAL SURVEY",
        "depth_estimate_note": "Estimated from integrated geological, geophysical and available subsurface evidence.",
    }
