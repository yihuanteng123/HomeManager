from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.entities import HouseProperty
from app.schemas.common import PropertyIn

router = APIRouter(prefix="/api/properties", tags=["properties"])


@router.post("")
def create_property(payload: PropertyIn, db: Session = Depends(get_db), _=Depends(get_current_user)):
    entity = HouseProperty(**payload.model_dump())
    db.add(entity)
    db.commit()
    db.refresh(entity)
    return entity


@router.get("")
def list_properties(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(HouseProperty).all()
