import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { fetchTags } from '../api/tags'

export default function TagsPage() {
  const [q, setQ] = useState('')
  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['tags', q],
    queryFn: () => fetchTags(q || undefined),
  })

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Tags</h1>
      <p className="text-sm text-gray-500 mb-6">
        Tags are labels that categorize questions by topic. Use them to find questions relevant to you.
      </p>

      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Filter tags…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="card p-4 animate-pulse h-20 bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              to={`/?tag=${tag.name}`}
              className="card p-4 hover:border-brand-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium"
                  style={{ backgroundColor: tag.color + '22', color: tag.color, borderColor: tag.color + '44' }}
                >
                  {tag.name}
                </span>
              </div>
              {tag.description && (
                <p className="text-xs text-gray-500 line-clamp-2 mb-2">{tag.description}</p>
              )}
              <p className="text-xs text-gray-400">{tag.question_count} question{tag.question_count !== 1 ? 's' : ''}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
