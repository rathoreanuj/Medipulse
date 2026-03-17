import React, { useContext, useEffect, useRef, useState } from 'react'
import { assets } from '../assets/assets'
import { NavLink, useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'

// ─── Doctor Search Bar (Smart + Quick) ────────────────────────────────────────
const DoctorSearchBar = ({ doctors }) => {
  const navigate = useNavigate()
  const backendUrl = import.meta.env.VITE_BACKEND_URL
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const [smartResults, setSmartResults] = useState(null)   // null = not in smart mode
  const [smartFilters, setSmartFilters] = useState([])
  const [smartLoading, setSmartLoading] = useState(false)
  const wrapperRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
        setQuery('')
        setSmartResults(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const q = query.toLowerCase().trim()

  // Quick local results (dropdown suggestions)
  const quickResults = q.length < 2
    ? []
    : doctors.filter(doc => {
        return (
          doc.name?.toLowerCase().includes(q) ||
          doc.speciality?.toLowerCase().includes(q) ||
          doc.degree?.toLowerCase().includes(q) ||
          doc.experience?.toLowerCase().includes(q) ||
          doc.address?.line1?.toLowerCase().includes(q) ||
          doc.address?.line2?.toLowerCase().includes(q) ||
          String(doc.fees).includes(q)
        )
      }).slice(0, 5)

  const handleSelect = (docId) => {
    navigate(`/appointment/${docId}`)
    setQuery('')
    setOpen(false)
    setSmartResults(null)
  }

  // Navigate to /doctors with smart results via state
  const runSmartSearch = async () => {
    if (!query.trim()) return
    setSmartLoading(true)
    try {
      const res = await fetch(`${backendUrl}/api/user/smart-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setOpen(false)
        navigate('/doctors', { state: { smartResults: data.doctors, parsedFilters: data.parsedFilters, query: query.trim() } })
        setQuery('')
        setSmartResults(null)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSmartLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { setOpen(false); setQuery(''); setSmartResults(null) }
    if (e.key === 'Enter') {
      // If query looks like natural language (more than 2 words) → smart search
      const wordCount = query.trim().split(/\s+/).length
      if (wordCount >= 2) {
        runSmartSearch()
      } else if (quickResults.length > 0) {
        handleSelect(quickResults[0]._id)
      }
    }
  }

  return (
    <div ref={wrapperRef} className='relative hidden md:block'>
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 bg-white ${
        focused ? 'border-primary shadow-sm shadow-primary/20 w-72' : 'border-gray-200 w-56'
      }`}>
        <svg className='w-4 h-4 text-gray-400 flex-shrink-0' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
        </svg>
        <input
          type='text'
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setSmartResults(null) }}
          onFocus={() => { setFocused(true); if (query.length >= 2) setOpen(true) }}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder='Search doctors...'
          className='flex-1 outline-none bg-transparent text-sm text-gray-700 placeholder-gray-400 min-w-0'
        />
        {/* Smart Search button — appears after 2+ words typed */}
        {query.trim().split(/\s+/).length >= 2 ? (
          <button
            onMouseDown={runSmartSearch}
            disabled={smartLoading}
            title='Smart Search'
            className='flex-shrink-0 bg-primary text-white rounded px-2 py-0.5 text-[11px] font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1'
          >
            {smartLoading ? (
              <span className='w-3 h-3 border border-white border-t-transparent rounded-full animate-spin' />
            ) : (
              <svg className='w-3 h-3' fill='none' stroke='currentColor' strokeWidth='2.5' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M13 10V3L4 14h7v7l9-11h-7z' />
              </svg>
            )}
            AI
          </button>
        ) : query ? (
          <button onClick={() => { setQuery(''); setOpen(false) }} className='flex-shrink-0 text-gray-400 hover:text-gray-600'>
            <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' strokeWidth='2.5' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>
        ) : null}
      </div>

      {/* Dropdown — quick local results */}
      {open && q.length >= 2 && quickResults.length > 0 && (
        <div className='absolute top-full left-0 mt-1.5 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden'>
          <p className='px-3 pt-2.5 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider'>
            Quick results
          </p>
          {quickResults.map(doc => (
            <button
              key={doc._id}
              onMouseDown={() => handleSelect(doc._id)}
              className='w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 transition-colors text-left'
            >
              <img
                src={doc.image}
                alt={doc.name}
                className='w-9 h-9 rounded-full object-cover flex-shrink-0 border border-gray-100'
              />
              <div className='flex-1 min-w-0'>
                <p className='text-sm font-semibold text-gray-800 truncate'>{doc.name}</p>
                <p className='text-xs text-primary truncate'>{doc.speciality}</p>
                <div className='flex items-center gap-2 mt-0.5'>
                  {doc.averageRating > 0 && (
                    <span className='text-[11px] text-yellow-500 font-medium'>★ {doc.averageRating.toFixed(1)}</span>
                  )}
                  {doc.experience && (
                    <span className='text-[11px] text-gray-400'>{doc.averageRating > 0 ? '·' : ''} {doc.experience}</span>
                  )}
                  {doc.fees && (
                    <span className='text-[11px] text-gray-400'>· ₹{doc.fees}</span>
                  )}
                </div>
              </div>
              <svg className='w-4 h-4 text-gray-300 flex-shrink-0' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M9 5l7 7-7 7' />
              </svg>
            </button>
          ))}
          {/* Smart search suggestion at bottom */}
          {query.trim().split(/\s+/).length >= 2 && (
            <button
              onMouseDown={runSmartSearch}
              className='w-full px-3 py-2.5 text-sm text-primary font-medium border-t border-gray-100 hover:bg-blue-50 transition-colors text-left flex items-center gap-2'
            >
              <svg className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M13 10V3L4 14h7v7l9-11h-7z' />
              </svg>
              Smart Search for &ldquo;{query}&rdquo; →
            </button>
          )}
          <button
            onMouseDown={() => { navigate('/doctors'); setOpen(false); setQuery('') }}
            className='w-full px-3 py-2.5 text-sm text-gray-500 font-medium border-t border-gray-100 hover:bg-blue-50 transition-colors text-left'
          >
            View all doctors →
          </button>
        </div>
      )}

      {/* No quick results — show smart search prompt */}
      {open && q.length >= 2 && quickResults.length === 0 && (
        <div className='absolute top-full left-0 mt-1.5 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden'>
          <div className='px-4 py-3 text-sm text-gray-500'>No exact match — try Smart Search</div>
          <button
            onMouseDown={runSmartSearch}
            className='w-full px-3 py-2.5 text-sm text-primary font-semibold border-t border-gray-100 hover:bg-blue-50 transition-colors text-left flex items-center gap-2'
          >
            <svg className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' d='M13 10V3L4 14h7v7l9-11h-7z' />
            </svg>
            Smart Search for &ldquo;{query}&rdquo; →
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

const Navbar = () => {

  const navigate = useNavigate()

  const [showMenu, setShowMenu] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const notifRef = useRef(null)
  const userDropdownRef = useRef(null)
  const {
    token,
    setToken,
    userData,
    doctors,
    notifications,
    unreadNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useContext(AppContext)

  const getInitial = (name) => (name || 'U').trim().charAt(0).toUpperCase()
  const isDefaultBackendAvatar = (image) =>
    typeof image === 'string' &&
    image.startsWith('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAADwCAYAAAA+VemS')

  const hasUsableAvatar = !!userData?.image && !isDefaultBackendAvatar(userData.image)

  useEffect(() => {
    setAvatarError(false)
  }, [userData?.image])

  // Close notification panel when clicking outside
  useEffect(() => {
    if (!showNotifications) return
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showNotifications])

  // Close user dropdown when clicking outside
  useEffect(() => {
    if (!showUserDropdown) return
    const handleClickOutside = (e) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setShowUserDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showUserDropdown])

  const logout = () => {
    localStorage.removeItem('token')
    setToken(false)
    navigate('/login')
  }

  return (
    <div className='flex items-center justify-between text-sm py-4 mb-5 border-b border-b-[#ADADAD]'>
      <div className='flex items-center gap-4'>
        <img onClick={() => navigate('/')} className='w-44 cursor-pointer' src={assets.logo} alt="" />
        <DoctorSearchBar doctors={doctors || []} />
      </div>
      <ul className='md:flex items-start gap-5 font-medium hidden'>
        <NavLink to='/' >
          <li className='py-1'>HOME</li>
          <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>
        <NavLink to='/doctors' >
          <li className='py-1'>ALL DOCTORS</li>
          <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>
        <NavLink to='/about' >
          <li className='py-1'>ABOUT</li>
          <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>
        <NavLink to='/contact' >
          <li className='py-1'>CONTACT</li>
          <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>
      </ul>

      <div className='flex items-center gap-4 '>
        {
          token && userData
            ? (
              <>
                <div ref={notifRef} className='relative'>
                  <button
                    onClick={() => setShowNotifications((prev) => !prev)}
                    className='w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50'
                    aria-label='Notifications'
                  >
                    <svg className='w-5 h-5 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.8} d='M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .53-.21 1.04-.59 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' />
                    </svg>
                    {unreadNotifications > 0 && (
                      <span className='absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center'>
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className='absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg z-30'>
                      <div className='flex items-center justify-between px-3 py-2 border-b'>
                        <p className='font-semibold text-gray-700'>Notifications</p>
                        <button
                          onClick={markAllNotificationsAsRead}
                          className='text-xs text-primary hover:underline'
                        >
                          Mark all read
                        </button>
                      </div>

                      {notifications.length === 0 ? (
                        <p className='text-sm text-gray-500 px-3 py-4'>No notifications yet.</p>
                      ) : (
                        notifications.map((item) => (
                          <button
                            key={item._id}
                            onClick={() => {
                              markNotificationAsRead(item._id)
                              setShowNotifications(false)
                              if (item.link) navigate(item.link)
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

                <div ref={userDropdownRef} className='flex items-center gap-2 cursor-pointer relative' onClick={() => setShowUserDropdown(prev => !prev)}>
                  {(() => {
                    const isPremium = userData?.plan === 'premium' && userData?.planExpiry && new Date(userData.planExpiry) > new Date()
                    const ringClass = isPremium ? 'ring-2 ring-yellow-400 ring-offset-1' : ''
                    return hasUsableAvatar && !avatarError ? (
                      <img
                        className={`w-8 h-8 rounded-full object-cover ${ringClass}`}
                        src={userData.image}
                        alt={userData.name || 'User'}
                        onError={() => setAvatarError(true)}
                      />
                    ) : (
                      <div className={`w-8 h-8 rounded-full bg-blue-50 text-primary border flex items-center justify-center font-semibold ${isPremium ? 'border-yellow-400 ring-2 ring-yellow-400 ring-offset-1' : 'border-gray-200'}`}>
                        {getInitial(userData.name)}
                      </div>
                    )
                  })()}
                  <img className='w-2.5' src={assets.dropdown_icon} alt="" />
                  {showUserDropdown && (
                    <div className='absolute top-0 right-0 pt-14 text-base font-medium text-gray-600 z-20'>
                      <div className='min-w-48 bg-gray-50 rounded flex flex-col gap-4 p-4 shadow-lg border border-gray-200'>
                        <p onClick={() => { navigate('/my-profile'); setShowUserDropdown(false) }} className='hover:text-black cursor-pointer'>My Profile</p>
                        <p onClick={() => { navigate('/my-dashboard'); setShowUserDropdown(false) }} className='hover:text-black cursor-pointer'>My Dashboard</p>
                        <p onClick={() => { navigate('/my-appointments'); setShowUserDropdown(false) }} className='hover:text-black cursor-pointer'>My Appointments</p>
                        <p onClick={() => { navigate('/premium-plan'); setShowUserDropdown(false) }} className='hover:text-black cursor-pointer'>
                          Premium Plan
                        </p>
                        <p onClick={logout} className='hover:text-black cursor-pointer'>Logout</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )
            : <button onClick={() => navigate('/login')} className='bg-primary text-white px-8 py-3 rounded-full font-light hidden md:block'>Create account</button>
        }
        <img onClick={() => setShowMenu(true)} className='w-6 md:hidden' src={assets.menu_icon} alt="" />

        <div className={`md:hidden ${showMenu ? 'fixed w-full' : 'h-0 w-0'} right-0 top-0 bottom-0 z-20 overflow-hidden bg-white transition-all`}>
          <div className='flex items-center justify-between px-5 py-6'>
            <img src={assets.logo} className='w-36' alt="" />
            <img onClick={() => setShowMenu(false)} src={assets.cross_icon} className='w-7' alt="" />
          </div>
          <ul className='flex flex-col items-center gap-2 mt-5 px-5 text-lg font-medium'>
            <NavLink onClick={() => setShowMenu(false)} to='/'><p className='px-4 py-2 rounded full inline-block'>HOME</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/doctors' ><p className='px-4 py-2 rounded full inline-block'>ALL DOCTORS</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/about' ><p className='px-4 py-2 rounded full inline-block'>ABOUT</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/contact' ><p className='px-4 py-2 rounded full inline-block'>CONTACT</p></NavLink>
            {token && userData ? (
              <>
                <NavLink onClick={() => setShowMenu(false)} to='/my-profile'><p className='px-4 py-2 rounded full inline-block'>MY PROFILE</p></NavLink>
                <NavLink onClick={() => setShowMenu(false)} to='/my-dashboard'><p className='px-4 py-2 rounded full inline-block'>MY DASHBOARD</p></NavLink>
                <NavLink onClick={() => setShowMenu(false)} to='/my-appointments'><p className='px-4 py-2 rounded full inline-block'>MY APPOINTMENTS</p></NavLink>
                <NavLink onClick={() => setShowMenu(false)} to='/premium-plan'><p className='px-4 py-2 rounded full inline-block'>PREMIUM PLAN</p></NavLink>
                <p onClick={() => { logout(); setShowMenu(false) }} className='px-4 py-2 cursor-pointer text-red-500'>LOGOUT</p>
              </>
            ) : (
              <NavLink onClick={() => setShowMenu(false)} to='/login'><p className='px-4 py-2 bg-primary text-white rounded-full mt-2 inline-block'>Create Account</p></NavLink>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Navbar