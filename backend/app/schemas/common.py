from datetime import date

from pydantic import BaseModel


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserLogin(BaseModel):
    username: str
    password: str


class PropertyIn(BaseModel):
    property_code: str
    property_type: str
    address: str
    layout: str
    area: float
    floor: str
    orientation: str
    upstream_landlord: str


class TenantIn(BaseModel):
    name: str
    id_card: str
    phone: str
    emergency_contact: str
    company: str | None = None
    credit_note: str | None = None


class ContractIn(BaseModel):
    contract_no: str
    property_id: int
    tenant_id: int
    start_date: date
    end_date: date
    monthly_rent: float
    deposit: float
    payment_method: str
    increment_rule: str | None = None


class RentRecordIn(BaseModel):
    contract_id: int
    due_date: date
    receivable_amount: float
    received_amount: float = 0
    overdue_amount: float = 0
    late_fee: float = 0
