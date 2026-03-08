<template>
  <div class="house-form-page">
    <el-card>
      <template #header>
        <span>{{ isEdit ? '编辑房源' : '新增房源' }}</span>
      </template>

      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="房源编号" prop="house_code">
              <el-input v-model="form.house_code" placeholder="请输入房源编号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="房源类型" prop="house_type">
              <el-select v-model="form.house_type" placeholder="请选择" style="width: 100%">
                <el-option label="整租" value="whole" />
                <el-option label="合租" value="shared" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="地址" prop="address">
          <el-input v-model="form.address" placeholder="请输入详细地址" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="面积(㎡)" prop="area">
              <el-input-number v-model="form.area" :precision="2" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="楼层">
              <el-input v-model="form.floor" placeholder="如：3" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="总楼层">
              <el-input v-model="form.total_floors" placeholder="如：6" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="朝向">
              <el-input v-model="form.orientation" placeholder="如：南" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="户型">
              <el-input v-model="form.layout" placeholder="如：2室1厅" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="月租金(元)">
              <el-input-number v-model="form.monthly_rent" :precision="2" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="押金(元)">
              <el-input-number v-model="form.deposit" :precision="2" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="上游房东姓名">
              <el-input v-model="form.upstream_landlord_name" placeholder="请输入" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="上游房东电话">
              <el-input v-model="form.upstream_landlord_phone" placeholder="请输入" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="房源状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择" style="width: 100%">
            <el-option label="空置" value="vacant" />
            <el-option label="已租" value="rented" />
            <el-option label="待签约" value="pending" />
            <el-option label="即将到期" value="expiring" />
            <el-option label="维修中" value="repairing" />
            <el-option label="下架" value="offline" />
          </el-select>
        </el-form-item>

        <el-form-item label="房源描述">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请输入房源描述" />
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
  house_code: '',
  house_type: '',
  address: '',
  area: null,
  floor: '',
  total_floors: '',
  orientation: '',
  layout: '',
  monthly_rent: null,
  deposit: null,
  upstream_landlord_name: '',
  upstream_landlord_phone: '',
  status: 'vacant',
  description: ''
})

const rules = {
  house_code: [{ required: true, message: '请输入房源编号', trigger: 'blur' }],
  house_type: [{ required: true, message: '请选择房源类型', trigger: 'change' }],
  address: [{ required: true, message: '请输入地址', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const fetchData = async () => {
  if (route.params.id) {
    isEdit.value = true
    try {
      const res = await api.get(`/houses/${route.params.id}`)
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
          await api.put(`/houses/${route.params.id}`, form)
          ElMessage.success('更新成功')
        } else {
          await api.post('/houses', form)
          ElMessage.success('创建成功')
        }
        router.push('/houses')
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
.house-form-page {
  padding: 0;
}
</style>
