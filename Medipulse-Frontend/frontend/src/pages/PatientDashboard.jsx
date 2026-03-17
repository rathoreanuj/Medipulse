import { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, color, sub }) => (
  <div className='bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4'>
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      {icon}
    </div>
    <div>
      <p className='text-2xl font-bold text-gray-800'>{value}</p>
      <p className='text-sm text-gray-500 mt-0.5'>{label}</p>
      {sub && <p className='text-xs text-gray-400 mt-0.5'>{sub}</p>}
    </div>
  </div>
)

// ─── Appointment row ──────────────────────────────────────────────────────────
const AppointmentRow = ({ appt, onClick }) => {
  const statusColor = appt.cancelled
    ? 'bg-red-50 text-red-600'
    : appt.isCompleted
    ? 'bg-green-50 text-green-600'
    : 'bg-blue-50 text-blue-600'
  const statusText = appt.cancelled ? 'Cancelled' : appt.isCompleted ? 'Completed' : 'Upcoming'
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const formatDate = (d) => { const p = d.split('_'); return `${p[0]} ${months[+p[1]-1]} ${p[2]}` }

  return (
    <div
      onClick={onClick}
      className='flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-transparent hover:border-gray-100'
    >
      <div className='flex items-center gap-3'>
        <img src={appt.docData?.image} alt='' className='w-10 h-10 rounded-full object-cover border border-gray-200' />
        <div>
          <p className='text-sm font-semibold text-gray-800'>{appt.docData?.name}</p>
          <p className='text-xs text-gray-400'>{appt.docData?.speciality} · {formatDate(appt.slotDate)} {appt.slotTime}</p>
        </div>
      </div>
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor}`}>{statusText}</span>
    </div>
  )
}

// ─── Main dashboard ───────────────────────────────────────────────────────────
const PatientDashboard = () => {
  const { token, userData, backendUrl } = useContext(AppContext)
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) { navigate('/login'); return }
    fetchAppointments()
  }, [token])

  const fetchAppointments = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/appointments`, { headers: { token } })
      if (data.appointments) setAppointments(data.appointments)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const total = appointments.length
  const completed = appointments.filter(a => a.isCompleted).length
  const cancelled = appointments.filter(a => a.cancelled).length
  const upcoming = appointments.filter(a => !a.isCompleted && !a.cancelled).length
  const paid = appointments.filter(a => a.payment).length
  const totalSpent = appointments.filter(a => a.payment).reduce((s, a) => s + (a.amount || 0), 0)
  const recent = [...appointments].sort((a, b) => b.date - a.date).slice(0, 5)

  // Speciality breakdown
  const specialityMap = {}
  appointments.forEach(a => {
    const sp = a.docData?.speciality || 'Other'
    specialityMap[sp] = (specialityMap[sp] || 0) + 1
  })
  const specialities = Object.entries(specialityMap).sort((a, b) => b[1] - a[1])

  // Doctor frequency
  const doctorMap = {}
  appointments.forEach(a => {
    const key = a.docData?.name || 'Unknown'
    if (!doctorMap[key]) doctorMap[key] = { name: key, image: a.docData?.image, count: 0 }
    doctorMap[key].count++
  })
  const topDoctors = Object.values(doctorMap).sort((a, b) => b.count - a.count).slice(0, 4)

  const isPremium = userData?.plan === 'premium' && userData?.planExpiry && new Date(userData.planExpiry) > new Date()

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[60vh]'>
        <div className='w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin' />
      </div>
    )
  }

  return (
    <div className='max-w-5xl mx-auto py-8 px-4'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-7'>
        <div>
          <h1 className='text-2xl font-bold text-gray-800'>
            Welcome back, {userData?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className='text-sm text-gray-500 mt-0.5'>Here's your health activity overview</p>
        </div>
        {isPremium && (
          <span className='inline-flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm font-semibold px-3 py-1.5 rounded-full'>
            <svg className='w-4 h-4 text-yellow-500' viewBox='0 0 24 24' fill='currentColor'>
              <path d='M2 19h20v2H2v-2zm2-3l3-8 5 4 5-7 3 11H4z'/>
            </svg>
            Premium Member
          </span>
        )}
      </div>

      {/* KPI cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-7'>
        <StatCard
          label='Total Appointments'
          value={total}
          color='bg-blue-50 text-blue-500'
          icon={<svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'/></svg>}
        />
        <StatCard
          label='Upcoming'
          value={upcoming}
          color='bg-indigo-50 text-indigo-500'
          icon={<svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'/></svg>}
        />
        <StatCard
          label='Completed'
          value={completed}
          color='bg-green-50 text-green-500'
          icon={<svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'/></svg>}
        />
        <StatCard
          label='Cancelled'
          value={cancelled}
          color='bg-red-50 text-red-400'
          icon={<svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'/></svg>}
        />
        <StatCard
          label='Total Spent'
          value={`₹${totalSpent.toFixed(0)}`}
          color='bg-purple-50 text-purple-500'
          sub={`${paid} paid appointments`}
          icon={<svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'/></svg>}
        />
        <StatCard
          label='Doctors Visited'
          value={topDoctors.length}
          color='bg-teal-50 text-teal-500'
          icon={<svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z'/></svg>}
        />
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-5 mb-7'>
        {/* Recent Appointments */}
        <div className='lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm'>
          <div className='flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-50'>
            <h2 className='font-semibold text-gray-700'>Recent Appointments</h2>
            <button onClick={() => navigate('/my-appointments')} className='text-xs text-primary hover:underline'>View all</button>
          </div>
          <div className='px-3 py-2 space-y-1'>
            {recent.length === 0 ? (
              <p className='text-sm text-gray-400 text-center py-6'>No appointments yet.</p>
            ) : (
              recent.map(a => (
                <AppointmentRow
                  key={a._id}
                  appt={a}
                  onClick={() => navigate('/my-appointments')}
                />
              ))
            )}
          </div>
        </div>

        {/* Speciality breakdown */}
        <div className='bg-white rounded-xl border border-gray-100 shadow-sm'>
          <div className='px-5 pt-5 pb-3 border-b border-gray-50'>
            <h2 className='font-semibold text-gray-700'>By Speciality</h2>
          </div>
          <div className='px-5 py-4 space-y-3'>
            {specialities.length === 0 ? (
              <p className='text-sm text-gray-400 text-center py-4'>No data yet.</p>
            ) : (
              specialities.map(([sp, count]) => (
                <div key={sp}>
                  <div className='flex justify-between text-sm text-gray-600 mb-1'>
                    <span className='font-medium truncate'>{sp}</span>
                    <span className='text-gray-400 ml-2 flex-shrink-0'>{count}</span>
                  </div>
                  <div className='w-full h-1.5 bg-gray-100 rounded-full overflow-hidden'>
                    <div
                      className='h-1.5 bg-primary rounded-full'
                      style={{ width: `${Math.round((count / total) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Top doctors + Quick actions */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
        {/* Top doctors */}
        <div className='bg-white rounded-xl border border-gray-100 shadow-sm p-5'>
          <h2 className='font-semibold text-gray-700 mb-4'>Most Visited Doctors</h2>
          {topDoctors.length === 0 ? (
            <p className='text-sm text-gray-400'>No appointments yet.</p>
          ) : (
            <div className='space-y-3'>
              {topDoctors.map((doc) => (
                <div key={doc.name} className='flex items-center gap-3'>
                  <img src={doc.image} alt='' className='w-9 h-9 rounded-full object-cover border border-gray-200' />
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium text-gray-700 truncate'>{doc.name}</p>
                  </div>
                  <span className='text-xs text-gray-400 flex-shrink-0'>{doc.count} visit{doc.count > 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className='bg-white rounded-xl border border-gray-100 shadow-sm p-5'>
          <h2 className='font-semibold text-gray-700 mb-4'>Quick Actions</h2>
          <div className='space-y-2'>
            {[
              { label: 'Book New Appointment', path: '/doctors', color: 'bg-primary text-white hover:bg-primary/90' },
              { label: 'View My Appointments', path: '/my-appointments', color: 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200' },
              { label: 'Edit My Profile', path: '/my-profile', color: 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200' },
              { label: isPremium ? 'Manage Premium Plan' : 'Upgrade to Premium', path: '/premium-plan', color: isPremium ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200' },
            ].map(({ label, path, color }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${color}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PatientDashboard
