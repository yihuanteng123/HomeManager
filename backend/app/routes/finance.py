from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import extract, func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.entities import ExpenseRecord, RentRecord
from app.schemas.common import RentRecordIn

router = APIRouter(prefix="/api/finance", tags=["finance"])


@router.post("/rent-records")
def create_rent_record(payload: RentRecordIn, db: Session = Depends(get_db), _=Depends(get_current_user)):
    entity = RentRecord(**payload.model_dump())
    db.add(entity)
    db.commit()
    db.refresh(entity)
    return entity


@router.get("/rent-records")
def list_rent_records(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(RentRecord).all()


@router.get("/profit/monthly")
def monthly_profit(year: int, month: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    received = (
        db.query(func.coalesce(func.sum(RentRecord.received_amount), 0))
        .filter(extract("year", RentRecord.due_date) == year, extract("month", RentRecord.due_date) == month)
        .scalar()
    )
    expense = (
        db.query(func.coalesce(func.sum(ExpenseRecord.amount), 0))
        .filter(extract("year", ExpenseRecord.occurred_at) == year, extract("month", ExpenseRecord.occurred_at) == month)
        .scalar()
    )
    return {"year": year, "month": month, "profit": float(received - expense)}
