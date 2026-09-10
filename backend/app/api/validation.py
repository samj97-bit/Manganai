"""
MANGANAI - Field Validation API
"""
import os
import aiofiles
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from ..database.connection import get_db
from ..database.models import FieldValidation

router = APIRouter(prefix="/api/validation", tags=["validation"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "../../data/uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


class ValidationCreate(BaseModel):
    target_id: str
    latitude: float
    longitude: float
    sample_id: str
    mn_grade: Optional[float] = None
    depth: Optional[float] = None
    lithology: Optional[str] = None
    result: str  # confirmed / not_found / inconclusive
    notes: Optional[str] = None


@router.post("")
def create_validation(val: ValidationCreate, db: Session = Depends(get_db)):
    """Submit a field validation record."""
    if val.result not in ("confirmed", "not_found", "inconclusive"):
        raise HTTPException(status_code=422, detail="result must be: confirmed / not_found / inconclusive")

    db_val = FieldValidation(
        target_id=val.target_id,
        latitude=val.latitude,
        longitude=val.longitude,
        sample_id=val.sample_id,
        mn_grade=val.mn_grade,
        depth=val.depth,
        lithology=val.lithology,
        result=val.result,
        notes=val.notes,
    )
    db.add(db_val)
    db.commit()
    db.refresh(db_val)

    return {
        "success": True,
        "message": "Validation recorded successfully.",
        "id": db_val.id,
        "target_id": db_val.target_id,
        "result": db_val.result,
        "created_at": db_val.created_at.isoformat(),
    }


@router.get("")
def list_validations(db: Session = Depends(get_db)):
    """List all field validation records."""
    records = db.query(FieldValidation).order_by(FieldValidation.created_at.desc()).all()
    result = []
    for r in records:
        result.append({
            "id": r.id,
            "target_id": r.target_id,
            "latitude": r.latitude,
            "longitude": r.longitude,
            "sample_id": r.sample_id,
            "mn_grade": r.mn_grade,
            "depth": r.depth,
            "lithology": r.lithology,
            "result": r.result,
            "notes": r.notes,
            "photo_path": r.photo_path,
            "created_at": r.created_at.isoformat(),
        })
    return {"validations": result, "count": len(result)}


@router.post("/upload-photo")
async def upload_photo(
    target_id: str = Form(...),
    sample_id: str = Form(...),
    photo: UploadFile = File(...),
):
    """Upload a field photo."""
    filename = f"{target_id}_{sample_id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{photo.filename}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    async with aiofiles.open(filepath, "wb") as out_file:
        content = await photo.read()
        await out_file.write(content)

    return {
        "success": True,
        "photo_path": filepath,
        "message": f"Photo uploaded: {filename}",
    }
