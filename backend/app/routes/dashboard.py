from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.entities import Contract, ContractStatus, HouseProperty, PropertyStatus, RentRecord

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/overview")
def dashboard_overview(db: Session = Depends(get_db), _=Depends(get_current_user)):
    today = date.today()
    month_start = date(today.year, today.month, 1)
    month_end = month_start + timedelta(days=31)

    expiring_contracts = db.query(func.count(Contract.id)).filter(
        Contract.end_date <= today + timedelta(days=30), Contract.status == ContractStatus.ACTIVE
    ).scalar()
    month_receivable = db.query(func.coalesce(func.sum(RentRecord.receivable_amount), 0)).filter(
        RentRecord.due_date >= month_start, RentRecord.due_date < month_end
    ).scalar()
    arrears_tenants = db.query(func.count(RentRecord.id)).filter(RentRecord.overdue_amount > 0).scalar()
    vacant_houses = db.query(func.count(HouseProperty.id)).filter(HouseProperty.status == PropertyStatus.VACANT).scalar()

    return {
        "expiring_contracts": expiring_contracts,
        "month_receivable": float(month_receivable),
        "arrears_count": arrears_tenants,
        "vacant_houses": vacant_houses,
    }
