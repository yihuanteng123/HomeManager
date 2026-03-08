<template>
  <div class="users-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户列表</span>
          <el-button type="primary" @click="handleCreate">新增用户</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="角色">
          <el-select v-model="searchForm.role" placeholder="请选择" clearable style="width: 120px">
            <el-option label="管理员" value="admin" />
            <el-option label="财务" value="finance" />
            <el-option label="运营" value="operation" />
            <el-option label="客服" value="service" />
          </el-select>
        </el-form-item>
        <el-form-item label="用户名/姓名">
          <el-input v-model="searchForm.keyword" placeholder="请输入" clearable style="width: 160px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" v-loading="loading" style="width: 100%">
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="real_name" label="真实姓名" width="120" />
        <el-table-column prop="role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="getRoleType(row.role)">
              {{ getRoleText(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="电话" width="130" />
        <el-table-column prop="email" label="邮箱" min-width="150" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="warning" link @click="handleResetPassword(row)">重置密码</el-button>
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

    <!-- 新增用户弹窗 -->
    <el-dialog v-model="createVisible" title="新增用户" width="500px" @close="resetCreateForm">
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="90px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="createForm.username" placeholder="请输入登录用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="createForm.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="真实姓名">
          <el-input v-model="createForm.real_name" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="createForm.role" placeholder="请选择角色" style="width: 100%">
            <el-option label="管理员" value="admin" />
            <el-option label="财务" value="finance" />
            <el-option label="运营" value="operation" />
            <el-option label="客服" value="service" />
          </el-select>
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="createForm.phone" placeholder="请输入电话" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="createForm.email" placeholder="请输入邮箱" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCreate" :loading="createLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 编辑用户弹窗 -->
    <el-dialog v-model="editVisible" title="编辑用户" width="500px" @close="resetEditForm">
      <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="90px">
        <el-form-item label="用户名">
          <el-input v-model="editForm.username" disabled />
        </el-form-item>
        <el-form-item label="真实姓名">
          <el-input v-model="editForm.real_name" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="editForm.role" placeholder="请选择角色" style="width: 100%">
            <el-option label="管理员" value="admin" />
            <el-option label="财务" value="finance" />
            <el-option label="运营" value="operation" />
            <el-option label="客服" value="service" />
          </el-select>
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="editForm.phone" placeholder="请输入电话" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="editForm.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit" :loading="editLoading">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/utils/api'

const loading = ref(false)
const tableData = ref([])

const searchForm = reactive({
  role: '',
  keyword: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const getRoleType = (role) => {
  const map = {
    admin: 'danger',
    finance: 'warning',
    operation: 'success',
    service: 'info'
  }
  return map[role] || ''
}

const getRoleText = (role) => {
  const map = {
    admin: '管理员',
    finance: '财务',
    operation: '运营',
    service: '客服'
  }
  return map[role] || role
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    }
    const res = await api.get('/users', { params })
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
  searchForm.role = ''
  searchForm.keyword = ''
  handleSearch()
}

// 新增用户
const createVisible = ref(false)
const createLoading = ref(false)
const createFormRef = ref(null)
const createForm = reactive({
  username: '',
  password: '',
  real_name: '',
  role: 'operation',
  phone: '',
  email: ''
})
const createRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 6, message: '密码至少6位', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

const handleCreate = () => {
  createVisible.value = true
}

const resetCreateForm = () => {
  Object.assign(createForm, {
    username: '',
    password: '',
    real_name: '',
    role: 'operation',
    phone: '',
    email: ''
  })
  createFormRef.value?.clearValidate()
}

const submitCreate = async () => {
  try {
    await createFormRef.value?.validate()
  } catch {
    return
  }
  createLoading.value = true
  try {
    await api.post('/users', createForm)
    ElMessage.success('用户创建成功')
    createVisible.value = false
    fetchData()
  } catch (error) {
    // 错误已在 api 拦截器提示
  } finally {
    createLoading.value = false
  }
}

// 编辑用户
const editVisible = ref(false)
const editLoading = ref(false)
const editFormRef = ref(null)
const editForm = reactive({
  id: null,
  username: '',
  real_name: '',
  role: 'operation',
  phone: '',
  email: '',
  status: 1
})
const editRules = {
  role: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

const handleEdit = (row) => {
  editForm.id = row.id
  editForm.username = row.username
  editForm.real_name = row.real_name || ''
  editForm.role = row.role
  editForm.phone = row.phone || ''
  editForm.email = row.email || ''
  editForm.status = row.status
  editVisible.value = true
}

const resetEditForm = () => {
  editForm.id = null
  editFormRef.value?.clearValidate()
}

const submitEdit = async () => {
  try {
    await editFormRef.value?.validate()
  } catch {
    return
  }
  editLoading.value = true
  try {
    await api.put(`/users/${editForm.id}`, {
      real_name: editForm.real_name,
      role: editForm.role,
      phone: editForm.phone,
      email: editForm.email,
      status: editForm.status
    })
    ElMessage.success('用户更新成功')
    editVisible.value = false
    fetchData()
  } catch (error) {
    // 错误已在 api 拦截器提示
  } finally {
    editLoading.value = false
  }
}

// 重置密码
const handleResetPassword = async (row) => {
  try {
    const { value } = await ElMessageBox.prompt('请输入新密码（至少6位）', `重置密码 - ${row.username}`, {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputType: 'password',
      inputValidator: (v) => (v && v.length >= 6 ? true : '密码至少6位')
    })
    await api.post(`/users/${row.id}/reset-password`, { newPassword: value })
    ElMessage.success('密码重置成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '密码重置失败')
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
.users-page {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 16px;
}
</style>
