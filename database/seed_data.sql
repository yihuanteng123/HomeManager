-- 测试数据脚本（约 10–20 条主业务数据 + 关联数据）
-- 使用前请先执行 schema.sql 创建库表及默认 admin 账号
--
-- 执行方式（在项目根目录）：
--   CMD：  mysql -u 用户名 -p home_manager < database/seed_data.sql
--   PowerShell：  Get-Content database/seed_data.sql -Raw -Encoding UTF8 | mysql -u 用户名 -p home_manager

USE home_manager;

-- ========== 1. 额外系统用户（密码均为 123456，bcrypt 加密） ==========
INSERT INTO users (username, password, real_name, role, phone, email, status) VALUES
('finance01', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '张财务', 'finance', '13800138001', 'finance@example.com', 1),
('operation01', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '李运营', 'operation', '13800138002', 'operation@example.com', 1),
('service01', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '王客服', 'service', '13800138003', 'service@example.com', 1)
ON DUPLICATE KEY UPDATE username = username;

-- ========== 2. 房源（5 条：3 整租 + 2 合租） ==========
INSERT IGNORE INTO houses (house_code, house_type, address, area, floor, total_floors, orientation, layout, upstream_landlord_name, upstream_landlord_phone, status, monthly_rent, deposit, description, created_by) VALUES
('H001', 'whole', '阳光小区 1 栋 101', 85.00, '1', '6', '南', '2室1厅1卫', '陈房东', '13900001111', 'rented', 3200.00, 6400.00, '南北通透，近地铁', 1),
('H002', 'whole', '翠湖花园 3 栋 502', 62.00, '5', '18', '东', '1室1厅1卫', '林房东', '13900002222', 'rented', 2600.00, 5200.00, '精装修，拎包入住', 1),
('H003', 'shared', '青年公寓 A 座 201', 120.00, '2', '10', '南', '4室2厅2卫', '赵房东', '13900003333', 'rented', NULL, NULL, '合租单间出租', 1),
('H004', 'whole', '学府路 88 号 2 单元 301', 72.00, '3', '7', '南', '2室1厅1卫', '孙房东', '13900004444', 'expiring', 2800.00, 5600.00, '近学校，安静', 1),
('H005', 'shared', '创业大厦 B 栋 1501', 95.00, '15', '20', '西', '3室1厅2卫', '周房东', '13900005555', 'vacant', NULL, NULL, '合租，主卧带独卫', 1);

-- ========== 3. 租客（8 条） ==========
INSERT IGNORE INTO tenants (name, id_card, phone, emergency_contact, emergency_phone, company, credit_note, is_blacklist) VALUES
('张三', '110101199001011234', '13700001111', '张父', '13700001112', '某科技公司', '信用良好', 0),
('李四', '110101199202022345', '13700002222', '李母', '13700002223', '某贸易公司', NULL, 0),
('王五', '110101198803033456', '13700003333', '王姐', '13700003334', NULL, NULL, 0),
('赵六', '110101199504044567', '13700004444', '赵兄', '13700004445', '某教育机构', NULL, 0),
('钱七', '110101199105055678', '13700005555', '钱父', '13700005556', '自由职业', '曾延期 1 次', 0),
('孙八', '110101198606066789', '13700006666', '孙母', '13700006667', '某制造厂', NULL, 0),
('周九', '110101199707077890', '13700007777', '周姐', '13700007778', NULL, NULL, 0),
('吴十', '110101199308088901', '13700008888', '吴兄', '13700008889', NULL, '列入观察', 0);

-- ========== 4. 房间（仅合租房源 H003、H005） ==========
INSERT IGNORE INTO rooms (house_id, room_code, area, has_bathroom, monthly_rent, deposit, status, description) VALUES
(3, 'A-201-1', 28.00, 1, 1800.00, 3600.00, 'rented', '主卧带独卫'),
(3, 'A-201-2', 22.00, 0, 1400.00, 2800.00, 'vacant', '次卧'),
(3, 'A-201-3', 20.00, 0, 1200.00, 2400.00, 'vacant', '次卧'),
(5, 'B-1501-1', 25.00, 1, 2200.00, 4400.00, 'vacant', '主卧独卫'),
(5, 'B-1501-2', 18.00, 0, 1600.00, 3200.00, 'vacant', '次卧');

