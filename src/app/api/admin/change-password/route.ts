import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== 'houssem@khedhiri.me') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const { userId, newPassword } = await req.json() as { userId: string; newPassword: string }

  if (!userId || !newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: 'Données invalides (min 8 caractères)' }, { status: 400 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey || serviceKey === 'REMPLACER_PAR_LA_CLE_SERVICE_ROLE') {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY non configurée' }, { status: 500 })
  }

  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
