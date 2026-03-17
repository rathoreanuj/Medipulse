import React, { useContext, useEffect, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import axios from 'axios'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Crown, Star, CheckCircle2, Zap, Sparkles, TrendingUp } from 'lucide-react'

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
      <div className='p-3.5 border border-gray-200 rounded-xl bg-gray-50'>
        <CardElement options={{ style: { base: { fontSize: '15px', color: '#374151' } } }} />
      </div>
      {error && <p className='text-sm text-red-500'>{error}</p>}
      <div className='flex gap-3'>
        <button
          type='submit'
          disabled={!stripe || processing}
          className='flex-1 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors'
        >
          {processing ? 'Processing…' : `Pay & Activate ${label}`}
        </button>
        <button type='button' onClick={onCancel} className='px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors'>
          Cancel
        </button>
      </div>
    </form>
  )
}

// ─── Feature check item ───────────────────────────────────────────────────────
const FeatureItem = ({ text, color = 'text-primary', icon: Icon = null }) => (
  <li className='flex items-center gap-2.5 text-sm text-gray-600'>
    {Icon ? (
      <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
    ) : (
      <svg className={`w-4 h-4 ${color} flex-shrink-0`} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M5 13l4 4L19 7' />
      </svg>
    )}
    {text}
  </li>
)

