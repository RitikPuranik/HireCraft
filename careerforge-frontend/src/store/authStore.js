import { create } from 'zustand'
import { authAPI, userAPI } from '../api/services'

const getStored = () => {
  try {
    const user = localStorage.getItem('cf_user')
    const token = localStorage.getItem('cf_token')
    return { user: user ? JSON.parse(user) : null, token }
  } catch { return { user: null, token: null } }
}

export const useAuthStore = create((set, get) => ({
  user: getStored().user,
  token: getStored().token,
  loading: false,

  login: async (email, password) => {
    set({ loading: true })
    try {
      const res = await authAPI.login({ email, password })
      const { token, user } = res.data
      localStorage.setItem('cf_token', token)
      localStorage.setItem('cf_user', JSON.stringify(user))
      set({ user, token, loading: false })
      return { success: true }
    } catch (err) {
      set({ loading: false })
      return { success: false, error: err.message }
    }
  },

  register: async (name, email, password) => {
    set({ loading: true })
    try {
      const res = await authAPI.register({ name, email, password })
      const { token, user } = res.data
      localStorage.setItem('cf_token', token)
      localStorage.setItem('cf_user', JSON.stringify(user))
      set({ user, token, loading: false })
      return { success: true }
    } catch (err) {
      set({ loading: false })
      return { success: false, error: err.message }
    }
  },

  logout: async () => {
    try { await authAPI.logout() } catch {}
    localStorage.removeItem('cf_token')
    localStorage.removeItem('cf_user')
    set({ user: null, token: null })
  },

  refreshUser: async () => {
    try {
      const res = await userAPI.getProfile()
      const user = res.data
      localStorage.setItem('cf_user', JSON.stringify(user))
      set({ user })
    } catch {}
  },
}))
