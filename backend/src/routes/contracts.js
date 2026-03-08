const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const moment = require('moment');

// 获取合同列表
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status, keyword } = req.query;
    const limit = Math.max(1, parseInt(pageSize, 10) || 10);
    const offset = (Math.max(1, parseInt(page, 10) || 1) - 1) * limit;

    let query = `SELECT c.*, h.house_code, h.address, h.house_type, r.room_code, 
                 t.name as tenant_name, t.phone as tenant_phone,
                 u.real_name as creator_name
                 FROM contracts c 
                 LEFT JOIN houses h ON c.house_id = h.id 
                 LEFT JOIN rooms r ON c.room_id = r.id 
                 LEFT JOIN tenants t ON c.tenant_id = t.id 
                 LEFT JOIN users u ON c.created_by = u.id 
                 WHERE 1=1`;
    const params = [];

    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }

    if (keyword) {
      query += ' AND (c.contract_code LIKE ? OR h.house_code LIKE ? OR t.name LIKE ?)';
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern, keywordPattern);
    }

    query += ` ORDER BY c.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const [contracts] = await pool.execute(query, params);

    // 获取总数
    let countQuery = `SELECT COUNT(*) as total FROM contracts c 
                      LEFT JOIN houses h ON c.house_id = h.id 
                      LEFT JOIN tenants t ON c.tenant_id = t.id 
                      WHERE 1=1`;
    const countParams = [];
    if (status) {
      countQuery += ' AND c.status = ?';
      countParams.push(status);
    }
    if (keyword) {
      countQuery += ' AND (c.contract_code LIKE ? OR h.house_code LIKE ? OR t.name LIKE ?)';
      const keywordPattern = `%${keyword}%`;
      countParams.push(keywordPattern, keywordPattern, keywordPattern);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        list: contracts,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('获取合同列表错误:', error);
    res.status(500).json({ success: false, message: '获取合同列表失败' });
  }
});

// 获取合同详情
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const [contracts] = await pool.execute(
      `SELECT c.*, h.house_code, h.address, h.house_type, r.room_code,
       t.name as tenant_name, t.phone as tenant_phone, t.id_card as tenant_id_card,
       u.real_name as creator_name
       FROM contracts c 
       LEFT JOIN houses h ON c.house_id = h.id 
       LEFT JOIN rooms r ON c.room_id = r.id 
       LEFT JOIN tenants t ON c.tenant_id = t.id 
       LEFT JOIN users u ON c.created_by = u.id 
       WHERE c.id = ?`,
      [id]
    );

    if (contracts.length === 0) {
      return res.status(404).json({ success: false, message: '合同不存在' });
    }

    const contract = contracts[0];

    // 获取收租记录
    const [rentRecords] = await pool.execute(
      'SELECT * FROM rent_records WHERE contract_id = ? ORDER BY rent_month DESC',
      [id]
    );
    contract.rent_records = rentRecords;

    res.json({ success: true, data: contract });
  } catch (error) {
    console.error('获取合同详情错误:', error);
    res.status(500).json({ success: false, message: '获取合同详情失败' });
  }
});

// 创建合同
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      contract_code,
      house_id,
      room_id,
      tenant_id,
      start_date,
      end_date,
      monthly_rent,
      deposit,
      payment_method,
      increment_rule,
      notes
    } = req.body;

    if (!contract_code || !house_id || !tenant_id || !start_date || !end_date || !monthly_rent || !deposit) {
      return res.status(400).json({ success: false, message: '必填字段不能为空' });
    }

    // 检查合同编号是否已存在
    const [existing] = await pool.execute('SELECT id FROM contracts WHERE contract_code = ?', [contract_code]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: '合同编号已存在' });
    }

    // 检查房源是否存在
    const [houses] = await pool.execute('SELECT id, status FROM houses WHERE id = ?', [house_id]);
    if (houses.length === 0) {
      return res.status(404).json({ success: false, message: '房源不存在' });
    }

    // 检查租客是否存在
    const [tenants] = await pool.execute('SELECT id FROM tenants WHERE id = ?', [tenant_id]);
    if (tenants.length === 0) {
      return res.status(404).json({ success: false, message: '租客不存在' });
    }

    // 如果是合租，检查房间是否存在
    if (room_id) {
      const [rooms] = await pool.execute('SELECT id, house_id FROM rooms WHERE id = ?', [room_id]);
      if (rooms.length === 0) {
        return res.status(404).json({ success: false, message: '房间不存在' });
      }
      if (rooms[0].house_id !== parseInt(house_id)) {
        return res.status(400).json({ success: false, message: '房间不属于该房源' });
      }
    }

    // 开始事务
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 插入合同
      const [result] = await connection.execute(
        `INSERT INTO contracts (
          contract_code, house_id, room_id, tenant_id, start_date, end_date,
          monthly_rent, deposit, payment_method, increment_rule, notes, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
        [
          contract_code, house_id, room_id || null, tenant_id, start_date, end_date,
          monthly_rent, deposit, payment_method || null, increment_rule || null, notes || null, req.user.id
        ]
      );

      const contractId = result.insertId;

      // 更新房源状态为已租
      await connection.execute('UPDATE houses SET status = ? WHERE id = ?', ['rented', house_id]);

      // 如果是合租，更新房间状态和当前租客
      if (room_id) {
        await connection.execute(
          'UPDATE rooms SET status = ?, current_tenant_id = ? WHERE id = ?',
          ['rented', tenant_id, room_id]
        );
      }

      // 生成首月租金记录
      const firstMonth = moment(start_date).format('YYYY-MM');
      await connection.execute(
        `INSERT INTO rent_records (
          contract_id, house_id, tenant_id, rent_month, expected_amount, status, created_by
        ) VALUES (?, ?, ?, ?, ?, 'unpaid', ?)`,
        [contractId, house_id, tenant_id, firstMonth, monthly_rent, req.user.id]
      );

      await connection.commit();

      res.json({
        success: true,
        message: '合同创建成功',
        data: { id: contractId }
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('创建合同错误:', error);
    res.status(500).json({ success: false, message: '创建合同失败' });
  }
});

