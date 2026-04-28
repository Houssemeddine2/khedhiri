'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { uploadMedia } from '@/app/actions/posts'
import { saveCreation } from '@/app/actions/atelier'

const COULEURS = [
  { label: 'Terracotta', value: '#C5563D' },
  { label: 'Olive',      value: '#6B7B3F' },
  { label: 'Azur',       value: '#2E5C8A' },
  { label: 'Or',         value: '#D4A04C' },
  { label: 'Rose',       value: '#E8A598' },
  { label: 'Encre',      value: '#2A1F18' },
  { label: 'Blanc',      value: '#FAF4EA' },
]

const TAILLES = [
  { label: 'Fin',   value: 3 },
  { label: 'Moyen', value: 8 },
  { label: 'Épais', value: 20 },
]

const COLORIAGES = [
  { id: 'maison',  label: 'Maison',   emoji: '🏠' },
  { id: 'chat',    label: 'Chat',     emoji: '🐱' },
  { id: 'fleur',   label: 'Fleur',    emoji: '🌸' },
  { id: 'bateau',  label: 'Bateau',   emoji: '⛵' },
  { id: 'licorne', label: 'Licorne',  emoji: '🦄' },
  { id: 'soleil',  label: 'Soleil',   emoji: '☀️' },
]

const TAMPONS = ['❤️', '⭐', '🦄', '🌈', '🌸', '🐬', '🌟', '🎀']

interface DrawingCanvasProps {
  onSaved: () => void
}

