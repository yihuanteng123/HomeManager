# HomeManager

二手房东房源管理系统（B/S 架构）后端基础版。

## 已实现能力（MVP）
- JWT 登录认证（默认管理员账号）
- 房源管理（新增、列表）
- 租客管理（新增、列表）
- 合同管理（新增、列表、即将到期查询）
- 财务管理（收租记录、月利润统计）
- Dashboard 风险预警概览

## 项目结构
```text
backend/
  app/
    core/       # 数据库、鉴权
    models/     # SQLAlchemy 实体
    routes/     # 各模块 API
    schemas/    # 入参模型
docs/
  system_design.md
```

## 快速启动
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

启动后访问：
- Swagger: `http://127.0.0.1:8000/docs`
- 健康检查: `http://127.0.0.1:8000/`

## 默认账号
- 用户名：`admin`
- 密码：`admin123`

## 关键接口
- `POST /api/auth/login` 登录
- `POST /api/properties` 新增房源
- `POST /api/tenants` 新增租客
- `POST /api/contracts` 新增合同
- `GET /api/contracts/expiring?days=30` 即将到期合同
- `POST /api/finance/rent-records` 新增收租记录
- `GET /api/dashboard/overview` 风险预警总览
