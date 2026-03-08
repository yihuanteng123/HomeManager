<template>
  <div class="tenants-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>租客列表</span>
          <el-button type="primary" @click="handleCreate">新增租客</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="姓名/电话/身份证">
          <el-input v-model="searchForm.keyword" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="黑名单">
          <el-select v-model="searchForm.is_blacklist" placeholder="请选择" clearable>
            <el-option label="是" :value="1" />
            <el-option label="否" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" v-loading="loading" style="width: 100%">
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="id_card" label="身份证号" width="180" />
        <el-table-column prop="phone" label="联系电话" width="130" />
        <el-table-column prop="emergency_contact" label="紧急联系人" width="120" />
        <el-table-column prop="emergency_phone" label="紧急电话" width="130" />
        <el-table-column prop="company" label="公司" min-width="150" />
        <el-table-column prop="is_blacklist" label="黑名单" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_blacklist ? 'danger' : 'success'">
              {{ row.is_blacklist ? '是' : '否' }}
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
  is_blacklist: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    }
    const res = await api.get('/tenants', { params })
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
    is_blacklist: ''
  })
  handleSearch()
}

const handleCreate = () => {
  router.push('/tenants/create')
}

const handleEdit = (row) => {
  router.push(`/tenants/${row.id}/edit`)
}

const handleView = (row) => {
  router.push(`/tenants/${row.id}`)
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该租客吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await api.delete(`/tenants/${row.id}`)
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
.tenants-page {
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
