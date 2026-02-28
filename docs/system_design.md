# 二手房东房源管理系统（B/S 架构）设计说明

## 1. 技术选型
- 前端：推荐 React + Ant Design Pro（当前仓库先交付后端 API）
- 后端：FastAPI（RESTful + JWT）
- 数据库：SQLite（开发环境），可平滑迁移 MySQL/PostgreSQL

## 2. 模块落地（当前版本）
- 房源管理：房源档案 + 列表查询
- 租客管理：租客建档 + 列表查询
- 合同管理：合同建档 + 即将到期查询
- 财务管理：收租记录 + 月利润统计
- 风险预警中心：Dashboard 概览指标
- 权限管理：用户角色 + JWT 登录认证

## 3. 核心表
- house_property
- room
- tenant
- contract
- rent_record
- expense_record
- repair_record
- user
- role

## 4. 默认账号
- 用户名：admin
- 密码：admin123

## 5. 下一阶段建议
1. 接入前端管理界面（菜单按角色控制）
2. 增加报修、附件上传、黑名单审批
3. 增加定时任务（合同到期提醒、租金催缴提醒）
