import React, { useContext, useEffect } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import { useNavigate } from 'react-router-dom'
import {
  LuCalendarDays, LuUsers, LuWallet, LuActivity,
  LuCheck, LuX, LuClock, LuArrowRight, LuTrendingUp, LuStethoscope
} from 'react-icons/lu'

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, sub }) => (
  <div className='relative overflow-hidden rounded-2xl p-5 bg-blue-50 border border-blue-100 shadow-sm'>
    <div className='flex items-start justify-between'>
      <div>
        <p className='text-blue-500 text-sm font-medium'>{label}</p>
        <p className='text-3xl font-bold mt-1 text-blue-800'>{value ?? '—'}</p>
        {sub && <p className='text-blue-400 text-xs mt-1'>{sub}</p>}
      </div>
      <div className='w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center'>
        {icon}
      </div>
    </div>
    <div className='absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-blue-100/60' />
  </div>
)

// ─── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ item, onCancel, onComplete }) => {
  if (item.cancelled) return (
    <span className='inline-flex items-center gap-1 text-xs font-semibold text-red-400 bg-red-50 px-2.5 py-1 rounded-full'>
      <LuX className='w-3 h-3' /> Cancelled
    </span>
  )
  if (item.isCompleted) return (
    <span className='inline-flex items-center gap-1 text-xs font-semibold text-green-500 bg-green-50 px-2.5 py-1 rounded-full'>
      <LuCheck className='w-3 h-3' /> Completed
    </span>
  )
  return (
    <div className='flex items-center gap-2'>
      <button
        onClick={onCancel}
        className='w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors'
        title='Cancel'
      >
        <LuX className='w-3.5 h-3.5 text-red-400' />
      </button>
      <button
        onClick={onComplete}
        className='w-8 h-8 rounded-full bg-green-50 hover:bg-green-100 flex items-center justify-center transition-colors'
        title='Complete'
      >
        <LuCheck className='w-3.5 h-3.5 text-green-500' />
      </button>
    </div>
  )
}

// ─── Main DoctorDashboard ─────────────────────────────────────────────────────
const DoctorDashboard = () => {
  const { dToken, dashData, getDashData, cancelAppointment, completeAppointment } = useContext(DoctorContext)
  const { slotDateFormat, currency } = useContext(AppContext)
  const navigate = useNavigate()

  useEffect(() => {
    if (dToken) getDashData()
  }, [dToken])

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

  // Top patients by visit count
  const patientMap = {}
  appointments.forEach(a => {
    const key = a.userData?._id || a.userData?.name
    if (!key) return
    if (!patientMap[key]) patientMap[key] = { name: a.userData.name, image: a.userData.image, count: 0 }
    patientMap[key].count++
  })
  const topPatients = Object.values(patientMap).sort((a, b) => b.count - a.count).slice(0, 4)

  return (
    <div className='p-6 min-h-screen bg-gray-50/50'>
      {/* Header */}
      <div className='mb-7'>
        <h1 className='text-2xl font-bold text-gray-800'>Doctor Dashboard</h1>
        <p className='text-sm text-gray-500 mt-0.5'>Welcome back — here's your activity overview</p>
      </div>

      {/* KPI cards */}
      <div className='grid grid-cols-2 xl:grid-cols-4 gap-4 mb-7'>
        <StatCard
          label='Total Earnings'
          value={`${currency}${dashData.earnings}`}
          icon={<LuWallet className='w-5 h-5 text-blue-500' />}
          sub='From paid appointments'
        />
        <StatCard
          label='Total Appointments'
          value={dashData.appointments}
          icon={<LuCalendarDays className='w-5 h-5 text-blue-500' />}
          sub='All time'
        />
        <StatCard
          label='Total Patients'
          value={dashData.patients}
          icon={<LuUsers className='w-5 h-5 text-blue-500' />}
          sub='Unique patients'
        />
        <StatCard
          label='Pending'
          value={pending}
          icon={<LuClock className='w-5 h-5 text-blue-500' />}
          sub='Awaiting completion'
        />
      </div>

      {/* Middle row */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-5'>

        {/* Latest bookings — 2/3 width */}
        <div className='lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden'>
          <div className='flex items-center justify-between px-5 py-4 border-b border-gray-50'>
            <div className='flex items-center gap-2'>
              <div className='w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center'>
                <LuCalendarDays className='w-4 h-4 text-blue-500' />
              </div>
              <p className='font-semibold text-gray-700'>Latest Bookings</p>
            </div>
            <button
              onClick={() => navigate('/doctor-appointments')}
              className='text-xs text-primary hover:underline flex items-center gap-1'
            >
              View all <LuArrowRight className='w-3.5 h-3.5' />
            </button>
          </div>

          <div className='divide-y divide-gray-50'>
            {appointments.slice(0, 7).map((item, index) => (
              <div key={index} className='flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors'>
                {item.userData?.image ? (
                  <img className='w-10 h-10 rounded-full object-cover border border-gray-200 flex-shrink-0' src={item.userData.image} alt='' />
                ) : (
                  <div className='w-10 h-10 rounded-full bg-blue-50 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0 border border-gray-200'>
                    {item.userData?.name?.[0] || '?'}
                  </div>
                )}
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-semibold text-gray-800 truncate'>{item.userData?.name}</p>
                  <p className='text-xs text-gray-400 mt-0.5 flex items-center gap-1'>
                    <LuCalendarDays className='w-3 h-3' />
                    {slotDateFormat(item.slotDate)} · {item.slotTime}
                  </p>
                </div>
                <div className='flex-shrink-0'>
                  <StatusBadge
                    item={item}
                    onCancel={() => cancelAppointment(item._id)}
                    onComplete={() => completeAppointment(item._id)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className='flex flex-col gap-5'>

          {/* Summary */}
          <div className='bg-white rounded-2xl border border-gray-100 shadow-sm p-5'>
            <div className='flex items-center gap-2 mb-4'>
              <div className='w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center'>
                <LuTrendingUp className='w-4 h-4 text-emerald-500' />
              </div>
              <p className='font-semibold text-gray-700'>Summary</p>
            </div>
            <div className='space-y-3'>
              {[
                { label: 'Completed', value: completed, color: 'bg-green-300', textColor: 'text-green-500' },
                { label: 'Pending', value: pending, color: 'bg-blue-300', textColor: 'text-blue-500' },
                { label: 'Cancelled', value: cancelled, color: 'bg-red-300', textColor: 'text-red-400' },
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

          {/* Top Patients */}
          <div className='bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex-1'>
            <div className='flex items-center gap-2 mb-4'>
              <div className='w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center'>
                <LuUsers className='w-4 h-4 text-blue-500' />
              </div>
              <p className='font-semibold text-gray-700'>Top Patients</p>
            </div>
            {topPatients.length === 0 ? (
              <p className='text-sm text-gray-400 text-center py-4'>No data yet.</p>
            ) : (
              <div className='space-y-3'>
                {topPatients.map((p) => (
                  <div key={p.name} className='flex items-center gap-3'>
                    {p.image ? (
                      <img src={p.image} alt='' className='w-9 h-9 rounded-full object-cover border border-gray-200' />
                    ) : (
                      <div className='w-9 h-9 rounded-full bg-blue-50 text-primary flex items-center justify-center text-sm font-bold border border-gray-200'>
                        {p.name?.[0] || '?'}
                      </div>
                    )}
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium text-gray-700 truncate'>{p.name}</p>
                    </div>
                    <span className='text-xs text-gray-400 flex-shrink-0'>{p.count} visit{p.count > 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

export default DoctorDashboard
