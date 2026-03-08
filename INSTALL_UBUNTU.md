# Ubuntu 安装指南

## 一、系统要求

- Ubuntu 18.04 或更高版本
- 具有 sudo 权限的用户

## 二、安装 MySQL

### 1. 更新系统包

```bash
sudo apt update
sudo apt upgrade -y
```

### 2. 安装 MySQL Server

```bash
sudo apt install mysql-server -y
```

### 3. 启动 MySQL 服务

```bash
sudo systemctl start mysql
sudo systemctl enable mysql  # 设置开机自启
```

### 4. 检查 MySQL 状态

```bash
sudo systemctl status mysql
```

应该看到 `active (running)` 状态。

### 5. 配置 MySQL root 密码（重要）

MySQL 8.0 默认使用 `auth_socket` 认证，需要切换到密码认证：

```bash
# 以 root 身份登录 MySQL（无需密码）
sudo mysql

# 在 MySQL 命令行中执行以下命令
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '你的密码';
FLUSH PRIVILEGES;
EXIT;
```

**⚠️ 请记住你设置的密码，后续配置需要用到！**

### 6. 测试 MySQL 连接

```bash
mysql -u root -p
# 输入刚才设置的密码
```

如果成功进入 MySQL 命令行，说明安装成功。输入 `EXIT;` 退出。

## 三、安装 Node.js 和 npm

### 方法一：使用 NodeSource 仓库（推荐，版本较新）

```bash
# 安装 Node.js 18.x LTS 版本
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node --version
npm --version
```

### 方法二：使用 Ubuntu 默认仓库

```bash
sudo apt install nodejs npm -y
```

### 方法三：使用 nvm（Node Version Manager，推荐开发者使用）

```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 重新加载 shell 配置
source ~/.bashrc

# 安装 Node.js LTS 版本
nvm install --lts
nvm use --lts

# 验证
node --version
npm --version
```

## 四、创建数据库

### 1. 进入项目目录

```bash
cd /path/to/HomeManager  # 替换为你的项目路径
```

### 2. 执行数据库脚本

```bash
# 使用 root 用户执行 SQL 脚本
mysql -u root -p < database/schema.sql
# 输入 MySQL root 密码
```

### 3. 验证数据库创建

```bash
mysql -u root -p -e "USE home_manager; SHOW TABLES;"
```

应该能看到 9 个表：users, houses, rooms, tenants, contracts, rent_records, expense_records, repair_records, operation_logs

## 五、配置后端

### 1. 进入后端目录并安装依赖

```bash
cd backend
npm install
```

### 2. 创建环境变量文件

```bash
cp env.example .env
```

### 3. 编辑环境变量

```bash
nano .env
# 或使用 vim
# vim .env
```

修改以下配置：

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你刚才设置的MySQL密码
DB_NAME=home_manager

# JWT密钥（生产环境请修改为复杂字符串）
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRES_IN=7d

# 文件上传配置
UPLOAD_DIR=./uploads
```

保存文件：
- nano: `Ctrl + X`，然后 `Y`，然后 `Enter`
- vim: 按 `Esc`，输入 `:wq`，按 `Enter`

### 4. 创建上传目录

```bash
mkdir -p uploads
```

### 5. 测试后端连接

```bash
npm start
```

如果看到 "数据库连接成功" 和 "服务器运行在端口 3000"，说明配置成功！

按 `Ctrl + C` 停止服务。

## 六、配置前端

### 1. 进入前端目录并安装依赖

```bash
cd ../frontend
npm install
```

### 2. 检查前端配置

前端已经配置了代理，会自动转发到后端 `http://localhost:3000`。

如果需要修改，编辑 `vite.config.js`：

```javascript
proxy: {
  '/api': {
    target: 'http://localhost:3000',  // 确保这里指向后端地址
    changeOrigin: true
  }
}
```

## 七、启动项目

### 方式一：分别启动（开发模式）

**终端 1 - 启动后端：**
```bash
cd backend
npm run dev
```

**终端 2 - 启动前端：**
```bash
cd frontend
npm run dev
```

### 方式二：使用 PM2（生产环境推荐）

```bash
# 全局安装 PM2
sudo npm install -g pm2

# 启动后端
cd backend
pm2 start src/app.js --name "home-manager-api"

# 启动前端（需要先构建）
cd ../frontend
npm run build
pm2 serve dist 8080 --name "home-manager-web"

# 查看运行状态
pm2 list

# 查看日志
pm2 logs

# 停止服务
pm2 stop all
pm2 delete all
```

