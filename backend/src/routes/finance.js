const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const moment = require('moment');

// 获取收租记录列表
router.get('/rent-records', authenticate, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status, rent_month, keyword } = req.query;
    const limit = Math.max(1, parseInt(pageSize, 10) || 10);
    const offset = (Math.max(1, parseInt(page, 10) || 1) - 1) * limit;

    let query = `SELECT rr.*, h.house_code, h.address, t.name as tenant_name, t.phone as tenant_phone,
                 c.contract_code
                 FROM rent_records rr 
                 LEFT JOIN houses h ON rr.house_id = h.id 
                 LEFT JOIN tenants t ON rr.tenant_id = t.id 
                 LEFT JOIN contracts c ON rr.contract_id = c.id 
                 WHERE 1=1`;
    const params = [];

    if (status) {
      query += ' AND rr.status = ?';
      params.push(status);
    }

    if (rent_month) {
      query += ' AND rr.rent_month = ?';
      params.push(rent_month);
    }

    if (keyword) {
      query += ' AND (h.house_code LIKE ? OR t.name LIKE ?)';
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern);
    }

    query += ` ORDER BY rr.rent_month DESC, rr.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const [records] = await pool.execute(query, params);

    // 获取总数
    let countQuery = `SELECT COUNT(*) as total FROM rent_records rr 
                      LEFT JOIN houses h ON rr.house_id = h.id 
                      LEFT JOIN tenants t ON rr.tenant_id = t.id 
                      WHERE 1=1`;
    const countParams = [];
    if (status) {
      countQuery += ' AND rr.status = ?';
      countParams.push(status);
    }
    if (rent_month) {
      countQuery += ' AND rr.rent_month = ?';
      countParams.push(rent_month);
    }
    if (keyword) {
      countQuery += ' AND (h.house_code LIKE ? OR t.name LIKE ?)';
      const keywordPattern = `%${keyword}%`;
      countParams.push(keywordPattern, keywordPattern);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        list: records,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('获取收租记录错误:', error);
    res.status(500).json({ success: false, message: '获取收租记录失败' });
  }
});

// 创建收租记录
router.post('/rent-records', authenticate, async (req, res) => {
  try {
    const {
      contract_id,
      house_id,
      tenant_id,
      rent_month,
      expected_amount,
      actual_amount,
      late_fee,
      payment_date,
      payment_method,
      notes
    } = req.body;

    if (!contract_id || !house_id || !tenant_id || !rent_month || !expected_amount) {
      return res.status(400).json({ success: false, message: '必填字段不能为空' });
    }

    // 检查是否已存在该月份的记录
    const [existing] = await pool.execute(
      'SELECT id FROM rent_records WHERE contract_id = ? AND rent_month = ?',
      [contract_id, rent_month]
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: '该月份的收租记录已存在' });
    }

    // 确定支付状态
    let status = 'unpaid';
    if (actual_amount > 0) {
      if (actual_amount >= expected_amount) {
        status = 'paid';
      } else {
        status = 'partial';
      }
    }

    const [result] = await pool.execute(
      `INSERT INTO rent_records (
        contract_id, house_id, tenant_id, rent_month, expected_amount, actual_amount,
        late_fee, payment_date, payment_method, status, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        contract_id, house_id, tenant_id, rent_month, expected_amount,
        actual_amount || 0, late_fee || 0, payment_date || null, payment_method || null,
        status, notes || null, req.user.id
      ]
    );

    res.json({
      success: true,
      message: '收租记录创建成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('创建收租记录错误:', error);
    res.status(500).json({ success: false, message: '创建收租记录失败' });
  }
});

// 更新收租记录（收款）
router.put('/rent-records/:id/pay', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { actual_amount, late_fee, payment_date, payment_method, notes } = req.body;

    // 获取原记录
    const [records] = await pool.execute('SELECT * FROM rent_records WHERE id = ?', [id]);
    if (records.length === 0) {
      return res.status(404).json({ success: false, message: '收租记录不存在' });
    }

    const record = records[0];
    const newActualAmount = actual_amount !== undefined ? actual_amount : record.actual_amount;
    const newLateFee = late_fee !== undefined ? late_fee : record.late_fee;

    // 确定支付状态
    let status = 'unpaid';
    if (newActualAmount > 0) {
      if (newActualAmount >= record.expected_amount) {
        status = 'paid';
      } else {
        status = 'partial';
      }
    }

    await pool.execute(
      `UPDATE rent_records SET 
        actual_amount = ?, late_fee = ?, payment_date = ?, payment_method = ?, 
        status = ?, notes = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        newActualAmount, newLateFee, payment_date || null, payment_method || null,
        status, notes || null, id
      ]
    );

    res.json({ success: true, message: '收租记录更新成功' });
  } catch (error) {
    console.error('更新收租记录错误:', error);
    res.status(500).json({ success: false, message: '更新收租记录失败' });
  }
});

// 获取支出记录列表
router.get('/expenses', authenticate, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, expense_type, start_date, end_date } = req.query;
    const limit = Math.max(1, parseInt(pageSize, 10) || 10);
    const offset = (Math.max(1, parseInt(page, 10) || 1) - 1) * limit;

    let query = `SELECT e.*, h.house_code, h.address, u.real_name as creator_name
                 FROM expense_records e 
                 LEFT JOIN houses h ON e.house_id = h.id 
                 LEFT JOIN users u ON e.created_by = u.id 
                 WHERE 1=1`;
    const params = [];

    if (expense_type) {
      query += ' AND e.expense_type = ?';
      params.push(expense_type);
    }

    if (start_date) {
      query += ' AND e.expense_date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND e.expense_date <= ?';
      params.push(end_date);
    }

    query += ` ORDER BY e.expense_date DESC, e.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const [expenses] = await pool.execute(query, params);

    // 获取总数
    let countQuery = `SELECT COUNT(*) as total FROM expense_records e WHERE 1=1`;
    const countParams = [];
    if (expense_type) {
      countQuery += ' AND e.expense_type = ?';
      countParams.push(expense_type);
    }
    if (start_date) {
      countQuery += ' AND e.expense_date >= ?';
      countParams.push(start_date);
    }
    if (end_date) {
      countQuery += ' AND e.expense_date <= ?';
      countParams.push(end_date);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        list: expenses,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('获取支出记录错误:', error);
    res.status(500).json({ success: false, message: '获取支出记录失败' });
  }
});

