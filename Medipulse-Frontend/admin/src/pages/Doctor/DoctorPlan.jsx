import React, { useContext, useEffect, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import axios from 'axios'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

// ─── Payment form component ───────────────────────────────────────────────────
const PaymentForm = ({ clientSecret, onSuccess, onCancel, label }) => {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setProcessing(true)
    setError('')

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: elements.getElement(CardElement) },
    })

    if (result.error) {
      setError(result.error.message)
      setProcessing(false)
    } else if (result.paymentIntent?.status === 'succeeded') {
      onSuccess(result.paymentIntent.id)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='p-3 border border-gray-200 rounded-lg bg-gray-50'>
        <CardElement options={{ style: { base: { fontSize: '15px', color: '#374151' } } }} />
      </div>
      {error && <p className='text-sm text-red-500'>{error}</p>}
      <div className='flex gap-3'>
        <button
          type='submit'
          disabled={!stripe || processing}
          className='flex-1 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors'
        >
          {processing ? 'Processing…' : `Pay & Activate ${label}`}
        </button>
        <button type='button' onClick={onCancel} className='px-4 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors'>
          Cancel
        </button>
      </div>
    </form>
  )
}

// ─── Main DoctorPlan page ─────────────────────────────────────────────────────
const DoctorPlanInner = () => {
  const { dToken, backendUrl } = useContext(DoctorContext)
  const backUrl = backendUrl || import.meta.env.VITE_BACKEND_URL

  const [planStatus, setPlanStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeModal, setActiveModal] = useState(null) // 'pro' | 'featured'
  const [clientSecret, setClientSecret] = useState('')
  const [paymentIntentId, setPaymentIntentId] = useState('')

  const loadPlanStatus = async () => {
    try {
      setLoading(true)
      const { data } = await axios.post(
        `${backUrl}/api/subscription/doctor/plan-status`,
        {},
        { headers: { dToken } }
      )
      if (data.success) setPlanStatus(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (dToken) loadPlanStatus()
  }, [dToken])

  const initiatePayment = async (type, label) => {
    try {
      const { data } = await axios.post(
        `${backUrl}/api/subscription/doctor/create-payment`,
        { type },
        { headers: { dToken } }
      )
      if (data.success) {
        setClientSecret(data.clientSecret)
        setPaymentIntentId(data.paymentIntentId)
        setActiveModal({ type, label })
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handlePaymentSuccess = async (intentId) => {
    try {
      const { data } = await axios.post(`${backUrl}/api/subscription/verify-payment`, {
        paymentIntentId: intentId,
      })
      if (data.success) {
        setActiveModal(null)
        setClientSecret('')
        await loadPlanStatus()
      }
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) {
    return (
      <div className='flex-1 flex items-center justify-center h-[80vh]'>
        <div className='w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin' />
      </div>
    )
  }

  const isPro = planStatus?.plan === 'pro'
  const isFeatured = planStatus?.isFeatured
  const proExpiry = planStatus?.planExpiry ? new Date(planStatus.planExpiry).toLocaleDateString() : null
  const featuredExpiry = planStatus?.featuredUntil ? new Date(planStatus.featuredUntil).toLocaleDateString() : null

  return (
    <div className='flex-1 p-6 overflow-y-auto'>
      {/* Header */}
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-800'>My Plan</h1>
        <p className='text-sm text-gray-500 mt-1'>Manage your subscription and featured listing</p>
      </div>

      {/* Current Status */}
      <div className='bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6 flex flex-wrap items-center gap-4'>
        <div>
          <p className='text-xs text-gray-400 uppercase tracking-wide'>Current Plan</p>
          <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-semibold ${isPro ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}>
            {isPro ? '✨ Pro' : 'Free'}
          </span>
          {isPro && proExpiry && <p className='text-xs text-gray-400 mt-1'>Renews: {proExpiry}</p>}
        </div>
        <div className='w-px h-10 bg-gray-100 hidden sm:block' />
        <div>
          <p className='text-xs text-gray-400 uppercase tracking-wide'>Featured Listing</p>
          <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-semibold ${isFeatured ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
            {isFeatured ? '⭐ Active' : 'Not Featured'}
          </span>
          {isFeatured && featuredExpiry && <p className='text-xs text-gray-400 mt-1'>Until: {featuredExpiry}</p>}
        </div>
      </div>

      {/* Plan Comparison */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-5 mb-6'>
        {/* Free Plan */}
        <div className={`bg-white rounded-xl border-2 shadow-sm p-6 ${!isPro ? 'border-primary' : 'border-gray-200'}`}>
          {!isPro && <span className='inline-block mb-3 text-xs bg-primary/10 text-primary font-semibold px-2 py-1 rounded-full'>Current Plan</span>}
          <h2 className='text-xl font-bold text-gray-800 mb-1'>Free</h2>
          <p className='text-3xl font-bold text-gray-800 mb-4'>₹0 <span className='text-sm font-normal text-gray-400'>/month</span></p>
          <ul className='space-y-2 text-sm text-gray-600'>
            {['Up to 10 appointments/month', 'Basic profile listing', 'Standard search position', 'Chat with patients', 'Dashboard & reports'].map(f => (
              <li key={f} className='flex items-center gap-2'>
                <svg className='w-4 h-4 text-green-500 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                </svg>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Pro Plan */}
        <div className={`rounded-xl border-2 shadow-sm p-6 ${isPro ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white'}`}>
          {isPro && <span className='inline-block mb-3 text-xs bg-primary text-white font-semibold px-2 py-1 rounded-full'>Active</span>}
          <h2 className='text-xl font-bold text-gray-800 mb-1'>Pro ✨</h2>
          <p className='text-3xl font-bold text-gray-800 mb-4'>₹999 <span className='text-sm font-normal text-gray-400'>/month</span></p>
          <ul className='space-y-2 text-sm text-gray-600 mb-6'>
            {[
              'Unlimited appointments',
              'Priority listing in search results',
              'Pro badge on your profile',
              'Advanced analytics & earnings',
              'All Free features included',
            ].map(f => (
              <li key={f} className='flex items-center gap-2'>
                <svg className='w-4 h-4 text-primary flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                </svg>
                {f}
              </li>
            ))}
          </ul>
          {!isPro && (
            <button
              onClick={() => initiatePayment('doctor_pro', 'Pro Plan')}
              className='w-full py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors'
            >
              Upgrade to Pro — $11.99
            </button>
          )}
          {isPro && (
            <button
              onClick={() => initiatePayment('doctor_pro', 'Pro Plan')}
              className='w-full py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors'
            >
              Renew Pro Plan
            </button>
          )}
        </div>
      </div>

      {/* Featured Listing Card */}
      <div className='bg-white rounded-xl border-2 border-yellow-300 shadow-sm p-6'>
        <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
          <div className='flex-1'>
            <div className='flex items-center gap-2 mb-2'>
              <span className='text-2xl'>⭐</span>
              <h2 className='text-lg font-bold text-gray-800'>Featured Listing</h2>
              <span className='text-xs bg-yellow-100 text-yellow-700 font-semibold px-2 py-0.5 rounded-full'>₹499/week</span>
            </div>
            <p className='text-sm text-gray-500'>Appear at the very top of doctor search results for 7 days. Massively increase your visibility and appointment bookings.</p>
            <ul className='mt-3 space-y-1 text-sm text-gray-600'>
              {['Top position in all search results', 'Gold ⭐ Featured badge on your card', '7-day guaranteed visibility'].map(f => (
                <li key={f} className='flex items-center gap-2'>
                  <svg className='w-3.5 h-3.5 text-yellow-500 flex-shrink-0' fill='currentColor' viewBox='0 0 20 20'>
                    <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className='flex-shrink-0'>
            {isFeatured ? (
              <div className='text-center'>
                <span className='block text-sm font-semibold text-yellow-700 bg-yellow-50 px-4 py-2 rounded-lg border border-yellow-200'>⭐ Currently Featured</span>
                {featuredExpiry && <p className='text-xs text-gray-400 mt-1'>Expires {featuredExpiry}</p>}
                <button
                  onClick={() => initiatePayment('featured_week', 'Featured Listing')}
                  className='mt-2 text-sm text-primary underline'
                >
                  Extend listing
                </button>
              </div>
            ) : (
              <button
                onClick={() => initiatePayment('featured_week', 'Featured Listing')}
                className='px-6 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-white font-bold rounded-lg transition-colors whitespace-nowrap shadow'
              >
                Get Featured — $5.99
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {activeModal && clientSecret && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-2xl shadow-xl p-6 w-full max-w-md'>
            <h3 className='text-lg font-bold text-gray-800 mb-1'>Complete Payment</h3>
            <p className='text-sm text-gray-500 mb-4'>{activeModal.label}</p>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentForm
                clientSecret={clientSecret}
                label={activeModal.label}
                onSuccess={handlePaymentSuccess}
                onCancel={() => { setActiveModal(null); setClientSecret('') }}
              />
            </Elements>
          </div>
        </div>
      )}
    </div>
  )
}

const DoctorPlan = () => <DoctorPlanInner />

export default DoctorPlan
