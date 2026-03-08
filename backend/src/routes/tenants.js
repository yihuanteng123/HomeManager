const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

// 获取租客列表
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, is_blacklist } = req.query;
    const limit = Math.max(1, parseInt(pageSize, 10) || 10);
    const offset = (Math.max(1, parseInt(page, 10) || 1) - 1) * limit;

    let query = 'SELECT * FROM tenants WHERE 1=1';
    const params = [];

    if (keyword) {
      query += ' AND (name LIKE ? OR phone LIKE ? OR id_card LIKE ?)';
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern, keywordPattern);
    }

    if (is_blacklist !== undefined) {
      query += ' AND is_blacklist = ?';
      params.push(is_blacklist);
    }

    query += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const [tenants] = await pool.execute(query, params);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM tenants WHERE 1=1';
    const countParams = [];
    if (keyword) {
      countQuery += ' AND (name LIKE ? OR phone LIKE ? OR id_card LIKE ?)';
      const keywordPattern = `%${keyword}%`;
      countParams.push(keywordPattern, keywordPattern, keywordPattern);
    }
    if (is_blacklist !== undefined) {
      countQuery += ' AND is_blacklist = ?';
      countParams.push(is_blacklist);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        list: tenants,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('获取租客列表错误:', error);
    res.status(500).json({ success: false, message: '获取租客列表失败' });
  }
});

// 获取租客详情
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const [tenants] = await pool.execute('SELECT * FROM tenants WHERE id = ?', [id]);

    if (tenants.length === 0) {
      return res.status(404).json({ success: false, message: '租客不存在' });
    }

    const tenant = tenants[0];

    // 获取租住历史（合同记录）
    const [contracts] = await pool.execute(
      `SELECT c.*, h.house_code, h.address, h.house_type, r.room_code 
       FROM contracts c 
       LEFT JOIN houses h ON c.house_id = h.id 
       LEFT JOIN rooms r ON c.room_id = r.id 
       WHERE c.tenant_id = ? 
       ORDER BY c.start_date DESC`,
      [id]
    );
    tenant.contract_history = contracts;

    // 获取欠费记录
    const [unpaidRents] = await pool.execute(
      `SELECT rr.*, h.house_code, h.address 
       FROM rent_records rr 
       LEFT JOIN houses h ON rr.house_id = h.id 
       WHERE rr.tenant_id = ? AND rr.status IN ('unpaid', 'partial', 'overdue')
       ORDER BY rr.rent_month DESC`,
      [id]
    );
    tenant.unpaid_records = unpaidRents;

    res.json({ success: true, data: tenant });
  } catch (error) {
    console.error('获取租客详情错误:', error);
    res.status(500).json({ success: false, message: '获取租客详情失败' });
  }
});

// 创建租客
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      name,
      id_card,
      phone,
      emergency_contact,
      emergency_phone,
      company,
      credit_note
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: '姓名和联系电话不能为空' });
    }

    // 如果提供了身份证，检查是否已存在
    if (id_card) {
      const [existing] = await pool.execute('SELECT id FROM tenants WHERE id_card = ?', [id_card]);
      if (existing.length > 0) {
        return res.status(400).json({ success: false, message: '该身份证号已存在' });
      }
    }

    const [result] = await pool.execute(
      `INSERT INTO tenants (
        name, id_card, phone, emergency_contact, emergency_phone, company, credit_note
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, id_card || null, phone, emergency_contact || null, emergency_phone || null, company || null, credit_note || null]
    );

    res.json({
      success: true,
      message: '租客创建成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('创建租客错误:', error);
    res.status(500).json({ success: false, message: '创建租客失败' });
  }
});

// 更新租客
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // 检查租客是否存在
    const [tenants] = await pool.execute('SELECT id FROM tenants WHERE id = ?', [id]);
    if (tenants.length === 0) {
      return res.status(404).json({ success: false, message: '租客不存在' });
    }

    // 如果更新了身份证，检查是否重复
    if (updateData.id_card) {
      const [existing] = await pool.execute('SELECT id FROM tenants WHERE id_card = ? AND id != ?', [updateData.id_card, id]);
      if (existing.length > 0) {
        return res.status(400).json({ success: false, message: '该身份证号已存在' });
      }
    }

    // 构建更新SQL
    const allowedFields = [
      'name', 'id_card', 'phone', 'emergency_contact', 'emergency_phone',
      'company', 'credit_note', 'is_blacklist', 'blacklist_reason'
    ];

    const updateFields = [];
    const updateValues = [];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(updateData[field]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: '没有要更新的字段' });
    }

    updateValues.push(id);

    await pool.execute(
      `UPDATE tenants SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({ success: true, message: '租客更新成功' });
  } catch (error) {
    console.error('更新租客错误:', error);
    res.status(500).json({ success: false, message: '更新租客失败' });
  }
});

// 删除租客
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // 检查是否有活跃合同
    const [contracts] = await pool.execute(
      'SELECT id FROM contracts WHERE tenant_id = ? AND status IN ("active", "expiring")',
      [id]
    );

    if (contracts.length > 0) {
      return res.status(400).json({ success: false, message: '该租客存在活跃合同，无法删除' });
    }

    await pool.execute('DELETE FROM tenants WHERE id = ?', [id]);

    res.json({ success: true, message: '租客删除成功' });
  } catch (error) {
    console.error('删除租客错误:', error);
    res.status(500).json({ success: false, message: '删除租客失败' });
  }
});

module.exports = router;
