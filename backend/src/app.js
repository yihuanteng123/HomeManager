const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务（上传的文件）
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/houses', require('./routes/houses'));
app.use('/api/tenants', require('./routes/tenants'));
app.use('/api/contracts', require('./routes/contracts'));
app.use('/api/finance', require('./routes/finance'));
app.use('/api/repairs', require('./routes/repairs'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/users', require('./routes/users'));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'HomeManager API is running' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: err.message || '服务器内部错误' 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});

module.exports = app;
