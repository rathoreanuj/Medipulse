import React, { useContext, useState } from 'react'
import { assets } from '../assets/assets'
import { DoctorContext } from '../context/DoctorContext'
import { AdminContext } from '../context/AdminContext'
import { useNavigate } from 'react-router-dom'

const Navbar = () => {

  const { dToken, setDToken, notifications: doctorNotifications, unreadNotifications: doctorUnread, markNotificationAsRead: markDoctorNotificationAsRead, markAllNotificationsAsRead: markAllDoctorRead } = useContext(DoctorContext)
  const { aToken, setAToken, notifications: adminNotifications, unreadNotifications: adminUnread, markNotificationAsRead: markAdminNotificationAsRead, markAllNotificationsAsRead: markAllAdminRead } = useContext(AdminContext)
  const [showNotifications, setShowNotifications] = useState(false)

  const navigate = useNavigate()

  const logout = () => {
    navigate('/')
    dToken && setDToken('')
    dToken && localStorage.removeItem('dToken')
    aToken && setAToken('')
    aToken && localStorage.removeItem('aToken')
  }

  const activeNotifications = aToken ? adminNotifications : doctorNotifications
  const activeUnread = aToken ? adminUnread : doctorUnread
  const markOneRead = aToken ? markAdminNotificationAsRead : markDoctorNotificationAsRead
  const markAllRead = aToken ? markAllAdminRead : markAllDoctorRead
  const defaultLink = aToken ? '/all-appointments' : '/doctor-appointments'

  return (
    <div className='flex justify-between items-center px-4 sm:px-10 py-3 border-b bg-white'>
      <div className='flex items-center gap-2 text-xs'>
        <img onClick={() => navigate('/')} className='w-36 sm:w-40 cursor-pointer' src={assets.admin_logo} alt="" />
        <p className='border px-2.5 py-0.5 rounded-full border-gray-500 text-gray-600'>{aToken ? 'Admin' : 'Doctor'}</p>
      </div>
      <div className='flex items-center gap-3'>
        <div className='relative'>
          <button
            onClick={() => setShowNotifications((prev) => !prev)}
            className='w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 bg-white'
            aria-label='Notifications'
          >
            <svg className='w-5 h-5 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.8} d='M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .53-.21 1.04-.59 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' />
            </svg>
            {activeUnread > 0 && (
              <span className='absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center'>
                {activeUnread > 9 ? '9+' : activeUnread}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className='absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg z-30'>
              <div className='flex items-center justify-between px-3 py-2 border-b'>
                <p className='font-semibold text-gray-700'>Notifications</p>
                <button
                  onClick={markAllRead}
                  className='text-xs text-primary hover:underline'
                >
                  Mark all read
                </button>
              </div>

              {activeNotifications?.length === 0 ? (
                <p className='text-sm text-gray-500 px-3 py-4'>No notifications yet.</p>
              ) : (
                activeNotifications?.map((item) => (
                  <button
                    key={item._id}
                    onClick={() => {
                      markOneRead(item._id)
                      setShowNotifications(false)
                      navigate(item.link || defaultLink)
                    }}
                    className={`w-full text-left px-3 py-3 border-b hover:bg-gray-50 ${!item.isRead ? 'bg-blue-50/40' : ''}`}
                  >
                    <p className='text-sm font-medium text-gray-700'>{item.title}</p>
                    <p className='text-xs text-gray-500 mt-1'>{item.message}</p>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        <button onClick={() => logout()} className='bg-primary text-white text-sm px-10 py-2 rounded-full'>Logout</button>
      </div>
    </div>
  )
}

export default Navbar