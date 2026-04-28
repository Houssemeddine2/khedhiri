import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendNotificationToUsers } from '@/lib/push-server'

export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: lettres, error } = await supabase
    .from('lettres')
    .select('id, destinataire_id, titre')
    .lte('unlock_at', new Date().toISOString())
    .eq('notif_envoyee', false)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!lettres || lettres.length === 0) {
    return NextResponse.json({ ok: true, notified: 0 })
  }

  for (const lettre of lettres) {
    await sendNotificationToUsers([lettre.destinataire_id as string], {
      title: '✉️ Une lettre de Papa vient de s\'ouvrir !',
      body: lettre.titre as string,
      url: '/lettres',
    })
    await supabase
      .from('lettres')
      .update({ notif_envoyee: true })
      .eq('id', lettre.id)
  }

  return NextResponse.json({ ok: true, notified: lettres.length })
}
