import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import axios from 'axios'
import { toast } from 'react-toastify'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
  ],
}

const MEDIA_CONSTRAINTS = {
  video: {
    width:      { ideal: 1280, min: 640 },
    height:     { ideal: 720,  min: 480 },
    frameRate:  { ideal: 30,   min: 15  },
    facingMode: 'user',
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl:  true,
  },
}

const applyHighQualityEncoding = async (pc) => {
  const senders = pc.getSenders()
  for (const sender of senders) {
    if (sender.track?.kind !== 'video') continue
    try {
      const params = sender.getParameters()
      if (!params.encodings || params.encodings.length === 0) {
        params.encodings = [{}]
      }
      params.encodings.forEach(enc => {
        enc.maxBitrate      = 2_500_000
        enc.maxFramerate    = 30
        enc.networkPriority = 'high'
        enc.priority        = 'high'
      })
      await sender.setParameters(params)
    } catch {
      // fail silently if browser doesn't support
    }
  }
}

const COLOR_MAP = {
  blue:   'bg-blue-50 border-blue-200 text-blue-800',
  yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  green:  'bg-green-50 border-green-200 text-green-800',
  purple: 'bg-purple-50 border-purple-200 text-purple-800',
  orange: 'bg-orange-50 border-orange-200 text-orange-800',
}

const SummarySection = ({ label, color, value, items }) => (
  <div className={`rounded-lg border px-4 py-3 ${COLOR_MAP[color] || COLOR_MAP.blue}`}>
    <p className='text-xs font-bold uppercase tracking-wide opacity-70 mb-1'>{label}</p>
    {value && <p className='text-sm leading-relaxed'>{value}</p>}
    {items && items.length > 0 && (
      <ul className='list-disc list-inside space-y-0.5'>
        {items.map((it, i) => <li key={i} className='text-sm'>{it}</li>)}
      </ul>
    )}
  </div>
)

