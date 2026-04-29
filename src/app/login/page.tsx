import { login } from './actions'
import { SubmitButton } from './submit-button'

export const metadata = {
  title: 'Connexion — les Khedhiris',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const hasError = params.error === 'identifiants'

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-5 bg-gradient-to-br from-cream via-sand to-sand-warm relative overflow-hidden">

      {/* Cercles décoratifs */}
      <div className="absolute top-[-80px] right-[-80px] w-64 h-64 rounded-full opacity-20 pointer-events-none" style={{ background: 'var(--color-terracotta)' }} aria-hidden="true" />
      <div className="absolute bottom-[-60px] left-[-60px] w-48 h-48 rounded-full opacity-15 pointer-events-none" style={{ background: 'var(--color-azur)' }} aria-hidden="true" />
      <div className="absolute top-1/3 left-[-40px] w-32 h-32 rounded-full opacity-10 pointer-events-none" style={{ background: 'var(--color-gold)' }} aria-hidden="true" />

      <div className="relative w-full max-w-sm flex flex-col items-center">

        {/* Logo */}
        <h1 className="font-fraunces italic text-6xl md:text-7xl text-terracotta leading-none mb-1 drop-shadow-sm text-center w-full">
          les Khedhiris
        </h1>
        <p className="font-caveat text-2xl text-gold mb-8 text-center">
          Notre petit monde ♡
        </p>

        {/* Formulaire de connexion */}
        <div className="w-full bg-white rounded-2xl shadow-[0_4px_24px_rgba(42,31,24,0.12)] p-8">
          <h2 className="font-fraunces text-lg text-ink mb-6 text-center">
            Bienvenue chez nous
          </h2>

          <form action={login} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs uppercase tracking-wider text-ink-soft font-semibold">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="prénom@khedhiri.me"
                autoComplete="email"
                className="bg-sand border-0 rounded-xl px-4 py-3 w-full text-ink text-[15px] placeholder:text-ink-soft/50 focus:outline-none focus:ring-2 focus:ring-terracotta/50 transition-shadow"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs uppercase tracking-wider text-ink-soft font-semibold">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                autoComplete="current-password"
                className="bg-sand border-0 rounded-xl px-4 py-3 w-full text-ink text-[15px] focus:outline-none focus:ring-2 focus:ring-terracotta/50 transition-shadow"
              />
            </div>

            {hasError && (
              <div className="flex items-center gap-2 bg-rose/30 border border-rose rounded-xl px-4 py-3" role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-terracotta flex-shrink-0" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p className="text-sm text-terracotta-deep font-medium">Email ou mot de passe incorrect</p>
              </div>
            )}

            <SubmitButton />
          </form>
        </div>

        <p className="font-caveat text-ink-soft text-xl mt-8 text-center">
          Fait par Papa avec ♡ pour Sandra et Sarah
        </p>
      </div>
    </main>
  )
}
