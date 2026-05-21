import api from './client'
import type { Question, PaginatedQuestions, Answer, Comment } from '../types'

export const fetchQuestions = (params: Record<string, string | number | undefined>) =>
  api.get<PaginatedQuestions>('/api/questions', { params }).then((r) => r.data)

export const fetchQuestion = (id: number) =>
  api.get<Question>(`/api/questions/${id}`).then((r) => r.data)

export const createQuestion = (data: { title: string; body: string; tags: string[] }) =>
  api.post<Question>('/api/questions', data).then((r) => r.data)

export const updateQuestion = (id: number, data: { title?: string; body?: string; tags?: string[] }) =>
  api.put<Question>(`/api/questions/${id}`, data).then((r) => r.data)

export const deleteQuestion = (id: number) =>
  api.delete(`/api/questions/${id}`)

export const voteQuestion = (id: number, value: number) =>
  api.post<{ vote_score: number; user_vote: number | null }>(`/api/questions/${id}/vote?value=${value}`).then((r) => r.data)

// Answers
export const fetchAnswers = (questionId: number) =>
  api.get<Answer[]>(`/api/questions/${questionId}/answers`).then((r) => r.data)

export const createAnswer = (questionId: number, body: string) =>
  api.post<Answer>(`/api/questions/${questionId}/answers`, { body }).then((r) => r.data)

export const updateAnswer = (questionId: number, answerId: number, body: string) =>
  api.put<Answer>(`/api/questions/${questionId}/answers/${answerId}`, { body }).then((r) => r.data)

export const deleteAnswer = (questionId: number, answerId: number) =>
  api.delete(`/api/questions/${questionId}/answers/${answerId}`)

export const voteAnswer = (questionId: number, answerId: number, value: number) =>
  api.post<{ vote_score: number; user_vote: number | null }>(`/api/questions/${questionId}/answers/${answerId}/vote?value=${value}`).then((r) => r.data)

export const acceptAnswer = (questionId: number, answerId: number) =>
  api.post(`/api/questions/${questionId}/answers/${answerId}/accept`).then((r) => r.data)

// Comments
export const fetchQuestionComments = (questionId: number) =>
  api.get<Comment[]>(`/api/questions/${questionId}/comments`).then((r) => r.data)

export const addQuestionComment = (questionId: number, body: string) =>
  api.post<Comment>(`/api/questions/${questionId}/comments`, { body }).then((r) => r.data)

export const addAnswerComment = (answerId: number, body: string) =>
  api.post<Comment>(`/api/answers/${answerId}/comments`, { body }).then((r) => r.data)
