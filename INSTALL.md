# 安装指南

## 一、环境要求

- Node.js >= 14.0.0
- MySQL >= 5.7 或 MySQL >= 8.0
- npm 或 yarn

## 二、MySQL 安装步骤（Windows）

### 方法一：官方安装包（推荐）

1. **下载 MySQL**
   - 访问 MySQL 官网：https://dev.mysql.com/downloads/mysql/
   - 选择 Windows 版本下载（推荐下载 MySQL Installer）

2. **安装 MySQL**
   - 运行安装程序，选择 "Developer Default" 或 "Server only"
   - 设置 root 用户密码（请记住这个密码，后续配置需要用到）
   - 完成安装

3. **验证安装**
   ```bash
   # 打开命令提示符或 PowerShell
   mysql --version
   ```

4. **启动 MySQL 服务**
   - 按 `Win + R`，输入 `services.msc`
   - 找到 "MySQL80" 或 "MySQL" 服务
   - 右键选择 "启动"（如果未启动）

### 方法二：使用 XAMPP（简单快速）

1. **下载 XAMPP**
   - 访问：https://www.apachefriends.org/
   - 下载 Windows 版本

2. **安装并启动**
   - 安装 XAMPP
   - 打开 XAMPP Control Panel
   - 点击 MySQL 旁边的 "Start" 按钮

3. **默认配置**
   - 默认用户名：`root`
   - 默认密码：**空**（无密码）
   - 默认端口：`3306`

### 方法三：使用 Docker（适合开发者）

```bash
# 拉取 MySQL 镜像
docker pull mysql:8.0

# 运行 MySQL 容器
docker run --name mysql-home-manager \
  -e MYSQL_ROOT_PASSWORD=your_password \
  -e MYSQL_DATABASE=home_manager \
  -p 3306:3306 \
  -d mysql:8.0
```

## 三、创建数据库

### 方法一：使用命令行

```bash
# 登录 MySQL（输入你设置的 root 密码）
mysql -u root -p

# 执行以下 SQL 命令
CREATE DATABASE IF NOT EXISTS home_manager DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 方法二：使用 MySQL Workbench 或 phpMyAdmin

1. 打开 MySQL Workbench 或 phpMyAdmin
2. 连接到 MySQL 服务器
3. 创建新数据库：`home_manager`
4. 字符集选择：`utf8mb4`
5. 排序规则选择：`utf8mb4_unicode_ci`

### 方法三：使用项目提供的 SQL 脚本（推荐）

```bash
# 在项目根目录执行
mysql -u root -p < database/schema.sql
```

这会自动创建数据库和所有表结构。

## 四、配置后端数据库连接

1. **复制环境变量文件**
   ```bash
   cd backend
   # Note: the template file is `env.example` (not `.env.example`)
   # because `.env*` files are ignored/blocked by default for safety.
   cp env.example .env
   ```

2. **编辑 `.env` 文件**
   ```env
   # 服务器配置
   PORT=3000
   NODE_ENV=development

   # 数据库配置（根据你的 MySQL 配置修改）
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password  # 修改为你的 MySQL root 密码
   DB_NAME=home_manager

   # JWT密钥（生产环境请修改为复杂字符串）
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=7d

   # 文件上传配置
   UPLOAD_DIR=./uploads
   ```

3. **测试数据库连接**
   ```bash
   cd backend
   npm install
   npm start
   ```
   
   如果看到 "数据库连接成功" 的提示，说明配置正确。

## 五、常见问题

### Q1: 忘记 MySQL root 密码怎么办？

**Windows 方法：**
1. 停止 MySQL 服务
2. 以管理员身份打开命令提示符
3. 执行：
   ```bash
   mysqld --skip-grant-tables
   ```
4. 打开新的命令提示符窗口：
   ```bash
   mysql -u root
   USE mysql;
   UPDATE user SET authentication_string=PASSWORD('新密码') WHERE User='root';
   FLUSH PRIVILEGES;
   EXIT;
   ```
5. 重启 MySQL 服务

### Q2: 连接被拒绝（Access denied）

- 检查用户名和密码是否正确
- 确认 MySQL 服务是否启动
- 检查防火墙设置

### Q3: 端口 3306 被占用

- 修改 `.env` 文件中的 `DB_PORT` 为其他端口（如 3307）
- 或在 MySQL 配置文件中修改端口

### Q4: 字符编码问题

确保数据库和表的字符集都是 `utf8mb4`：
```sql
ALTER DATABASE home_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 六、验证安装

完成以上步骤后，运行以下命令验证：

```bash
# 1. 检查 MySQL 是否运行
mysql -u root -p -e "SHOW DATABASES;"

# 2. 检查数据库是否创建
mysql -u root -p -e "USE home_manager; SHOW TABLES;"

# 3. 启动后端服务
cd backend
npm start

# 4. 启动前端服务（新开一个终端）
cd frontend
npm run dev
```

如果一切正常，访问 http://localhost:8080 应该能看到登录页面。

## 七、默认账号

系统安装完成后，使用以下账号登录：
- **用户名**：`admin`
- **密码**：`admin123`

**⚠️ 重要：首次登录后请立即修改密码！**