// 创建支出记录
router.post('/expenses', authenticate, async (req, res) => {
  try {
    const {
      house_id,
      expense_type,
      expense_date,
      amount,
      description,
      receipt_file
    } = req.body;

    if (!expense_type || !expense_date || !amount) {
      return res.status(400).json({ success: false, message: '支出类型、日期和金额不能为空' });
    }

    const [result] = await pool.execute(
      `INSERT INTO expense_records (
        house_id, expense_type, expense_date, amount, description, receipt_file, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        house_id || null, expense_type, expense_date, amount,
        description || null, receipt_file || null, req.user.id
      ]
    );

    res.json({
      success: true,
      message: '支出记录创建成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('创建支出记录错误:', error);
    res.status(500).json({ success: false, message: '创建支出记录失败' });
  }
});

// 获取财务统计（按月份汇总收租记录与支出记录）
router.get('/statistics', authenticate, async (req, res) => {
  try {
    let monthParam = req.query.month || req.query.rent_month;
    let currentMonth = monthParam;

    // 未传月份时：使用“有收租或支出数据”的最新月份，若无任何数据则用当前月
    if (!currentMonth) {
      const [latestRent] = await pool.execute(
        `SELECT rent_month FROM rent_records ORDER BY rent_month DESC LIMIT 1`
      );
      const [latestExpense] = await pool.execute(
        `SELECT DATE_FORMAT(expense_date, '%Y-%m') as ym FROM expense_records ORDER BY expense_date DESC LIMIT 1`
      );
      const rentMonth = latestRent[0]?.rent_month || '';
      const expenseMonth = latestExpense[0]?.ym || '';
      currentMonth = rentMonth >= expenseMonth ? rentMonth : expenseMonth;
      if (!currentMonth) {
        currentMonth = moment().format('YYYY-MM');
      }
    }

    // 应收租金：该月所有收租记录的 expected_amount 之和
    const [expectedRent] = await pool.execute(
      `SELECT COALESCE(SUM(expected_amount), 0) as total FROM rent_records WHERE rent_month = ?`,
      [currentMonth]
    );

    // 实收租金：该月所有收租记录的 actual_amount 之和
    const [actualRent] = await pool.execute(
      `SELECT COALESCE(SUM(actual_amount), 0) as total FROM rent_records WHERE rent_month = ?`,
      [currentMonth]
    );

    // 欠租金额：该月未付清记录的 (expected_amount - actual_amount) 之和
    const [unpaidRent] = await pool.execute(
      `SELECT COALESCE(SUM(expected_amount - actual_amount), 0) as total 
       FROM rent_records 
       WHERE rent_month = ? AND status IN ('unpaid', 'partial', 'overdue')`,
      [currentMonth]
    );

    // 支出金额：该月所有支出记录的 amount 之和（按 expense_date 所在月）
    const [expenses] = await pool.execute(
      `SELECT COALESCE(SUM(amount), 0) as total FROM expense_records 
       WHERE DATE_FORMAT(expense_date, '%Y-%m') = ?`,
      [currentMonth]
    );

    const actualTotal = parseFloat(actualRent[0].total) || 0;
    const expenseTotal = parseFloat(expenses[0].total) || 0;
    const profit = actualTotal - expenseTotal;

    // 欠租人数：该月未付清记录中不同 tenant_id 的数量
    const [unpaidCount] = await pool.execute(
      `SELECT COUNT(DISTINCT tenant_id) as cnt 
       FROM rent_records 
       WHERE rent_month = ? AND status IN ('unpaid', 'partial', 'overdue')`,
      [currentMonth]
    );

    res.json({
      success: true,
      data: {
        month: currentMonth,
        expected_rent: parseFloat(expectedRent[0].total) || 0,
        actual_rent: actualTotal,
        unpaid_rent: parseFloat(unpaidRent[0].total) || 0,
        expenses: expenseTotal,
        profit: Number(profit.toFixed(2)),
        unpaid_count: Number(unpaidCount[0].cnt) || 0
      }
    });
  } catch (error) {
    console.error('获取财务统计错误:', error);
    res.status(500).json({ success: false, message: '获取财务统计失败' });
  }
});

module.exports = router;
