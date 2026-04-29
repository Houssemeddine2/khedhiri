import type { TutorMessage } from '@/types/tutor'

interface TuteurBubbleProps {
  message: TutorMessage
  prenom: string
}

export default function TuteurBubble({ message, prenom }: TuteurBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-olive flex items-center justify-center text-white text-sm font-bold font-manrope flex-shrink-0">
          N
        </div>
      )}
      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
        isUser
          ? 'bg-terracotta text-white rounded-br-sm'
          : 'bg-white border border-sand-warm text-ink rounded-bl-sm'
      }`}>
        {message.image_url && (
          <img
            src={message.image_url}
            alt="Photo du cahier"
            className="rounded-xl mb-2 max-h-40 object-cover"
          />
        )}
        <p className="font-manrope text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        <p className={`font-manrope text-xs mt-1 ${isUser ? 'text-white/60' : 'text-ink-soft'}`}>
          {isUser ? prenom : 'Sid Ahmed'}
        </p>
      </div>
    </div>
  )
}
