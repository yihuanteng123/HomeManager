import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/utils/api'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const login = async (username, password) => {
    try {
      const res = await api.post('/auth/login', { username, password })
      if (res.data.success) {
        token.value = res.data.data.token
        user.value = res.data.data.user
        localStorage.setItem('token', res.data.data.token)
        localStorage.setItem('user', JSON.stringify(res.data.data.user))
        return true
      }
      return false
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    }
  }

  const logout = () => {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const fetchUserInfo = async () => {
    try {
      const res = await api.get('/auth/me')
      if (res.data.success) {
        user.value = res.data.data
        localStorage.setItem('user', JSON.stringify(res.data.data))
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  }

  return {
    token,
    user,
    login,
    logout,
    fetchUserInfo
  }
})
