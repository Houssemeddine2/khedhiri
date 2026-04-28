// src/app/api/google-books/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()
  if (!q) return NextResponse.json({ results: [] })

  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=5&langRestrict=fr`
    const res = await fetch(url, { next: { revalidate: 0 } })
    if (!res.ok) return NextResponse.json({ results: [] })

    const data = await res.json()
    const results = ((data.items ?? []) as any[]).map(item => ({
      titre: item.volumeInfo?.title ?? '',
      auteur: ((item.volumeInfo?.authors ?? []) as string[]).join(', '),
      description: item.volumeInfo?.description ?? null,
      couverture_url: item.volumeInfo?.imageLinks?.thumbnail?.replace('http://', 'https://') ?? null,
    }))

    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ results: [] })
  }
}
