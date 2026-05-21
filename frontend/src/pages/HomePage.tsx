import { useQuery } from '@tanstack/react-query'
import { useSearchParams, Link } from 'react-router-dom'
import { fetchQuestions } from '../api/questions'
import QuestionCard from '../components/QuestionCard'
import Sidebar from '../components/Sidebar'
import { ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'votes', label: 'Most Voted' },
  { value: 'unanswered', label: 'Unanswered' },
]

export default function HomePage() {
  const [params, setParams] = useSearchParams()
  const { user } = useAuth()
  const page = parseInt(params.get('page') ?? '1')
  const sort = params.get('sort') ?? 'newest'
  const tag = params.get('tag') ?? undefined
  const q = params.get('q') ?? undefined

  const { data, isLoading } = useQuery({
    queryKey: ['questions', { page, sort, tag, q }],
    queryFn: () => fetchQuestions({ page, sort, tag, q }),
  })

  const setPage = (p: number) => {
    const next = new URLSearchParams(params)
    next.set('page', String(p))
    setParams(next)
  }

  const setSort = (s: string) => {
    const next = new URLSearchParams(params)
    next.set('sort', s)
    next.set('page', '1')
    setParams(next)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 flex gap-6">
      {/* Main */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {tag ? `Questions tagged [${tag}]` : q ? `Search: "${q}"` : 'All Questions'}
            </h1>
            {data && <p className="text-sm text-gray-500 mt-0.5">{data.total.toLocaleString()} questions</p>}
          </div>
          {user && (
            <Link to="/ask" className="btn-primary">
              <PlusCircle className="h-4 w-4" /> Ask Question
            </Link>
          )}
        </div>

        {/* Sort tabs */}
        <div className="flex items-center gap-1 mb-4 border border-gray-200 rounded-md p-0.5 w-fit bg-gray-50">
          {SORTS.map((s) => (
            <button
              key={s.value}
              onClick={() => setSort(s.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                sort === s.value ? 'bg-white shadow text-brand-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="card p-4 animate-pulse h-24 bg-gray-100" />
            ))}
          </div>
        ) : data?.items.length === 0 ? (
          <div className="card p-10 text-center text-gray-500">
            <p className="text-lg font-medium">No questions found</p>
            <p className="text-sm mt-1">Be the first to ask one!</p>
            {user && <Link to="/ask" className="btn-primary mt-4 inline-flex">Ask a Question</Link>}
          </div>
        ) : (
          <div className="space-y-3">
            {data?.items.map((q) => <QuestionCard key={q.id} question={q} />)}
          </div>
        )}

        {/* Pagination */}
        {data && data.total > data.per_page && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="btn-secondary py-1.5 px-2 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(7, Math.ceil(data.total / data.per_page)) }, (_, i) => {
              const p = i + 1
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1.5 rounded text-sm font-medium ${p === page ? 'bg-brand-500 text-white' : 'btn-secondary'}`}
                >
                  {p}
                </button>
              )
            })}
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= Math.ceil(data.total / data.per_page)}
              className="btn-secondary py-1.5 px-2 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="hidden lg:block w-72 shrink-0">
        <Sidebar />
      </div>
    </div>
  )
}
