import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import type { User } from '../types'
import { Shield } from 'lucide-react'

interface Props {
  user: User
  label?: string
  date?: string
}

export default function UserCard({ user, label, date }: Props) {
  return (
    <div className="flex items-start gap-2 text-xs text-gray-500">
      {label && <span>{label}</span>}
      <div className="flex flex-col">
        {date && <span>{formatDistanceToNow(new Date(date), { addSuffix: true })}</span>}
        <Link to={`/users/${user.id}`} className="flex items-center gap-1 text-brand-600 font-medium hover:underline">
          {user.display_name}
          {user.is_lone_soldier && (
            <span title="Lone Soldier"><Shield className="h-3 w-3 text-amber-500 inline" /></span>
          )}
        </Link>
        <span className="text-gray-400">{user.reputation} rep</span>
      </div>
    </div>
  )
}
