import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register, getMe, login } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { Star, Shield } from 'lucide-react'

export default function RegisterPage() {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: '', password: '', display_name: '',
    aliyah_year: '', country_of_origin: '', is_lone_soldier: false,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register({
        email: form.email,
        password: form.password,
        display_name: form.display_name,
        aliyah_year: form.aliyah_year ? parseInt(form.aliyah_year) : undefined,
        country_of_origin: form.country_of_origin || undefined,
        is_lone_soldier: form.is_lone_soldier,
      })
      const token = await login(form.email, form.password)
      localStorage.setItem('access_token', token.access_token)
      localStorage.setItem('refresh_token', token.refresh_token)
      const user = await getMe()
      setUser(user)
      navigate('/')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg ?? 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Star className="h-10 w-10 fill-brand-500 text-brand-500 mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-gray-900">Join OlimQ&A</h1>
          <p className="text-sm text-gray-500 mt-1">Community for Olim &amp; Lone Soldiers</p>
        </div>
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Name <span className="text-red-500">*</span>
              </label>
              <input
                className="input"
                value={form.display_name}
                onChange={(e) => set('display_name', e.target.value)}
                placeholder="How others will see you"
                required
                minLength={2}
                maxLength={100}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                className="input"
                type="password"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                required
                minLength={8}
              />
            </div>

            <hr className="my-2" />
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Optional — Olim Details</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aliyah Year</label>
                <input
                  className="input"
                  type="number"
                  min={1948}
                  max={2100}
                  value={form.aliyah_year}
                  onChange={(e) => set('aliyah_year', e.target.value)}
                  placeholder="e.g. 2022"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country of Origin</label>
                <input
                  className="input"
                  value={form.country_of_origin}
                  onChange={(e) => set('country_of_origin', e.target.value)}
                  placeholder="e.g. USA"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_lone_soldier}
                onChange={(e) => set('is_lone_soldier', e.target.checked)}
                className="rounded border-gray-300 text-brand-500 focus:ring-brand-400 h-4 w-4"
              />
              <Shield className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-gray-700">I am a Lone Soldier</span>
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
