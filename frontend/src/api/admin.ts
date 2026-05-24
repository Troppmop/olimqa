import api from './client'
import type { Answer } from '../types'

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

// ── AI Answer Generation ──────────────────────────────────────────

export interface AICitation { file: string; pages: number[] }

export const generateAIAnswer = (qid: number) =>
  api.post<{ generated_text: string; citations: AICitation[] }>(
    `/api/admin/questions/${qid}/generate-ai-answer`
  ).then(r => r.data)

export const publishAIAnswer = (qid: number, body: string) =>
  api.post<Answer>(`/api/admin/questions/${qid}/publish-ai-answer`, { body }).then(r => r.data)

export const uploadAIDocument = (file: File) => {
  const fd = new FormData()
  fd.append('file', file)
  return api.post<{ name: string; status: string }>('/api/admin/ai/upload-document', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data)
}
