const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名和密码不能为空' 
      });
    }

    // 查询用户
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE username = ? AND status = 1',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: '用户名或密码错误' 
      });
    }

    const user = users[0];

    // 验证密码（首次登录时，如果密码未加密，则使用明文对比并更新）
    let isValidPassword = false;
    if (user.password.startsWith('$2a$')) {
      // 已加密的密码
      isValidPassword = await bcrypt.compare(password, user.password);
    } else {
      // 未加密的密码（兼容旧数据）
      isValidPassword = user.password === password;
      if (isValidPassword) {
        // 更新为加密密码
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);
      }
    }

    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: '用户名或密码错误' 
      });
    }

    // 生成JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // 返回用户信息（不包含密码）
    const { password: _, ...userInfo } = user;

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: userInfo
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '登录失败，请稍后重试' 
    });
  }
});

// 获取当前用户信息
router.get('/me', authenticate, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, username, real_name, role, phone, email, status, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '用户不存在' 
      });
    }

    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取用户信息失败' 
    });
  }
});

// 修改密码
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: '旧密码和新密码不能为空' 
      });
    }

    // 查询用户
    const [users] = await pool.execute('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '用户不存在' 
      });
    }

    const user = users[0];

    // 验证旧密码
    let isValidPassword = false;
    if (user.password.startsWith('$2a$')) {
      isValidPassword = await bcrypt.compare(oldPassword, user.password);
    } else {
      isValidPassword = user.password === oldPassword;
    }

    if (!isValidPassword) {
      return res.status(400).json({ 
        success: false, 
        message: '旧密码错误' 
      });
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '修改密码失败' 
    });
  }
});

module.exports = router;