export default function DrawingCanvas({ onSaved }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawingRef = useRef(false)
  const [couleur, setCouleur] = useState('#2A1F18')
  const [taille, setTaille] = useState(8)
  const [efface, setEfface] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [coloriageActif, setColoriageActif] = useState<string | null>(null)
  const [tamponActif, setTamponActif] = useState<string | null>(null)

  // Initialise le canvas avec un fond blanc au premier montage
  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  // Charge le coloriage SVG sélectionné sur le canvas
  const initCanvas = useCallback(async (coloriageId: string | null) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    if (coloriageId) {
      const img = new window.Image()
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      img.src = `/coloriages/${coloriageId}.svg`
    }
  }, [])

  useEffect(() => { initCanvas(coloriageActif) }, [coloriageActif, initCanvas])

  function getPos(clientX: number, clientY: number) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    }
  }

  function applyCtx() {
    const ctx = canvasRef.current!.getContext('2d')!
    ctx.strokeStyle = efface ? '#FFFFFF' : couleur
    ctx.lineWidth   = efface ? taille * 3 : taille
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
    return ctx
  }

  // Place un tampon emoji à la position cliquée
  const placeTampon = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!tamponActif) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (canvas.width / rect.width)
    const y = (e.clientY - rect.top) * (canvas.height / rect.height)
    ctx.font = '40px serif'
    ctx.fillText(tamponActif, x - 20, y + 15)
  }, [tamponActif])

  function onMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (tamponActif) return  // tampons gérés par onClick
    const { x, y } = getPos(e.clientX, e.clientY)
    const ctx = applyCtx()
    ctx.beginPath()
    ctx.moveTo(x, y)
    isDrawingRef.current = true
  }

  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) return
    const { x, y } = getPos(e.clientX, e.clientY)
    const ctx = applyCtx()
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  function onMouseUp() { isDrawingRef.current = false }

  function onTouchStart(e: React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault()
    if (tamponActif) return  // tampons non gérés au toucher (simplification)
    const { x, y } = getPos(e.touches[0].clientX, e.touches[0].clientY)
    const ctx = applyCtx()
    ctx.beginPath()
    ctx.moveTo(x, y)
    isDrawingRef.current = true
  }

  function onTouchMove(e: React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault()
    if (!isDrawingRef.current) return
    const { x, y } = getPos(e.touches[0].clientX, e.touches[0].clientY)
    const ctx = applyCtx()
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  function onTouchEnd() { isDrawingRef.current = false }

  function handleClear() {
    setColoriageActif(null)
    setTamponActif(null)
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  async function handleSave() {
    const canvas = canvasRef.current!
    setIsSaving(true)
    canvas.toBlob(async (blob) => {
      if (!blob) { setIsSaving(false); return }
      try {
        const form = new FormData()
        form.append('file', blob, 'dessin.png')
        const url = await uploadMedia(form)
        await saveCreation(url)
        handleClear()
        onSaved()
      } catch (err) {
        console.error('Erreur sauvegarde dessin:', err)
      } finally {
        setIsSaving(false)
      }
    }, 'image/png')
  }

  return (
    <div className="space-y-3">
      {/* Section coloriages */}
      <div className="mb-3">
        <p className="text-xs font-semibold text-ink-soft mb-2">CHOISIR UN COLORIAGE</p>
        <div className="flex gap-2 flex-wrap">
          {COLORIAGES.map((c) => (
            <button
              key={c.id}
              onClick={() => setColoriageActif(coloriageActif === c.id ? null : c.id)}
              className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-2xl transition-colors ${
                coloriageActif === c.id
                  ? 'border-terracotta bg-sand'
                  : 'border-sand-warm hover:border-terracotta/50'
              }`}
              title={c.label}
            >
              {c.emoji}
            </button>
          ))}
          <button
            onClick={() => setColoriageActif(null)}
            className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-xs font-semibold text-ink-soft transition-colors ${
              coloriageActif === null
                ? 'border-terracotta bg-sand'
                : 'border-sand-warm hover:border-terracotta/50'
            }`}
          >
            blanc
          </button>
        </div>
      </div>

      {/* Section tampons */}
      <div className="mb-3">
        <p className="text-xs font-semibold text-ink-soft mb-2">TAMPONS</p>
        <div className="flex gap-2 flex-wrap">
          {TAMPONS.map((t) => (
            <button
              key={t}
              onClick={() => setTamponActif(tamponActif === t ? null : t)}
              className={`w-9 h-9 rounded-lg border flex items-center justify-center text-xl transition-colors ${
                tamponActif === t
                  ? 'border-terracotta bg-sand'
                  : 'border-sand-warm hover:border-terracotta/50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        {tamponActif && (
          <p className="text-xs text-terracotta mt-1">Clique sur le dessin pour placer le tampon {tamponActif}</p>
        )}
      </div>

      {/* Palette de couleurs */}
      <div className="flex items-center gap-2 flex-wrap">
        {COULEURS.map((c) => (
          <button
            key={c.value}
            onClick={() => { setCouleur(c.value); setEfface(false) }}
            aria-label={c.label}
            className={`w-9 h-9 rounded-full border-2 transition-transform active:scale-95 ${
              couleur === c.value && !efface ? 'border-ink scale-110 shadow-md' : 'border-transparent'
            }`}
            style={{
              background: c.value,
              boxShadow: c.value === '#FAF4EA' ? 'inset 0 0 0 1px #5A4A3F' : undefined,
            }}
          />
        ))}

        {/* Gomme */}
        <button
          onClick={() => setEfface(!efface)}
          aria-label={efface ? 'Pinceau' : 'Gomme'}
          className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-base transition-transform active:scale-95 ${
            efface ? 'border-ink bg-sand shadow-md' : 'border-sand-warm bg-sand'
          }`}
        >
          {efface ? '✏️' : '🧹'}
        </button>
      </div>

      {/* Taille du pinceau */}
      <div className="flex items-center gap-3">
        <span className="font-manrope text-xs text-ink-soft">Épaisseur :</span>
        {TAILLES.map((t) => (
          <button
            key={t.value}
            onClick={() => setTaille(t.value)}
            aria-label={`Pinceau ${t.label}`}
            className={`flex items-center justify-center rounded-full border-2 transition-all active:scale-95 ${
              taille === t.value ? 'border-ink' : 'border-sand-warm'
            }`}
            style={{ width: t.value * 2 + 16, height: t.value * 2 + 16, minWidth: 28, minHeight: 28 }}
          >
            <span
              className="rounded-full"
              style={{ width: t.value, height: t.value, background: couleur === '#FAF4EA' ? '#2A1F18' : couleur }}
            />
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div className="rounded-xl overflow-hidden border-2 border-sand-warm shadow-sm">
        <canvas
          ref={canvasRef}
          width={640}
          height={380}
          className="w-full touch-none"
          style={{ display: 'block', cursor: tamponActif ? 'copy' : efface ? 'cell' : 'crosshair' }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onClick={tamponActif ? placeTampon : undefined}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleClear}
          className="font-manrope text-sm text-ink-soft border border-sand-warm rounded-lg px-4 py-2 hover:border-terracotta hover:text-terracotta transition-colors"
        >
          Effacer tout
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="font-manrope text-sm font-semibold bg-terracotta text-white rounded-lg px-6 py-2 hover:bg-terracotta-deep transition-colors disabled:opacity-50 active:scale-95"
        >
          {isSaving ? 'Enregistrement…' : 'Partager mon dessin ✨'}
        </button>
      </div>
    </div>
  )
}
