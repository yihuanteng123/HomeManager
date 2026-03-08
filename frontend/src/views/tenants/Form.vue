<template>
  <div class="tenant-form-page">
    <el-card>
      <template #header>
        <span>{{ isEdit ? '编辑租客' : '新增租客' }}</span>
      </template>

      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="form.name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="身份证号" prop="id_card">
              <el-input v-model="form.id_card" placeholder="请输入身份证号" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="公司信息">
              <el-input v-model="form.company" placeholder="请输入公司信息" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="紧急联系人">
              <el-input v-model="form.emergency_contact" placeholder="请输入紧急联系人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="紧急联系人电话">
              <el-input v-model="form.emergency_phone" placeholder="请输入紧急联系人电话" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="信用备注">
          <el-input v-model="form.credit_note" type="textarea" :rows="4" placeholder="请输入信用备注" />
        </el-form-item>

        <el-form-item label="是否黑名单">
          <el-switch v-model="form.is_blacklist" :active-value="1" :inactive-value="0" />
        </el-form-item>

        <el-form-item v-if="form.is_blacklist" label="黑名单原因">
          <el-input v-model="form.blacklist_reason" type="textarea" :rows="3" placeholder="请输入黑名单原因" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="loading">保存</el-button>
          <el-button @click="handleCancel">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/utils/api'

const route = useRoute()
const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const isEdit = ref(false)

const form = reactive({
  name: '',
  id_card: '',
  phone: '',
  emergency_contact: '',
  emergency_phone: '',
  company: '',
  credit_note: '',
  is_blacklist: 0,
  blacklist_reason: ''
})

const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }]
}

const fetchData = async () => {
  if (route.params.id) {
    isEdit.value = true
    try {
      const res = await api.get(`/tenants/${route.params.id}`)
      if (res.data.success) {
        Object.assign(form, res.data.data)
      }
    } catch (error) {
      ElMessage.error('获取数据失败')
    }
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        if (isEdit.value) {
          await api.put(`/tenants/${route.params.id}`, form)
          ElMessage.success('更新成功')
        } else {
          await api.post('/tenants', form)
          ElMessage.success('创建成功')
        }
        router.push('/tenants')
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '操作失败')
      } finally {
        loading.value = false
      }
    }
  })
}

const handleCancel = () => {
  router.back()
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.tenant-form-page {
  padding: 0;
}
</style>
