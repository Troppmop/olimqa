export interface User {
  id: number
  display_name: string
  email?: string
  reputation: number
  is_lone_soldier: boolean
  aliyah_year: number | null
  country_of_origin: string | null
  avatar_url: string | null
  bio?: string | null
  created_at: string
  updated_at?: string
}

export interface Tag {
  id: number
  name: string
  description: string | null
  color: string
  question_count?: number
}

export interface Question {
  id: number
  title: string
  body: string
  author: User
  tags: Tag[]
  view_count: number
  vote_score: number
  answer_count: number
  is_closed: boolean
  accepted_answer_id: number | null
  created_at: string
  updated_at: string
  user_vote: number | null
}

export interface Answer {
  id: number
  body: string
  author: User
  question_id: number
  vote_score: number
  is_accepted: boolean
  created_at: string
  updated_at: string
  user_vote: number | null
}

export interface Comment {
  id: number
  body: string
  author: User
  question_id: number | null
  answer_id: number | null
  created_at: string
}

export interface PaginatedQuestions {
  items: Question[]
  total: number
  page: number
  per_page: number
}

export interface Token {
  access_token: string
  refresh_token: string
  token_type: string
}
