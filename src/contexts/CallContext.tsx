'use client'

import {
  createContext, useCallback, useContext,
  useEffect, useRef, useState,
} from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { membreById, MEMBRES } from '@/lib/membres'

// ── Types ────────────────────────────────────────────────────
export type CallStatus = 'idle' | 'calling' | 'receiving' | 'active'
export type CallType   = 'audio' | 'video'

export interface PeerInfo { id: string; name: string }

type SigMsg =
  | { type: 'offer';     from: string; to: string; offer: RTCSessionDescriptionInit; callType: CallType }
  | { type: 'answer';    from: string; to: string; answer: RTCSessionDescriptionInit }
  | { type: 'candidate'; from: string; to: string; candidate: RTCIceCandidateInit | null }
  | { type: 'hangup';    from: string; to: string }
  | { type: 'reject';    from: string; to: string }

interface CallContextValue {
  status:       CallStatus
  callType:     CallType | null
  peer:         PeerInfo | null
  startedAt:    Date | null
  muted:        boolean
  videoEnabled: boolean
  localStream:  MediaStream | null
  remoteStream: MediaStream | null
  callError:    string | null
  initiateCall: (peerId: string, peerName: string, type?: CallType) => void
  acceptCall:   () => void
  rejectCall:   () => void
  hangUp:       () => void
  toggleMute:   () => void
  toggleVideo:  () => void
}

// STUN + TURN publics (openrelay.metered.ca) — indispensables pour traverser le CGNAT
// des réseaux mobiles tunisiens / portugais
const ICE: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:openrelay.metered.ca:80' },
  { urls: 'turn:openrelay.metered.ca:80',          username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:openrelay.metered.ca:443',         username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turns:openrelay.metered.ca:443',        username: 'openrelayproject', credential: 'openrelayproject' },
]

const CallContext = createContext<CallContextValue>({
  status: 'idle', callType: null, peer: null, startedAt: null,
  muted: false, videoEnabled: false, localStream: null, remoteStream: null,
  callError: null,
  initiateCall: () => {}, acceptCall: () => {}, rejectCall: () => {},
  hangUp: () => {}, toggleMute: () => {}, toggleVideo: () => {},
})

export const useCall = () => useContext(CallContext)

