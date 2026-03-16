import axios from "axios";
import { createContext, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { io } from 'socket.io-client'

export const AdminContext = createContext()

const AdminContextProvider = (props) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL

    const [aToken, setAToken] = useState(localStorage.getItem('aToken') ? localStorage.getItem('aToken') : '')

    const [appointments, setAppointments] = useState([])
    const [doctors, setDoctors] = useState([])
    const [dashData, setDashData] = useState(false)
    const [notifications, setNotifications] = useState([])
    const [unreadNotifications, setUnreadNotifications] = useState(0)
    const notificationSocketRef = useRef(null)

    const loadNotifications = async () => {
        if (!aToken) {
            setNotifications([])
            setUnreadNotifications(0)
            return
        }

        try {
            const { data } = await axios.get(backendUrl + '/api/notification/admin', { headers: { aToken } })
            if (data.success) {
                setNotifications(data.notifications || [])
                setUnreadNotifications(data.unreadCount || 0)
            }
        } catch (error) {
            console.log(error)
        }
    }

    const markNotificationAsRead = async (notificationId) => {
        if (!aToken || !notificationId) return

        setNotifications((prev) => prev.map((item) => (
            item._id === notificationId ? { ...item, isRead: true } : item
        )))

        try {
            const { data } = await axios.post(
                backendUrl + '/api/notification/admin/mark-read',
                { notificationId },
                { headers: { aToken } }
            )
            if (data.success) {
                setUnreadNotifications(data.unreadCount || 0)
            }
        } catch (error) {
            console.log(error)
        }
    }

    const markAllNotificationsAsRead = async () => {
        if (!aToken) return

        setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })))

        try {
            const { data } = await axios.post(
                backendUrl + '/api/notification/admin/mark-all-read',
                {},
                { headers: { aToken } }
            )
            if (data.success) {
                setUnreadNotifications(0)
            }
        } catch (error) {
            console.log(error)
        }
    }

    const getAllDoctors = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/admin/all-doctors', { headers: { aToken } })
            
            if (data.success) {
                setDoctors(data.doctors)
            } else {
                toast.error(data.message)
            }
        } 
        catch (error) {
            toast.error(error.message)
        }

    }

    const changeAvailability = async (docId) => {
        try {

            const { data } = await axios.post(backendUrl + '/api/admin/change-availability', { docId }, { headers: { aToken } })
            if (data.success) {
                toast.success(data.message)
                getAllDoctors()
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }


    const getAllAppointments = async () => {

        try {

            const { data } = await axios.get(backendUrl + '/api/admin/appointments', { headers: { aToken } })
            if (data.success) {
                setAppointments(data.appointments.reverse())
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }

    }

    const cancelAppointment = async (appointmentId) => {

        try {

            const { data } = await axios.post(backendUrl + '/api/admin/cancel-appointment', { appointmentId }, { headers: { aToken } })

            if (data.success) {
                getAllAppointments()
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }

    }

    const deleteDoctor = async (docId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/admin/delete-doctor', { docId }, { headers: { aToken } })
            if (data.success) {
                getAllDoctors()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    const getDashData = async () => {
        try {

            const { data } = await axios.get(backendUrl + '/api/admin/dashboard', { headers: { aToken } })

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
        if (aToken) {
            loadNotifications()
        } else {
            setNotifications([])
            setUnreadNotifications(0)
        }
    }, [aToken])

    useEffect(() => {
        if (!aToken || !backendUrl) return

        const socket = io(backendUrl, { transports: ['websocket'] })
        notificationSocketRef.current = socket

        socket.on('connect', () => {
            socket.emit('join-notification-room', { atoken: aToken, senderType: 'admin' })
        })

        socket.on('notification-created', (notification) => {
            if (!notification) return
            setNotifications((prev) => [notification, ...prev].slice(0, 30))
            setUnreadNotifications((prev) => prev + 1)
            // No toast: notifications are added silently to UI
        })

        return () => {
            socket.disconnect()
            notificationSocketRef.current = null
        }
    }, [aToken, backendUrl])

    const value = {
        aToken, setAToken,
        doctors,
        getAllDoctors,
        changeAvailability,
        deleteDoctor,
        appointments,
        getAllAppointments,
        getDashData,
        cancelAppointment,
        dashData,
        notifications,
        unreadNotifications,
        loadNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead
    }

    return (
        <AdminContext.Provider value={value}>
            {props.children}
        </AdminContext.Provider>
    )

}

export default AdminContextProvider