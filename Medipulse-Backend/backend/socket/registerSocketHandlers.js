import jwt from 'jsonwebtoken'
import appointmentModel from '../models/appointmentModel.js'
import chatModel from '../models/chatModel.js'
import userModel from '../models/userModel.js'
import doctorModel from '../models/doctorModel.js'
import { createSystemNotification } from '../services/systemNotificationService.js'
import { sendChatNotificationEmail } from '../services/chatNotificationEmailService.js'

const registerSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    // Client joins a personal room to receive message notifications across the portal.
    socket.on('join-notification-room', async ({ token, dtoken, atoken, senderType }) => {
      try {
        if (senderType === 'user') {
          const decoded = jwt.verify(token, process.env.JWT_SECRET)
          socket.join(`user-${decoded.id}`)
          socket.emit('joined-notification-room', { room: `user-${decoded.id}` })
          return
        }

        if (senderType === 'doctor') {
          const decoded = jwt.verify(dtoken, process.env.JWT_SECRET)
          socket.join(`doctor-${decoded.id}`)
          socket.emit('joined-notification-room', { room: `doctor-${decoded.id}` })
          return
        }

        if (senderType === 'admin') {
          const decoded = jwt.verify(atoken, process.env.JWT_SECRET)
          if (decoded !== process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) {
            socket.emit('error', 'Not authorized')
            return
          }
          socket.join('admin-global')
          socket.emit('joined-notification-room', { room: 'admin-global' })
          return
        }

        socket.emit('error', 'Invalid sender type')
      } catch (error) {
        socket.emit('error', error.message)
      }
    })

    // Client joins the chat room for a specific appointment.
    socket.on('join-room', async ({ appointmentId, token, dtoken, senderType }) => {
      try {
        let senderId

        if (senderType === 'user') {
          const decoded = jwt.verify(token, process.env.JWT_SECRET)
          senderId = decoded.id
          const appointment = await appointmentModel.findById(appointmentId)
          if (!appointment || appointment.userId !== senderId) {
            socket.emit('error', 'Not authorized')
            return
          }
        } else {
          const decoded = jwt.verify(dtoken, process.env.JWT_SECRET)
          senderId = decoded.id
          const appointment = await appointmentModel.findById(appointmentId)
          if (!appointment || appointment.docId !== senderId) {
            socket.emit('error', 'Not authorized')
            return
          }
        }

        socket.data.senderId = senderId
        socket.data.senderType = senderType
        socket.data.appointmentId = appointmentId
        socket.join(appointmentId)
        socket.emit('joined', { appointmentId })
      } catch (error) {
        socket.emit('error', error.message)
      }
    })

    // Client sends a new message.
    socket.on('send-message', async ({ message }) => {
      try {
        const { senderId, senderType, appointmentId } = socket.data
        if (!senderId || !appointmentId) {
          socket.emit('error', 'Not in a room. Join a room first.')
          return
        }

        const appointment = await appointmentModel.findById(appointmentId)
        if (!appointment) {
          socket.emit('error', 'Appointment not found')
          return
        }

        const newMsg = await chatModel.create({ appointmentId, senderId, senderType, message })
        io.to(appointmentId).emit('new-message', newMsg)

        const senderName = senderType === 'user'
          ? (appointment.userData?.name || 'Patient')
          : (appointment.docData?.name || 'Doctor')

        const shortMessage = String(message || '').slice(0, 160)

        if (senderType === 'user') {
          io.to(`doctor-${appointment.docId}`).emit('chat-notification', {
            appointmentId,
            senderType,
            senderName,
            message: shortMessage,
            createdAt: newMsg.createdAt
          })

          await createSystemNotification({
            recipientType: 'doctor',
            recipientId: appointment.docId,
            type: 'chat',
            title: `New message from ${senderName}`,
            message: shortMessage,
            link: `/doctor-chat/${appointmentId}`,
            meta: { appointmentId }
          })

          const doctorRecord = appointment.docData?.email ? null : await doctorModel.findById(appointment.docId).select('email')
          const doctorEmail = appointment.docData?.email || doctorRecord?.email
          sendChatNotificationEmail({
            toEmail: doctorEmail,
            toName: appointment.docData?.name || 'Doctor',
            fromName: senderName,
            message: shortMessage,
            appointmentId
          }).catch((error) => console.log('Chat email error:', error.message))

          return
        }

        io.to(`user-${appointment.userId}`).emit('chat-notification', {
          appointmentId,
          senderType,
          senderName,
          message: shortMessage,
          createdAt: newMsg.createdAt
        })

        await createSystemNotification({
          recipientType: 'user',
          recipientId: appointment.userId,
          type: 'chat',
          title: `New message from ${senderName}`,
          message: shortMessage,
          link: `/chat/${appointmentId}`,
          meta: { appointmentId }
        })

        const userRecord = appointment.userData?.email ? null : await userModel.findById(appointment.userId).select('email')
        const userEmail = appointment.userData?.email || userRecord?.email
        sendChatNotificationEmail({
          toEmail: userEmail,
          toName: appointment.userData?.name || 'Patient',
          fromName: senderName,
          message: shortMessage,
          appointmentId
        }).catch((error) => console.log('Chat email error:', error.message))
      } catch (error) {
        socket.emit('error', error.message)
      }
    })

    // WebRTC Video Signaling.
    socket.on('join-video-room', async ({ videoRoomId, appointmentId, token, dtoken }) => {
      try {
        let callerId
        let callerRole

        if (token) {
          const decoded = jwt.verify(token, process.env.JWT_SECRET)
          callerId = decoded.id
          callerRole = 'patient'
        } else if (dtoken) {
          const decoded = jwt.verify(dtoken, process.env.JWT_SECRET)
          callerId = decoded.id
          callerRole = 'doctor'
        } else {
          socket.emit('video-error', 'Authentication required')
          return
        }

        const appointment = await appointmentModel.findById(appointmentId)
        if (!appointment || appointment.consultationType !== 'video' || appointment.videoRoomId !== videoRoomId) {
          socket.emit('video-error', 'Invalid video room')
          return
        }

        if (callerRole === 'patient' && appointment.userId !== callerId) {
          socket.emit('video-error', 'Not authorized')
          return
        }

        if (callerRole === 'doctor' && appointment.docId !== callerId) {
          socket.emit('video-error', 'Not authorized')
          return
        }

        socket.data.videoRoomId = videoRoomId
        socket.data.callerRole = callerRole
        socket.join(videoRoomId)

        const roomSockets = await io.in(videoRoomId).fetchSockets()
        const peersInRoom = roomSockets.length

        if (peersInRoom === 1) {
          socket.emit('video-joined', { initiator: false, peersInRoom: 1 })
          return
        }

        if (peersInRoom === 2) {
          socket.emit('video-joined', { initiator: false, peersInRoom: 2 })
          socket.to(videoRoomId).emit('video-peer-joined', { initiator: true })
          return
        }

        socket.emit('video-error', 'Room is full')
        socket.leave(videoRoomId)
      } catch (error) {
        socket.emit('video-error', error.message)
      }
    })

    socket.on('video-offer', ({ videoRoomId, sdp }) => {
      socket.to(videoRoomId).emit('video-offer', { sdp })
    })

    socket.on('video-answer', ({ videoRoomId, sdp }) => {
      socket.to(videoRoomId).emit('video-answer', { sdp })
    })

    socket.on('ice-candidate', ({ videoRoomId, candidate }) => {
      socket.to(videoRoomId).emit('ice-candidate', { candidate })
    })

    socket.on('end-call', ({ videoRoomId }) => {
      io.to(videoRoomId).emit('call-ended')
    })

    socket.on('disconnecting', () => {
      if (socket.data.videoRoomId) {
        socket.to(socket.data.videoRoomId).emit('peer-disconnected')
      }
    })
  })
}

export default registerSocketHandlers
