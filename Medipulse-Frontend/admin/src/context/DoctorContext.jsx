import { createContext, useEffect, useRef, useState } from "react";
import axios from 'axios'
import { toast } from 'react-toastify'
import { io } from 'socket.io-client'


export const DoctorContext = createContext()

const DoctorContextProvider = (props) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL

    const [dToken, setDToken] = useState(localStorage.getItem('dToken') ? localStorage.getItem('dToken') : '')
    const [appointments, setAppointments] = useState([])
    const [dashData, setDashData] = useState(false)
    const [profileData, setProfileData] = useState(false)
    const [notifications, setNotifications] = useState([])
    const [unreadNotifications, setUnreadNotifications] = useState(0)
    const notificationSocketRef = useRef(null)

    const loadNotifications = async () => {
        if (!dToken) {
            setNotifications([])
            setUnreadNotifications(0)
            return
        }

        try {
            const { data } = await axios.get(backendUrl + '/api/notification/doctor', { headers: { dToken } })
            if (data.success) {
                setNotifications(data.notifications || [])
                setUnreadNotifications(data.unreadCount || 0)
            }
        } catch (error) {
            console.log(error)
        }
    }

    const markNotificationAsRead = async (notificationId) => {
        if (!dToken || !notificationId) return

        setNotifications((prev) => prev.map((item) => (
            item._id === notificationId ? { ...item, isRead: true } : item
        )))

        try {
            const { data } = await axios.post(
                backendUrl + '/api/notification/doctor/mark-read',
                { notificationId },
                { headers: { dToken } }
            )
            if (data.success) {
                setUnreadNotifications(data.unreadCount || 0)
            }
        } catch (error) {
            console.log(error)
        }
    }

    const markAllNotificationsAsRead = async () => {
        if (!dToken) return

        setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })))

        try {
            const { data } = await axios.post(
                backendUrl + '/api/notification/doctor/mark-all-read',
                {},
                { headers: { dToken } }
            )
            if (data.success) {
                setUnreadNotifications(0)
            }
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        if (dToken) {
            loadNotifications()
        } else {
            setNotifications([])
            setUnreadNotifications(0)
        }
    }, [dToken])

    const getAppointments = async () => {
        try {

            const { data } = await axios.get(backendUrl + '/api/doctor/appointments', { headers: { dToken } })

            if (data.success) {
                setAppointments(data.appointments.reverse())
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    const getProfileData = async () => {
        try {

            const { data } = await axios.get(backendUrl + '/api/doctor/profile', { headers: { dToken } })
            console.log(data.profileData)
            setProfileData(data.profileData)

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    const cancelAppointment = async (appointmentId) => {

        try {

            const { data } = await axios.post(backendUrl + '/api/doctor/cancel-appointment', { appointmentId }, { headers: { dToken } })

            if (data.success) {
                getAppointments()
                getDashData()
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }

    }

    const completeAppointment = async (appointmentId) => {

        try {

            const { data } = await axios.post(backendUrl + '/api/doctor/complete-appointment', { appointmentId }, { headers: { dToken } })

            if (data.success) {
                getAppointments()
                getDashData()
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }

    }

    const getDashData = async () => {
        try {

            const { data } = await axios.get(backendUrl + '/api/doctor/dashboard', { headers: { dToken } })

            if (data.success) {
                setDashData(data.dashData)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }

    }

    useEffect(() => {
        if (!dToken || !backendUrl) return

        const socket = io(backendUrl, { transports: ['websocket'] })
        notificationSocketRef.current = socket

        socket.on('connect', () => {
            socket.emit('join-notification-room', { dtoken: dToken, senderType: 'doctor' })
        })

        socket.on('chat-notification', (_payload) => {
            // handled silently — notification-created covers the list update
        })

        socket.on('notification-created', (notification) => {
            if (!notification) return
            setNotifications((prev) => [notification, ...prev].slice(0, 30))
            setUnreadNotifications((prev) => prev + 1)
        })

        return () => {
            socket.disconnect()
            notificationSocketRef.current = null
        }
    }, [dToken, backendUrl])

    const value = {
        dToken, setDToken, backendUrl,
        appointments,
        getAppointments,
        cancelAppointment,
        completeAppointment,
        dashData, getDashData,
        profileData, setProfileData,
        getProfileData,
        notifications,
        unreadNotifications,
        loadNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
    }

    return (
        <DoctorContext.Provider value={value}>
            {props.children}
        </DoctorContext.Provider>
    )


}

export default DoctorContextProvider