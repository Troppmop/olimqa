import api from './client'
import type { Token, User } from '../types'

export const login = (email: string, password: string) =>
  api.post<Token>('/api/auth/login', { email, password }).then((r) => r.data)

export const register = (data: {
  email: string
  password: string
  display_name: string
  aliyah_year?: number
  country_of_origin?: string
  is_lone_soldier?: boolean
}) => api.post<User>('/api/auth/register', data).then((r) => r.data)

export const getMe = () => api.get<User>('/api/auth/me').then((r) => r.data)

export const updateMe = (data: Partial<User>) =>
  api.put<User>('/api/users/me', data).then((r) => r.data)

export const confirmEmail = (token: string) =>
  api.post<User>(`/api/auth/confirm-email?token=${token}`).then((r) => r.data)

export const resendConfirmation = () =>
  api.post('/api/auth/resend-confirmation').then((r) => r.data)
