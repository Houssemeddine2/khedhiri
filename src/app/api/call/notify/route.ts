import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendNotificationToUsers } from '@/lib/push-server'
import { membreById } from '@/lib/membres'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { targetId } = await req.json() as { targetId: string }
    if (!targetId) return NextResponse.json({ error: 'targetId requis' }, { status: 400 })

    const callerProfile = await supabase
      .from('profiles')
      .select('nom')
      .eq('id', user.id)
      .single()

    const callerName = callerProfile.data?.nom ?? membreById(user.id)?.nom ?? 'Quelqu\'un'

    await sendNotificationToUsers([targetId], {
      title: `📞 Appel de ${callerName}`,
      body:  'Ouvre l\'application pour décrocher',
      url:   '/',
    })

    return NextResponse.json({ ok: true })
  } catch {
    // Pas de service role key configurée → on ignore silencieusement
    return NextResponse.json({ ok: false, reason: 'push_skipped' })
  }
}
