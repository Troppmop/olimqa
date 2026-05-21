import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { formatDistanceToNow } from 'date-fns'
import { CheckCircle, Pencil, Trash2, CheckCheck } from 'lucide-react'
import {
  fetchQuestion, fetchAnswers, createAnswer, voteQuestion, voteAnswer, acceptAnswer,
  deleteQuestion, deleteAnswer,
} from '../api/questions'
import VoteButtons from '../components/VoteButtons'
import TagBadge from '../components/TagBadge'
import UserCard from '../components/UserCard'
import MarkdownEditor from '../components/MarkdownEditor'
import { useAuth } from '../context/AuthContext'
import type { Answer } from '../types'

export default function QuestionPage() {
  const { id } = useParams<{ id: string }>()
  const qid = parseInt(id!)
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: question, isLoading } = useQuery({
    queryKey: ['question', qid],
    queryFn: () => fetchQuestion(qid),
  })
  const { data: answers = [] } = useQuery({
    queryKey: ['answers', qid],
    queryFn: () => fetchAnswers(qid),
  })

  const [answerBody, setAnswerBody] = useState('')
  const [answerError, setAnswerError] = useState('')

  const qVoteMut = useMutation({
    mutationFn: (v: number) => voteQuestion(qid, v),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['question', qid] }),
  })
  const aVoteMut = useMutation({
    mutationFn: ({ aid, v }: { aid: number; v: number }) => voteAnswer(qid, aid, v),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['answers', qid] }),
  })
  const answerMut = useMutation({
    mutationFn: (body: string) => createAnswer(qid, body),
    onSuccess: () => {
      setAnswerBody('')
      qc.invalidateQueries({ queryKey: ['answers', qid] })
      qc.invalidateQueries({ queryKey: ['question', qid] })
    },
  })
  const acceptMut = useMutation({
    mutationFn: (aid: number) => acceptAnswer(qid, aid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['answers', qid] })
      qc.invalidateQueries({ queryKey: ['question', qid] })
    },
  })
  const delQMut = useMutation({
    mutationFn: () => deleteQuestion(qid),
    onSuccess: () => navigate('/'),
  })
  const delAMut = useMutation({
    mutationFn: (aid: number) => deleteAnswer(qid, aid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['answers', qid] }),
  })

  const submitAnswer = (e: React.FormEvent) => {
    e.preventDefault()
    if (answerBody.trim().length < 30) {
      setAnswerError('Answer must be at least 30 characters')
      return
    }
    setAnswerError('')
    answerMut.mutate(answerBody)
  }

  if (isLoading) return <div className="mx-auto max-w-4xl px-4 py-10 text-center text-gray-400">Loading…</div>
  if (!question) return <div className="mx-auto max-w-4xl px-4 py-10 text-center text-red-400">Question not found</div>

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* Question header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 leading-snug">{question.title}</h1>
        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
          <span>Asked {formatDistanceToNow(new Date(question.created_at), { addSuffix: true })}</span>
          <span>Modified {formatDistanceToNow(new Date(question.updated_at), { addSuffix: true })}</span>
          <span>{question.view_count} views</span>
        </div>
      </div>
      <hr className="mb-6" />

      {/* Question body */}
      <div className="flex gap-4">
        <div className="shrink-0 pt-1">
          <VoteButtons
            score={question.vote_score}
            userVote={question.user_vote}
            onVote={(v) => qVoteMut.mutate(v)}
            disabled={!user || user.id === question.author.id}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{question.body}</ReactMarkdown>
          </div>
          <div className="mt-4 flex flex-wrap gap-1">
            {question.tags.map((t) => <TagBadge key={t.id} tag={t} />)}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex gap-2">
              {user?.id === question.author.id && (
                <>
                  <Link to={`/questions/${qid}/edit`} className="btn-ghost text-xs">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Link>
                  <button onClick={() => { if (confirm('Delete this question?')) delQMut.mutate() }} className="btn-ghost text-xs text-red-500">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </>
              )}
            </div>
            <UserCard user={question.author} label="asked" date={question.created_at} />
          </div>
        </div>
      </div>

      {/* Answers */}
      {answers.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-gray-800 mt-10 mb-4">{answers.length} Answer{answers.length !== 1 ? 's' : ''}</h2>
          <div className="space-y-6">
            {answers.map((a: Answer) => (
              <div key={a.id} className={`flex gap-4 pb-6 border-b border-gray-100 ${a.is_accepted ? 'bg-green-50/50 rounded-lg p-3 border border-green-200' : ''}`}>
                <div className="shrink-0 pt-1 flex flex-col items-center gap-1">
                  <VoteButtons
                    score={a.vote_score}
                    userVote={a.user_vote}
                    onVote={(v) => aVoteMut.mutate({ aid: a.id, v })}
                    disabled={!user || user.id === a.author.id}
                  />
                  {a.is_accepted && <span title="Accepted answer"><CheckCircle className="h-6 w-6 text-green-500 mt-1" /></span>}
                  {!a.is_accepted && user?.id === question.author.id && (
                    <button
                      onClick={() => acceptMut.mutate(a.id)}
                      className="mt-1 text-gray-300 hover:text-green-500 transition-colors"
                      title="Accept this answer"
                    >
                      <CheckCheck className="h-6 w-6" />
                    </button>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{a.body}</ReactMarkdown>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex gap-2">
                      {user?.id === a.author.id && (
                        <button onClick={() => { if (confirm('Delete this answer?')) delAMut.mutate(a.id) }} className="btn-ghost text-xs text-red-500">
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      )}
                    </div>
                    <UserCard user={a.author} label="answered" date={a.created_at} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Post answer */}
      {user ? (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Your Answer</h2>
          <form onSubmit={submitAnswer}>
            <MarkdownEditor
              value={answerBody}
              onChange={setAnswerBody}
              placeholder="Write your answer here (Markdown supported)…"
              minHeight="200px"
              error={answerError}
            />
            <button type="submit" disabled={answerMut.isPending} className="btn-primary mt-3">
              {answerMut.isPending ? 'Posting…' : 'Post Your Answer'}
            </button>
          </form>
        </div>
      ) : (
        <div className="mt-10 card p-6 text-center text-gray-600">
          <Link to="/login" className="text-brand-600 font-medium hover:underline">Log in</Link> or{' '}
          <Link to="/register" className="text-brand-600 font-medium hover:underline">sign up</Link> to post an answer.
        </div>
      )}
    </div>
  )
}
