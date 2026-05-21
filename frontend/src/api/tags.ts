import api from './client'
import type { Tag } from '../types'

export const fetchTags = (q?: string) =>
  api.get<(Tag & { question_count: number })[]>('/api/tags', { params: q ? { q } : {} }).then((r) => r.data)
