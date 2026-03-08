<template>
  <div class="dashboard">
    <div class="dashboard-toolbar">
      <span class="toolbar-label">统计时间段</span>
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        format="YYYY-MM-DD"
        clearable
        class="toolbar-daterange"
      />
      <el-button type="primary" @click="handleQuery">查询</el-button>
      <el-button @click="handleQueryAll">全部</el-button>
      <span class="toolbar-hint">{{ timeRangeText }}</span>
    </div>

    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #409EFF;">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ overview.expiring_contracts }}</div>
              <div class="stat-label">即将到期合同</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #67C23A;">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">¥{{ formatMoney(overview.expected_rent) }}</div>
              <div class="stat-label">应收租金</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #E6A23C;">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ overview.unpaid_count }}</div>
              <div class="stat-label">欠租人数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #F56C6C;">
              <el-icon><House /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ overview.vacant_houses }}</div>
              <div class="stat-label">空置房数量</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #67C23A;">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">¥{{ formatMoney(overview.actual_rent) }}</div>
              <div class="stat-label">实收租金</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #E6A23C;">
              <el-icon><DataAnalysis /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">¥{{ formatMoney(overview.profit) }}</div>
              <div class="stat-label">利润</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #909399;">
              <el-icon><Tools /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ overview.pending_repairs }}</div>
              <div class="stat-label">待处理维修</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>即将到期合同</span>
          </template>
          <el-table :data="expiringContracts" style="width: 100%">
            <el-table-column prop="house_code" label="房源编号" width="120" />
            <el-table-column prop="address" label="地址" />
            <el-table-column prop="tenant_name" label="租客" width="100" />
            <el-table-column prop="end_date" label="到期日期" width="120" />
            <el-table-column label="剩余天数" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.days_left == null || row.days_left < 0" type="info">已过期</el-tag>
                <el-tag v-else :type="row.days_left <= 7 ? 'danger' : 'warning'">
                  {{ row.days_left }} 天
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>欠租列表</span>
          </template>
          <el-table :data="unpaidRents" style="width: 100%">
            <el-table-column prop="house_code" label="房源编号" width="120" />
            <el-table-column prop="tenant_name" label="租客" width="100" />
            <el-table-column prop="rent_month" label="月份" width="100" />
            <el-table-column label="欠租金额" width="120">
              <template #default="{ row }">
                <span style="color: #F56C6C;">¥{{ formatMoney(row.unpaid_amount) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/utils/api'
import { ElMessage } from 'element-plus'

const dateRange = ref(null) // [start, end] 或 null 表示全部
const timeRangeText = ref('统计范围：全部')

const overview = ref({
  expiring_contracts: 0,
  expected_rent: 0,
  actual_rent: 0,
  unpaid_count: 0,
  vacant_houses: 0,
  profit: 0,
  pending_repairs: 0
})

const expiringContracts = ref([])
const unpaidRents = ref([])

const formatMoney = (amount) => {
  return (amount || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

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

const fetchDashboardData = async () => {
  try {
    const params = {}
    if (dateRange.value && dateRange.value.length === 2) {
      params.start_date = dateRange.value[0]
      params.end_date = dateRange.value[1]
    }
    const res = await api.get('/dashboard', { params })
    if (res.data.success) {
      const d = res.data.data
      if (d.time_range) {
        timeRangeText.value = `统计范围：${d.time_range.start_date} 至 ${d.time_range.end_date}`
      } else {
        timeRangeText.value = '统计范围：全部'
      }
      overview.value = {
        expiring_contracts: Number(d.overview?.expiring_contracts ?? 0),
        expected_rent: Number(d.overview?.expected_rent ?? 0),
        actual_rent: Number(d.overview?.actual_rent ?? 0),
        unpaid_count: Number(d.overview?.unpaid_count ?? 0),
        vacant_houses: Number(d.overview?.vacant_houses ?? 0),
        profit: Number(d.overview?.profit ?? 0),
        pending_repairs: Number(d.overview?.pending_repairs ?? 0)
      }
      expiringContracts.value = Array.isArray(d.expiring_contracts) ? d.expiring_contracts : []
      unpaidRents.value = Array.isArray(d.unpaid_rents) ? d.unpaid_rents : []
    }
  } catch (error) {
    ElMessage.error('获取数据失败')
  }
}

const handleQuery = () => {
  if (dateRange.value && dateRange.value.length === 2) {
    fetchDashboardData()
  } else {
    ElMessage.info('请选择开始和结束日期')
  }
}

const handleQueryAll = () => {
  dateRange.value = null
  fetchDashboardData()
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.dashboard-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
  padding: 14px 18px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.toolbar-label {
  font-size: 14px;
  color: #606266;
}

.toolbar-daterange {
  width: 240px;
}

.toolbar-hint {
  font-size: 13px;
  color: #909399;
  margin-left: 8px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  cursor: pointer;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-content {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  margin-right: 15px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}
</style>
