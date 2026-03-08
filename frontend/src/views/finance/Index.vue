<template>
  <div class="finance-page">
    <el-card class="finance-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">财务管理</span>
        </div>
      </template>

      <el-tabs v-model="activeTab" class="finance-tabs">
        <el-tab-pane label="收租记录" name="rent">
          <div class="record-pane">
            <div class="pane-header">
              <div class="pane-title">收租记录</div>
              <p class="pane-desc">按月份与支付状态筛选，对未付清记录可点击「收款」登记实收。</p>
            </div>
            <div class="tab-toolbar">
              <el-form :inline="true" :model="rentSearchForm" class="search-form">
                <el-form-item label="月份">
                  <el-date-picker
                    v-model="rentSearchForm.rent_month"
                    type="month"
                    placeholder="选择月份"
                    format="YYYY-MM"
                    value-format="YYYY-MM"
                    clearable
                    class="toolbar-input"
                  />
                </el-form-item>
                <el-form-item label="状态">
                  <el-select v-model="rentSearchForm.status" placeholder="全部" clearable class="toolbar-select">
                    <el-option label="未支付" value="unpaid" />
                    <el-option label="部分支付" value="partial" />
                    <el-option label="已支付" value="paid" />
                    <el-option label="逾期" value="overdue" />
                  </el-select>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="handleRentSearch">查询</el-button>
                  <el-button @click="handleRentReset">重置</el-button>
                </el-form-item>
              </el-form>
              <el-button type="primary" class="btn-add" @click="handleCreateRent">新增收租记录</el-button>
            </div>

            <div class="table-wrap">
              <el-table :data="rentData" v-loading="rentLoading" class="data-table record-table" stripe>
                <el-table-column prop="house_code" label="房源编号" width="118" />
                <el-table-column prop="tenant_name" label="租客" width="100" />
                <el-table-column prop="rent_month" label="月份" width="100" />
                <el-table-column prop="expected_amount" label="应收金额" width="118" align="right">
                  <template #default="{ row }"><span class="amount">¥{{ formatMoney(row.expected_amount) }}</span></template>
                </el-table-column>
                <el-table-column prop="actual_amount" label="实收金额" width="118" align="right">
                  <template #default="{ row }"><span class="amount">¥{{ formatMoney(row.actual_amount) }}</span></template>
                </el-table-column>
                <el-table-column prop="late_fee" label="滞纳金" width="96" align="right">
                  <template #default="{ row }">¥{{ formatMoney(row.late_fee) }}</template>
                </el-table-column>
                <el-table-column prop="payment_date" label="支付日期" width="118" />
                <el-table-column prop="status" label="状态" width="96">
                  <template #default="{ row }">
                    <el-tag :type="getStatusType(row.status)" size="small" round>
                      {{ getStatusText(row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="96" fixed="right" align="center">
                  <template #default="{ row }">
                    <el-button type="primary" link @click="handlePayRent(row)" v-if="row.status !== 'paid'">收款</el-button>
                    <span v-else class="text-muted">—</span>
                  </template>
                </el-table-column>
                <template #empty>
                  <div class="table-empty">
                    <div class="empty-text">暂无收租记录</div>
                    <div class="empty-hint">可通过合同管理生成收租记录，或使用上方筛选条件调整查询</div>
                  </div>
                </template>
              </el-table>
            </div>

            <div class="pagination-wrap">
              <span class="pagination-total">共 {{ rentPagination.total }} 条</span>
              <el-pagination
                v-model:current-page="rentPagination.page"
                v-model:page-size="rentPagination.pageSize"
                :total="rentPagination.total"
                :page-sizes="[10, 20, 50, 100]"
                layout="sizes, prev, pager, next, jumper"
                @size-change="handleRentSizeChange"
                @current-change="handleRentPageChange"
              />
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="支出记录" name="expense">
          <div class="record-pane">
            <div class="pane-header">
              <div class="pane-title">支出记录</div>
              <p class="pane-desc">按支出类型筛选，记录上游租金、维修、水电、物业等支出。</p>
            </div>
            <div class="tab-toolbar">
              <el-form :inline="true" :model="expenseSearchForm" class="search-form">
                <el-form-item label="支出类型">
                  <el-select v-model="expenseSearchForm.expense_type" placeholder="全部" clearable class="toolbar-select">
                    <el-option label="上游租金" value="upstream_rent" />
                    <el-option label="维修费用" value="repair" />
                    <el-option label="水电燃气" value="utility" />
                    <el-option label="物业费" value="property_fee" />
                    <el-option label="其他" value="other" />
                  </el-select>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="handleExpenseSearch">查询</el-button>
                  <el-button @click="handleExpenseReset">重置</el-button>
                </el-form-item>
              </el-form>
              <el-button type="primary" class="btn-add" @click="handleCreateExpense">新增支出记录</el-button>
            </div>

            <div class="table-wrap">
              <el-table :data="expenseData" v-loading="expenseLoading" class="data-table record-table" stripe>
                <el-table-column prop="house_code" label="房源编号" width="120" />
                <el-table-column prop="expense_type" label="支出类型" width="120">
                  <template #default="{ row }">
                    <span class="expense-type">{{ getExpenseTypeText(row.expense_type) }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="expense_date" label="支出日期" width="120" />
                <el-table-column prop="amount" label="金额" width="120" align="right">
                  <template #default="{ row }"><span class="amount expense">¥{{ formatMoney(row.amount) }}</span></template>
                </el-table-column>
                <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
                <template #empty>
                  <div class="table-empty">
                    <div class="empty-text">暂无支出记录</div>
                    <div class="empty-hint">点击「新增支出记录」添加一条支出</div>
                  </div>
                </template>
              </el-table>
            </div>

            <div class="pagination-wrap">
              <span class="pagination-total">共 {{ expensePagination.total }} 条</span>
              <el-pagination
                v-model:current-page="expensePagination.page"
                v-model:page-size="expensePagination.pageSize"
                :total="expensePagination.total"
                :page-sizes="[10, 20, 50, 100]"
                layout="sizes, prev, pager, next, jumper"
                @size-change="handleExpenseSizeChange"
                @current-change="handleExpensePageChange"
              />
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="财务统计" name="statistics">
          <div class="statistics-section">
            <div class="stat-toolbar">
              <span class="label">统计月份</span>
              <el-date-picker
                v-model="statMonth"
                type="month"
                placeholder="不选则显示有数据的最新月份"
                format="YYYY年MM月"
                value-format="YYYY-MM"
                clearable
                @change="fetchStatistics"
              />
              <el-button type="primary" @click="fetchStatistics" :loading="statLoading">刷新</el-button>
            </div>
            <div class="stat-month" v-if="statistics.month">
              <span class="value">当前统计：{{ statistics.month }}</span>
            </div>
            <el-row :gutter="16" class="stat-cards">
              <el-col :xs="24" :sm="12" :md="8">
                <div class="stat-card income">
                  <div class="stat-label">应收租金</div>
                  <div class="stat-value">¥{{ formatMoney(statistics.expected_rent) }}</div>
                </div>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8">
                <div class="stat-card received">
                  <div class="stat-label">实收租金</div>
                  <div class="stat-value">¥{{ formatMoney(statistics.actual_rent) }}</div>
                </div>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8">
                <div class="stat-card unpaid">
                  <div class="stat-label">欠租金额</div>
                  <div class="stat-value">¥{{ formatMoney(statistics.unpaid_rent) }}</div>
                </div>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8">
                <div class="stat-card expense">
                  <div class="stat-label">支出金额</div>
                  <div class="stat-value">¥{{ formatMoney(statistics.expenses) }}</div>
                </div>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8">
                <div class="stat-card profit">
                  <div class="stat-label">利润</div>
                  <div class="stat-value">¥{{ formatMoney(statistics.profit) }}</div>
                </div>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8">
                <div class="stat-card count">
                  <div class="stat-label">欠租人数</div>
                  <div class="stat-value">{{ statistics.unpaid_count }} 人</div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 收款对话框 -->
    <el-dialog v-model="payDialogVisible" title="收款登记" width="500px" class="pay-dialog">
      <el-form :model="payForm" label-width="100px" label-position="left">
        <el-form-item label="实收金额">
          <el-input-number v-model="payForm.actual_amount" :precision="2" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="滞纳金">
          <el-input-number v-model="payForm.late_fee" :precision="2" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="支付日期">
          <el-date-picker v-model="payForm.payment_date" type="date" style="width: 100%" />
        </el-form-item>
        <el-form-item label="支付方式">
          <el-input v-model="payForm.payment_method" placeholder="如：银行转账、支付宝、微信" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="payForm.notes" type="textarea" :rows="3" placeholder="选填" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="payDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handlePaySubmit" :loading="payLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/utils/api'

const activeTab = ref('rent')
const rentLoading = ref(false)
const expenseLoading = ref(false)
const rentData = ref([])
const expenseData = ref([])
const statMonth = ref('') // 空则后端返回有数据的最新月份
const statLoading = ref(false)
const statistics = ref({
  month: '',
  expected_rent: 0,
  actual_rent: 0,
  unpaid_rent: 0,
  expenses: 0,
  profit: 0,
  unpaid_count: 0
})

const rentSearchForm = reactive({
  rent_month: '',
  status: ''
})

const expenseSearchForm = reactive({
  expense_type: ''
})

const rentPagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const expensePagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const payDialogVisible = ref(false)
const payLoading = ref(false)
const currentRentRecord = ref(null)
const payForm = reactive({
  actual_amount: 0,
  late_fee: 0,
  payment_date: '',
  payment_method: '',
  notes: ''
})

const getStatusType = (status) => {
  const map = {
    unpaid: 'danger',
    partial: 'warning',
    paid: 'success',
    overdue: 'danger'
  }
  return map[status] || ''
}

const getStatusText = (status) => {
  const map = {
    unpaid: '未支付',
    partial: '部分支付',
    paid: '已支付',
    overdue: '逾期'
  }
  return map[status] || status
}

const getExpenseTypeText = (type) => {
  const map = {
    upstream_rent: '上游租金',
    repair: '维修费用',
    utility: '水电燃气',
    property_fee: '物业费',
    other: '其他'
  }
  return map[type] || type
}

const formatMoney = (amount) => {
  return (amount || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const fetchRentData = async () => {
  rentLoading.value = true
  try {
    const params = {
      page: rentPagination.page,
      pageSize: rentPagination.pageSize,
      ...rentSearchForm
    }
    const res = await api.get('/finance/rent-records', { params })
    if (res.data.success) {
      rentData.value = res.data.data.list
      rentPagination.total = res.data.data.total
    }
  } catch (error) {
    ElMessage.error('获取数据失败')
  } finally {
    rentLoading.value = false
  }
}

const fetchExpenseData = async () => {
  expenseLoading.value = true
  try {
    const params = {
      page: expensePagination.page,
      pageSize: expensePagination.pageSize,
      ...expenseSearchForm
    }
    const res = await api.get('/finance/expenses', { params })
    if (res.data.success) {
      expenseData.value = res.data.data.list
      expensePagination.total = res.data.data.total
    }
  } catch (error) {
    ElMessage.error('获取数据失败')
  } finally {
    expenseLoading.value = false
  }
}

const fetchStatistics = async () => {
  statLoading.value = true
  try {
    const params = statMonth.value ? { month: statMonth.value } : {}
    const res = await api.get('/finance/statistics', { params })
    if (res.data.success) {
      statistics.value = res.data.data
    }
  } catch (error) {
    ElMessage.error('获取统计失败')
  } finally {
    statLoading.value = false
  }
}

const handleRentSearch = () => {
  rentPagination.page = 1
  fetchRentData()
}

const handleRentReset = () => {
  Object.assign(rentSearchForm, {
    rent_month: '',
    status: ''
  })
  handleRentSearch()
}

const handleExpenseSearch = () => {
  expensePagination.page = 1
  fetchExpenseData()
}

const handleExpenseReset = () => {
  Object.assign(expenseSearchForm, {
    expense_type: ''
  })
  handleExpenseSearch()
}

const handleCreateRent = () => {
  ElMessage.info('请通过合同管理创建收租记录')
}

const handleCreateExpense = () => {
  ElMessage.info('支出记录功能开发中')
}

const handlePayRent = (row) => {
  currentRentRecord.value = row
  payForm.actual_amount = row.expected_amount - row.actual_amount
  payForm.late_fee = 0
  payForm.payment_date = new Date().toISOString().split('T')[0]
  payForm.payment_method = ''
  payForm.notes = ''
  payDialogVisible.value = true
}

const handlePaySubmit = async () => {
  payLoading.value = true
  try {
    await api.put(`/finance/rent-records/${currentRentRecord.value.id}/pay`, {
      ...payForm,
      payment_date: payForm.payment_date ? new Date(payForm.payment_date).toISOString().split('T')[0] : ''
    })
    ElMessage.success('收款成功')
    payDialogVisible.value = false
    fetchRentData()
    fetchStatistics()
  } catch (error) {
    ElMessage.error('收款失败')
  } finally {
    payLoading.value = false
  }
}

const handleRentSizeChange = () => {
  fetchRentData()
}

const handleRentPageChange = () => {
  fetchRentData()
}

const handleExpenseSizeChange = () => {
  fetchExpenseData()
}

const handleExpensePageChange = () => {
  fetchExpenseData()
}

onMounted(() => {
  fetchRentData()
  fetchExpenseData()
  fetchStatistics()
})
</script>

<style scoped>
.finance-page {
  padding: 0;
  min-height: 100%;
}

.finance-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.finance-tabs :deep(.el-tabs__header) {
  margin-bottom: 20px;
}

.finance-tabs :deep(.el-tabs__item) {
  font-size: 15px;
}

.finance-tabs :deep(.el-tabs__content) {
  overflow: visible;
}

.finance-tabs :deep(.el-tabs__item.is-active) {
  color: #409eff;
  font-weight: 500;
}

.finance-tabs :deep(.el-tabs__ink-bar) {
  background-color: #409eff;
}

/* 收租/支出 tab 内容区 */
.record-pane {
  padding: 0 4px;
}

.pane-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.pane-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 6px;
}

.pane-desc {
  font-size: 13px;
  color: #909399;
  margin: 0;
  line-height: 1.5;
}

.tab-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  padding: 18px 20px;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.search-form {
  margin-bottom: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
}

.search-form :deep(.el-form-item) {
  margin-bottom: 0;
  margin-right: 12px;
}

.search-form :deep(.el-form-item__label) {
  color: #606266;
  font-size: 13px;
}

.toolbar-select {
  width: 130px;
}

.toolbar-input {
  width: 140px;
}

.btn-add {
  flex-shrink: 0;
}

.table-wrap {
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  background: #fff;
}

.record-table {
  margin-top: 0;
}

.record-table :deep(.el-table__header th) {
  background: #f8fafc !important;
  color: #475569;
  font-weight: 600;
  font-size: 13px;
}

.record-table :deep(.el-table__body td) {
  font-size: 13px;
}

.record-table :deep(.el-table__row:hover > td) {
  background-color: #f0f9ff !important;
}

.data-table .amount {
  font-weight: 600;
  color: #409eff;
  font-variant-numeric: tabular-nums;
}

.data-table .amount.expense {
  color: #ea580c;
  font-weight: 600;
}

.expense-type {
  color: #475569;
  font-size: 13px;
}

.text-muted {
  color: #94a3b8;
  font-size: 13px;
}

.table-empty {
  padding: 48px 24px;
  text-align: center;
}

.empty-text {
  font-size: 15px;
  color: #64748b;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 13px;
  color: #94a3b8;
}

.pagination-wrap {
  margin-top: 16px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.pagination-total {
  font-size: 13px;
  color: #64748b;
}

.pagination-wrap :deep(.el-pagination) {
  justify-content: flex-end;
}

.pagination-wrap :deep(.el-pagination__total) {
  display: none;
}

/* 财务统计 */
.statistics-section {
  padding: 8px 0;
}

.stat-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.stat-toolbar .label {
  color: #606266;
  font-size: 14px;
}

.stat-month {
  margin-bottom: 20px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #ecf5ff 0%, #f0f9ff 100%);
  border-radius: 8px;
  border: 1px solid #d9ecff;
}

.stat-month .value {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.stat-cards {
  margin-top: 0;
}

.stat-card {
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  margin-bottom: 16px;
  background: #fff;
  transition: box-shadow 0.2s;
}

.stat-card:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
}

.stat-card .stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-card .stat-value {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
}

.stat-card.income .stat-value { color: #409eff; }
.stat-card.received .stat-value { color: #67c23a; }
.stat-card.unpaid .stat-value { color: #f56c6c; }
.stat-card.expense .stat-value { color: #e6a23c; }
.stat-card.profit .stat-value { color: #67c23a; }
.stat-card.count .stat-value { color: #606266; }

.pay-dialog :deep(.el-dialog__body) {
  padding-top: 10px;
}
</style>
