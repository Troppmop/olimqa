import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { confirmEmail } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { CheckCircle, XCircle, Loader } from 'lucide-react'

export default function ConfirmEmailPage() {
  const [params] = useSearchParams()
  const { setUser } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    const token = params.get('token')
    if (!token) { setStatus('error'); return }

    confirmEmail(token)
      .then((user) => { setUser(user); setStatus('success') })
      .catch(() => setStatus('error'))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
      <div className="card p-10 text-center max-w-md w-full">
        {status === 'loading' && (
          <>
            <Loader className="h-10 w-10 text-brand-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Confirming your email…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Email confirmed!</h1>
            <p className="text-gray-600 mb-6">Your account is now fully verified. Welcome to OlimQ&A!</p>
            <Link to="/" className="btn-primary">Go to homepage</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Link invalid or expired</h1>
            <p className="text-gray-600 mb-6">
              This confirmation link has expired or already been used. You can request a new one from your account.
            </p>
            <Link to="/" className="btn-secondary">Back to homepage</Link>
          </>
        )}
      </div>
    </div>
  )
}