// 更新合同
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // 检查合同是否存在
    const [contracts] = await pool.execute('SELECT * FROM contracts WHERE id = ?', [id]);
    if (contracts.length === 0) {
      return res.status(404).json({ success: false, message: '合同不存在' });
    }

    // 如果更新了合同编号，检查是否重复
    if (updateData.contract_code) {
      const [existing] = await pool.execute('SELECT id FROM contracts WHERE contract_code = ? AND id != ?', [updateData.contract_code, id]);
      if (existing.length > 0) {
        return res.status(400).json({ success: false, message: '合同编号已存在' });
      }
    }

    // 构建更新SQL
    const allowedFields = [
      'contract_code', 'house_id', 'room_id', 'tenant_id', 'start_date', 'end_date',
      'monthly_rent', 'deposit', 'payment_method', 'increment_rule', 'status', 'notes',
      'contract_file', 'supplement_file'
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
      `UPDATE contracts SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({ success: true, message: '合同更新成功' });
  } catch (error) {
    console.error('更新合同错误:', error);
    res.status(500).json({ success: false, message: '更新合同失败' });
  }
});

// 终止合同
router.post('/:id/terminate', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 获取合同信息
      const [contracts] = await connection.execute('SELECT * FROM contracts WHERE id = ?', [id]);
      if (contracts.length === 0) {
        return res.status(404).json({ success: false, message: '合同不存在' });
      }

      const contract = contracts[0];

      // 更新合同状态
      await connection.execute(
        'UPDATE contracts SET status = ?, notes = CONCAT(IFNULL(notes, ""), ?) WHERE id = ?',
        ['terminated', reason ? `\n终止原因：${reason}` : '', id]
      );

      // 更新房源状态为空置
      await connection.execute('UPDATE houses SET status = ? WHERE id = ?', ['vacant', contract.house_id]);

      // 如果是合租，更新房间状态
      if (contract.room_id) {
        await connection.execute(
          'UPDATE rooms SET status = ?, current_tenant_id = NULL WHERE id = ?',
          ['vacant', contract.room_id]
        );
      }

      await connection.commit();

      res.json({ success: true, message: '合同终止成功' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('终止合同错误:', error);
    res.status(500).json({ success: false, message: '终止合同失败' });
  }
});

module.exports = router;
