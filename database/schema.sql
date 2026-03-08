-- 二手房东房源管理系统数据库表结构

-- 创建数据库
CREATE DATABASE IF NOT EXISTS home_manager DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE home_manager;

-- 1. 用户表（系统用户）
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
  password VARCHAR(255) NOT NULL COMMENT '密码（加密）',
  real_name VARCHAR(50) COMMENT '真实姓名',
  role ENUM('admin', 'finance', 'operation', 'service') DEFAULT 'operation' COMMENT '角色：管理员/财务/运营/客服',
  phone VARCHAR(20) COMMENT '联系电话',
  email VARCHAR(100) COMMENT '邮箱',
  status TINYINT DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统用户表';

-- 2. 房源表
CREATE TABLE IF NOT EXISTS houses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  house_code VARCHAR(50) UNIQUE NOT NULL COMMENT '房源编号',
  house_type ENUM('whole', 'shared') NOT NULL COMMENT '房源类型：整租/合租',
  address VARCHAR(255) NOT NULL COMMENT '地址',
  area DECIMAL(10, 2) COMMENT '面积（平方米）',
  floor VARCHAR(20) COMMENT '楼层',
  total_floors VARCHAR(20) COMMENT '总楼层',
  orientation VARCHAR(20) COMMENT '朝向',
  layout VARCHAR(50) COMMENT '户型（如：2室1厅）',
  upstream_landlord_name VARCHAR(100) COMMENT '上游房东姓名',
  upstream_landlord_phone VARCHAR(20) COMMENT '上游房东电话',
  status ENUM('vacant', 'rented', 'pending', 'expiring', 'repairing', 'offline') DEFAULT 'vacant' COMMENT '房源状态',
  monthly_rent DECIMAL(10, 2) COMMENT '月租金',
  deposit DECIMAL(10, 2) COMMENT '押金',
  description TEXT COMMENT '房源描述',
  images TEXT COMMENT '房屋照片（JSON数组）',
  property_certificate VARCHAR(255) COMMENT '房产证扫描件路径',
  original_contract VARCHAR(255) COMMENT '原始租赁合同路径',
  created_by INT COMMENT '创建人ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_house_code (house_code),
  INDEX idx_status (status),
  INDEX idx_address (address),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='房源表';