-- ========== 5. 合同（5 条） ==========
INSERT IGNORE INTO contracts (contract_code, house_id, room_id, tenant_id, start_date, end_date, monthly_rent, deposit, payment_method, status, notes, created_by) VALUES
('CT2024001', 1, NULL, 1, '2024-01-01', '2025-12-31', 3200.00, 6400.00, '月付', 'active', '整租', 1),
('CT2024002', 2, NULL, 2, '2024-03-15', '2025-03-14', 2600.00, 5200.00, '季付', 'terminated', '已退租', 1),
('CT2024003', 3, 1, 3, '2024-02-01', '2025-01-31', 1800.00, 3600.00, '月付', 'active', '合租主卧', 1),
('CT2024004', 4, NULL, 4, '2023-06-01', '2024-05-31', 2800.00, 5600.00, '季付', 'expiring', '即将到期', 1),
('CT2024005', 2, NULL, 5, '2024-07-01', '2025-06-30', 2600.00, 5200.00, '月付', 'active', '新房客续租', 1);

-- ========== 6. 收租记录（约 10 条） ==========
INSERT IGNORE INTO rent_records (contract_id, house_id, tenant_id, rent_month, expected_amount, actual_amount, late_fee, payment_date, payment_method, status, created_by) VALUES
(1, 1, 1, '2024-10', 3200.00, 3200.00, 0, '2024-10-05', '支付宝', 'paid', 1),
(1, 1, 1, '2024-11', 3200.00, 3200.00, 0, '2024-11-03', '微信', 'paid', 1),
(1, 1, 1, '2024-12', 3200.00, 0, 0, NULL, NULL, 'unpaid', 1),
(3, 3, 3, '2024-10', 1800.00, 1800.00, 0, '2024-10-01', '支付宝', 'paid', 1),
(3, 3, 3, '2024-11', 1800.00, 1800.00, 0, '2024-11-02', '支付宝', 'paid', 1),
(4, 4, 4, '2024-09', 2800.00, 2800.00, 0, '2024-09-01', '银行转账', 'paid', 1),
(4, 4, 4, '2024-10', 2800.00, 2800.00, 0, '2024-10-01', '银行转账', 'paid', 1),
(4, 4, 4, '2024-11', 2800.00, 0, 0, NULL, NULL, 'overdue', 1),
(5, 2, 5, '2024-10', 2600.00, 2600.00, 0, '2024-10-10', '微信', 'paid', 1),
(5, 2, 5, '2024-11', 2600.00, 0, 0, NULL, NULL, 'unpaid', 1);

-- ========== 7. 支出记录（5 条） ==========
INSERT IGNORE INTO expense_records (house_id, expense_type, expense_date, amount, description, created_by) VALUES
(1, 'upstream_rent', '2024-10-01', 2800.00, '10 月上游租金', 1),
(2, 'utility', '2024-10-15', 320.00, '水电燃气', 1),
(3, 'repair', '2024-09-20', 500.00, 'A-201 卫生间漏水维修', 1),
(NULL, 'property_fee', '2024-10-01', 180.00, '阳光小区物业费', 1),
(4, 'other', '2024-10-05', 200.00, '学府路 88 号杂项', 1);

-- ========== 8. 维修记录（5 条） ==========
INSERT IGNORE INTO repair_records (house_id, room_id, reporter, report_date, problem_description, urgency, assigned_to, estimated_cost, status, result_description, created_by) VALUES
(1, NULL, '张三', '2024-09-10 10:00:00', '厨房水龙头漏水', 'medium', '李师傅', 80.00, 'completed', '已更换龙头', 1),
(3, 1, '王五', '2024-10-01 14:30:00', '卫生间排风扇不转', 'low', '王师傅', 120.00, 'processing', NULL, 1),
(4, NULL, '赵六', '2024-10-15 09:00:00', '卧室空调不制冷', 'high', NULL, 300.00, 'pending', NULL, 1),
(2, NULL, '物业', '2024-10-20 16:00:00', '门锁损坏需更换', 'medium', NULL, 150.00, 'pending', NULL, 1),
(5, 1, NULL, '2024-10-25 11:00:00', '主卧墙面发霉', 'low', NULL, NULL, 'pending', NULL, 1);

-- ========== 9. 操作日志（5 条，仅使用 user_id=1 即 admin，避免外键依赖后续用户） ==========
INSERT IGNORE INTO operation_logs (user_id, module, action, target_type, target_id, description) VALUES
(1, 'house', 'create', 'house', 1, '新增房源 H001'),
(1, 'contract', 'create', 'contract', 1, '签订合同 CT2024001'),
(1, 'finance', 'pay', 'rent_record', 1, '收租 2024-10 张三'),
(1, 'finance', 'create', 'expense_record', 1, '登记上游租金支出'),
(1, 'repair', 'create', 'repair_record', 1, '登记维修：厨房水龙头');

-- 更新合租房间的当前租客（与合同一致）
UPDATE rooms SET current_tenant_id = 3 WHERE id = 1;

SELECT '测试数据导入完成。额外用户账号密码均为：123456' AS tip;
