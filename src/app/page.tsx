import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/login/actions'

// Capitalise la première lettre d'une chaîne
function capitaliser(texte: string): string {
  if (!texte) return texte
  return texte.charAt(0).toUpperCase() + texte.slice(1)
}

// Phrase chaleureuse selon le prénom connecté
function phraseChaleureuse(prénom: string): string {
  switch (prénom) {
    case 'Houssem':
      return 'Tes filles pensent à toi. ♡'
    case 'Sandra':
      return 'Papa et Sarah t\'envoient plein d\'amour. ♡'
    case 'Sarah':
      return 'Papa et Sandra t\'adorent. ♡'
    default:
      return 'Bienvenue dans notre famille. ♡'
  }
}

export default async function AccueilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Sécurité : redirection si pas d'utilisateur (le middleware gère normalement ce cas)
  if (!user) {
    redirect('/login')
  }

  const prénom = capitaliser(user.email?.split('@')[0] ?? '')
  const phrase = phraseChaleureuse(prénom)

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-cream">
      <h1 className="font-fraunces italic text-5xl md:text-6xl text-terracotta">
        Bonjour {prénom} ♡
      </h1>

      <p className="font-caveat text-2xl text-gold mt-3">
        {phrase}
      </p>

      <div className="bg-jasmine p-6 rounded-2xl shadow-sm mt-8 max-w-sm w-full">
        <p className="font-manrope text-sm text-ink-soft">
          Tu es connecté(e) en tant que
        </p>
        <p className="font-manrope text-ink font-medium mt-1">
          {user.email}
        </p>
      </div>

      <form action={logout} className="mt-6">
        <button
          type="submit"
          className="text-ink-soft underline text-sm font-manrope hover:text-terracotta transition-colors cursor-pointer bg-transparent border-0"
        >
          Se déconnecter
        </button>
      </form>
    </main>
  )
}
