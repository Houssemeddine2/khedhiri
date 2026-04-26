'use client'

import { useFormStatus } from 'react-dom'

export function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-terracotta hover:bg-terracotta-deep disabled:opacity-60 text-white font-manrope font-semibold py-3 rounded-xl transition-colors cursor-pointer w-full text-base mt-1"
    >
      {pending ? 'Connexion...' : 'Entrer →'}
    </button>
  )
}
