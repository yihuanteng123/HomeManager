const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// 获取用户列表（仅管理员）
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, pageSize = 10, role, keyword } = req.query;
    const limit = Math.max(1, parseInt(pageSize, 10) || 10);
    const offset = (Math.max(1, parseInt(page, 10) || 1) - 1) * limit;

    let query = 'SELECT id, username, real_name, role, phone, email, status, created_at FROM users WHERE 1=1';
    const params = [];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    if (keyword) {
      query += ' AND (username LIKE ? OR real_name LIKE ?)';
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern);
    }

    query += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const [users] = await pool.execute(query, params);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const countParams = [];
    if (role) {
      countQuery += ' AND role = ?';
      countParams.push(role);
    }
    if (keyword) {
      countQuery += ' AND (username LIKE ? OR real_name LIKE ?)';
      const keywordPattern = `%${keyword}%`;
      countParams.push(keywordPattern, keywordPattern);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        list: users,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ success: false, message: '获取用户列表失败' });
  }
});

// 创建用户（仅管理员）
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { username, password, real_name, role, phone, email } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
    }

    // 检查用户名是否已存在
    const [existing] = await pool.execute('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: '用户名已存在' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      `INSERT INTO users (username, password, real_name, role, phone, email) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, hashedPassword, real_name || null, role || 'operation', phone || null, email || null]
    );

    res.json({
      success: true,
      message: '用户创建成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('创建用户错误:', error);
    res.status(500).json({ success: false, message: '创建用户失败' });
  }
});

// 更新用户（仅管理员）
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { real_name, role, phone, email, status } = req.body;

    // 检查用户是否存在
    const [users] = await pool.execute('SELECT id FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const updateFields = [];
    const updateValues = [];

    if (real_name !== undefined) {
      updateFields.push('real_name = ?');
      updateValues.push(real_name);
    }
    if (role !== undefined) {
      updateFields.push('role = ?');
      updateValues.push(role);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: '没有要更新的字段' });
    }

    updateValues.push(id);

    await pool.execute(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({ success: true, message: '用户更新成功' });
  } catch (error) {
    console.error('更新用户错误:', error);
    res.status(500).json({ success: false, message: '更新用户失败' });
  }
});

// 重置用户密码（仅管理员）
router.post('/:id/reset-password', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ success: false, message: '新密码不能为空' });
    }

    // 检查用户是否存在
    const [users] = await pool.execute('SELECT id FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);

    res.json({ success: true, message: '密码重置成功' });
  } catch (error) {
    console.error('重置密码错误:', error);
    res.status(500).json({ success: false, message: '重置密码失败' });
  }
});

module.exports = router;
