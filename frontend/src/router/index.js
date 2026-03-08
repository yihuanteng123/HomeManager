import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '数据驾驶舱', icon: 'DataAnalysis' }
      },
      {
        path: 'houses',
        name: 'Houses',
        component: () => import('@/views/houses/List.vue'),
        meta: { title: '房源管理', icon: 'House' }
      },
      {
        path: 'houses/create',
        name: 'HouseCreate',
        component: () => import('@/views/houses/Form.vue'),
        meta: { title: '新增房源', hidden: true }
      },
      {
        path: 'houses/:id/edit',
        name: 'HouseEdit',
        component: () => import('@/views/houses/Form.vue'),
        meta: { title: '编辑房源', hidden: true }
      },
      {
        path: 'tenants',
        name: 'Tenants',
        component: () => import('@/views/tenants/List.vue'),
        meta: { title: '租客管理', icon: 'User' }
      },
      {
        path: 'tenants/create',
        name: 'TenantCreate',
        component: () => import('@/views/tenants/Form.vue'),
        meta: { title: '新增租客', hidden: true }
      },
      {
        path: 'tenants/:id/edit',
        name: 'TenantEdit',
        component: () => import('@/views/tenants/Form.vue'),
        meta: { title: '编辑租客', hidden: true }
      },
      {
        path: 'contracts',
        name: 'Contracts',
        component: () => import('@/views/contracts/List.vue'),
        meta: { title: '合同管理', icon: 'Document' }
      },
      {
        path: 'contracts/create',
        name: 'ContractCreate',
        component: () => import('@/views/contracts/Form.vue'),
        meta: { title: '新增合同', hidden: true }
      },
      {
        path: 'contracts/:id',
        name: 'ContractDetail',
        component: () => import('@/views/contracts/Detail.vue'),
        meta: { title: '合同详情', hidden: true }
      },
      {
        path: 'finance',
        name: 'Finance',
        component: () => import('@/views/finance/Index.vue'),
        meta: { title: '财务管理', icon: 'Money' }
      },
      {
        path: 'repairs',
        name: 'Repairs',
        component: () => import('@/views/repairs/List.vue'),
        meta: { title: '维修管理', icon: 'Tools' }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/users/List.vue'),
        meta: { title: '用户管理', icon: 'Avatar', roles: ['admin'] }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.token) {
    next('/login')
  } else if (to.path === '/login' && userStore.token) {
    next('/')
  } else {
    // 检查角色权限
    if (to.meta.roles && !to.meta.roles.includes(userStore.user?.role)) {
      ElMessage.error('权限不足')
      next(from.path)
    } else {
      next()
    }
  }
})

export default router
