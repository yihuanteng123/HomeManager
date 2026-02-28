from datetime import date, datetime
from enum import Enum

from sqlalchemy import Date, DateTime, Enum as SAEnum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class PropertyType(str, Enum):
    ENTIRE = "整租"
    SHARED = "合租"


class PropertyStatus(str, Enum):
    VACANT = "空置"
    RENTED = "已租"
    PENDING = "待签约"
    EXPIRING = "即将到期"
    REPAIR = "维修中"
    OFFLINE = "下架"


class ContractStatus(str, Enum):
    ACTIVE = "生效中"
    EXPIRING = "即将到期"
    TERMINATED = "已终止"
    BREACH = "违约"


class RoomStatus(str, Enum):
    VACANT = "空置"
    RENTED = "已租"
    REPAIR = "维修中"


class Role(Base):
    __tablename__ = "role"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)


class User(Base):
    __tablename__ = "user"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role_id: Mapped[int] = mapped_column(ForeignKey("role.id"), nullable=False)
    role: Mapped[Role] = relationship()


class HouseProperty(Base):
    __tablename__ = "house_property"

    id: Mapped[int] = mapped_column(primary_key=True)
    property_code: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)
    property_type: Mapped[PropertyType] = mapped_column(SAEnum(PropertyType), nullable=False)
    address: Mapped[str] = mapped_column(String(255), nullable=False)
    layout: Mapped[str] = mapped_column(String(50), nullable=False)
    area: Mapped[float] = mapped_column(Float, nullable=False)
    floor: Mapped[str] = mapped_column(String(20), nullable=False)
    orientation: Mapped[str] = mapped_column(String(20), nullable=False)
    upstream_landlord: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[PropertyStatus] = mapped_column(SAEnum(PropertyStatus), default=PropertyStatus.VACANT)

    rooms: Mapped[list["Room"]] = relationship(back_populates="property", cascade="all, delete")


class Room(Base):
    __tablename__ = "room"

    id: Mapped[int] = mapped_column(primary_key=True)
    room_code: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)
    property_id: Mapped[int] = mapped_column(ForeignKey("house_property.id"), nullable=False)
    area: Mapped[float] = mapped_column(Float, nullable=False)
    private_bathroom: Mapped[int] = mapped_column(Integer, default=0)
    current_tenant: Mapped[str | None] = mapped_column(String(50), nullable=True)
    status: Mapped[RoomStatus] = mapped_column(SAEnum(RoomStatus), default=RoomStatus.VACANT)

    property: Mapped[HouseProperty] = relationship(back_populates="rooms")


class Tenant(Base):
    __tablename__ = "tenant"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    id_card: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    emergency_contact: Mapped[str] = mapped_column(String(50), nullable=False)
    company: Mapped[str | None] = mapped_column(String(100), nullable=True)
    credit_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    blacklisted: Mapped[int] = mapped_column(Integer, default=0)
    blacklist_reason: Mapped[str | None] = mapped_column(Text, nullable=True)


class Contract(Base):
    __tablename__ = "contract"

    id: Mapped[int] = mapped_column(primary_key=True)
    contract_no: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)
    property_id: Mapped[int] = mapped_column(ForeignKey("house_property.id"), nullable=False)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenant.id"), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    monthly_rent: Mapped[float] = mapped_column(Float, nullable=False)
    deposit: Mapped[float] = mapped_column(Float, nullable=False)
    payment_method: Mapped[str] = mapped_column(String(30), nullable=False)
    increment_rule: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[ContractStatus] = mapped_column(SAEnum(ContractStatus), default=ContractStatus.ACTIVE)


class RentRecord(Base):
    __tablename__ = "rent_record"

    id: Mapped[int] = mapped_column(primary_key=True)
    contract_id: Mapped[int] = mapped_column(ForeignKey("contract.id"), nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    receivable_amount: Mapped[float] = mapped_column(Float, nullable=False)
    received_amount: Mapped[float] = mapped_column(Float, default=0)
    overdue_amount: Mapped[float] = mapped_column(Float, default=0)
    late_fee: Mapped[float] = mapped_column(Float, default=0)


class ExpenseRecord(Base):
    __tablename__ = "expense_record"

    id: Mapped[int] = mapped_column(primary_key=True)
    expense_type: Mapped[str] = mapped_column(String(40), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    occurred_at: Mapped[date] = mapped_column(Date, nullable=False)
    remark: Mapped[str | None] = mapped_column(String(255), nullable=True)


class RepairRecord(Base):
    __tablename__ = "repair_record"

    id: Mapped[int] = mapped_column(primary_key=True)
    property_id: Mapped[int] = mapped_column(ForeignKey("house_property.id"), nullable=False)
    reporter: Mapped[str] = mapped_column(String(50), nullable=False)
    report_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    urgency: Mapped[str] = mapped_column(String(20), nullable=False)
    assignee: Mapped[str | None] = mapped_column(String(50), nullable=True)
    estimated_cost: Mapped[float | None] = mapped_column(Float, nullable=True)
    actual_cost: Mapped[float | None] = mapped_column(Float, nullable=True)
    result: Mapped[str | None] = mapped_column(Text, nullable=True)
    settled: Mapped[int] = mapped_column(Integer, default=0)
