# HomeManager - 二手房东房源管理系统

一个基于 B/S 架构的房源管理系统，帮助二手房东高效管理房源、租客、合同和财务。

## 技术栈

### 后端
- Node.js + Express
- MySQL
- JWT 认证
- bcryptjs 密码加密

### 前端
- Vue 3
- Element Plus
- Vue Router
- Pinia
- Axios
- Vite

## 功能模块

### 第一阶段（已完成）
- ✅ 房源管理（房源档案、房间管理、状态管理）
- ✅ 租客管理（租客档案、租住历史、黑名单）
- ✅ 合同管理（合同信息、状态管理、自动提醒）
- ✅ 收租记录（应收/实收、欠租管理）
- ✅ 数据驾驶舱（Dashboard预警中心）
- ✅ 权限管理（多角色、JWT认证）

### 第二阶段（规划中）
- ⏳ 财务统计（利润统计、报表导出）
- ⏳ 自动提醒（合同到期、租金缴纳）
- ⏳ 维修系统（报修、派单、记录）

### 第三阶段（规划中）
- ⏳ 多城市管理
- ⏳ 数据分析
- ⏳ 小程序端
- ⏳ 短信提醒
- ⏳ 电子签约

## 快速开始

### 1. 数据库设置

```bash
# 创建数据库
mysql -u root -p < database/schema.sql
```

### 2. 后端设置

```bash
cd backend
npm install

# 复制环境变量文件
cp env.example .env

# 编辑 .env 文件，配置数据库连接和JWT密钥
# DB_HOST=localhost
# DB_PORT=3306
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=home_manager
# JWT_SECRET=your_jwt_secret_key_here

# 启动后端服务
npm run dev
# 或
npm start
```

后端服务默认运行在 `http://localhost:3000`

### 3. 前端设置

```bash
cd frontend
npm install

# 启动前端开发服务器
npm run dev
```

前端服务默认运行在 `http://localhost:8080`

### 4. 访问系统

打开浏览器访问 `http://localhost:8080`

**默认登录账号：**
- 用户名：`admin`
- 密码：`admin123`

> 注意：首次登录后请及时修改默认密码！

## 项目结构

```
HomeManager/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── config/         # 配置文件
│   │   ├── middleware/     # 中间件
│   │   ├── routes/         # 路由
│   │   └── app.js          # 应用入口
│   ├── uploads/            # 文件上传目录
│   └── package.json
├── frontend/                # 前端应用
│   ├── src/
│   │   ├── views/          # 页面组件
│   │   ├── layouts/        # 布局组件
│   │   ├── stores/         # 状态管理
│   │   ├── router/          # 路由配置
│   │   ├── utils/          # 工具函数
│   │   └── main.js         # 应用入口
│   └── package.json
├── database/                # 数据库脚本
│   └── schema.sql          # 数据库表结构
└── README.md
```

## API 接口文档

### 认证相关
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息
- `POST /api/auth/change-password` - 修改密码

### 房源管理
- `GET /api/houses` - 获取房源列表
- `GET /api/houses/:id` - 获取房源详情
- `POST /api/houses` - 创建房源
- `PUT /api/houses/:id` - 更新房源
- `DELETE /api/houses/:id` - 删除房源

### 租客管理
- `GET /api/tenants` - 获取租客列表
- `GET /api/tenants/:id` - 获取租客详情
- `POST /api/tenants` - 创建租客
- `PUT /api/tenants/:id` - 更新租客
- `DELETE /api/tenants/:id` - 删除租客

### 合同管理
- `GET /api/contracts` - 获取合同列表
- `GET /api/contracts/:id` - 获取合同详情
- `POST /api/contracts` - 创建合同
- `PUT /api/contracts/:id` - 更新合同
- `POST /api/contracts/:id/terminate` - 终止合同

### 财务管理
- `GET /api/finance/rent-records` - 获取收租记录
- `POST /api/finance/rent-records` - 创建收租记录
- `PUT /api/finance/rent-records/:id/pay` - 收款
- `GET /api/finance/expenses` - 获取支出记录
- `POST /api/finance/expenses` - 创建支出记录
- `GET /api/finance/statistics` - 获取财务统计

### 维修管理
- `GET /api/repairs` - 获取维修记录
- `POST /api/repairs` - 创建维修记录
- `PUT /api/repairs/:id` - 更新维修记录

### Dashboard
- `GET /api/dashboard` - 获取Dashboard数据

### 用户管理（仅管理员）
- `GET /api/users` - 获取用户列表
- `POST /api/users` - 创建用户
- `PUT /api/users/:id` - 更新用户
- `POST /api/users/:id/reset-password` - 重置密码

## 数据库表结构

系统包含以下核心数据表：
- `users` - 系统用户表
- `houses` - 房源表
- `rooms` - 房间表（合租）
- `tenants` - 租客表
- `contracts` - 合同表
- `rent_records` - 收租记录表
- `expense_records` - 支出记录表
- `repair_records` - 维修记录表
- `operation_logs` - 操作日志表

详细表结构请查看 `database/schema.sql`

## 角色权限

系统支持以下角色：
- **admin** - 管理员：拥有所有权限
- **finance** - 财务：财务管理相关权限
- **operation** - 运营：房源、租客、合同管理权限
- **service** - 客服：查看和基础操作权限

## 开发计划

### 已完成 ✅
- [x] 项目基础架构
- [x] 数据库设计
- [x] 后端API开发
- [x] 前端页面开发
- [x] 用户认证和权限
- [x] Dashboard数据展示

### 进行中 🚧
- [ ] 文件上传功能
- [ ] 维修管理完整功能
- [ ] 支出管理完整功能

### 计划中 📋
- [ ] 自动提醒功能（定时任务）
- [ ] 数据报表导出
- [ ] 移动端适配
- [ ] 小程序开发

## 注意事项

1. **安全性**：生产环境请务必修改默认密码和JWT密钥
2. **数据库**：建议定期备份数据库
3. **文件上传**：确保 `backend/uploads` 目录有写入权限
4. **环境变量**：不要将 `.env` 文件提交到版本控制系统

## 许可证

ISC

## 贡献

欢迎提交 Issue 和 Pull Request！
