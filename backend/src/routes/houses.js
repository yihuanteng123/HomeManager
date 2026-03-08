const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

// 获取房源列表
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status, house_type, keyword } = req.query;
    const limit = Math.max(1, parseInt(pageSize, 10) || 10);
    const offset = (Math.max(1, parseInt(page, 10) || 1) - 1) * limit;

    let query = 'SELECT h.*, u.real_name as creator_name FROM houses h LEFT JOIN users u ON h.created_by = u.id WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND h.status = ?';
      params.push(status);
    }

    if (house_type) {
      query += ' AND h.house_type = ?';
      params.push(house_type);
    }

    if (keyword) {
      query += ' AND (h.house_code LIKE ? OR h.address LIKE ?)';
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern);
    }

    query += ` ORDER BY h.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const [houses] = await pool.execute(query, params);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM houses h WHERE 1=1';
    const countParams = [];
    if (status) {
      countQuery += ' AND h.status = ?';
      countParams.push(status);
    }
    if (house_type) {
      countQuery += ' AND h.house_type = ?';
      countParams.push(house_type);
    }
    if (keyword) {
      countQuery += ' AND (h.house_code LIKE ? OR h.address LIKE ?)';
      const keywordPattern = `%${keyword}%`;
      countParams.push(keywordPattern, keywordPattern);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        list: houses,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('获取房源列表错误:', error);
    res.status(500).json({ success: false, message: '获取房源列表失败' });
  }
});

// 获取房源详情
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const [houses] = await pool.execute(
      'SELECT h.*, u.real_name as creator_name FROM houses h LEFT JOIN users u ON h.created_by = u.id WHERE h.id = ?',
      [id]
    );

    if (houses.length === 0) {
      return res.status(404).json({ success: false, message: '房源不存在' });
    }

    const house = houses[0];

    // 如果是合租，获取房间列表
    if (house.house_type === 'shared') {
      const [rooms] = await pool.execute(
        'SELECT r.*, t.name as tenant_name FROM rooms r LEFT JOIN tenants t ON r.current_tenant_id = t.id WHERE r.house_id = ? ORDER BY r.room_code',
        [id]
      );
      house.rooms = rooms;
    }

    // 获取当前合同
    const [contracts] = await pool.execute(
      'SELECT c.*, t.name as tenant_name FROM contracts c LEFT JOIN tenants t ON c.tenant_id = t.id WHERE c.house_id = ? AND c.status = "active" ORDER BY c.created_at DESC LIMIT 1',
      [id]
    );
    house.current_contract = contracts[0] || null;

    res.json({ success: true, data: house });
  } catch (error) {
    console.error('获取房源详情错误:', error);
    res.status(500).json({ success: false, message: '获取房源详情失败' });
  }
});

// 创建房源
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      house_code,
      house_type,
      address,
      area,
      floor,
      total_floors,
      orientation,
      layout,
      upstream_landlord_name,
      upstream_landlord_phone,
      status,
      monthly_rent,
      deposit,
      description,
      images
    } = req.body;

    if (!house_code || !house_type || !address) {
      return res.status(400).json({ success: false, message: '房源编号、类型和地址不能为空' });
    }

    // 检查房源编号是否已存在
    const [existing] = await pool.execute('SELECT id FROM houses WHERE house_code = ?', [house_code]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: '房源编号已存在' });
    }

    const [result] = await pool.execute(
      `INSERT INTO houses (
        house_code, house_type, address, area, floor, total_floors, orientation, layout,
        upstream_landlord_name, upstream_landlord_phone, status, monthly_rent, deposit,
        description, images, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        house_code, house_type, address, area, floor, total_floors, orientation, layout,
        upstream_landlord_name, upstream_landlord_phone, status || 'vacant', monthly_rent, deposit,
        description, images ? JSON.stringify(images) : null, req.user.id
      ]
    );

    res.json({
      success: true,
      message: '房源创建成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('创建房源错误:', error);
    res.status(500).json({ success: false, message: '创建房源失败' });
  }
});

// 更新房源
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // 检查房源是否存在
    const [houses] = await pool.execute('SELECT id FROM houses WHERE id = ?', [id]);
    if (houses.length === 0) {
      return res.status(404).json({ success: false, message: '房源不存在' });
    }

    // 如果更新了房源编号，检查是否重复
    if (updateData.house_code) {
      const [existing] = await pool.execute('SELECT id FROM houses WHERE house_code = ? AND id != ?', [updateData.house_code, id]);
      if (existing.length > 0) {
        return res.status(400).json({ success: false, message: '房源编号已存在' });
      }
    }

    // 构建更新SQL
    const allowedFields = [
      'house_code', 'house_type', 'address', 'area', 'floor', 'total_floors', 'orientation', 'layout',
      'upstream_landlord_name', 'upstream_landlord_phone', 'status', 'monthly_rent', 'deposit',
      'description', 'images', 'property_certificate', 'original_contract'
    ];

    const updateFields = [];
    const updateValues = [];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(field === 'images' && updateData[field] ? JSON.stringify(updateData[field]) : updateData[field]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: '没有要更新的字段' });
    }

    updateValues.push(id);

    await pool.execute(
      `UPDATE houses SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({ success: true, message: '房源更新成功' });
  } catch (error) {
    console.error('更新房源错误:', error);
    res.status(500).json({ success: false, message: '更新房源失败' });
  }
});

// 删除房源
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // 检查是否有活跃合同
    const [contracts] = await pool.execute(
      'SELECT id FROM contracts WHERE house_id = ? AND status IN ("active", "expiring")',
      [id]
    );

    if (contracts.length > 0) {
      return res.status(400).json({ success: false, message: '该房源存在活跃合同，无法删除' });
    }

    await pool.execute('DELETE FROM houses WHERE id = ?', [id]);

    res.json({ success: true, message: '房源删除成功' });
  } catch (error) {
    console.error('删除房源错误:', error);
    res.status(500).json({ success: false, message: '删除房源失败' });
  }
});

module.exports = router;