// ─── Main DoctorPlan page ─────────────────────────────────────────────────────
const DoctorPlanInner = () => {
  const { dToken, backendUrl } = useContext(DoctorContext)
  const backUrl = backendUrl || import.meta.env.VITE_BACKEND_URL

  const [planStatus, setPlanStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeModal, setActiveModal] = useState(null)
  const [clientSecret, setClientSecret] = useState('')

  const loadPlanStatus = async () => {
    try {
      setLoading(true)
      const { data } = await axios.post(`${backUrl}/api/subscription/doctor/plan-status`, {}, { headers: { dToken } })
      if (data.success) setPlanStatus(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { if (dToken) loadPlanStatus() }, [dToken])

  const initiatePayment = async (type, label) => {
    try {
      const { data } = await axios.post(`${backUrl}/api/subscription/doctor/create-payment`, { type }, { headers: { dToken } })
      if (data.success) { setClientSecret(data.clientSecret); setActiveModal({ type, label }) }
    } catch (e) { console.error(e) }
  }

  const handlePaymentSuccess = async (intentId) => {
    try {
      const { data } = await axios.post(`${backUrl}/api/subscription/verify-payment`, { paymentIntentId: intentId })
      if (data.success) { setActiveModal(null); setClientSecret(''); await loadPlanStatus() }
    } catch (e) { console.error(e) }
  }

  if (loading) {
    return (
      <div className='flex-1 flex items-center justify-center h-[80vh]'>
        <div className='w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin' />
      </div>
    )
  }

  const isPro       = planStatus?.plan === 'pro'
  const isFeatured  = planStatus?.isFeatured
  const proExpiry   = planStatus?.planExpiry     ? new Date(planStatus.planExpiry).toLocaleDateString('en-IN')     : null
  const featExpiry  = planStatus?.featuredUntil  ? new Date(planStatus.featuredUntil).toLocaleDateString('en-IN')  : null

  return (
    <div className='flex-1 p-6 overflow-y-auto max-w-5xl'>

      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className='mb-7'>
        <div className='flex items-center gap-3 mb-1'>
          <div className='w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center'>
            <Crown className='w-5 h-5 text-primary' />
          </div>
          <h1 className='text-2xl font-bold text-gray-800'>My Plan</h1>
        </div>
        <p className='text-sm text-gray-500 ml-13'>Manage your subscription and featured listing</p>
      </div>

      {/* ── Status Bar ────────────────────────────────────────────────────── */}
      <div className='bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-7 flex flex-wrap gap-6'>
        {/* Plan status */}
        <div className='flex flex-col gap-1'>
          <p className='text-[11px] font-semibold text-gray-400 uppercase tracking-widest'>Current Plan</p>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${
            isPro ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'
          }`}>
            {isPro ? <><Zap className='w-3.5 h-3.5' /> Pro</> : 'Free'}
          </div>
          {isPro && proExpiry && <p className='text-xs text-gray-400'>Renews {proExpiry}</p>}
        </div>

        <div className='w-px bg-gray-100 self-stretch hidden sm:block' />

        {/* Featured status */}
        <div className='flex flex-col gap-1'>
          <p className='text-[11px] font-semibold text-gray-400 uppercase tracking-widest'>Featured Listing</p>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${
            isFeatured ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
          }`}>
            <Star className={`w-3.5 h-3.5 ${isFeatured ? 'fill-amber-500 text-amber-500' : ''}`} />
            {isFeatured ? 'Active' : 'Not Featured'}
          </div>
          {isFeatured && featExpiry && <p className='text-xs text-gray-400'>Until {featExpiry}</p>}
        </div>
      </div>

      {/* ── Plan Cards ────────────────────────────────────────────────────── */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-5 mb-6'>

        {/* Free Card */}
        <div className={`rounded-2xl border-2 p-7 bg-white transition-all ${!isPro ? 'border-primary shadow-md' : 'border-gray-200 shadow-sm'}`}>
          {!isPro && <span className='inline-block mb-3 text-xs bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-full'>Current Plan</span>}
          <h2 className='text-xl font-bold text-gray-800 mb-1'>Free</h2>
          <p className='text-4xl font-extrabold text-gray-800 mb-6'>₹0 <span className='text-sm font-normal text-gray-400'>/month</span></p>
          <ul className='space-y-3'>
            {['Up to 10 appointments/month', 'Basic profile listing', 'Standard search position', 'Chat with patients', 'Dashboard & reports'].map(f => (
              <FeatureItem key={f} text={f} color='text-green-500' />
            ))}
          </ul>
        </div>

        {/* Pro Card */}
        <div className={`rounded-2xl border-2 p-7 transition-all ${isPro ? 'border-primary bg-gradient-to-br from-primary/5 to-blue-50 shadow-lg' : 'border-gray-200 bg-white shadow-sm'}`}>
          <div className='flex items-center justify-between mb-3'>
            <div className='flex items-center gap-2'>
              <Crown className='w-5 h-5 text-primary' />
              <h2 className='text-xl font-bold text-gray-800'>Pro</h2>
            </div>
            {isPro ? (
              <span className='inline-flex items-center gap-1 text-xs bg-primary text-white font-bold px-2.5 py-1 rounded-full'>
                <CheckCircle2 className='w-3 h-3' /> Active
              </span>
            ) : (
              <span className='inline-block text-xs bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-full'>⭐ Recommended</span>
            )}
          </div>
          <p className='text-4xl font-extrabold text-gray-800 mb-6'>₹999 <span className='text-sm font-normal text-gray-400'>/month</span></p>
          <ul className='space-y-3 mb-7'>
            {['Unlimited appointments', 'Priority listing in search results', 'Pro badge on your profile', 'Advanced analytics & earnings', 'All Free features included'].map(f => (
              <FeatureItem key={f} text={f} color='text-primary' />
            ))}
          </ul>
          {isPro ? (
            <div className='w-full py-3 bg-green-50 border border-green-200 text-green-700 rounded-xl font-semibold text-center text-sm'>
              ✓ Pro Plan Active — Expires {proExpiry}
            </div>
          ) : (
            <button
              onClick={() => initiatePayment('doctor_pro', 'Pro Plan')}
              className='w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors text-sm flex items-center justify-center gap-2 shadow-sm'
            >
              <Zap className='w-4 h-4' /> Upgrade to Pro — ₹999/month
            </button>
          )}
        </div>
      </div>

      {/* ── Featured Listing Card ────────────────────────────────────────── */}
      <div className='rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-sm p-7'>
        <div className='flex flex-col sm:flex-row gap-6'>
          <div className='flex-1'>
            <div className='flex items-center gap-2 mb-1'>
              <Star className='w-5 h-5 fill-amber-400 text-amber-400' />
              <h2 className='text-lg font-bold text-gray-800'>Featured Listing</h2>
              <span className='text-xs bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full border border-amber-200'>₹499/week</span>
            </div>
            <p className='text-sm text-gray-500 mb-4 leading-relaxed'>
              Appear at the very top of doctor search results for 7 days. Massively increase your visibility and appointment bookings.
            </p>
            <ul className='space-y-2'>
              {[
                { text: 'Top position in all search results', icon: TrendingUp },
                { text: 'Gold Featured badge on your profile card', icon: Star },
                { text: '7-day guaranteed visibility boost', icon: Sparkles },
              ].map(({ text, icon: Icon }) => (
                <li key={text} className='flex items-center gap-2 text-sm text-gray-700 font-medium'>
                  <Icon className='w-4 h-4 text-amber-500 fill-amber-100 flex-shrink-0' />
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <div className='flex-shrink-0 flex flex-col items-center justify-center min-w-[160px]'>
            {isFeatured ? (
              <div className='text-center'>
                <div className='flex items-center gap-1.5 bg-amber-100 border border-amber-300 text-amber-800 font-bold text-sm px-4 py-2.5 rounded-xl mb-2'>
                  <Star className='w-4 h-4 fill-amber-500 text-amber-500' /> Currently Featured
                </div>
                {featExpiry && <p className='text-xs text-gray-400 mb-2'>Expires {featExpiry}</p>}
                <button
                  onClick={() => initiatePayment('featured_week', 'Featured Listing')}
                  className='text-sm text-amber-700 font-semibold underline hover:text-amber-900 transition-colors'
                >
                  Extend listing
                </button>
              </div>
            ) : (
              <button
                onClick={() => initiatePayment('featured_week', 'Featured Listing')}
                className='px-6 py-3 bg-amber-400 hover:bg-amber-300 text-amber-900 font-bold rounded-xl transition-colors whitespace-nowrap shadow-sm border border-amber-400 flex items-center gap-2'
              >
                <Star className='w-4 h-4 fill-amber-700 text-amber-700' />
                Get Featured — ₹499
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Payment Modal ─────────────────────────────────────────────────── */}
      {activeModal && clientSecret && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-2xl shadow-2xl p-7 w-full max-w-md'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center'>
                <Crown className='w-5 h-5 text-primary' />
              </div>
              <div>
                <h3 className='text-lg font-bold text-gray-800'>Complete Payment</h3>
                <p className='text-sm text-gray-500'>{activeModal.label}</p>
              </div>
            </div>
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




