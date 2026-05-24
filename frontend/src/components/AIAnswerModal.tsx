import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Sparkles, Send, Loader2, RefreshCw, BookOpen } from 'lucide-react'
import MarkdownEditor from './MarkdownEditor'
import { generateAIAnswer, publishAIAnswer, type AdminQuestion, type AICitation } from '../api/admin'

interface Props {
  question: AdminQuestion
  onClose: () => void
}

export default function AIAnswerModal({ question, onClose }: Props) {
  const qc = useQueryClient()
  const [draftBody, setDraftBody] = useState('')
  const [citations, setCitations] = useState<AICitation[]>([])
  const [generateError, setGenerateError] = useState('')
  const [publishError, setPublishError] = useState('')

  const generateMut = useMutation({
    mutationFn: () => generateAIAnswer(question.id),
    onSuccess: (data) => {
      setDraftBody(data.generated_text)
      setCitations(data.citations ?? [])
      setGenerateError('')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail
      setGenerateError(msg ?? 'Failed to generate. Check PINECONE_API_KEY and try again.')
    },
  })

  const publishMut = useMutation({
    mutationFn: () => publishAIAnswer(question.id, draftBody),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['answers', question.id] })
      qc.invalidateQueries({ queryKey: ['question', question.id] })
      qc.invalidateQueries({ queryKey: ['admin-answers'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
      onClose()
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail
      setPublishError(msg ?? 'Failed to publish answer.')
    },
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-500" />
            <h2 className="text-lg font-semibold text-gray-900">Generate AI Answer</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Question summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
            <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Question</p>
            <p className="font-semibold text-gray-900 text-sm">{question.title}</p>
          </div>

          {/* Generate / Regenerate */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => generateMut.mutate()}
              disabled={generateMut.isPending}
              className="btn-primary flex items-center gap-2"
            >
              {generateMut.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
              ) : draftBody ? (
                <><RefreshCw className="h-4 w-4" /> Regenerate</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Generate Answer</>
              )}
            </button>
            {draftBody && !generateMut.isPending && (
              <span className="text-xs text-green-600 font-medium">
                ✓ Answer generated — review and edit below
              </span>
            )}
          </div>

          {generateError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {generateError}
            </p>
          )}

          {/* Editable draft */}
          {(draftBody || generateMut.isPending) && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1.5">
                Review &amp; edit before publishing
              </p>
              <MarkdownEditor
                value={draftBody}
                onChange={setDraftBody}
                placeholder="AI answer will appear here…"
                minHeight="260px"
              />
            </div>
          )}

          {/* Citations */}
          {citations.length > 0 && (
            <div className="border border-purple-100 rounded-lg p-3 bg-purple-50">
              <div className="flex items-center gap-1.5 mb-2">
                <BookOpen className="h-3.5 w-3.5 text-purple-600" />
                <p className="text-xs font-semibold text-purple-700">
                  Source citations from Pinecone
                </p>
              </div>
              <ul className="space-y-1">
                {citations.map((c, i) => (
                  <li key={i} className="text-xs text-purple-800">
                    <span className="font-medium">{c.file}</span>
                    {c.pages.length > 0 && (
                      <span className="text-purple-500 ml-1">
                        p.{c.pages.join(', ')}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {publishError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {publishError}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => publishMut.mutate()}
            disabled={!draftBody.trim() || publishMut.isPending}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {publishMut.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Publishing…</>
            ) : (
              <><Send className="h-4 w-4" /> Publish Answer</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
