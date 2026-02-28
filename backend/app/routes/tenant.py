from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.entities import Tenant
from app.schemas.common import TenantIn

router = APIRouter(prefix="/api/tenants", tags=["tenants"])


@router.post("")
def create_tenant(payload: TenantIn, db: Session = Depends(get_db), _=Depends(get_current_user)):
    entity = Tenant(**payload.model_dump())
    db.add(entity)
    db.commit()
    db.refresh(entity)
    return entity


@router.get("")
def list_tenants(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Tenant).all()
