// src/hooks/useSpeech.ts
'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface UseSpeechReturn {
  supported: boolean
  isListening: boolean
  isSpeaking: boolean
  transcript: string
  startListening: (lang?: string) => void
  stopListening: () => void
  speak: (text: string, lang?: string) => void
  stopSpeaking: () => void
}

export function useSpeech(): UseSpeechReturn {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  const supported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) &&
    'speechSynthesis' in window

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
      window.speechSynthesis?.cancel()
    }
  }, [])

  const startListening = useCallback((lang = 'fr-FR') => {
    if (!supported) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition
    const recognition = new SR()
    recognition.lang = lang
    recognition.continuous = false
    recognition.interimResults = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      setTranscript(e.results[0][0].transcript)
    }
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    recognitionRef.current = recognition
    recognition.start()
    setTranscript('')
    setIsListening(true)
  }, [supported])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  const speak = useCallback((text: string, lang = 'fr-FR') => {
    if (!supported) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang

    // Préférer une voix masculine française
    const voices = window.speechSynthesis.getVoices()
    const voiceMale = voices.find(v => v.lang.startsWith(lang.split('-')[0]) && /male|homme|thomas|nicolas/i.test(v.name))
    const voiceLang = voices.find(v => v.lang === lang)
    if (voiceMale) utterance.voice = voiceMale
    else if (voiceLang) utterance.voice = voiceLang

    utterance.rate = 0.95
    utterance.pitch = 0.9
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }, [supported])

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel()
    setIsSpeaking(false)
  }, [])

  return { supported, isListening, isSpeaking, transcript, startListening, stopListening, speak, stopSpeaking }
}
