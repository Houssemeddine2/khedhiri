// src/components/quiz/CreerQuiz.tsx
'use client'

import { useState } from 'react'

const MEMBRES_ASSIGNABLES = [
  { id: '1a0967e9-91e0-48f6-a3da-752255274153', nom: 'Sandra' },
  { id: '617eff77-47ed-40e0-b784-c027183c9bee', nom: 'Sarah' },
]

type QuestionType = 'qcm' | 'vrai_faux' | 'ouverte'

interface QuestionForm {
  type: QuestionType
  contenu: string
  options: string[]
  bonne_reponse: string
}

interface Props {
  onCree: () => void
  onAnnuler: () => void
}

function QuestionFormRow({
  question,
  index,
  total,
  onChange,
  onDelete,
  onMontee,
  onDescente,
}: {
  question: QuestionForm
  index: number
  total: number
  onChange: (q: QuestionForm) => void
  onDelete: () => void
  onMontee: () => void
  onDescente: () => void
}) {
  const setOption = (i: number, val: string) => {
    const opts = [...question.options]
    opts[i] = val
    onChange({ ...question, options: opts })
  }

  const addOption = () => {
    if (question.options.length < 4) {
      onChange({ ...question, options: [...question.options, ''] })
    }
  }

  const removeOption = (i: number) => {
    const opts = question.options.filter((_, idx) => idx !== i)
    onChange({ ...question, options: opts })
  }

  return (
    <div className="bg-cream rounded-2xl p-3 border border-terracotta/10 mb-2">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-manrope text-xs text-ink-soft font-semibold flex-1">
          Question {index + 1}
        </span>
        <button
          type="button"
          onClick={onMontee}
          disabled={index === 0}
          aria-label="Monter la question"
          className="px-2 py-1 rounded-lg font-manrope text-xs text-ink-soft border border-terracotta/20 hover:bg-sand disabled:opacity-30 transition-colors"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={onDescente}
          disabled={index === total - 1}
          aria-label="Descendre la question"
          className="px-2 py-1 rounded-lg font-manrope text-xs text-ink-soft border border-terracotta/20 hover:bg-sand disabled:opacity-30 transition-colors"
        >
          ↓
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={total === 1}
          aria-label="Supprimer la question"
          className="px-2 py-1 rounded-lg font-manrope text-xs text-red-500 border border-red-200 hover:bg-red-50 disabled:opacity-30 transition-colors"
        >
          ✕
        </button>
      </div>

      <select
        value={question.type}
        onChange={e => onChange({ ...question, type: e.target.value as QuestionType, options: e.target.value === 'qcm' ? ['', ''] : [], bonne_reponse: '' })}
        aria-label={`Type de la question ${index + 1}`}
        className="w-full rounded-xl border border-terracotta/20 bg-jasmine px-3 py-2 font-manrope text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/40 mb-2"
      >
        <option value="qcm">QCM (2 à 4 options)</option>
        <option value="vrai_faux">Vrai / Faux</option>
        <option value="ouverte">Réponse ouverte</option>
      </select>

      <input
        type="text"
        value={question.contenu}
        onChange={e => onChange({ ...question, contenu: e.target.value })}
        placeholder={`Énoncé de la question ${index + 1} *`}
        aria-label={`Énoncé de la question ${index + 1}`}
        className="w-full rounded-xl border border-terracotta/20 bg-jasmine px-3 py-2 font-manrope text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/40 mb-2"
      />

      {question.type === 'qcm' && (
        <div className="flex flex-col gap-1">
          {question.options.map((opt, i) => (
            <div key={i} className="flex gap-1 items-center">
              <input
                type="text"
                value={opt}
                onChange={e => setOption(i, e.target.value)}
                placeholder={`Option ${i + 1}`}
                aria-label={`Option ${i + 1} de la question ${index + 1}`}
                className="flex-1 rounded-xl border border-terracotta/20 bg-jasmine px-3 py-1.5 font-manrope text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/40"
              />
              {question.options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  aria-label={`Supprimer l'option ${i + 1}`}
                  className="text-red-400 text-xs px-1 hover:text-red-600"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {question.options.length < 4 && (
            <button
              type="button"
              onClick={addOption}
              className="font-manrope text-xs text-terracotta underline underline-offset-2 self-start mt-1"
            >
              + Ajouter une option
            </button>
          )}
          <div className="mt-1">
            <label className="font-manrope text-xs text-ink-soft mb-1 block">
              Bonne réponse *
            </label>
            <select
              value={question.bonne_reponse}
              onChange={e => onChange({ ...question, bonne_reponse: e.target.value })}
              aria-label={`Bonne réponse de la question ${index + 1}`}
              className="w-full rounded-xl border border-terracotta/20 bg-jasmine px-3 py-2 font-manrope text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/40"
            >
              <option value="">Choisir…</option>
              {question.options.filter(o => o.trim()).map((opt, i) => (
                <option key={i} value={opt.trim()}>{opt.trim()}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {question.type === 'vrai_faux' && (
        <div className="flex gap-2">
          {['vrai', 'faux'].map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange({ ...question, bonne_reponse: opt })}
              aria-pressed={question.bonne_reponse === opt}
              className={`flex-1 py-1.5 rounded-xl font-manrope text-sm capitalize font-semibold transition-all ${
                question.bonne_reponse === opt
                  ? 'bg-terracotta text-white'
                  : 'bg-jasmine border border-terracotta/20 text-ink hover:border-terracotta/40'
              }`}
            >
              {opt === 'vrai' ? '✅ Vrai' : '❌ Faux'}
            </button>
          ))}
        </div>
      )}

      {question.type === 'ouverte' && (
        <p className="font-manrope text-xs text-ink-soft italic">
          Réponse libre — tu pourras la valider manuellement après que les membres ont joué.
        </p>
      )}
    </div>
  )
}

export default function CreerQuiz({ onCree, onAnnuler }: Props) {
  const [titre, setTitre] = useState('')
  const [description, setDescription] = useState('')
  const [assignees, setAssignees] = useState<string[]>([])
  const [questions, setQuestions] = useState<QuestionForm[]>([
    { type: 'qcm', contenu: '', options: ['', ''], bonne_reponse: '' },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const toggleAssignee = (id: string) => {
    setAssignees(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id])
  }

  const updateQuestion = (i: number, q: QuestionForm) => {
    setQuestions(prev => prev.map((old, idx) => idx === i ? q : old))
  }

  const deleteQuestion = (i: number) => {
    setQuestions(prev => prev.filter((_, idx) => idx !== i))
  }

  const moveUp = (i: number) => {
    if (i === 0) return
    setQuestions(prev => {
      const next = [...prev]
      ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
      return next
    })
  }

  const moveDown = (i: number) => {
    if (i === questions.length - 1) return
    setQuestions(prev => {
      const next = [...prev]
      ;[next[i], next[i + 1]] = [next[i + 1], next[i]]
      return next
    })
  }

  const addQuestion = () => {
    setQuestions(prev => [...prev, { type: 'qcm', contenu: '', options: ['', ''], bonne_reponse: '' }])
  }

  const canSubmit = titre.trim() && questions.length > 0 && questions.every(q => {
    if (!q.contenu.trim()) return false
    if (q.type === 'qcm') return q.options.length >= 2 && q.options.every(o => o.trim()) && q.bonne_reponse.trim()
    if (q.type === 'vrai_faux') return q.bonne_reponse === 'vrai' || q.bonne_reponse === 'faux'
    return true
  })

  const handlePublier = async () => {
    if (!canSubmit) return
    setIsLoading(true)
    setErreur(null)
    try {
      const payload = {
        titre: titre.trim(),
        description: description.trim() || undefined,
        assignees,
        questions: questions.map((q, i) => ({
          type: q.type,
          contenu: q.contenu.trim(),
          options: q.type === 'qcm' ? q.options.map(o => o.trim()) : undefined,
          bonne_reponse: q.type === 'ouverte' ? undefined : q.bonne_reponse.trim(),
          ordre: i + 1,
        })),
      }
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const { error } = await res.json()
        setErreur(error ?? 'Erreur lors de la création')
        return
      }
      onCree()
    } catch {
      setErreur('Erreur réseau')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-jasmine rounded-3xl p-4 mb-4 border-2 border-terracotta/20">
      <h2 className="font-fraunces text-lg text-ink mb-3">Créer un quiz</h2>

      <div className="flex flex-col gap-2 mb-3">
        <input
          type="text"
          value={titre}
          onChange={e => setTitre(e.target.value)}
          placeholder="Titre du quiz *"
          aria-label="Titre du quiz"
          className="w-full rounded-xl border border-terracotta/20 bg-cream px-3 py-2 font-manrope text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/40"
        />
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Description (optionnel)"
          aria-label="Description du quiz"
          className="w-full rounded-xl border border-terracotta/20 bg-cream px-3 py-2 font-manrope text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/40"
        />
      </div>

      <div className="mb-4">
        <p className="font-manrope text-xs text-ink-soft mb-2">Pour qui ?</p>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setAssignees([])}
            aria-pressed={assignees.length === 0}
            className={`px-3 py-1 rounded-full font-manrope text-xs font-semibold transition-all ${
              assignees.length === 0
                ? 'bg-terracotta text-white'
                : 'bg-cream text-ink-soft border border-terracotta/20 hover:border-terracotta/40'
            }`}
          >
            Tout le monde
          </button>
          {MEMBRES_ASSIGNABLES.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => toggleAssignee(m.id)}
              aria-pressed={assignees.includes(m.id)}
              className={`px-3 py-1 rounded-full font-manrope text-xs font-semibold transition-all ${
                assignees.includes(m.id)
                  ? 'bg-terracotta text-white'
                  : 'bg-cream text-ink-soft border border-terracotta/20 hover:border-terracotta/40'
              }`}
            >
              {m.nom}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <p className="font-manrope text-xs text-ink-soft mb-2 font-semibold">Questions</p>
        {questions.map((q, i) => (
          <QuestionFormRow
            key={i}
            question={q}
            index={i}
            total={questions.length}
            onChange={updated => updateQuestion(i, updated)}
            onDelete={() => deleteQuestion(i)}
            onMontee={() => moveUp(i)}
            onDescente={() => moveDown(i)}
          />
        ))}
        <button
          type="button"
          onClick={addQuestion}
          disabled={questions.length >= 20}
          className="font-manrope text-xs text-terracotta underline underline-offset-2 mt-1 disabled:opacity-40"
        >
          + Ajouter une question
        </button>
      </div>

      {erreur && <p role="alert" className="text-xs text-red-600 font-manrope mb-2">{erreur}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onAnnuler}
          disabled={isLoading}
          className="flex-1 py-2 rounded-full border border-terracotta/20 font-manrope text-sm text-ink-soft hover:bg-sand disabled:opacity-40 transition-colors"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={handlePublier}
          disabled={isLoading || !canSubmit}
          className="flex-1 py-2 rounded-full bg-terracotta text-white font-manrope font-semibold text-sm hover:bg-terracotta-deep disabled:opacity-40 transition-colors"
        >
          {isLoading ? 'Création…' : 'Publier 🧩'}
        </button>
      </div>
    </div>
  )
}
