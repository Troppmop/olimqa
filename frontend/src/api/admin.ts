import api from './client'

export interface AdminStats {
  total_users: number
  total_questions: number
  total_answers: number
  new_users_today: number
  new_questions_today: number
}

export interface AdminUser {
  id: number
  email: string
  display_name: string
  reputation: number
  is_active: boolean
  is_verified: boolean
  is_admin: boolean
  is_lone_soldier: boolean
  created_at: string
}

export interface AdminQuestion {
  id: number
  title: string
  author_id: number
  author_name: string
  vote_score: number
  answer_count: number
  view_count: number
  is_closed: boolean
  created_at: string
}

export interface AdminAnswer {
  id: number
  body_preview: string
  author_id: number
  author_name: string
  question_id: number
  question_title: string
  vote_score: number
  is_accepted: boolean
  created_at: string
}

interface Paginated<T> { items: T[]; total: number; page: number; per_page: number }

export const fetchAdminStats = () =>
  api.get<AdminStats>('/api/admin/stats').then(r => r.data)

export const fetchAdminUsers = (page = 1, q?: string) =>
  api.get<Paginated<AdminUser>>('/api/admin/users', { params: { page, per_page: 20, q } }).then(r => r.data)

export const updateAdminUser = (id: number, data: Partial<Pick<AdminUser, 'is_active' | 'is_admin' | 'is_verified'>>) =>
  api.patch<AdminUser>(`/api/admin/users/${id}`, data).then(r => r.data)

export const deleteAdminUser = (id: number) =>
  api.delete(`/api/admin/users/${id}`)

export const fetchAdminQuestions = (page = 1, q?: string) =>
  api.get<Paginated<AdminQuestion>>('/api/admin/questions', { params: { page, per_page: 20, q } }).then(r => r.data)

export const deleteAdminQuestion = (id: number) =>
  api.delete(`/api/admin/questions/${id}`)

export const fetchAdminAnswers = (page = 1) =>
  api.get<Paginated<AdminAnswer>>('/api/admin/answers', { params: { page, per_page: 20 } }).then(r => r.data)

export const deleteAdminAnswer = (id: number) =>
  api.delete(`/api/admin/answers/${id}`)
