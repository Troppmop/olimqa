import { ChevronUp, ChevronDown } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  score: number
  userVote: number | null
  onVote: (value: number) => void
  disabled?: boolean
  size?: 'sm' | 'md'
}

export default function VoteButtons({ score, userVote, onVote, disabled, size = 'md' }: Props) {
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-6 w-6'
  const scoreSize = size === 'sm' ? 'text-sm' : 'text-lg'

  const handleVote = (val: number) => {
    if (disabled) return
    onVote(userVote === val ? 0 : val)
  }

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <button
        onClick={() => handleVote(1)}
        disabled={disabled}
        title="Upvote"
        className={clsx(
          'rounded p-1 transition-colors',
          userVote === 1
            ? 'text-brand-500 bg-brand-50'
            : 'text-gray-400 hover:text-brand-500 hover:bg-brand-50',
          disabled && 'cursor-not-allowed opacity-40'
        )}
      >
        <ChevronUp className={iconSize} />
      </button>
      <span className={clsx('font-bold text-gray-700', scoreSize)}>{score}</span>
      <button
        onClick={() => handleVote(-1)}
        disabled={disabled}
        title="Downvote"
        className={clsx(
          'rounded p-1 transition-colors',
          userVote === -1
            ? 'text-red-500 bg-red-50'
            : 'text-gray-400 hover:text-red-500 hover:bg-red-50',
          disabled && 'cursor-not-allowed opacity-40'
        )}
      >
        <ChevronDown className={iconSize} />
      </button>
    </div>
  )
}
