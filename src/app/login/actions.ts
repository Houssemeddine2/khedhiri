'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email')
  const password = formData.get('password')

  if (typeof email !== 'string' || !email.trim() ||
      typeof password !== 'string' || !password) {
    redirect('/login?error=identifiants')
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect('/login?error=identifiants')
  }

  redirect('/')
}

export async function logout() {
  const supabase = await createClient()
  try {
    await supabase.auth.signOut()
  } catch {
    // Session déjà expirée ou réseau indisponible — on redirige quand même
  }
  redirect('/login')
}
