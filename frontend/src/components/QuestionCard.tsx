import { Link } from 'react-router-dom'
import { MessageSquare, Eye, CheckCircle } from 'lucide-react'
import type { Question } from '../types'
import TagBadge from './TagBadge'
import UserCard from './UserCard'

interface Props {
  question: Question
}

export default function QuestionCard({ question: q }: Props) {
  return (
    <div className="card p-4 flex gap-4 hover:border-brand-200 transition-colors">
      {/* Stats */}
      <div className="hidden sm:flex flex-col items-end gap-1 shrink-0 w-20 text-xs text-gray-500">
        <div className={`rounded px-1.5 py-0.5 ${q.vote_score > 0 ? 'bg-brand-50 text-brand-700' : q.vote_score < 0 ? 'bg-red-50 text-red-600' : 'bg-gray-100'}`}>
          {q.vote_score} votes
        </div>
        <div className={`rounded px-1.5 py-0.5 ${q.accepted_answer_id ? 'bg-green-100 text-green-700 font-semibold' : q.answer_count > 0 ? 'bg-gray-100' : 'text-gray-400'}`}>
          {q.answer_count} answers
        </div>
        <div className="text-gray-400">{q.view_count} views</div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/questions/${q.id}`} className="text-base font-semibold text-gray-900 hover:text-brand-600 line-clamp-2">
            {q.accepted_answer_id && <CheckCircle className="inline h-4 w-4 text-green-500 mr-1 mb-0.5" />}
            {q.is_closed && <span className="text-xs text-red-500 border border-red-300 rounded px-1 mr-1">closed</span>}
            {q.title}
          </Link>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {q.tags.map((t) => <TagBadge key={t.id} tag={t} />)}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-400 sm:hidden">
            <span>{q.vote_score}v</span>
            <span className="flex items-center gap-0.5"><MessageSquare className="h-3 w-3" />{q.answer_count}</span>
            <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" />{q.view_count}</span>
          </div>
          <div className="ml-auto">
            <UserCard user={q.author} label="asked" date={q.created_at} />
          </div>
        </div>
      </div>
    </div>
  )
}
