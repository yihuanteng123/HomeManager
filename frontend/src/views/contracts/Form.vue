<template>
  <div class="contract-form-page">
    <el-card>
      <template #header>
        <span>新增合同</span>
      </template>

      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="合同编号" prop="contract_code">
          <el-input v-model="form.contract_code" placeholder="请输入合同编号" />
        </el-form-item>

        <el-form-item label="房源" prop="house_id">
          <el-select v-model="form.house_id" placeholder="请选择房源" filterable @change="handleHouseChange" style="width: 100%">
            <el-option
              v-for="house in houses"
              :key="house.id"
              :label="`${house.house_code} - ${house.address}`"
              :value="house.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="房间" v-if="selectedHouse?.house_type === 'shared'">
          <el-select v-model="form.room_id" placeholder="请选择房间" filterable style="width: 100%">
            <el-option
              v-for="room in rooms"
              :key="room.id"
              :label="`${room.room_code} - ${room.area}㎡`"
              :value="room.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="租客" prop="tenant_id">
          <el-select v-model="form.tenant_id" placeholder="请选择租客" filterable style="width: 100%">
            <el-option
              v-for="tenant in tenants"
              :key="tenant.id"
              :label="`${tenant.name} - ${tenant.phone}`"
              :value="tenant.id"
            />
          </el-select>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始日期" prop="start_date">
              <el-date-picker v-model="form.start_date" type="date" placeholder="选择日期" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束日期" prop="end_date">
              <el-date-picker v-model="form.end_date" type="date" placeholder="选择日期" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="月租金(元)" prop="monthly_rent">
              <el-input-number v-model="form.monthly_rent" :precision="2" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="押金(元)" prop="deposit">
              <el-input-number v-model="form.deposit" :precision="2" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="支付方式">
          <el-input v-model="form.payment_method" placeholder="如：银行转账、支付宝等" />
        </el-form-item>

        <el-form-item label="递增规则">
          <el-input v-model="form.increment_rule" type="textarea" :rows="2" placeholder="如：每年递增5%" />
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="form.notes" type="textarea" :rows="3" placeholder="请输入备注" />
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
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/utils/api'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const houses = ref([])
const tenants = ref([])
const rooms = ref([])
const selectedHouse = ref(null)

const form = reactive({
  contract_code: '',
  house_id: null,
  room_id: null,
  tenant_id: null,
  start_date: '',
  end_date: '',
  monthly_rent: null,
  deposit: null,
  payment_method: '',
  increment_rule: '',
  notes: ''
})

const rules = {
  contract_code: [{ required: true, message: '请输入合同编号', trigger: 'blur' }],
  house_id: [{ required: true, message: '请选择房源', trigger: 'change' }],
  tenant_id: [{ required: true, message: '请选择租客', trigger: 'change' }],
  start_date: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  end_date: [{ required: true, message: '请选择结束日期', trigger: 'change' }],
  monthly_rent: [{ required: true, message: '请输入月租金', trigger: 'blur' }],
  deposit: [{ required: true, message: '请输入押金', trigger: 'blur' }]
}

const fetchHouses = async () => {
  try {
    const res = await api.get('/houses', { params: { page: 1, pageSize: 1000 } })
    if (res.data.success) {
      houses.value = res.data.data.list
    }
  } catch (error) {
    ElMessage.error('获取房源列表失败')
  }
}

const fetchTenants = async () => {
  try {
    const res = await api.get('/tenants', { params: { page: 1, pageSize: 1000 } })
    if (res.data.success) {
      tenants.value = res.data.data.list
    }
  } catch (error) {
    ElMessage.error('获取租客列表失败')
  }
}

const handleHouseChange = async (houseId) => {
  if (!houseId) {
    selectedHouse.value = null
    rooms.value = []
    return
  }

  selectedHouse.value = houses.value.find(h => h.id === houseId)
  
  if (selectedHouse.value?.house_type === 'shared') {
    try {
      const res = await api.get(`/houses/${houseId}`)
      if (res.data.success && res.data.data.rooms) {
        rooms.value = res.data.data.rooms.filter(r => r.status === 'vacant')
      }
    } catch (error) {
      ElMessage.error('获取房间列表失败')
    }
  } else {
    rooms.value = []
    form.room_id = null
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const submitData = {
          ...form,
          start_date: form.start_date ? new Date(form.start_date).toISOString().split('T')[0] : '',
          end_date: form.end_date ? new Date(form.end_date).toISOString().split('T')[0] : ''
        }
        await api.post('/contracts', submitData)
        ElMessage.success('合同创建成功')
        router.push('/contracts')
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '创建失败')
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
  fetchHouses()
  fetchTenants()
})
</script>

<style scoped>
.contract-form-page {
  padding: 0;
}
</style>
