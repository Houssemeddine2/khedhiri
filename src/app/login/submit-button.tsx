'use client'

import { useFormStatus } from 'react-dom'

export function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-terracotta hover:bg-terracotta-deep active:scale-[0.98] disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-all cursor-pointer text-[15px] shadow-sm mt-1"
    >
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40" strokeDashoffset="20" strokeLinecap="round"/>
          </svg>
          Connexion…
        </span>
      ) : (
        'Entrer dans notre monde →'
      )}
    </button>
  )
}
