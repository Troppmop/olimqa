import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchTags } from '../api/tags'
import TagBadge from './TagBadge'

export default function Sidebar() {
  const { data: tags } = useQuery({ queryKey: ['tags'], queryFn: () => fetchTags() })

  return (
    <aside className="space-y-4">
      {/* Community info */}
      <div className="card p-4">
        <h3 className="font-semibold text-gray-800 mb-2 text-sm">About OlimQ&A</h3>
        <p className="text-xs text-gray-600 leading-relaxed">
          A community Q&A platform for <strong>Olim Chadashim</strong> (new immigrants to Israel)
          and <strong>Lone Soldiers</strong>. Ask questions, share knowledge, and help each other navigate life in Israel.
        </p>
        <Link to="/ask" className="btn-primary w-full justify-center mt-3 text-xs py-1.5">
          Ask a Question
        </Link>
      </div>

      {/* Popular tags */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800 text-sm">Popular Tags</h3>
          <Link to="/tags" className="text-xs text-brand-600 hover:underline">all tags</Link>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tags?.slice(0, 12).map((t) => (
            <div key={t.id} className="flex items-center gap-1">
              <TagBadge tag={t} />
              <span className="text-xs text-gray-400">{t.question_count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Resources */}
      <div className="card p-4">
        <h3 className="font-semibold text-gray-800 text-sm mb-2">Useful Resources</h3>
        <ul className="space-y-1 text-xs">
          <li><a href="https://www.nbn.org.il" target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">Nefesh B'Nefesh</a></li>
          <li><a href="https://www.idf.il" target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">IDF Lone Soldier Center</a></li>
          <li><a href="https://www.btl.gov.il" target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">Bituach Leumi</a></li>
          <li><a href="https://www.gov.il/en/departments/ministry_of_aliyah_and_integration" target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">Ministry of Aliyah</a></li>
        </ul>
      </div>
    </aside>
  )
}
