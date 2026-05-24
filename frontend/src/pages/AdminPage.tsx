import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import {
  Users, MessageSquare, BarChart3, Trash2, Shield, ShieldOff,
  ShieldCheck, Ban, CheckCircle, ChevronLeft, ChevronRight, Search,
  Sparkles, FileUp, FileText,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  fetchAdminStats, fetchAdminUsers, fetchAdminQuestions, fetchAdminAnswers,
  updateAdminUser, deleteAdminUser, deleteAdminQuestion, deleteAdminAnswer,
  uploadAIDocument,
  type AdminUser, type AdminQuestion, type AdminAnswer,
} from '../api/admin'
import AIAnswerModal from '../components/AIAnswerModal'

type Tab = 'overview' | 'users' | 'questions' | 'answers' | 'ai-docs'

function StatCard({ label, value, sub, icon }: { label: string; value: number; sub?: string; icon: React.ReactNode }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className="p-3 bg-brand-50 rounded-lg text-brand-600">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {sub && <p className="text-xs text-brand-600 font-medium">{sub}</p>}
      </div>
    </div>
  )
}

function Pagination({ page, total, perPage, onChange }: { page: number; total: number; perPage: number; onChange: (p: number) => void }) {
  const pages = Math.ceil(total / perPage)
  if (pages <= 1) return null
  return (
    <div className="flex items-center gap-2 mt-4 justify-end">
      <button onClick={() => onChange(page - 1)} disabled={page === 1} className="btn-secondary py-1 px-2 disabled:opacity-40">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-sm text-gray-600">{page} / {pages}</span>
      <button onClick={() => onChange(page + 1)} disabled={page >= pages} className="btn-secondary py-1 px-2 disabled:opacity-40">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

export default function AdminPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('overview')
  const [userSearch, setUserSearch] = useState('')
  const [qSearch, setQSearch] = useState('')
  const [userPage, setUserPage] = useState(1)
  const [qPage, setQPage] = useState(1)
  const [aPage, setAPage] = useState(1)
  const [aiQuestion, setAiQuestion] = useState<AdminQuestion | null>(null)
  const [uploadedDocs, setUploadedDocs] = useState<{ name: string; status: string }[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!user?.is_admin) { navigate('/'); return null }

  const { data: stats } = useQuery({ queryKey: ['admin-stats'], queryFn: fetchAdminStats })
  const { data: users } = useQuery({
    queryKey: ['admin-users', userPage, userSearch],
    queryFn: () => fetchAdminUsers(userPage, userSearch || undefined),
    enabled: tab === 'users',
  })
  const { data: questions } = useQuery({
    queryKey: ['admin-questions', qPage, qSearch],
    queryFn: () => fetchAdminQuestions(qPage, qSearch || undefined),
    enabled: tab === 'questions',
  })
  const { data: answers } = useQuery({
    queryKey: ['admin-answers', aPage],
    queryFn: () => fetchAdminAnswers(aPage),
    enabled: tab === 'answers',
  })

  const patchUser = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateAdminUser>[1] }) =>
      updateAdminUser(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })
  const rmUser = useMutation({
    mutationFn: deleteAdminUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })
  const rmQuestion = useMutation({
    mutationFn: deleteAdminQuestion,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-questions'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })
  const rmAnswer = useMutation({
    mutationFn: deleteAdminAnswer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-answers'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const result = await uploadAIDocument(file)
      setUploadedDocs(prev => [...prev, result])
    } catch {
      setUploadedDocs(prev => [...prev, { name: file.name, status: 'failed' }])
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'users', label: 'Users', icon: <Users className="h-4 w-4" /> },
    { id: 'questions', label: 'Questions', icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'answers', label: 'Answers', icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'ai-docs', label: 'AI Documents', icon: <Sparkles className="h-4 w-4" /> },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-6 w-6 text-brand-500" /> Admin Panel
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Full moderation control over OlimQ&A</p>
        </div>
        <Link to="/" className="btn-secondary text-sm">← Back to site</Link>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === 'overview' && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Total Users" value={stats.total_users} sub={`+${stats.new_users_today} today`} icon={<Users className="h-5 w-5" />} />
          <StatCard label="Total Questions" value={stats.total_questions} sub={`+${stats.new_questions_today} today`} icon={<MessageSquare className="h-5 w-5" />} />
          <StatCard label="Total Answers" value={stats.total_answers} icon={<CheckCircle className="h-5 w-5" />} />
        </div>
      )}

      {/* ── Users ── */}
      {tab === 'users' && (
        <div>
          <div className="relative max-w-sm mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="Search by name or email…"
              value={userSearch}
              onChange={e => { setUserSearch(e.target.value); setUserPage(1) }}
            />
          </div>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['User', 'Email', 'Joined', 'Rep', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users?.items.map((u: AdminUser) => (
                  <tr key={u.id} className={`${!u.is_active ? 'bg-red-50' : ''} hover:bg-gray-50`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{u.display_name}</span>
                        {u.is_admin && <span className="text-xs bg-brand-100 text-brand-700 rounded px-1.5 py-0.5 font-medium">Admin</span>}
                        {u.is_lone_soldier && <span className="text-xs bg-amber-100 text-amber-700 rounded px-1.5 py-0.5">Lone Soldier</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-medium">{u.reputation}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        !u.is_active ? 'bg-red-100 text-red-700' :
                        !u.is_verified ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {!u.is_active ? 'Banned' : !u.is_verified ? 'Unverified' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => patchUser.mutate({ id: u.id, data: { is_active: !u.is_active } })}
                          className={`p-1.5 rounded hover:bg-gray-100 ${!u.is_active ? 'text-green-600' : 'text-red-500'}`}
                          title={u.is_active ? 'Ban user' : 'Unban user'}
                        >
                          {u.is_active ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => patchUser.mutate({ id: u.id, data: { is_admin: !u.is_admin } })}
                          className={`p-1.5 rounded hover:bg-gray-100 ${u.is_admin ? 'text-brand-600' : 'text-gray-400'}`}
                          title={u.is_admin ? 'Remove admin' : 'Make admin'}
                        >
                          {u.is_admin ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => confirm(`Delete ${u.display_name}?`) && rmUser.mutate(u.id)}
                          className="p-1.5 rounded hover:bg-red-50 text-red-400 hover:text-red-600"
                          title="Delete user"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={userPage} total={users?.total ?? 0} perPage={20} onChange={setUserPage} />
        </div>
      )}

      {/* ── Questions ── */}
      {tab === 'questions' && (
        <div>
          <div className="relative max-w-sm mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="Search questions…"
              value={qSearch}
              onChange={e => { setQSearch(e.target.value); setQPage(1) }}
            />
          </div>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Title', 'Author', 'Posted', 'Votes', 'Answers', 'Views', ''].map((h, i) => (
                    <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {questions?.items.map((q: AdminQuestion) => (
                  <tr key={q.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 max-w-xs">
                      <Link to={`/questions/${q.id}`} className="text-brand-600 hover:underline line-clamp-1 font-medium">
                        {q.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{q.author_name}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {formatDistanceToNow(new Date(q.created_at), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-3 text-center">{q.vote_score}</td>
                    <td className="px-4 py-3 text-center">{q.answer_count}</td>
                    <td className="px-4 py-3 text-center">{q.view_count}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setAiQuestion(q)}
                          className="p-1.5 rounded hover:bg-purple-50 text-purple-400 hover:text-purple-600"
                          title="Generate AI Answer"
                        >
                          <Sparkles className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => confirm('Delete this question and all its answers?') && rmQuestion.mutate(q.id)}
                          className="p-1.5 rounded hover:bg-red-50 text-red-400 hover:text-red-600"
                          title="Delete question"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={qPage} total={questions?.total ?? 0} perPage={20} onChange={setQPage} />
        </div>
      )}

      {/* ── Answers ── */}
      {tab === 'answers' && (
        <div>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Answer', 'Author', 'Question', 'Posted', 'Votes', ''].map((h, i) => (
                    <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {answers?.items.map((a: AdminAnswer) => (
                  <tr key={a.id} className={`hover:bg-gray-50 ${a.is_accepted ? 'bg-green-50/40' : ''}`}>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-gray-700 line-clamp-2 text-xs">{a.body_preview}</p>
                      {a.is_accepted && <span className="text-xs text-green-600 font-medium">✓ Accepted</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{a.author_name}</td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <Link to={`/questions/${a.question_id}`} className="text-brand-600 hover:underline line-clamp-1 text-xs">
                        {a.question_title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-3 text-center">{a.vote_score}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => confirm('Delete this answer?') && rmAnswer.mutate(a.id)}
                        className="p-1.5 rounded hover:bg-red-50 text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={aPage} total={answers?.total ?? 0} perPage={20} onChange={setAPage} />
        </div>
      )}

      {/* ── AI Documents ── */}
      {tab === 'ai-docs' && (
        <div className="max-w-2xl space-y-6">
          <div className="card p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-1 flex items-center gap-2">
              <FileUp className="h-4 w-4 text-purple-500" /> Upload Grounding Document
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Upload IDF rulebooks, Israeli aliyah law PDFs, or any official document.
              The Pinecone Assistant will use these as its knowledge base when generating answers.
              Supported: PDF, TXT, MD, DOCX.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn-primary flex items-center gap-2"
            >
              <FileUp className="h-4 w-4" />
              {uploading ? 'Uploading…' : 'Choose File to Upload'}
            </button>
          </div>

          {uploadedDocs.length > 0 && (
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Documents uploaded this session
              </h3>
              <ul className="space-y-2">
                {uploadedDocs.map((doc, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="text-gray-700 flex-1">{doc.name}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      doc.status === 'uploaded'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {doc.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* AI Answer generation modal */}
      {aiQuestion && (
        <AIAnswerModal
          question={aiQuestion}
          onClose={() => setAiQuestion(null)}
        />
      )}
    </div>
  )
}
