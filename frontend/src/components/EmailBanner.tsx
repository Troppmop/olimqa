import { useState } from 'react'
import { MailWarning, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { resendConfirmation } from '../api/auth'

export default function EmailBanner() {
  const { user } = useAuth()
  const [sent, setSent] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (!user || user.is_verified || dismissed) return null

  const handleResend = async () => {
    await resendConfirmation()
    setSent(true)
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="mx-auto max-w-7xl px-4 py-2 flex items-center gap-3 text-sm">
        <MailWarning className="h-4 w-4 text-amber-600 shrink-0" />
        <span className="text-amber-800 flex-1">
          Please confirm your email address to unlock all features.
        </span>
        {sent ? (
          <span className="text-green-700 font-medium">Email sent ✓</span>
        ) : (
          <button onClick={handleResend} className="text-amber-700 font-semibold underline hover:text-amber-900">
            Resend confirmation
          </button>
        )}
        <button onClick={() => setDismissed(true)} className="text-amber-500 hover:text-amber-700 ml-1">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
