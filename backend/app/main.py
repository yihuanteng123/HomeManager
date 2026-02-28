from fastapi import FastAPI

from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.models.entities import Role, User
from app.routes import auth, contract, dashboard, finance, property, tenant

app = FastAPI(title="二手房东房源管理系统 API", version="0.1.0")


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Role).count() == 0:
            db.add_all([Role(name="管理员"), Role(name="财务"), Role(name="运营"), Role(name="客服")])
            db.commit()
        admin_role = db.query(Role).filter(Role.name == "管理员").first()
        if admin_role and not db.query(User).filter(User.username == "admin").first():
            db.add(User(username="admin", password_hash=hash_password("admin123"), role_id=admin_role.id))
            db.commit()
    finally:
        db.close()


@app.get("/")
def health_check():
    return {"message": "二手房东房源管理系统运行中"}


app.include_router(auth.router)
app.include_router(property.router)
app.include_router(tenant.router)
app.include_router(contract.router)
app.include_router(finance.router)
app.include_router(dashboard.router)
