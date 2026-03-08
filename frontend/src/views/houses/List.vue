<template>
  <div class="houses-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>房源列表</span>
          <el-button type="primary" @click="handleCreate">新增房源</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="房源编号/地址">
          <el-input v-model="searchForm.keyword" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="房源类型">
          <el-select v-model="searchForm.house_type" placeholder="请选择" clearable>
            <el-option label="整租" value="whole" />
            <el-option label="合租" value="shared" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable>
            <el-option label="空置" value="vacant" />
            <el-option label="已租" value="rented" />
            <el-option label="待签约" value="pending" />
            <el-option label="即将到期" value="expiring" />
            <el-option label="维修中" value="repairing" />
            <el-option label="下架" value="offline" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" v-loading="loading" style="width: 100%">
        <el-table-column prop="house_code" label="房源编号" width="120" />
        <el-table-column prop="house_type" label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="row.house_type === 'whole' ? 'success' : 'info'">
              {{ row.house_type === 'whole' ? '整租' : '合租' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="address" label="地址" min-width="200" />
        <el-table-column prop="area" label="面积(㎡)" width="100" />
        <el-table-column prop="monthly_rent" label="月租金" width="100">
          <template #default="{ row }">
            ¥{{ row.monthly_rent || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="info" link @click="handleView(row)">详情</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
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
  house_type: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const getStatusType = (status) => {
  const map = {
    vacant: 'info',
    rented: 'success',
    pending: 'warning',
    expiring: 'warning',
    repairing: 'danger',
    offline: ''
  }
  return map[status] || ''
}

const getStatusText = (status) => {
  const map = {
    vacant: '空置',
    rented: '已租',
    pending: '待签约',
    expiring: '即将到期',
    repairing: '维修中',
    offline: '下架'
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
    const res = await api.get('/houses', { params })
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
    house_type: '',
    status: ''
  })
  handleSearch()
}

const handleCreate = () => {
  router.push('/houses/create')
}

const handleEdit = (row) => {
  router.push(`/houses/${row.id}/edit`)
}

const handleView = (row) => {
  router.push(`/houses/${row.id}`)
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该房源吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await api.delete(`/houses/${row.id}`)
    ElMessage.success('删除成功')
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
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
.houses-page {
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
