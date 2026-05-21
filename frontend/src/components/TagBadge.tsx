import { Link } from 'react-router-dom'
import type { Tag } from '../types'

interface Props {
  tag: Tag
  clickable?: boolean
}

export default function TagBadge({ tag, clickable = true }: Props) {
  const style = {
    backgroundColor: tag.color + '22',
    color: tag.color,
    borderColor: tag.color + '44',
  }

  if (!clickable) {
    return (
      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium" style={style}>
        {tag.name}
      </span>
    )
  }

  return (
    <Link
      to={`/?tag=${tag.name}`}
      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium hover:opacity-80 transition-opacity"
      style={style}
    >
      {tag.name}
    </Link>
  )
}
