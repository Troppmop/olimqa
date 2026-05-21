import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { createQuestion } from '../api/questions'
import MarkdownEditor from '../components/MarkdownEditor'
import { useAuth } from '../context/AuthContext'
import { X, Lightbulb } from 'lucide-react'

export default function AskPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const mut = useMutation({
    mutationFn: () => createQuestion({ title, body, tags }),
    onSuccess: (q) => navigate(`/questions/${q.id}`),
  })

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-gray-600">Please <Link to="/login" className="text-brand-600 font-medium">log in</Link> to ask a question.</p>
      </div>
    )
  }

  const addTag = (name: string) => {
    const n = name.trim().toLowerCase()
    if (n && !tags.includes(n) && tags.length < 5) {
      setTags([...tags, n])
    }
    setTagInput('')
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (title.trim().length < 15) e.title = 'Title must be at least 15 characters'
    if (body.trim().length < 30) e.body = 'Body must be at least 30 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) mut.mutate()
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 flex gap-6">
      {/* Form */}
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Ask a Question</h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-1.5">Be specific. Imagine you're asking a friend who just made aliyah.</p>
            <input
              className={`input ${errors.title ? 'border-red-400 focus:ring-red-300' : ''}`}
              placeholder="e.g. How do I open a bank account at Bank Hapoalim as a new oleh?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Body <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-1.5">Include all relevant details. Markdown is supported.</p>
            <MarkdownEditor
              value={body}
              onChange={setBody}
              placeholder="Describe your situation in detail…"
              minHeight="220px"
              error={errors.body}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">Tags</label>
            <p className="text-xs text-gray-500 mb-1.5">Add up to 5 tags to describe what your question is about.</p>
            <div className="flex flex-wrap gap-1 mb-2">
              {tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-700 px-2.5 py-0.5 text-xs font-medium">
                  {t}
                  <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <input
              className="input"
              placeholder="Type a tag and press Enter (e.g. visa, ulpan, army)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault()
                  addTag(tagInput)
                }
              }}
              disabled={tags.length >= 5}
            />
          </div>

          {mut.isError && (
            <p className="text-sm text-red-600">Failed to submit. Please try again.</p>
          )}

          <button type="submit" className="btn-primary" disabled={mut.isPending}>
            {mut.isPending ? 'Posting…' : 'Post Your Question'}
          </button>
        </form>
      </div>

      {/* Tips sidebar */}
      <div className="hidden lg:block w-72 shrink-0">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-brand-500" />
            <h3 className="font-semibold text-sm">Tips for a great question</h3>
          </div>
          <ul className="text-xs text-gray-600 space-y-2 list-disc pl-4">
            <li>Summarize the problem in the title</li>
            <li>Describe what you've already tried</li>
            <li>Include relevant details (e.g., your visa type, which city)</li>
            <li>Be specific — avoid vague questions</li>
            <li>Use relevant tags to help others find your question</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
