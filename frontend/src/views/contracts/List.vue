<template>
  <div class="contracts-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>合同列表</span>
          <el-button type="primary" @click="handleCreate">新增合同</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="合同编号/房源/租客">
          <el-input v-model="searchForm.keyword" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable>
            <el-option label="生效中" value="active" />
            <el-option label="即将到期" value="expiring" />
            <el-option label="已终止" value="terminated" />
            <el-option label="违约" value="breach" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" v-loading="loading" style="width: 100%">
        <el-table-column prop="contract_code" label="合同编号" width="150" />
        <el-table-column prop="house_code" label="房源编号" width="120" />
        <el-table-column prop="address" label="地址" min-width="200" />
        <el-table-column prop="tenant_name" label="租客" width="100" />
        <el-table-column prop="start_date" label="开始日期" width="120" />
        <el-table-column prop="end_date" label="结束日期" width="120" />
        <el-table-column prop="monthly_rent" label="月租金" width="100">
          <template #default="{ row }">
            ¥{{ row.monthly_rent }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">详情</el-button>
            <el-button type="warning" link @click="handleTerminate(row)" v-if="row.status === 'active'">终止</el-button>
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
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/utils/api'

const router = useRouter()
const loading = ref(false)
const tableData = ref([])

const searchForm = reactive({
  keyword: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const getStatusType = (status) => {
  const map = {
    active: 'success',
    expiring: 'warning',
    terminated: 'info',
    breach: 'danger'
  }
  return map[status] || ''
}

const getStatusText = (status) => {
  const map = {
    active: '生效中',
    expiring: '即将到期',
    terminated: '已终止',
    breach: '违约'
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
    const res = await api.get('/contracts', { params })
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
    status: ''
  })
  handleSearch()
}

const handleCreate = () => {
  router.push('/contracts/create')
}

const handleView = (row) => {
  router.push(`/contracts/${row.id}`)
}

const handleTerminate = async (row) => {
  try {
    const { value } = await ElMessageBox.prompt('请输入终止原因', '终止合同', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputType: 'textarea'
    })
    await api.post(`/contracts/${row.id}/terminate`, { reason: value })
    ElMessage.success('合同已终止')
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('终止失败')
    }
  }
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
.contracts-page {
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
