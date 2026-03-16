import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useNavigate } from 'react-router-dom'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

// ─── Payment form ─────────────────────────────────────────────────────────────
const PaymentForm = ({ clientSecret, onSuccess, onCancel }) => {
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
          className='flex-1 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors'
        >
          {processing ? 'Processing…' : 'Pay & Activate Premium'}
        </button>
        <button type='button' onClick={onCancel} className='px-4 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors'>
          Cancel
        </button>
      </div>
    </form>
  )
}

// ─── Main Premium Plan Page ───────────────────────────────────────────────────
const PremiumPlanInner = () => {
  const { token, userData, backendUrl } = useContext(AppContext)
  const navigate = useNavigate()
  const backUrl = backendUrl || import.meta.env.VITE_BACKEND_URL

  const [planStatus, setPlanStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showPayment, setShowPayment] = useState(false)
  const [clientSecret, setClientSecret] = useState('')

  useEffect(() => {
    if (!token) { navigate('/login'); return }
    loadPlanStatus()
  }, [token])

  const loadPlanStatus = async () => {
    try {
      setLoading(true)
      const { data } = await axios.post(
        `${backUrl}/api/subscription/patient/plan-status`,
        {},
        { headers: { token } }
      )
      if (data.success) setPlanStatus(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const initiatePayment = async () => {
    try {
      const { data } = await axios.post(
        `${backUrl}/api/subscription/patient/create-payment`,
        { type: 'patient_premium' },
        { headers: { token } }
      )
      if (data.success) {
        setClientSecret(data.clientSecret)
        setShowPayment(true)
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
        setShowPayment(false)
        setClientSecret('')
        await loadPlanStatus()
      }
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[60vh]'>
        <div className='w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin' />
      </div>
    )
  }

  const isPremium = planStatus?.plan === 'premium'
  const planExpiry = planStatus?.planExpiry ? new Date(planStatus.planExpiry).toLocaleDateString() : null

  return (
    <div className='max-w-4xl mx-auto py-10 px-4'>
      {/* Header */}
      <div className='text-center mb-10'>
        <h1 className='text-3xl font-bold text-gray-800'>Choose Your Plan</h1>
        <p className='text-gray-500 mt-2'>Unlock unlimited bookings and premium features</p>
      </div>

      {/* Current status badge */}
      {isPremium && (
        <div className='mb-6 flex justify-center'>
          <div className='bg-primary/10 text-primary font-semibold text-sm px-5 py-2 rounded-full flex items-center gap-2'>
            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
              <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
            </svg>
            Premium Active — Renews {planExpiry}
          </div>
        </div>
      )}

      {/* Plan Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
        {/* Free */}
        <div className={`rounded-2xl border-2 p-7 bg-white ${!isPremium ? 'border-primary shadow-lg' : 'border-gray-200'}`}>
          {!isPremium && (
            <span className='inline-block mb-3 text-xs bg-primary/10 text-primary font-semibold px-2 py-1 rounded-full'>Current Plan</span>
          )}
          <h2 className='text-xl font-bold text-gray-800 mb-1'>Free</h2>
          <p className='text-3xl font-bold text-gray-800 mb-5'>₹0 <span className='text-sm font-normal text-gray-400'>/month</span></p>
          <ul className='space-y-3 text-sm text-gray-600'>
            {[
              '2 appointments per month',
              'Basic appointment chat',
              'Appointment history',
              'Email reminders',
            ].map(f => (
              <li key={f} className='flex items-center gap-2'>
                <svg className='w-4 h-4 text-green-500 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                </svg>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Premium */}
        <div className={`rounded-2xl border-2 p-7 ${isPremium ? 'border-primary bg-primary/5 shadow-xl' : 'border-primary bg-white shadow-md'}`}>
          <span className='inline-block mb-3 text-xs bg-primary text-white font-semibold px-2 py-1 rounded-full'>
            {isPremium ? '✨ Active' : '⭐ Recommended'}
          </span>
          <h2 className='text-xl font-bold text-gray-800 mb-1'>Premium</h2>
          <p className='text-3xl font-bold text-gray-800 mb-5'>₹299 <span className='text-sm font-normal text-gray-400'>/month</span></p>
          <ul className='space-y-3 text-sm text-gray-600 mb-6'>
            {[
              'Unlimited appointments',
              'Priority queue — see doctors faster',
              'Full appointment chat history',
              'Prescription history & downloads',
              'Follow-up reminders',
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
          {!isPremium ? (
            <button
              onClick={initiatePayment}
              className='w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors text-base'
            >
              Upgrade to Premium — $3.59
            </button>
          ) : (
            <button
              onClick={initiatePayment}
              className='w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors text-base'
            >
              Renew Premium Plan
            </button>
          )}
        </div>
      </div>

      {/* FAQ / info */}
      <div className='bg-blue-50 border border-blue-100 rounded-xl p-5 text-sm text-blue-700'>
        <strong>Note:</strong> Plans are billed monthly and automatically expire after 30 days. You can renew at any time. Payments are securely processed via Stripe.
      </div>

      {/* Payment Modal */}
      {showPayment && clientSecret && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-2xl shadow-xl p-6 w-full max-w-md'>
            <h3 className='text-lg font-bold text-gray-800 mb-1'>Complete Payment</h3>
            <p className='text-sm text-gray-500 mb-4'>Patient Premium Plan — 1 Month ($3.59)</p>
            <Elements stripe={stripePromise}>
              <PaymentForm
                clientSecret={clientSecret}
                onSuccess={handlePaymentSuccess}
                onCancel={() => { setShowPayment(false); setClientSecret('') }}
              />
            </Elements>
          </div>
        </div>
      )}
    </div>
  )
}

const PremiumPlan = () => (
  <Elements stripe={stripePromise}>
    <PremiumPlanInner />
  </Elements>
)

export default PremiumPlan
