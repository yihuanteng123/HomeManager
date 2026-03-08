const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || 'root',
  // If DB_PASSWORD is set (even to empty string), use it; otherwise default to no password.
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
  database: process.env.DB_NAME || 'home_manager',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// 启动时打印当前数据库配置（不含密码），便于排查 .env 是否生效
console.log('数据库配置:', {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database
});

const pool = mysql.createPool(dbConfig);

// 测试数据库连接
pool.getConnection()
  .then(connection => {
    console.log('数据库连接成功');
    connection.release();
  })
  .catch(err => {
    console.error('数据库连接失败:', err.message);
    if (err.message && err.message.includes("Access denied") && dbConfig.user === 'root' && dbConfig.host !== 'localhost' && dbConfig.host !== '127.0.0.1') {
      console.error('提示: 从本机连虚拟机/远程 MySQL 时，不要用 root。请在虚拟机 MySQL 中执行：');
      console.error("  CREATE USER 'home_manager'@'%' IDENTIFIED BY '你的密码';");
      console.error("  GRANT ALL PRIVILEGES ON home_manager.* TO 'home_manager'@'%'; FLUSH PRIVILEGES;");
      console.error('然后在 backend/.env 中设置 DB_USER=home_manager, DB_PASSWORD=你的密码');
    }
  });

module.exports = pool;
