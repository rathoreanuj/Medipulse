import { createContext, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import axios from 'axios'
import { io } from 'socket.io-client'

export const AppContext = createContext()

const AppContextProvider = (props) => {
    const currencySymbol = '₹'
    const backendUrl = import.meta.env.VITE_BACKEND_URL

    const [doctors, setDoctors] = useState([])
    const [token, setToken] = useState(localStorage.getItem('token') ? localStorage.getItem('token') : '')
    const [userData, setUserData] = useState(false)
    const [notifications, setNotifications] = useState([])
    const [unreadNotifications, setUnreadNotifications] = useState(0)
    const notificationSocketRef = useRef(null)

    const getDoctosData = async () => {

        try {

            const { data } = await axios.get(backendUrl + '/api/doctor/list')
            if (data.success) {
                setDoctors(data.doctors)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }

    }

    const loadUserProfileData = async () => {

        try {

            const { data } = await axios.get(backendUrl + '/api/user/get-profile', { headers: { token } })

            if (data.success) {
                setUserData(data.userData)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }

    }

    const loadNotifications = async () => {
        if (!token) {
            setNotifications([])
            setUnreadNotifications(0)
            return
        }

        try {
            const { data } = await axios.get(backendUrl + '/api/notification/user', { headers: { token } })

            if (data.success) {
                setNotifications(data.notifications || [])
                setUnreadNotifications(data.unreadCount || 0)
            }
        } catch (error) {
            console.log(error)
        }
    }

    const markNotificationAsRead = async (notificationId) => {
        if (!token || !notificationId) return

        setNotifications((prev) => prev.map((item) => (
            item._id === notificationId ? { ...item, isRead: true } : item
        )))

        try {
            const { data } = await axios.post(
                backendUrl + '/api/notification/user/mark-read',
                { notificationId },
                { headers: { token } }
            )
            if (data.success) {
                setUnreadNotifications(data.unreadCount || 0)
            }
        } catch (error) {
            console.log(error)
        }
    }

    const markAllNotificationsAsRead = async () => {
        if (!token) return

        setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })))

        try {
            const { data } = await axios.post(
                backendUrl + '/api/notification/user/mark-all-read',
                {},
                { headers: { token } }
            )
            if (data.success) {
                setUnreadNotifications(0)
            }
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        getDoctosData()
    }, [])

    useEffect(() => {
        if (token) {
            loadUserProfileData()
            loadNotifications()
        } else {
            setNotifications([])
            setUnreadNotifications(0)
        }
    }, [token])

    useEffect(() => {
        if (!token || !backendUrl) return

        const socket = io(backendUrl, { transports: ['websocket'] })
        notificationSocketRef.current = socket

        socket.on('connect', () => {
            socket.emit('join-notification-room', { token, senderType: 'user' })
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
    }, [token, backendUrl])

    const value = {
        doctors, getDoctosData,
        currencySymbol,
        backendUrl,
        token, setToken,
        userData, setUserData, loadUserProfileData,
        notifications,
        unreadNotifications,
        loadNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )

}

export default AppContextProvider