## 八、访问系统

### 本地访问

打开浏览器访问：http://localhost:8080

### 虚拟机网络访问

如果要从宿主机访问虚拟机：

1. **查看虚拟机 IP 地址：**
   ```bash
   ip addr show
   # 或
   hostname -I
   ```

2. **配置防火墙（如果需要）：**
   ```bash
   # Ubuntu 使用 ufw
   sudo ufw allow 8080/tcp
   sudo ufw allow 3000/tcp
   sudo ufw status
   ```

3. **从宿主机访问：**
   - 访问：`http://虚拟机IP:8080`
   - 例如：`http://192.168.1.100:8080`

4. **修改前端代理配置（如果从外部访问）：**
   
   编辑 `frontend/vite.config.js`，修改代理目标：
   ```javascript
   proxy: {
     '/api': {
       target: 'http://0.0.0.0:3000',  // 允许外部访问
       changeOrigin: true
     }
   }
   ```

## 九、默认登录账号

- **用户名**：`admin`
- **密码**：`admin123`

**⚠️ 重要：首次登录后请立即修改密码！**

## 十、常见问题排查

### Q1: MySQL 连接被拒绝

```bash
# 检查 MySQL 服务状态
sudo systemctl status mysql

# 重启 MySQL
sudo systemctl restart mysql

# 检查 MySQL 是否监听 3306 端口
sudo netstat -tlnp | grep 3306
```

### Q2: 端口被占用

```bash
# 查看端口占用
sudo lsof -i :3000
sudo lsof -i :8080

# 杀死占用进程
sudo kill -9 <PID>
```

### Q3: 权限问题

```bash
# 如果遇到文件权限问题
sudo chown -R $USER:$USER /path/to/HomeManager
chmod -R 755 /path/to/HomeManager
```

### Q4: Node.js 版本过低

```bash
# 检查 Node.js 版本
node --version

# 如果版本 < 14，使用 nvm 升级
nvm install 18
nvm use 18
```

### Q5: npm 安装依赖失败

```bash
# 清除 npm 缓存
npm cache clean --force

# 使用国内镜像（可选）
npm config set registry https://registry.npmmirror.com

# 重新安装
rm -rf node_modules package-lock.json
npm install
```

### Q6: 数据库字符编码问题

```bash
# 检查数据库字符集
mysql -u root -p -e "SHOW VARIABLES LIKE 'character_set%';"

# 如果字符集不是 utf8mb4，修改数据库
mysql -u root -p
ALTER DATABASE home_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

## 十一、生产环境部署建议

### 1. 使用 Nginx 反向代理

```bash
# 安装 Nginx
sudo apt install nginx -y

# 配置 Nginx（创建配置文件）
sudo nano /etc/nginx/sites-available/home-manager
```

添加以下配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名或IP

    # 前端静态文件
    location / {
        root /path/to/HomeManager/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/home-manager /etc/nginx/sites-enabled/
sudo nginx -t  # 测试配置
sudo systemctl restart nginx
```

### 2. 配置 SSL（HTTPS）

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取 SSL 证书
sudo certbot --nginx -d your-domain.com
```

### 3. 设置防火墙

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

## 十二、系统服务配置（可选）

创建 systemd 服务文件，让后端自动启动：

```bash
sudo nano /etc/systemd/system/home-manager-api.service
```

添加内容：

```ini
[Unit]
Description=Home Manager API
After=network.target mysql.service

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/HomeManager/backend
ExecStart=/usr/bin/node src/app.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启用服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable home-manager-api
sudo systemctl start home-manager-api
sudo systemctl status home-manager-api
```

---

## 快速命令参考

```bash
# 启动 MySQL
sudo systemctl start mysql

# 停止 MySQL
sudo systemctl stop mysql

# 重启 MySQL
sudo systemctl restart mysql

# 查看 MySQL 状态
sudo systemctl status mysql

# 登录 MySQL
mysql -u root -p

# 查看所有数据库
mysql -u root -p -e "SHOW DATABASES;"

# 查看项目数据库表
mysql -u root -p -e "USE home_manager; SHOW TABLES;"
```

完成以上步骤后，你的系统就可以在 Ubuntu 虚拟机上运行了！
