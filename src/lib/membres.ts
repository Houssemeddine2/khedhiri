// src/lib/membres.ts
// Liste fixe des 3 membres de khedhiri.me

export type Membre = {
  id: string
  nom: string
  email: string
}

export const MEMBRES: Membre[] = [
  { id: 'b6025d5f-77d5-4208-b489-bcc717ebc01c', nom: 'Houssem', email: 'houssem@khedhiri.me' },
  { id: '1a0967e9-91e0-48f6-a3da-752255274153', nom: 'Sandra',  email: 'sandra@khedhiri.me' },
  { id: '617eff77-47ed-40e0-b784-c027183c9bee', nom: 'Sarah',   email: 'sarah@khedhiri.me' },
]

export function membreById(id: string): Membre | undefined {
  return MEMBRES.find(m => m.id === id)
}
