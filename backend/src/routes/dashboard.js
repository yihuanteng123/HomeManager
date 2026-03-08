const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const moment = require('moment');

// 获取Dashboard数据，支持时间段：start_date, end_date（可选，YYYY-MM-DD）；不传则统计全部
router.get('/', authenticate, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const hasRange = start_date && end_date;
    const startMonth = hasRange ? moment(start_date).format('YYYY-MM') : null;
    const endMonth = hasRange ? moment(end_date).format('YYYY-MM') : null;

    // 1. 即将到期合同数量（与时间无关，始终全量）
    const [expiringContracts] = await pool.execute(
      `SELECT COUNT(*) as count FROM contracts 
       WHERE status = 'expiring' 
          OR (status = 'active' AND end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY))`
    );

    // 2. 应收租金（时间段内或全部）
    let expectedRentQuery = 'SELECT COALESCE(SUM(expected_amount), 0) as total FROM rent_records WHERE 1=1';
    const expectedRentParams = [];
    if (hasRange) {
      expectedRentQuery += ' AND rent_month >= ? AND rent_month <= ?';
      expectedRentParams.push(startMonth, endMonth);
    }
    const [expectedRent] = await pool.execute(expectedRentQuery, expectedRentParams);

    // 3. 欠租人数（时间段内或全部）
    let unpaidCountQuery = `SELECT COALESCE(COUNT(DISTINCT tenant_id), 0) as count FROM rent_records 
       WHERE status IN ('unpaid', 'partial', 'overdue')`;
    const unpaidCountParams = [];
    if (hasRange) {
      unpaidCountQuery += ' AND rent_month >= ? AND rent_month <= ?';
      unpaidCountParams.push(startMonth, endMonth);
    }
    const [unpaidCount] = await pool.execute(unpaidCountQuery, unpaidCountParams);

    // 4. 空置房数量（与时间无关，当前快照）
    const [vacantHouses] = await pool.execute(
      `SELECT COUNT(*) as count FROM houses WHERE status = 'vacant'`
    );

    // 5. 实收租金（时间段内或全部）
    let actualRentQuery = 'SELECT COALESCE(SUM(actual_amount), 0) as total FROM rent_records WHERE 1=1';
    const actualRentParams = [];
    if (hasRange) {
      actualRentQuery += ' AND rent_month >= ? AND rent_month <= ?';
      actualRentParams.push(startMonth, endMonth);
    }
    const [actualRent] = await pool.execute(actualRentQuery, actualRentParams);

    // 6. 支出金额（时间段内或全部，按支出日期）
    let expensesQuery = 'SELECT COALESCE(SUM(amount), 0) as total FROM expense_records WHERE 1=1';
    const expensesParams = [];
    if (hasRange) {
      expensesQuery += ' AND expense_date >= ? AND expense_date <= ?';
      expensesParams.push(start_date, end_date);
    }
    const [expenses] = await pool.execute(expensesQuery, expensesParams);

    const actualTotal = parseFloat(actualRent[0].total) || 0;
    const expenseTotal = parseFloat(expenses[0].total) || 0;
    const profit = actualTotal - expenseTotal;

    // 7. 待处理维修数量（与时间无关）
    const [pendingRepairs] = await pool.execute(
      `SELECT COUNT(*) as count FROM repair_records WHERE status IN ('pending', 'processing')`
    );

    // 8. 即将到期合同列表（与数量统计条件一致：含已过期的 expiring，前端对 days_left<0 显示「已过期」）
    const [expiringList] = await pool.execute(
      `SELECT c.*, h.house_code, h.address, t.name as tenant_name, t.phone as tenant_phone,
       DATEDIFF(c.end_date, CURDATE()) as days_left
       FROM contracts c 
       LEFT JOIN houses h ON c.house_id = h.id 
       LEFT JOIN tenants t ON c.tenant_id = t.id 
       WHERE c.status = 'expiring' 
          OR (c.status = 'active' AND c.end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY))
       ORDER BY c.end_date ASC 
       LIMIT 10`
    );

    // 9. 欠租列表（前10条，时间段内或全部）
    let unpaidListQuery = `SELECT rr.*, h.house_code, h.address, t.name as tenant_name, t.phone as tenant_phone,
       (rr.expected_amount - rr.actual_amount) as unpaid_amount
       FROM rent_records rr 
       LEFT JOIN houses h ON rr.house_id = h.id 
       LEFT JOIN tenants t ON rr.tenant_id = t.id 
       WHERE rr.status IN ('unpaid', 'partial', 'overdue')`;
    const unpaidListParams = [];
    if (hasRange) {
      unpaidListQuery += ' AND rr.rent_month >= ? AND rr.rent_month <= ?';
      unpaidListParams.push(startMonth, endMonth);
    }
    unpaidListQuery += ' ORDER BY rr.created_at DESC LIMIT 10';
    const [unpaidList] = await pool.execute(unpaidListQuery, unpaidListParams);

    // 10. 房源状态统计（与时间无关）
    const [houseStatusStats] = await pool.execute(
      `SELECT status, COUNT(*) as count FROM houses GROUP BY status`
    );

    // 11. 合同状态统计（与时间无关）
    const [contractStatusStats] = await pool.execute(
      `SELECT status, COUNT(*) as count FROM contracts GROUP BY status`
    );

    res.json({
      success: true,
      data: {
        time_range: hasRange ? { start_date, end_date } : null,
        overview: {
          expiring_contracts: Number(expiringContracts[0].count),
          expected_rent: parseFloat(expectedRent[0].total) || 0,
          actual_rent: actualTotal,
          unpaid_count: Number(unpaidCount[0].count),
          vacant_houses: Number(vacantHouses[0].count),
          profit: Number(profit.toFixed(2)),
          pending_repairs: Number(pendingRepairs[0].count)
        },
        expiring_contracts: expiringList,
        unpaid_rents: unpaidList,
        house_status_stats: houseStatusStats,
        contract_status_stats: contractStatusStats
      }
    });
  } catch (error) {
    console.error('获取Dashboard数据错误:', error);
    res.status(500).json({ success: false, message: '获取Dashboard数据失败' });
  }
});

module.exports = router;
