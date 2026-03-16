import React, { useContext, useEffect } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'
import { useNavigate } from 'react-router-dom'
import {
  LuStethoscope, LuCalendarDays, LuUsers, LuActivity,
  LuCheck, LuX, LuClock, LuArrowRight, LuTrendingUp
} from 'react-icons/lu'

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, gradient, sub }) => (
  <div className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-sm ${gradient}`}>
    <div className='flex items-start justify-between'>
      <div>
        <p className='text-white/70 text-sm font-medium'>{label}</p>
        <p className='text-3xl font-bold mt-1'>{value ?? '—'}</p>
        {sub && <p className='text-white/60 text-xs mt-1'>{sub}</p>}
      </div>
      <div className='w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center'>
        {icon}
      </div>
    </div>
    {/* decorative circle */}
    <div className='absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/10' />
  </div>
)

// ─── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ item }) => {
  if (item.cancelled) return (
    <span className='inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full'>
      <LuX className='w-3 h-3' /> Cancelled
    </span>
  )
  if (item.isCompleted) return (
    <span className='inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full'>
      <LuCheck className='w-3 h-3' /> Completed
    </span>
  )
  return (
    <span className='inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full'>
      <LuClock className='w-3 h-3' /> Upcoming
    </span>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const Dashboard = () => {
  const { aToken, getDashData, cancelAppointment, dashData } = useContext(AdminContext)
  const { slotDateFormat } = useContext(AppContext)
  const navigate = useNavigate()

  useEffect(() => {
    if (aToken) getDashData()
  }, [aToken])

  if (!dashData) {
    return (
      <div className='flex-1 flex items-center justify-center h-[80vh]'>
        <div className='w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin' />
      </div>
    )
  }

  const appointments = dashData.latestAppointments || []
  const completed = appointments.filter(a => a.isCompleted).length
  const cancelled = appointments.filter(a => a.cancelled).length
  const pending = appointments.filter(a => !a.isCompleted && !a.cancelled).length

  // Group by doctor for top doctors
  const docMap = {}
  appointments.forEach(a => {
    const id = a.docData?._id || a.docData?.name
    if (!id) return
    if (!docMap[id]) docMap[id] = { name: a.docData.name, image: a.docData.image, count: 0 }
    docMap[id].count++
  })
  const topDocs = Object.values(docMap).sort((a, b) => b.count - a.count).slice(0, 4)

  return (
    <div className='p-6 min-h-screen bg-gray-50/50'>
      {/* Header */}
      <div className='mb-7'>
        <h1 className='text-2xl font-bold text-gray-800'>Admin Dashboard</h1>
        <p className='text-sm text-gray-500 mt-0.5'>Welcome back — here's what's happening today</p>
      </div>

      {/* KPI cards */}
      <div className='grid grid-cols-2 xl:grid-cols-4 gap-4 mb-7'>
        <StatCard
          label='Total Doctors'
          value={dashData.doctors}
          gradient='bg-gradient-to-br from-blue-500 to-blue-600'
          icon={<LuStethoscope className='w-5 h-5 text-white' />}
          sub='Registered on platform'
        />
        <StatCard
          label='Total Appointments'
          value={dashData.appointments}
          gradient='bg-gradient-to-br from-violet-500 to-purple-600'
          icon={<LuCalendarDays className='w-5 h-5 text-white' />}
          sub='All time'
        />
        <StatCard
          label='Total Patients'
          value={dashData.patients}
          gradient='bg-gradient-to-br from-emerald-500 to-teal-600'
          icon={<LuUsers className='w-5 h-5 text-white' />}
          sub='Registered users'
        />
        <StatCard
          label='Active Today'
          value={pending}
          gradient='bg-gradient-to-br from-orange-400 to-pink-500'
          icon={<LuActivity className='w-5 h-5 text-white' />}
          sub='Upcoming appointments'
        />
      </div>

      {/* Middle row */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5'>

        {/* Latest bookings — takes 2/3 */}
        <div className='lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden'>
          <div className='flex items-center justify-between px-5 py-4 border-b border-gray-50'>
            <div className='flex items-center gap-2'>
              <div className='w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center'>
                <LuCalendarDays className='w-4 h-4 text-violet-500' />
              </div>
              <p className='font-semibold text-gray-700'>Latest Bookings</p>
            </div>
            <button
              onClick={() => navigate('/all-appointments')}
              className='text-xs text-primary hover:underline flex items-center gap-1'
            >
              View all <LuArrowRight className='w-3.5 h-3.5' />
            </button>
          </div>

          <div className='divide-y divide-gray-50'>
            {appointments.slice(0, 7).map((item, index) => (
              <div key={index} className='flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors'>
                <img
                  className='w-10 h-10 rounded-full object-cover border border-gray-200 flex-shrink-0'
                  src={item.docData.image}
                  alt=''
                />
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-semibold text-gray-800 truncate'>{item.docData.name}</p>
                  <p className='text-xs text-gray-400 mt-0.5 flex items-center gap-1'>
                    <LuCalendarDays className='w-3 h-3' />
                    {slotDateFormat(item.slotDate)} · {item.slotTime}
                  </p>
                </div>
                <div className='flex-shrink-0'>
                  <StatusBadge item={item} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className='flex flex-col gap-5'>

          {/* Appointment summary */}
          <div className='bg-white rounded-2xl border border-gray-100 shadow-sm p-5'>
            <div className='flex items-center gap-2 mb-4'>
              <div className='w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center'>
                <LuTrendingUp className='w-4 h-4 text-emerald-500' />
              </div>
              <p className='font-semibold text-gray-700'>Summary</p>
            </div>
            <div className='space-y-3'>
              {[
                { label: 'Completed', value: completed, color: 'bg-green-500', textColor: 'text-green-600' },
                { label: 'Pending', value: pending, color: 'bg-blue-500', textColor: 'text-blue-600' },
                { label: 'Cancelled', value: cancelled, color: 'bg-red-400', textColor: 'text-red-500' },
              ].map(({ label, value, color, textColor }) => (
                <div key={label}>
                  <div className='flex justify-between text-sm mb-1'>
                    <span className='text-gray-600 font-medium'>{label}</span>
                    <span className={`font-bold ${textColor}`}>{value}</span>
                  </div>
                  <div className='w-full h-2 bg-gray-100 rounded-full overflow-hidden'>
                    <div
                      className={`h-2 rounded-full ${color} transition-all`}
                      style={{ width: appointments.length ? `${Math.round((value / appointments.length) * 100)}%` : '0%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top doctors */}
          <div className='bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex-1'>
            <div className='flex items-center gap-2 mb-4'>
              <div className='w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center'>
                <LuStethoscope className='w-4 h-4 text-blue-500' />
              </div>
              <p className='font-semibold text-gray-700'>Top Doctors</p>
            </div>
            {topDocs.length === 0 ? (
              <p className='text-sm text-gray-400 text-center py-4'>No data yet.</p>
            ) : (
              <div className='space-y-3'>
                {topDocs.map((doc) => (
                  <div key={doc.name} className='flex items-center gap-3'>
                    <img src={doc.image} alt='' className='w-9 h-9 rounded-full object-cover border border-gray-200' />
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium text-gray-700 truncate'>{doc.name}</p>
                    </div>
                    <span className='text-xs text-gray-400 flex-shrink-0'>{doc.count} appt{doc.count > 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Quick actions */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        {[
          { label: 'All Appointments', path: '/all-appointments', color: 'bg-violet-50 border-violet-100 text-violet-700 hover:bg-violet-100', icon: <LuCalendarDays className='w-5 h-5' /> },
          { label: 'Add Doctor', path: '/add-doctor', color: 'bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100', icon: <LuStethoscope className='w-5 h-5' /> },
          { label: 'Doctors List', path: '/doctor-list', color: 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100', icon: <LuUsers className='w-5 h-5' /> },
          { label: 'Revenue', path: '/revenue', color: 'bg-orange-50 border-orange-100 text-orange-700 hover:bg-orange-100', icon: <LuActivity className='w-5 h-5' /> },
        ].map(({ label, path, color, icon }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border font-medium text-sm transition-colors ${color}`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default Dashboard
