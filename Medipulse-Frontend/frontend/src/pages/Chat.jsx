import { useContext, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { io } from 'socket.io-client'
import axios from 'axios'
import { toast } from 'react-toastify'

const Chat = () => {
    const { appointmentId } = useParams()
    const { backendUrl, token, userData } = useContext(AppContext)
    const navigate = useNavigate()

    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [docName, setDocName] = useState('')
    const [connected, setConnected] = useState(false)
    const socketRef = useRef(null)
    const bottomRef = useRef(null)

    // Load message history
    useEffect(() => {
        if (!token) return
        const loadHistory = async () => {
            try {
                const { data } = await axios.get(
                    backendUrl + `/api/chat/messages/${appointmentId}`,
                    { headers: { token } }
                )
                if (data.success) {
                    setMessages(data.messages)
                } else {
                    toast.error(data.message)
                }
            } catch (error) {
                toast.error(error.message)
            }
        }
        loadHistory()
    }, [token, appointmentId, backendUrl])

    // Connect socket
    useEffect(() => {
        if (!token) return

        const socket = io(backendUrl, { transports: ['websocket'] })
        socketRef.current = socket

        socket.on('connect', () => {
            socket.emit('join-room', { appointmentId, token, senderType: 'user' })
        })

        socket.on('joined', () => setConnected(true))

        socket.on('new-message', (msg) => {
            setMessages((prev) => [...prev, msg])
        })

        socket.on('error', (msg) => toast.error(msg))

        return () => socket.disconnect()
    }, [token, appointmentId, backendUrl])

    // Scroll to bottom on new message
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Fetch doctor name from appointment
    useEffect(() => {
        if (!token) return
        const fetchAppointment = async () => {
            try {
                const { data } = await axios.get(backendUrl + '/api/user/appointments', { headers: { token } })
                const appt = data.appointments?.find(a => a._id === appointmentId)
                if (appt) setDocName(appt.docData.name)
            } catch (_) {}
        }
        fetchAppointment()
    }, [token, appointmentId, backendUrl])

    const sendMessage = () => {
        if (!input.trim() || !connected) return
        socketRef.current.emit('send-message', { message: input.trim() })
        setInput('')
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    return (
        <div className='max-w-2xl mx-auto px-4 py-8 flex flex-col' style={{ height: 'calc(100vh - 140px)' }}>
            {/* Header */}
            <div className='flex items-center gap-3 mb-4'>
                <button
                    onClick={() => navigate('/my-appointments')}
                    className='p-2 hover:bg-gray-100 rounded-full transition-colors'
                >
                    <svg className='w-5 h-5 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
                    </svg>
                </button>
                <div>
                    <h1 className='text-xl font-bold text-gray-800'>{docName || 'Doctor'}</h1>
                    <p className='text-xs text-gray-500'>{connected ? '🟢 Connected' : '🔴 Connecting...'}</p>
                </div>
            </div>

            {/* Messages */}
            <div className='flex-1 overflow-y-auto bg-gray-50 rounded-xl p-4 space-y-3'>
                {messages.length === 0 && (
                    <p className='text-center text-gray-400 text-sm mt-8'>No messages yet. Start the conversation!</p>
                )}
                {messages.map((msg, i) => {
                    const isMe = msg.senderType === 'user'
                    return (
                        <div key={msg._id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow-sm ${
                                isMe
                                    ? 'bg-primary text-white rounded-br-sm'
                                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                            }`}>
                                <p>{msg.message}</p>
                                <p className={`text-xs mt-1 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    )
                })}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className='mt-4 flex gap-2'>
                <input
                    type='text'
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder='Type a message...'
                    className='flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary'
                    disabled={!connected}
                />
                <button
                    onClick={sendMessage}
                    disabled={!connected || !input.trim()}
                    className='bg-primary text-white px-5 py-3 rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                >
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 19l9 2-9-18-9 18 9-2zm0 0v-8' />
                    </svg>
                </button>
            </div>
        </div>
    )
}

export default Chat
