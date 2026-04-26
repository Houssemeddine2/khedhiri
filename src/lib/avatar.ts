// src/lib/avatar.ts

type AvatarInfo = {
  initiale: string
  couleurBg: string
  nom: string
}

const COULEURS: Record<string, string> = {
  houssem: 'bg-azur',
  sandra:  'bg-terracotta',
  sarah:   'bg-olive',
}

export function avatarFromEmail(email: string): AvatarInfo {
  const prenom = email.split('@')[0].toLowerCase()
  const nom    = prenom.charAt(0).toUpperCase() + prenom.slice(1)
  return {
    initiale:  nom.charAt(0),
    couleurBg: COULEURS[prenom] ?? 'bg-gold',
    nom,
  }
}

export function tempsRelatif(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min  = Math.floor(diff / 60_000)
  if (min < 1)  return 'à l\'instant'
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24)   return `il y a ${h}h`
  const j = Math.floor(h / 24)
  return j === 1 ? 'hier' : `il y a ${j} jours`
}

export function formatDuree(secondes: number): string {
  const m   = Math.floor(secondes / 60)
  const sec = Math.floor(secondes % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}
