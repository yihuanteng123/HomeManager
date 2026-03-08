#!/bin/bash
# Ubuntu 快速安装脚本
# 使用方法: chmod +x ubuntu_quick.sh && ./ubuntu_quick.sh

echo "=========================================="
echo "  房源管理系统 - Ubuntu 快速安装脚本"
echo "=========================================="
echo ""

# 检查是否为 root 用户
if [ "$EUID" -eq 0 ]; then 
   echo "请不要使用 root 用户运行此脚本"
   exit 1
fi

# 1. 更新系统
echo "步骤 1/6: 更新系统包..."
sudo apt update
sudo apt upgrade -y

# 2. 安装 MySQL
echo ""
echo "步骤 2/6: 安装 MySQL..."
sudo apt install mysql-server -y

# 启动 MySQL 服务
sudo systemctl start mysql
sudo systemctl enable mysql

# 3. 安装 Node.js
echo ""
echo "步骤 3/6: 安装 Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo "Node.js 已安装，版本: $(node --version)"
fi

# 4. 配置 MySQL
echo ""
echo "步骤 4/6: 配置 MySQL..."
echo "请设置 MySQL root 密码（两次输入）："
read -s MYSQL_PASSWORD
echo "请再次输入密码确认："
read -s MYSQL_PASSWORD_CONFIRM

if [ "$MYSQL_PASSWORD" != "$MYSQL_PASSWORD_CONFIRM" ]; then
    echo "密码不匹配，退出安装"
    exit 1
fi

# 设置 MySQL root 密码
sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '$MYSQL_PASSWORD';"
sudo mysql -e "FLUSH PRIVILEGES;"

# 5. 创建数据库
echo ""
echo "步骤 5/6: 创建数据库..."
if [ -f "database/schema.sql" ]; then
    mysql -u root -p"$MYSQL_PASSWORD" < database/schema.sql
    echo "数据库创建成功！"
else
    echo "错误: 找不到 database/schema.sql 文件"
    exit 1
fi

# 6. 安装项目依赖
echo ""
echo "步骤 6/6: 安装项目依赖..."

# 后端依赖
if [ -d "backend" ]; then
    echo "安装后端依赖..."
    cd backend
    npm install
    cd ..
fi

# 前端依赖
if [ -d "frontend" ]; then
    echo "安装前端依赖..."
    cd frontend
    npm install
    cd ..
fi

# 创建后端环境变量文件
if [ -d "backend" ] && [ ! -f "backend/.env" ]; then
    echo ""
    echo "创建后端环境变量文件..."
    cat > backend/.env << EOF
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=$MYSQL_PASSWORD
DB_NAME=home_manager

JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d

UPLOAD_DIR=./uploads
EOF
    echo "环境变量文件已创建: backend/.env"
fi

# 创建上传目录
mkdir -p backend/uploads

echo ""
echo "=========================================="
echo "  安装完成！"
echo "=========================================="
echo ""
echo "下一步："
echo "1. 编辑 backend/.env 文件（如果需要调整配置）"
echo "2. 启动后端: cd backend && npm run dev"
echo "3. 启动前端: cd frontend && npm run dev"
echo "4. 访问: http://localhost:8080"
echo ""
echo "默认登录账号："
echo "  用户名: admin"
echo "  密码: admin123"
echo ""
echo "MySQL root 密码已保存到 backend/.env 文件中"
echo ""