const DoctorVideoConsultation = () => {
  const { appointmentId } = useParams()
  const { backendUrl } = useContext(AppContext)
  const { dToken } = useContext(DoctorContext)
  const navigate = useNavigate()

  const [status, setStatus] = useState('connecting')
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [appointment, setAppointment] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  // Summary state
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [summaryNotes, setSummaryNotes] = useState('')
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryResult, setSummaryResult] = useState(null)
  const [summaryError, setSummaryError] = useState('')

  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const peerConnectionRef = useRef(null)
  const socketRef = useRef(null)
  const localStreamRef = useRef(null)
  const videoRoomIdRef = useRef(null)
  const timerRef = useRef(null)
  const pendingCandidatesRef = useRef([])

  const cleanup = useCallback(() => {
    clearInterval(timerRef.current)
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop())
      localStreamRef.current = null
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
  }, [])

  useEffect(() => () => cleanup(), [cleanup])

  const startTimer = () => {
    if (timerRef.current) return // already running — don't start a second interval
    timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000)
  }

  const createPeerConnection = useCallback((roomId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS)
    peerConnectionRef.current = pc

    pc.onicecandidate = ({ candidate }) => {
      if (candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', { videoRoomId: roomId, candidate })
      }
    }

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0]
      }
    }

    pc.onconnectionstatechange = () => {
      if (['failed', 'disconnected'].includes(pc.connectionState)) {
        setStatus('ended')
      }
    }

    return pc
  }, [])

  const initiateCall = useCallback(async (roomId) => {
    const pc = createPeerConnection(roomId)
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track =>
        pc.addTrack(track, localStreamRef.current)
      )
    }
    const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
    await pc.setLocalDescription(offer)
    await applyHighQualityEncoding(pc)
    socketRef.current.emit('video-offer', { videoRoomId: roomId, sdp: pc.localDescription })
  }, [createPeerConnection])

  const handleOffer = useCallback(async (sdp, roomId) => {
    const pc = createPeerConnection(roomId)
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track =>
        pc.addTrack(track, localStreamRef.current)
      )
    }
    await pc.setRemoteDescription(new RTCSessionDescription(sdp))
    for (const c of pendingCandidatesRef.current) {
      await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {})
    }
    pendingCandidatesRef.current = []
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    await applyHighQualityEncoding(pc)
    socketRef.current.emit('video-answer', { videoRoomId: roomId, sdp: pc.localDescription })
    setStatus('in-call')
    startTimer()
  }, [createPeerConnection])

  useEffect(() => {
    if (!dToken) { navigate('/'); return }

    let cancelled = false

    const setup = async () => {
      try {
        const { data } = await axios.post(
          `${backendUrl}/api/video/join-room`,
          { appointmentId },
          { headers: { dtoken: dToken } }
        )
        if (!data.success) {
          setErrorMsg(data.message)
          setStatus('error')
          return
        }
        if (cancelled) return

        videoRoomIdRef.current = data.videoRoomId
        setAppointment(data.appointment)

        let stream
        try {
          stream = await navigator.mediaDevices.getUserMedia(MEDIA_CONSTRAINTS)
        } catch {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          } catch {
            setErrorMsg('Camera / microphone access denied. Please allow permissions and try again.')
            setStatus('error')
            return
          }
        }
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }

        localStreamRef.current = stream
        if (localVideoRef.current) localVideoRef.current.srcObject = stream

        const socket = io(backendUrl, { transports: ['websocket'] })
        socketRef.current = socket

        socket.on('connect', () => {
          socket.emit('join-video-room', {
            videoRoomId: data.videoRoomId,
            appointmentId,
            dtoken: dToken,
          })
        })

        socket.on('video-joined', ({ peersInRoom }) => {
          setStatus(peersInRoom === 1 ? 'waiting' : 'in-call')
        })

        socket.on('video-peer-joined', () => {
          setStatus('in-call')
          startTimer()
          initiateCall(data.videoRoomId)
        })

        socket.on('video-offer', ({ sdp }) => {
          handleOffer(sdp, data.videoRoomId)
        })

        socket.on('video-answer', async ({ sdp }) => {
          if (peerConnectionRef.current) {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(sdp))
            for (const c of pendingCandidatesRef.current) {
              await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(c)).catch(() => {})
            }
            pendingCandidatesRef.current = []
            setStatus('in-call')
            startTimer()
          }
        })

        socket.on('ice-candidate', async ({ candidate }) => {
          if (!peerConnectionRef.current || !peerConnectionRef.current.remoteDescription) {
            pendingCandidatesRef.current.push(candidate)
            return
          }
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {})
        })

        socket.on('call-ended', () => { setStatus('ended'); cleanup() })
        socket.on('peer-disconnected', () => { toast.info('Patient disconnected'); setStatus('ended'); cleanup() })
        socket.on('video-error', (msg) => { setErrorMsg(msg); setStatus('error') })

      } catch (err) {
        if (!cancelled) { setErrorMsg(err.message); setStatus('error') }
      }
    }

    setup()
    return () => { cancelled = true }
  }, [appointmentId, backendUrl, dToken, navigate, initiateCall, handleOffer, cleanup])

  const toggleMute = () => {
    if (!localStreamRef.current) return
    const audioTrack = localStreamRef.current.getAudioTracks()[0]
    if (audioTrack) { audioTrack.enabled = !audioTrack.enabled; setIsMuted(!isMuted) }
  }

  const toggleCamera = () => {
    if (!localStreamRef.current) return
    const videoTrack = localStreamRef.current.getVideoTracks()[0]
    if (videoTrack) { videoTrack.enabled = !videoTrack.enabled; setIsCameraOff(!isCameraOff) }
  }

  const endCall = () => {
    if (socketRef.current && videoRoomIdRef.current) {
      socketRef.current.emit('end-call', { videoRoomId: videoRoomIdRef.current })
    }
    setStatus('ended')
    cleanup()
  }

  const handleGenerateSummary = async () => {
    setSummaryLoading(true)
    setSummaryError('')
    setSummaryResult(null)
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/video/generate-summary`,
        { appointmentId, notes: summaryNotes },
        { headers: { dtoken: dToken } }
      )
      if (data.success) {
        setSummaryResult(data)
        toast.success('Summary emailed to patient!')
      } else {
        setSummaryError(data.message || 'Failed to generate summary')
      }
    } catch {
      setSummaryError('Could not connect. Please try again.')
    } finally {
      setSummaryLoading(false)
    }
  }

  const formatDuration = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  if (status === 'error') {
    return (
      <div className='fixed inset-0 z-50 flex items-center justify-center px-4 bg-gray-50'>
        <div className='bg-white rounded-xl border border-red-200 p-8 max-w-md w-full text-center'>
          <div className='w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4'>
            <svg className='w-8 h-8 text-red-500' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
            </svg>
          </div>
          <h2 className='text-xl font-semibold text-gray-800 mb-2'>Unable to join call</h2>
          <p className='text-gray-500 text-sm mb-6'>{errorMsg}</p>
          <button onClick={() => navigate('/doctor-appointments')} className='bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium'>
            Back to Appointments
          </button>
        </div>
      </div>
    )
  }

  if (status === 'ended') {
    return (
      <div className='fixed inset-0 z-50 flex items-center justify-center px-4 bg-gray-50'>
        <div className='bg-white rounded-2xl border border-gray-200 shadow-xl p-8 max-w-lg w-full'>
          {/* Header */}
          <div className='text-center mb-6'>
            <div className='w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg className='w-8 h-8 text-green-500' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
              </svg>
            </div>
            <h2 className='text-xl font-bold text-gray-800'>Consultation Ended</h2>
            <p className='text-gray-500 text-sm mt-1'>Duration: <span className='font-medium text-gray-700'>{formatDuration(callDuration)}</span></p>
          </div>

          {/* Summary Form or Result */}
          {!summaryResult ? (
            <>
              <div className='bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5'>
                <div className='flex items-center gap-2 mb-2'>
                  <svg className='w-5 h-5 text-blue-500 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m1.636-6.364l.707.707M12 21v-1M12 8a4 4 0 100 8 4 4 0 000-8z' />
                  </svg>
                  <p className='text-sm font-semibold text-blue-800'>AI Consultation Summary</p>
                </div>
                <p className='text-xs text-blue-600 leading-relaxed'>Add brief notes about this consultation and AI will generate a structured summary — automatically emailed to the patient.</p>
              </div>

              <div className='mb-4'>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>Consultation Notes <span className='font-normal text-gray-400'>(optional)</span></label>
                <textarea
                  value={summaryNotes}
                  onChange={e => setSummaryNotes(e.target.value)}
                  placeholder='e.g. Patient complained of chest pain and breathlessness. Advised ECG and rest. Prescribed aspirin. Follow up in 1 week.'
                  rows={4}
                  className='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none'
                />
              </div>

              {summaryError && (
                <div className='bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-600 mb-4'>{summaryError}</div>
              )}

              <button
                onClick={handleGenerateSummary}
                disabled={summaryLoading}
                className='w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mb-3'
              >
                {summaryLoading ? (
                  <><div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />Generating & Emailing Summary…</>
                ) : (
                  <><svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 10V3L4 14h7v7l9-11h-7z' /></svg>Generate Summary & Email Patient</>
                )}
              </button>

              <button onClick={() => navigate('/doctor-appointments')} className='w-full text-sm text-gray-400 hover:text-gray-600 py-2 transition-colors'>
                Skip & go to Appointments
              </button>
            </>
          ) : (
            // Summary preview after generation
            <>
              <div className='space-y-3 mb-6 max-h-64 overflow-y-auto pr-1'>
                <SummarySection label='Chief Complaint' color='blue' value={summaryResult.summary?.chiefComplaint} />
                <SummarySection label='Assessment' color='yellow' value={summaryResult.summary?.assessment} />
                <SummarySection label='Recommendations' color='green' items={summaryResult.summary?.recommendations} />
                <SummarySection label='Medications / Advice' color='purple' items={summaryResult.summary?.medications} />
                <SummarySection label='Follow-up' color='orange' value={summaryResult.summary?.followUp} />
              </div>
              <div className='bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2 mb-5'>
                <svg className='w-4 h-4 text-green-500 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' /></svg>
                <p className='text-sm text-green-700'>Summary emailed to patient successfully.</p>
              </div>
              <button onClick={() => navigate('/doctor-appointments')} className='w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-blue-600 transition-colors'>
                Back to Appointments
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className='fixed inset-0 z-50 bg-gray-900 flex flex-col'>
      {/* Header */}
      <div className='flex items-center justify-between px-6 py-4 bg-gray-800 flex-shrink-0'>
        <div className='flex items-center gap-3'>
          {appointment?.patientImage && (
            <img src={appointment.patientImage} className='w-9 h-9 rounded-full object-cover border-2 border-gray-600' alt='' />
          )}
          <div>
            <p className='text-white font-semibold text-sm'>{appointment?.patientName || 'Patient'}</p>
            <p className='text-gray-400 text-xs'>{appointment?.slotDate} · {appointment?.slotTime}</p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          {status === 'in-call' && (
            <span className='flex items-center gap-1.5 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-medium'>
              <span className='w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse' />
              {formatDuration(callDuration)}
            </span>
          )}
          {status === 'waiting' && (
            <span className='flex items-center gap-1.5 bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-medium'>
              <span className='w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse' />
              Waiting for patient…
            </span>
          )}
          {status === 'connecting' && (
            <span className='text-gray-400 text-xs flex items-center gap-2'>
              <span className='w-4 h-4 border-2 border-gray-500 border-t-gray-300 rounded-full animate-spin' />
              Connecting…
            </span>
          )}
        </div>
      </div>

      {/* Video Area */}
      <div className='flex-1 relative bg-gray-900 overflow-hidden'>
        <video ref={remoteVideoRef} autoPlay playsInline className='w-full h-full object-cover' />

        {status !== 'in-call' && (
          <div className='absolute inset-0 flex items-center justify-center'>
            <div className='text-center'>
              <div className='w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4'>
                <svg className='w-12 h-12 text-gray-500' fill='none' stroke='currentColor' strokeWidth='1.5' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' d='M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z' />
                </svg>
              </div>
              <p className='text-gray-400 text-sm'>
                {status === 'waiting' ? 'Waiting for the patient to join…' : 'Setting up connection…'}
              </p>
            </div>
          </div>
        )}

        {/* Local PiP */}
        <div className='absolute bottom-4 right-4 w-36 h-24 md:w-48 md:h-32 rounded-xl overflow-hidden border-2 border-gray-600 shadow-xl bg-gray-800'>
          <video ref={localVideoRef} autoPlay muted playsInline className={`w-full h-full object-cover ${isCameraOff ? 'hidden' : ''}`} />
          {isCameraOff && (
            <div className='w-full h-full flex items-center justify-center bg-gray-800'>
              <svg className='w-8 h-8 text-gray-500' fill='none' stroke='currentColor' strokeWidth='1.5' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z' />
              </svg>
            </div>
          )}
          <div className='absolute bottom-1 left-1 text-white text-xs bg-black/50 px-1.5 py-0.5 rounded'>You</div>
        </div>
      </div>

      {/* Controls */}
      <div className='bg-gray-800 px-6 py-5 flex items-center justify-center gap-4 flex-shrink-0'>
        <button onClick={toggleMute} className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`} title={isMuted ? 'Unmute' : 'Mute'}>
          {isMuted ? (
            <svg className='w-5 h-5 text-white' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' d='M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z' /><path strokeLinecap='round' strokeLinejoin='round' d='M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2' /></svg>
          ) : (
            <svg className='w-5 h-5 text-white' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' d='M15.536 8.464a5 5 0 010 7.072M12 18.364a9 9 0 000-12.728M6.343 6.343a8 8 0 000 11.314' /></svg>
          )}
        </button>

        <button onClick={toggleCamera} className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isCameraOff ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`} title={isCameraOff ? 'Turn on camera' : 'Turn off camera'}>
          {isCameraOff ? (
            <svg className='w-5 h-5 text-white' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' d='M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M3 8.5A2.5 2.5 0 015.5 6h5A2.5 2.5 0 0113 8.5v7a2.5 2.5 0 01-2.5 2.5h-5A2.5 2.5 0 013 15.5v-7zM3 3l18 18' /></svg>
          ) : (
            <svg className='w-5 h-5 text-white' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' d='M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' /></svg>
          )}
        </button>

        <button onClick={endCall} className='w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-lg' title='End call'>
          <svg className='w-7 h-7 text-white' fill='currentColor' viewBox='0 0 24 24'>
            <path d='M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z' />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default DoctorVideoConsultation
