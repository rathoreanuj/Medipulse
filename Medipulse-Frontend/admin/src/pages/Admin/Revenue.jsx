import React, { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import axios from 'axios'

const StatCard = ({ title, value, subtitle, icon, color }) => (
  <div className='bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-start gap-4'>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      {icon}
    </div>
    <div>
      <p className='text-2xl font-bold text-gray-800'>{value}</p>
      <p className='text-sm font-medium text-gray-700 mt-0.5'>{title}</p>
      {subtitle && <p className='text-xs text-gray-400 mt-0.5'>{subtitle}</p>}
    </div>
  </div>
)

const Revenue = () => {
  const { aToken, backendUrl } = useContext(AdminContext)
  const [stats, setStats] = useState(null)
  const [recentCommissions, setRecentCommissions] = useState([])
  const [loading, setLoading] = useState(true)

  const backUrl = backendUrl || import.meta.env.VITE_BACKEND_URL

  const loadStats = async () => {
    try {
      setLoading(true)
      const { data } = await axios.get(`${backUrl}/api/subscription/admin/revenue-stats`, {
        headers: { aToken },
      })
      if (data.success) {
        setStats(data.stats)
        setRecentCommissions(data.recentCommissions || [])
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (aToken) loadStats()
  }, [aToken])

  if (loading) {
    return (
      <div className='flex-1 flex items-center justify-center h-[80vh]'>
        <div className='flex flex-col items-center gap-3'>
          <div className='w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin' />
          <p className='text-gray-500 text-sm'>Loading revenue data…</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className='flex-1 p-6'>
        <p className='text-gray-500'>Could not load revenue statistics. Please try again.</p>
      </div>
    )
  }

  const totalEstimatedRevenue = stats.totalCommission + stats.totalSubscriptionRevenue

  return (
    <div className='flex-1 p-6 overflow-y-auto'>
      {/* Header */}
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-800'>Revenue Dashboard</h1>
        <p className='text-sm text-gray-500 mt-1'>Platform earnings overview — commissions, subscriptions & featured listings</p>
      </div>

      {/* Top KPI Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6'>
        <StatCard
          title='Total Commission Earned'
          value={`$${stats.totalCommission.toFixed(2)}`}
          subtitle={`From ${stats.paidAppointments} paid appointments`}
          color='bg-blue-50 text-blue-600'
          icon={
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
            </svg>
          }
        />
        <StatCard
          title='Subscription Revenue'
          value={`$${stats.totalSubscriptionRevenue.toFixed(2)}`}
          subtitle='Active subscriptions this month'
          color='bg-emerald-50 text-emerald-600'
          icon={
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' />
            </svg>
          }
        />
        <StatCard
          title='Gross Appointment Revenue'
          value={`$${stats.totalRevenue.toFixed(2)}`}
          subtitle='Total paid by patients'
          color='bg-purple-50 text-purple-600'
          icon={
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' />
            </svg>
          }
        />
        <StatCard
          title='Total Platform Revenue'
          value={`$${totalEstimatedRevenue.toFixed(2)}`}
          subtitle='Commission + subscriptions'
          color='bg-orange-50 text-orange-600'
          icon={
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' />
            </svg>
          }
        />
      </div>

      {/* Subscription Breakdown */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
        <div className='bg-white rounded-xl border border-gray-100 shadow-sm p-5'>
          <div className='flex items-center justify-between mb-3'>
            <h3 className='font-semibold text-gray-700'>Doctor Pro Plans</h3>
            <span className='bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full'>$11.99/mo</span>
          </div>
          <p className='text-3xl font-bold text-gray-800'>{stats.activeDoctorPro}</p>
          <p className='text-sm text-gray-400 mt-1'>Active subscribers</p>
          <p className='text-sm text-emerald-600 font-medium mt-2'>≈ ${stats.doctorSubRevenue.toFixed(2)}/mo</p>
        </div>

        <div className='bg-white rounded-xl border border-gray-100 shadow-sm p-5'>
          <div className='flex items-center justify-between mb-3'>
            <h3 className='font-semibold text-gray-700'>Featured Listings</h3>
            <span className='bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-1 rounded-full'>$5.99/wk</span>
          </div>
          <p className='text-3xl font-bold text-gray-800'>{stats.activeFeatured}</p>
          <p className='text-sm text-gray-400 mt-1'>Active featured doctors</p>
          <p className='text-sm text-emerald-600 font-medium mt-2'>≈ ${stats.featuredRevenue.toFixed(2)}/wk</p>
        </div>

        <div className='bg-white rounded-xl border border-gray-100 shadow-sm p-5'>
          <div className='flex items-center justify-between mb-3'>
            <h3 className='font-semibold text-gray-700'>Patient Premium</h3>
            <span className='bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-1 rounded-full'>$3.59/mo</span>
          </div>
          <p className='text-3xl font-bold text-gray-800'>{stats.activePremiumPatients}</p>
          <p className='text-sm text-gray-400 mt-1'>Active subscribers</p>
          <p className='text-sm text-emerald-600 font-medium mt-2'>≈ ${stats.patientSubRevenue.toFixed(2)}/mo</p>
        </div>
      </div>

      {/* Recent Commissions Table */}
      <div className='bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden'>
        <div className='px-5 py-4 border-b border-gray-100'>
          <h3 className='font-semibold text-gray-700'>Recent Commissions (10%)</h3>
          <p className='text-xs text-gray-400 mt-0.5'>Last 20 paid appointments</p>
        </div>

        {recentCommissions.length === 0 ? (
          <div className='px-5 py-8 text-center'>
            <p className='text-gray-400 text-sm'>No paid appointments yet.</p>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='bg-gray-50 text-gray-500 text-left'>
                  <th className='px-5 py-3 font-medium'>#</th>
                  <th className='px-5 py-3 font-medium'>Patient</th>
                  <th className='px-5 py-3 font-medium'>Doctor</th>
                  <th className='px-5 py-3 font-medium'>Amount</th>
                  <th className='px-5 py-3 font-medium'>Commission</th>
                  <th className='px-5 py-3 font-medium'>Date</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-50'>
                {recentCommissions.map((item, i) => (
                  <tr key={item.id} className='hover:bg-gray-50'>
                    <td className='px-5 py-3 text-gray-400'>{i + 1}</td>
                    <td className='px-5 py-3 text-gray-700'>{item.patientName || '—'}</td>
                    <td className='px-5 py-3 text-gray-700'>{item.doctorName || '—'}</td>
                    <td className='px-5 py-3 font-medium text-gray-800'>${(item.amount || 0).toFixed(2)}</td>
                    <td className='px-5 py-3 font-semibold text-emerald-600'>${(item.commission || 0).toFixed(2)}</td>
                    <td className='px-5 py-3 text-gray-400'>
                      {item.date ? new Date(item.date).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Commission Policy Note */}
      <div className='mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3'>
        <svg className='w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
        </svg>
        <p className='text-sm text-blue-700'>
          <strong>Commission Policy:</strong> MediPulse automatically retains 10% of every paid appointment as platform commission. This is calculated and stored at payment time.
        </p>
      </div>
    </div>
  )
}

export default Revenue
