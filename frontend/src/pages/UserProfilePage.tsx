import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { Shield, Star, Calendar, Globe } from 'lucide-react'
import api from '../api/client'
import type { User, PaginatedQuestions } from '../types'
import QuestionCard from '../components/QuestionCard'

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>()

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => api.get<User>(`/api/users/${id}`).then((r) => r.data),
  })

  const { data: questions } = useQuery({
    queryKey: ['questions', { page: 1, sort: 'newest' }],
    queryFn: () => api.get<PaginatedQuestions>('/api/questions', { params: { per_page: 50 } }).then((r) => r.data),
    enabled: !!user,
  })

  if (isLoading) return <div className="mx-auto max-w-4xl px-4 py-10 text-center text-gray-400">Loading…</div>
  if (!user) return <div className="mx-auto max-w-4xl px-4 py-10 text-center text-red-400">User not found</div>

  const userQuestions = questions?.items.filter((q) => q.author.id === user.id) ?? []

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="card p-6 mb-6">
        <div className="flex items-start gap-6">
          <div className="h-20 w-20 rounded-full bg-brand-100 flex items-center justify-center text-3xl font-bold text-brand-600 shrink-0">
            {user.display_name[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{user.display_name}</h1>
              {user.is_lone_soldier && (
                <span className="badge-lone-soldier flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Lone Soldier
                </span>
              )}
            </div>
            {user.bio && <p className="mt-2 text-sm text-gray-700">{user.bio}</p>}
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 text-brand-400" />
                <strong className="text-gray-800">{user.reputation}</strong> reputation
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Member {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
              </span>
              {user.aliyah_year && (
                <span className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  Aliyah {user.aliyah_year}
                  {user.country_of_origin && ` from ${user.country_of_origin}`}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-gray-800 mb-3">Recent Questions</h2>
      {userQuestions.length === 0 ? (
        <p className="text-sm text-gray-500">No questions yet.</p>
      ) : (
        <div className="space-y-3">
          {userQuestions.slice(0, 5).map((q) => <QuestionCard key={q.id} question={q} />)}
        </div>
      )}
    </div>
  )
}
