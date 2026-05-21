import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  minHeight?: string
  error?: string
}

export default function MarkdownEditor({ value, onChange, placeholder, minHeight = '150px', error }: Props) {
  const [tab, setTab] = useState<'write' | 'preview'>('write')

  return (
    <div className={`rounded-md border ${error ? 'border-red-400' : 'border-gray-300'} overflow-hidden`}>
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          type="button"
          onClick={() => setTab('write')}
          className={`px-4 py-2 text-sm font-medium ${tab === 'write' ? 'bg-white border-b-2 border-brand-500 text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Write
        </button>
        <button
          type="button"
          onClick={() => setTab('preview')}
          className={`px-4 py-2 text-sm font-medium ${tab === 'preview' ? 'bg-white border-b-2 border-brand-500 text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Preview
        </button>
      </div>
      {tab === 'write' ? (
        <textarea
          className="block w-full px-3 py-2 text-sm font-mono focus:outline-none resize-y"
          style={{ minHeight }}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div className="px-3 py-2 prose prose-sm max-w-none min-h-[100px]" style={{ minHeight }}>
          {value ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          ) : (
            <p className="text-gray-400 text-sm">Nothing to preview yet.</p>
          )}
        </div>
      )}
      {error && <p className="px-3 py-1 text-xs text-red-500 bg-red-50">{error}</p>}
    </div>
  )
}
