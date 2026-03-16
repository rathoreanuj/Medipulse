import { useState, useContext } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AppContext } from '../context/AppContext'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { backendUrl } = useContext(AppContext)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await axios.post(backendUrl + '/api/user/forgot-password', { email })
      if (data.success) {
        setSubmitted(true)
      } else {
        toast.error(data.message)
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className='min-h-[80vh] flex items-center justify-center px-4 py-12'>
        <div className='w-full max-w-md bg-white border-2 border-gray-200 rounded-xl p-8 text-center'>
          {/* Success icon */}
          <div className='flex justify-center mb-5'>
            <div className='w-16 h-16 bg-green-50 rounded-full flex items-center justify-center'>
              <svg className='w-8 h-8 text-green-500' fill='none' stroke='currentColor' strokeWidth='1.8' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
              </svg>
            </div>
          </div>
          <h2 className='text-2xl font-semibold text-gray-800 mb-3'>Check your inbox</h2>
          <p className='text-gray-500 text-sm leading-relaxed mb-2'>
            If <span className='font-medium text-gray-700'>{email}</span> is registered, we've sent a password reset link.
          </p>
          <p className='text-gray-400 text-xs mb-7'>
            The link expires in 30 minutes. Check your spam folder if you don't see it.
          </p>
          <Link
            to='/login'
            className='inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline'
          >
            <svg className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' d='M15 19l-7-7 7-7' />
            </svg>
            Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-[80vh] flex items-center justify-center px-4 py-12'>
      <div className='w-full max-w-md'>
        <form onSubmit={handleSubmit} className='bg-white border-2 border-gray-200 rounded-xl p-8'>

          {/* Icon */}
          <div className='flex justify-center mb-5'>
            <div className='w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center'>
              <svg className='w-7 h-7 text-primary' fill='none' stroke='currentColor' strokeWidth='1.8' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' />
              </svg>
            </div>
          </div>

          <div className='text-center mb-7'>
            <h2 className='text-2xl font-semibold text-gray-800 mb-2'>Forgot password?</h2>
            <p className='text-sm text-gray-500 leading-relaxed'>
              No worries! Enter your email and we'll send you a link to reset your password.
            </p>
          </div>

          <div className='mb-5'>
            <label className='block text-sm font-medium text-gray-700 mb-1.5'>Email address</label>
            <input
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='you@example.com'
              className='w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none text-gray-700'
              required
            />
          </div>

          <button
            type='submit'
            disabled={loading}
            className='w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
          >
            {loading ? (
              <span className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
            ) : 'Send reset link'}
          </button>

          <div className='mt-5 text-center'>
            <Link
              to='/login'
              className='text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 justify-center'
            >
              <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M15 19l-7-7 7-7' />
              </svg>
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ForgotPassword
