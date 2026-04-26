import { login } from './actions'
import { SubmitButton } from './submit-button'

export const metadata = {
  title: 'Connexion — khedhiri.me',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const hasError = params.error === 'identifiants'

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      {/* Titre principal */}
      <h1 className="font-fraunces italic text-6xl md:text-7xl text-terracotta">
        khedhiri.me
      </h1>

      {/* Sous-titre poétique */}
      <p className="font-caveat text-2xl text-gold mt-2">
        Notre petit monde ♡
      </p>

      {/* Carte de connexion */}
      <div className="bg-jasmine rounded-2xl shadow-lg p-8 max-w-sm w-full mt-8">
        <form action={login} className="flex flex-col gap-5">
          {/* Champ email */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="email"
              className="text-xs uppercase tracking-wider text-ink-soft font-manrope font-medium"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="ton@email.me"
              autoComplete="email"
              className="bg-sand border-0 rounded-xl px-4 py-3 w-full text-ink focus:outline-none focus:ring-2 focus:ring-terracotta font-manrope"
            />
          </div>

          {/* Champ mot de passe */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="password"
              className="text-xs uppercase tracking-wider text-ink-soft font-manrope font-medium"
            >
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              autoComplete="current-password"
              className="bg-sand border-0 rounded-xl px-4 py-3 w-full text-ink focus:outline-none focus:ring-2 focus:ring-terracotta font-manrope"
            />
          </div>

          {/* Message d'erreur */}
          {hasError && (
            <p className="text-sm text-red-500 font-manrope" role="alert">
              Email ou mot de passe incorrect
            </p>
          )}

          {/* Bouton de connexion */}
          <SubmitButton />
        </form>
      </div>

      {/* Pied de page affectif */}
      <p className="font-caveat text-ink-soft text-lg mt-8">
        Pour Sandra, Sarah et Papa ♡
      </p>
    </main>
  )
}
