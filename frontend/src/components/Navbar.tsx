import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Search, LogOut, User, PlusCircle } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (q.trim()) navigate(`/?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src="/favicon.svg" alt="OlimQ&A" className="h-7 w-7" />
          <span className="text-lg font-bold text-gray-900 hidden sm:inline">
            Olim<span className="text-brand-500">Q&A</span>
          </span>
        </Link>

        <form onSubmit={handleSearch} className="flex flex-1 max-w-xl">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              className="input pl-9 w-full"
              placeholder="Search questions..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </form>

        <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-gray-600">
          <Link to="/tags" className="btn-ghost">Tags</Link>
        </nav>

        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {user ? (
            <>
              <Link to="/ask" className="btn-primary hidden sm:inline-flex">
                <PlusCircle className="h-4 w-4" />
                Ask
              </Link>
              <Link to={`/users/${user.id}`} className="btn-ghost flex items-center gap-1">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{user.display_name}</span>
                <span className="text-xs text-brand-500 font-bold hidden sm:inline">({user.reputation})</span>
              </Link>
              <button onClick={logout} className="btn-ghost" title="Logout">
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary">Log in</Link>
              <Link to="/register" className="btn-primary">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
