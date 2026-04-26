import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { membreById } from '@/lib/membres'
import { conversationId } from '@/lib/conversation'
import NavBar from '@/components/NavBar'
import ChatView from '@/components/chat/ChatView'
import type { Message } from '@/types/chat'
import type { CurrentUser } from '@/types/post'

export default async function ChatPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Vérification que l'autre utilisateur est un membre connu et pas soi-même
  const autreUser = membreById(userId)
  if (!autreUser || autreUser.id === user.id) notFound()

  const convId = conversationId(user.id, userId)

  const { data: initialMessages } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', convId)
    .order('created_at', { ascending: true })
    .limit(100)

  const currentUser: CurrentUser = { id: user.id, email: user.email ?? '' }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return (
    <>
      <NavBar />
      <ChatView
        initialMessages={(initialMessages ?? []) as Message[]}
        currentUser={currentUser}
        otherUser={autreUser}
        conversationId={convId}
        supabaseUrl={supabaseUrl}
        supabaseAnonKey={supabaseAnonKey}
      />
    </>
  )
}