-- 3. 房间表（适用于合租）
CREATE TABLE IF NOT EXISTS rooms (
  id INT PRIMARY KEY AUTO_INCREMENT,
  house_id INT NOT NULL COMMENT '所属房源ID',
  room_code VARCHAR(50) NOT NULL COMMENT '房间编号',
  area DECIMAL(10, 2) COMMENT '房间面积',
  has_bathroom TINYINT DEFAULT 0 COMMENT '是否独卫：1-是，0-否',
  monthly_rent DECIMAL(10, 2) COMMENT '月租金',
  deposit DECIMAL(10, 2) COMMENT '押金',
  status ENUM('vacant', 'rented', 'repairing') DEFAULT 'vacant' COMMENT '房间状态',
  current_tenant_id INT COMMENT '当前租客ID',
  description TEXT COMMENT '房间描述',
  images TEXT COMMENT '房间照片（JSON数组）',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_house_id (house_id),
  INDEX idx_room_code (room_code),
  INDEX idx_status (status),
  FOREIGN KEY (house_id) REFERENCES houses(id) ON DELETE CASCADE,
  FOREIGN KEY (current_tenant_id) REFERENCES tenants(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='房间表';

-- 4. 租客表
CREATE TABLE IF NOT EXISTS tenants (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL COMMENT '姓名',
  id_card VARCHAR(18) UNIQUE COMMENT '身份证号',
  phone VARCHAR(20) NOT NULL COMMENT '联系电话',
  emergency_contact VARCHAR(50) COMMENT '紧急联系人',
  emergency_phone VARCHAR(20) COMMENT '紧急联系人电话',
  company VARCHAR(100) COMMENT '公司信息',
  credit_note TEXT COMMENT '信用备注',
  is_blacklist TINYINT DEFAULT 0 COMMENT '是否黑名单：1-是，0-否',
  blacklist_reason TEXT COMMENT '黑名单原因',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_phone (phone),
  INDEX idx_id_card (id_card),
  INDEX idx_blacklist (is_blacklist)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='租客表';

-- 5. 合同表
CREATE TABLE IF NOT EXISTS contracts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  contract_code VARCHAR(50) UNIQUE NOT NULL COMMENT '合同编号',
  house_id INT NOT NULL COMMENT '房源ID',
  room_id INT COMMENT '房间ID（合租时使用）',
  tenant_id INT NOT NULL COMMENT '租客ID',
  start_date DATE NOT NULL COMMENT '合同开始日期',
  end_date DATE NOT NULL COMMENT '合同结束日期',
  monthly_rent DECIMAL(10, 2) NOT NULL COMMENT '月租金',
  deposit DECIMAL(10, 2) NOT NULL COMMENT '押金',
  payment_method VARCHAR(50) COMMENT '支付方式',
  increment_rule TEXT COMMENT '递增规则',
  status ENUM('active', 'expiring', 'terminated', 'breach') DEFAULT 'active' COMMENT '合同状态',
  contract_file VARCHAR(255) COMMENT '合同扫描件路径',
  supplement_file VARCHAR(255) COMMENT '补充协议路径',
  notes TEXT COMMENT '备注',
  created_by INT COMMENT '创建人ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_contract_code (contract_code),
  INDEX idx_house_id (house_id),
  INDEX idx_tenant_id (tenant_id),
  INDEX idx_status (status),
  INDEX idx_end_date (end_date),
  FOREIGN KEY (house_id) REFERENCES houses(id) ON DELETE CASCADE,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='合同表';

-- 6. 收租记录表
CREATE TABLE IF NOT EXISTS rent_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  contract_id INT NOT NULL COMMENT '合同ID',
  house_id INT NOT NULL COMMENT '房源ID',
  tenant_id INT NOT NULL COMMENT '租客ID',
  rent_month VARCHAR(7) NOT NULL COMMENT '租金月份（格式：YYYY-MM）',
  expected_amount DECIMAL(10, 2) NOT NULL COMMENT '应收金额',
  actual_amount DECIMAL(10, 2) DEFAULT 0 COMMENT '实收金额',
  late_fee DECIMAL(10, 2) DEFAULT 0 COMMENT '滞纳金',
  payment_date DATE COMMENT '支付日期',
  payment_method VARCHAR(50) COMMENT '支付方式',
  status ENUM('unpaid', 'partial', 'paid', 'overdue') DEFAULT 'unpaid' COMMENT '支付状态',
  notes TEXT COMMENT '备注',
  created_by INT COMMENT '创建人ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_contract_id (contract_id),
  INDEX idx_house_id (house_id),
  INDEX idx_tenant_id (tenant_id),
  INDEX idx_rent_month (rent_month),
  INDEX idx_status (status),
  FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
  FOREIGN KEY (house_id) REFERENCES houses(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收租记录表';

-- 7. 支出记录表
CREATE TABLE IF NOT EXISTS expense_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  house_id INT COMMENT '房源ID（为空表示非房源相关支出）',
  expense_type ENUM('upstream_rent', 'repair', 'utility', 'property_fee', 'other') NOT NULL COMMENT '支出类型',
  expense_date DATE NOT NULL COMMENT '支出日期',
  amount DECIMAL(10, 2) NOT NULL COMMENT '支出金额',
  description TEXT COMMENT '支出描述',
  receipt_file VARCHAR(255) COMMENT '凭证文件路径',
  created_by INT COMMENT '创建人ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_house_id (house_id),
  INDEX idx_expense_type (expense_type),
  INDEX idx_expense_date (expense_date),
  FOREIGN KEY (house_id) REFERENCES houses(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='支出记录表';

-- 8. 维修记录表
CREATE TABLE IF NOT EXISTS repair_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  house_id INT NOT NULL COMMENT '房源ID',
  room_id INT COMMENT '房间ID',
  reporter VARCHAR(50) COMMENT '报修人',
  report_date DATETIME NOT NULL COMMENT '报修时间',
  problem_description TEXT NOT NULL COMMENT '问题描述',
  urgency ENUM('low', 'medium', 'high') DEFAULT 'medium' COMMENT '紧急程度',
  assigned_to VARCHAR(100) COMMENT '指派维修人员',
  estimated_cost DECIMAL(10, 2) COMMENT '预计费用',
  actual_cost DECIMAL(10, 2) COMMENT '实际费用',
  status ENUM('pending', 'processing', 'completed', 'cancelled') DEFAULT 'pending' COMMENT '维修状态',
  repair_images TEXT COMMENT '维修图片（JSON数组）',
  result_description TEXT COMMENT '处理结果',
  is_settled TINYINT DEFAULT 0 COMMENT '是否结算：1-是，0-否',
  completed_date DATETIME COMMENT '完成时间',
  created_by INT COMMENT '创建人ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_house_id (house_id),
  INDEX idx_status (status),
  INDEX idx_report_date (report_date),
  FOREIGN KEY (house_id) REFERENCES houses(id) ON DELETE CASCADE,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='维修记录表';

-- 9. 操作日志表
CREATE TABLE IF NOT EXISTS operation_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT COMMENT '操作用户ID',
  module VARCHAR(50) COMMENT '操作模块',
  action VARCHAR(50) COMMENT '操作动作',
  target_type VARCHAR(50) COMMENT '目标类型',
  target_id INT COMMENT '目标ID',
  description TEXT COMMENT '操作描述',
  ip_address VARCHAR(50) COMMENT 'IP地址',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_module (module),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志表';

-- 插入默认管理员账户（密码：admin123，需要在实际部署时修改）
-- 注意：首次登录后系统会自动将密码加密，这里使用明文密码以便首次登录
INSERT INTO users (username, password, real_name, role, status) 
VALUES ('admin', 'admin123', '系统管理员', 'admin', 1)
ON DUPLICATE KEY UPDATE username=username;