// ── Provider ─────────────────────────────────────────────────
export function CallProvider({ children }: { children: React.ReactNode }) {
  const [status,       setStatus]       = useState<CallStatus>('idle')
  const [callType,     setCallType]     = useState<CallType | null>(null)
  const [peer,         setPeer]         = useState<PeerInfo | null>(null)
  const [startedAt,    setStartedAt]    = useState<Date | null>(null)
  const [muted,        setMuted]        = useState(false)
  const [videoEnabled, setVideoEnabled] = useState(false)
  const [localStream,  setLocalStream]  = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [callError,    setCallError]    = useState<string | null>(null)

  const supabase      = useRef(createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  ))
  const myId          = useRef<string | null>(null)
  const pc            = useRef<RTCPeerConnection | null>(null)
  const localStreamRef  = useRef<MediaStream | null>(null)
  const sigChannel    = useRef<ReturnType<typeof supabase.current.channel> | null>(null)
  const pendingOffer  = useRef<RTCSessionDescriptionInit | null>(null)
  const pendingFrom   = useRef<string | null>(null)
  const pendingType   = useRef<CallType>('audio')
  const ringInterval  = useRef<ReturnType<typeof setInterval> | null>(null)
  const ringTimeout   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastOffer     = useRef<{ peerId: string; offer: RTCSessionDescriptionInit; callType: CallType } | null>(null)

  // ── Auth ────────────────────────────────────────────────
  useEffect(() => {
    supabase.current.auth.getUser().then(({ data }) => {
      myId.current = data.user?.id ?? null
    })
  }, [])

  // ── Canal de signalisation ──────────────────────────────
  useEffect(() => {
    const ch = supabase.current.channel('webrtc-signaling', {
      config: { broadcast: { self: false } },
    })
    ch.on('broadcast', { event: 'sig' }, ({ payload }: { payload: SigMsg }) => {
      if (payload.to !== myId.current) return
      handleSignal(payload)
    }).subscribe()
    sigChannel.current = ch
    return () => { supabase.current.removeChannel(ch) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const send = useCallback((msg: SigMsg) => {
    sigChannel.current?.send({ type: 'broadcast', event: 'sig', payload: msg })
  }, [])

  // ── Créer RTCPeerConnection ─────────────────────────────
  const createPeer = useCallback((targetId: string) => {
    const conn = new RTCPeerConnection({ iceServers: ICE })

    conn.onicecandidate = ({ candidate }) => {
      send({ type: 'candidate', from: myId.current!, to: targetId, candidate: candidate?.toJSON() ?? null })
    }

    conn.ontrack = (e) => {
      if (e.streams[0]) setRemoteStream(e.streams[0])
    }

    conn.onconnectionstatechange = () => {
      if (['disconnected', 'failed', 'closed'].includes(conn.connectionState)) cleanup()
    }

    localStreamRef.current?.getTracks().forEach(t => conn.addTrack(t, localStreamRef.current!))
    pc.current = conn
    return conn
  }, [send]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Obtenir micro / caméra ──────────────────────────────
  const getMedia = useCallback(async (type: CallType) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === 'video' ? { width: 1280, height: 720, facingMode: 'user' } : false,
    })
    localStreamRef.current = stream
    setLocalStream(stream)
    if (type === 'video') setVideoEnabled(true)
    return stream
  }, [])

  // ── Nettoyage ───────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (ringInterval.current) { clearInterval(ringInterval.current); ringInterval.current = null }
    if (ringTimeout.current)  { clearTimeout(ringTimeout.current);   ringTimeout.current  = null }
    pc.current?.close(); pc.current = null
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    localStreamRef.current = null
    setLocalStream(null)
    setRemoteStream(null)
    setStatus('idle'); setCallType(null); setPeer(null)
    setStartedAt(null); setMuted(false); setVideoEnabled(false)
    pendingOffer.current = null
    pendingFrom.current  = null
    lastOffer.current    = null
  }, [])

  // ── Gérer signaux entrants ──────────────────────────────
  const handleSignal = useCallback(async (msg: SigMsg) => {
    switch (msg.type) {

      case 'offer': {
        // Si déjà en appel, ignorer
        if (pendingOffer.current && pendingFrom.current === msg.from) break
        const membre = membreById(msg.from)
        const name = membre?.nom ?? MEMBRES.find(m => m.id === msg.from)?.nom ?? 'Quelqu\'un'
        pendingOffer.current = msg.offer
        pendingFrom.current  = msg.from
        pendingType.current  = msg.callType ?? 'audio'
        setPeer({ id: msg.from, name })
        setCallType(msg.callType ?? 'audio')
        setStatus('receiving')
        break
      }

      case 'answer': {
        if (pc.current) {
          if (ringInterval.current) { clearInterval(ringInterval.current); ringInterval.current = null }
          if (ringTimeout.current)  { clearTimeout(ringTimeout.current);   ringTimeout.current  = null }
          await pc.current.setRemoteDescription(msg.answer)
          setStatus('active')
          setStartedAt(new Date())
        }
        break
      }

      case 'candidate': {
        if (pc.current && msg.candidate) {
          await pc.current.addIceCandidate(msg.candidate).catch(() => {})
        }
        break
      }

      case 'hangup':
      case 'reject':
        cleanup()
        break
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleanup])

  // ── Actions ─────────────────────────────────────────────
  const initiateCall = useCallback(async (peerId: string, peerName: string, type: CallType = 'audio') => {
    if (status !== 'idle') return
    setCallError(null)
    try {
      await getMedia(type)
      const conn  = createPeer(peerId)
      const offer = await conn.createOffer()
      await conn.setLocalDescription(offer)
      lastOffer.current = { peerId, offer, callType: type }

      setPeer({ id: peerId, name: peerName })
      setCallType(type)
      setStatus('calling')

      send({ type: 'offer', from: myId.current!, to: peerId, offer, callType: type })

      fetch('/api/call/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: peerId, callType: type }),
      }).catch(() => {})

      ringInterval.current = setInterval(() => {
        if (lastOffer.current) {
          send({ type: 'offer', from: myId.current!, to: lastOffer.current.peerId, offer: lastOffer.current.offer, callType: lastOffer.current.callType })
        }
      }, 5000)

      ringTimeout.current = setTimeout(() => {
        if (lastOffer.current) send({ type: 'hangup', from: myId.current!, to: lastOffer.current.peerId })
        cleanup()
      }, 45_000)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('Permission') || msg.includes('NotAllowed') || msg.includes('NotFound')) {
        setCallError('Accès au microphone refusé. Autorise le micro dans les réglages du navigateur.')
      } else {
        setCallError('Impossible de démarrer l\'appel. Vérifie ta connexion.')
      }
      cleanup()
      setTimeout(() => setCallError(null), 5000)
    }
  }, [status, getMedia, createPeer, send, cleanup])

  const acceptCall = useCallback(async () => {
    if (!pendingOffer.current || !pendingFrom.current) return
    try {
      await getMedia(pendingType.current)
      const conn = createPeer(pendingFrom.current)
      await conn.setRemoteDescription(pendingOffer.current)
      const answer = await conn.createAnswer()
      await conn.setLocalDescription(answer)
      send({ type: 'answer', from: myId.current!, to: pendingFrom.current, answer })
      setStatus('active')
      setStartedAt(new Date())
    } catch {
      cleanup()
    }
  }, [getMedia, createPeer, send, cleanup])

  const rejectCall = useCallback(() => {
    if (pendingFrom.current) send({ type: 'reject', from: myId.current!, to: pendingFrom.current })
    cleanup()
  }, [send, cleanup])

  const hangUp = useCallback(() => {
    if (peer) send({ type: 'hangup', from: myId.current!, to: peer.id })
    cleanup()
  }, [peer, send, cleanup])

  const toggleMute = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled })
    setMuted(m => !m)
  }, [])

  const toggleVideo = useCallback(() => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled })
    setVideoEnabled(v => !v)
  }, [])

  return (
    <CallContext.Provider value={{
      status, callType, peer, startedAt, muted, videoEnabled,
      localStream, remoteStream, callError,
      initiateCall, acceptCall, rejectCall, hangUp, toggleMute, toggleVideo,
    }}>
      {children}
    </CallContext.Provider>
  )
}
