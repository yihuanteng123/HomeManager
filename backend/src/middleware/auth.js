const jwt = require('jsonwebtoken');

// JWT认证中间件
const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: '未提供认证令牌' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: '无效的认证令牌' 
    });
  }
};

// 角色权限检查中间件
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: '未认证' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: '权限不足' 
      });
    }

    next();
  };
};

module.exports = { authenticate, authorize };
