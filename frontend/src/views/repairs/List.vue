<template>
  <div class="repairs-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>维修记录</span>
          <el-button type="primary" @click="handleCreate">新增维修记录</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="房源/问题">
          <el-input v-model="searchForm.keyword" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable>
            <el-option label="待处理" value="pending" />
            <el-option label="处理中" value="processing" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="紧急程度">
          <el-select v-model="searchForm.urgency" placeholder="请选择" clearable>
            <el-option label="低" value="low" />
            <el-option label="中" value="medium" />
            <el-option label="高" value="high" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" v-loading="loading" style="width: 100%">
        <el-table-column prop="house_code" label="房源编号" width="120" />
        <el-table-column prop="room_code" label="房间" width="100" />
        <el-table-column prop="reporter" label="报修人" width="100" />
        <el-table-column prop="report_date" label="报修时间" width="180" />
        <el-table-column prop="problem_description" label="问题描述" min-width="200" />
        <el-table-column prop="urgency" label="紧急程度" width="100">
          <template #default="{ row }">
            <el-tag :type="getUrgencyType(row.urgency)">
              {{ getUrgencyText(row.urgency) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="actual_cost" label="实际费用" width="120">
          <template #default="{ row }">
            {{ row.actual_cost ? `¥${row.actual_cost}` : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/utils/api'

const loading = ref(false)
const tableData = ref([])

const searchForm = reactive({
  keyword: '',
  status: '',
  urgency: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const getUrgencyType = (urgency) => {
  const map = {
    low: 'info',
    medium: 'warning',
    high: 'danger'
  }
  return map[urgency] || ''
}

const getUrgencyText = (urgency) => {
  const map = {
    low: '低',
    medium: '中',
    high: '高'
  }
  return map[urgency] || urgency
}

const getStatusType = (status) => {
  const map = {
    pending: 'warning',
    processing: 'primary',
    completed: 'success',
    cancelled: 'info'
  }
  return map[status] || ''
}

const getStatusText = (status) => {
  const map = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || status
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    }
    const res = await api.get('/repairs', { params })
    if (res.data.success) {
      tableData.value = res.data.data.list
      pagination.total = res.data.data.total
    }
  } catch (error) {
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  Object.assign(searchForm, {
    keyword: '',
    status: '',
    urgency: ''
  })
  handleSearch()
}

const handleCreate = () => {
  ElMessage.info('维修记录创建功能开发中')
}

const handleEdit = (row) => {
  ElMessage.info('维修记录编辑功能开发中')
}

const handleSizeChange = () => {
  fetchData()
}

const handlePageChange = () => {
  fetchData()
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.repairs-page {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}
</style>
