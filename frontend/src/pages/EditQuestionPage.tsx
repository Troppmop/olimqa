import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchQuestion, updateQuestion } from '../api/questions'
import MarkdownEditor from '../components/MarkdownEditor'
import { useAuth } from '../context/AuthContext'
import { X } from 'lucide-react'

export default function EditQuestionPage() {
  const { id } = useParams<{ id: string }>()
  const qid = parseInt(id!)
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: question } = useQuery({ queryKey: ['question', qid], queryFn: () => fetchQuestion(qid) })

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (question) {
      setTitle(question.title)
      setBody(question.body)
      setTags(question.tags.map((t) => t.name))
    }
  }, [question])

  const mut = useMutation({
    mutationFn: () => updateQuestion(qid, { title, body, tags }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['question', qid] })
      navigate(`/questions/${qid}`)
    },
  })

  if (!user || (question && user.id !== question.author.id)) {
    navigate('/')
    return null
  }

  const addTag = (name: string) => {
    const n = name.trim().toLowerCase()
    if (n && !tags.includes(n) && tags.length < 5) setTags([...tags, n])
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
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Question</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Title</label>
          <input className={`input ${errors.title ? 'border-red-400' : ''}`} value={title} onChange={(e) => setTitle(e.target.value)} />
          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Body</label>
          <MarkdownEditor value={body} onChange={setBody} minHeight="220px" error={errors.body} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Tags</label>
          <div className="flex flex-wrap gap-1 mb-2">
            {tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-700 px-2.5 py-0.5 text-xs font-medium">
                {t}
                <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))}><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
          <input
            className="input"
            placeholder="Type a tag and press Enter"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput) } }}
            disabled={tags.length >= 5}
          />
        </div>
        {mut.isError && <p className="text-sm text-red-600">Failed to update. Please try again.</p>}
        <div className="flex gap-3">
          <button type="submit" className="btn-primary" disabled={mut.isPending}>
            {mut.isPending ? 'Saving…' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => navigate(`/questions/${qid}`)} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
