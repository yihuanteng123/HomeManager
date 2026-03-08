# 快速启动指南

## 第一步：安装 MySQL

### Windows 推荐方式：XAMPP
1. 下载：https://www.apachefriends.org/
2. 安装后启动 MySQL 服务

## 第二步：创建数据库

打开命令提示符（CMD）或 PowerShell，执行：

```bash
# 如果使用 XAMPP（无密码）
mysql -u root < database/schema.sql

# 如果设置了密码
mysql -u root -p < database/schema.sql
# 然后输入你的 MySQL 密码
```

## 第三步：配置后端

```bash
cd backend
npm install
copy env.example .env
```

编辑 `backend/.env` 文件：
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的MySQL密码  # XAMPP用户留空
DB_NAME=home_manager
JWT_SECRET=your_jwt_secret_key_here
```

## 第四步：启动后端

```bash
cd backend
npm run dev
```

看到 "数据库连接成功" 说明配置正确！

## 第五步：启动前端

新开一个终端窗口：

```bash
cd frontend
npm install
npm run dev
```

## 第六步：访问系统

打开浏览器访问：http://localhost:8080

**默认登录账号：**
- 用户名：`admin`
- 密码：`admin123`

---

## 常见问题

**Q: MySQL 连接失败？**
- 检查 MySQL 服务是否启动（XAMPP Control Panel 中查看）
- 检查 `.env` 文件中的密码是否正确
- XAMPP 用户密码为空，不要填写

**Q: 数据库不存在？**
- 确保执行了 `database/schema.sql` 脚本
- 手动创建：`CREATE DATABASE home_manager;`

**Q: 端口被占用？**
- 后端默认端口：3000
- 前端默认端口：8080
- 可在配置文件中修改
