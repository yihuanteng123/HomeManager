<template>
  <div class="contract-detail-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>合同详情</span>
          <el-button @click="router.back()">返回</el-button>
        </div>
      </template>

      <div v-if="loading" style="text-align: center; padding: 40px;">
        <el-icon class="is-loading"><Loading /></el-icon>
      </div>

      <div v-else-if="contract">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="合同编号">{{ contract.contract_code }}</el-descriptions-item>
          <el-descriptions-item label="房源编号">{{ contract.house_code }}</el-descriptions-item>
          <el-descriptions-item label="地址">{{ contract.address }}</el-descriptions-item>
          <el-descriptions-item label="租客">{{ contract.tenant_name }} ({{ contract.tenant_phone }})</el-descriptions-item>
          <el-descriptions-item label="开始日期">{{ contract.start_date }}</el-descriptions-item>
          <el-descriptions-item label="结束日期">{{ contract.end_date }}</el-descriptions-item>
          <el-descriptions-item label="月租金">¥{{ contract.monthly_rent }}</el-descriptions-item>
          <el-descriptions-item label="押金">¥{{ contract.deposit }}</el-descriptions-item>
          <el-descriptions-item label="支付方式">{{ contract.payment_method || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(contract.status)">
              {{ getStatusText(contract.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="递增规则" :span="2">{{ contract.increment_rule || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ contract.notes || '-' }}</el-descriptions-item>
        </el-descriptions>

        <el-divider>收租记录</el-divider>

        <el-table :data="contract.rent_records || []" style="width: 100%">
          <el-table-column prop="rent_month" label="月份" width="120" />
          <el-table-column prop="expected_amount" label="应收金额" width="120">
            <template #default="{ row }">¥{{ row.expected_amount }}</template>
          </el-table-column>
          <el-table-column prop="actual_amount" label="实收金额" width="120">
            <template #default="{ row }">¥{{ row.actual_amount }}</template>
          </el-table-column>
          <el-table-column prop="late_fee" label="滞纳金" width="120">
            <template #default="{ row }">¥{{ row.late_fee }}</template>
          </el-table-column>
          <el-table-column prop="payment_date" label="支付日期" width="120" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/utils/api'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const contract = ref(null)

const getStatusType = (status) => {
  const map = {
    active: 'success',
    expiring: 'warning',
    terminated: 'info',
    breach: 'danger',
    unpaid: 'danger',
    partial: 'warning',
    paid: 'success',
    overdue: 'danger'
  }
  return map[status] || ''
}

const getStatusText = (status) => {
  const map = {
    active: '生效中',
    expiring: '即将到期',
    terminated: '已终止',
    breach: '违约',
    unpaid: '未支付',
    partial: '部分支付',
    paid: '已支付',
    overdue: '逾期'
  }
  return map[status] || status
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await api.get(`/contracts/${route.params.id}`)
    if (res.data.success) {
      contract.value = res.data.data
    }
  } catch (error) {
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.contract-detail-page {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
