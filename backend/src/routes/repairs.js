const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

// 获取维修记录列表
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status, urgency, keyword } = req.query;
    const limit = Math.max(1, parseInt(pageSize, 10) || 10);
    const offset = (Math.max(1, parseInt(page, 10) || 1) - 1) * limit;

    let query = `SELECT r.*, h.house_code, h.address, rm.room_code, u.real_name as creator_name
                 FROM repair_records r 
                 LEFT JOIN houses h ON r.house_id = h.id 
                 LEFT JOIN rooms rm ON r.room_id = rm.id 
                 LEFT JOIN users u ON r.created_by = u.id 
                 WHERE 1=1`;
    const params = [];

    if (status) {
      query += ' AND r.status = ?';
      params.push(status);
    }

    if (urgency) {
      query += ' AND r.urgency = ?';
      params.push(urgency);
    }

    if (keyword) {
      query += ' AND (h.house_code LIKE ? OR r.problem_description LIKE ?)';
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern);
    }

    query += ` ORDER BY r.report_date DESC LIMIT ${limit} OFFSET ${offset}`;

    const [repairs] = await pool.execute(query, params);

    // 获取总数
    let countQuery = `SELECT COUNT(*) as total FROM repair_records r 
                      LEFT JOIN houses h ON r.house_id = h.id 
                      WHERE 1=1`;
    const countParams = [];
    if (status) {
      countQuery += ' AND r.status = ?';
      countParams.push(status);
    }
    if (urgency) {
      countQuery += ' AND r.urgency = ?';
      countParams.push(urgency);
    }
    if (keyword) {
      countQuery += ' AND (h.house_code LIKE ? OR r.problem_description LIKE ?)';
      const keywordPattern = `%${keyword}%`;
      countParams.push(keywordPattern, keywordPattern);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        list: repairs,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('获取维修记录错误:', error);
    res.status(500).json({ success: false, message: '获取维修记录失败' });
  }
});

// 获取维修记录详情
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const [repairs] = await pool.execute(
      `SELECT r.*, h.house_code, h.address, rm.room_code, u.real_name as creator_name
       FROM repair_records r 
       LEFT JOIN houses h ON r.house_id = h.id 
       LEFT JOIN rooms rm ON r.room_id = rm.id 
       LEFT JOIN users u ON r.created_by = u.id 
       WHERE r.id = ?`,
      [id]
    );

    if (repairs.length === 0) {
      return res.status(404).json({ success: false, message: '维修记录不存在' });
    }

    res.json({ success: true, data: repairs[0] });
  } catch (error) {
    console.error('获取维修记录详情错误:', error);
    res.status(500).json({ success: false, message: '获取维修记录详情失败' });
  }
});

// 创建维修记录
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      house_id,
      room_id,
      reporter,
      report_date,
      problem_description,
      urgency,
      repair_images
    } = req.body;

    if (!house_id || !problem_description) {
      return res.status(400).json({ success: false, message: '房源ID和问题描述不能为空' });
    }

    const [result] = await pool.execute(
      `INSERT INTO repair_records (
        house_id, room_id, reporter, report_date, problem_description, urgency, repair_images, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        house_id, room_id || null, reporter || null, report_date || new Date(),
        problem_description, urgency || 'medium',
        repair_images ? JSON.stringify(repair_images) : null, req.user.id
      ]
    );

    res.json({
      success: true,
      message: '维修记录创建成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('创建维修记录错误:', error);
    res.status(500).json({ success: false, message: '创建维修记录失败' });
  }
});

// 更新维修记录
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // 检查维修记录是否存在
    const [repairs] = await pool.execute('SELECT id FROM repair_records WHERE id = ?', [id]);
    if (repairs.length === 0) {
      return res.status(404).json({ success: false, message: '维修记录不存在' });
    }

    // 构建更新SQL
    const allowedFields = [
      'assigned_to', 'estimated_cost', 'actual_cost', 'status',
      'repair_images', 'result_description', 'is_settled', 'completed_date'
    ];

    const updateFields = [];
    const updateValues = [];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(
          field === 'repair_images' && updateData[field] ? JSON.stringify(updateData[field]) : updateData[field]
        );
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: '没有要更新的字段' });
    }

    updateValues.push(id);

    await pool.execute(
      `UPDATE repair_records SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({ success: true, message: '维修记录更新成功' });
  } catch (error) {
    console.error('更新维修记录错误:', error);
    res.status(500).json({ success: false, message: '更新维修记录失败' });
  }
});

module.exports = router;
