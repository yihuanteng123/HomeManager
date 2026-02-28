from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.entities import Contract, ContractStatus
from app.schemas.common import ContractIn

router = APIRouter(prefix="/api/contracts", tags=["contracts"])


@router.post("")
def create_contract(payload: ContractIn, db: Session = Depends(get_db), _=Depends(get_current_user)):
    entity = Contract(**payload.model_dump())
    db.add(entity)
    db.commit()
    db.refresh(entity)
    return entity


@router.get("")
def list_contracts(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Contract).all()


@router.get("/expiring")
def expiring_contracts(days: int = 30, db: Session = Depends(get_db), _=Depends(get_current_user)):
    deadline = date.today() + timedelta(days=days)
    return db.query(Contract).filter(Contract.end_date <= deadline, Contract.status == ContractStatus.ACTIVE).all()
