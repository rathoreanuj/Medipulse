import { useState, useContext, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AppContext } from '../context/AppContext'

const ResetPassword = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const { backendUrl } = useContext(AppContext)

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  // Redirect if no token in URL
  useEffect(() => {
    if (!token) navigate('/forgot-password')
  }, [token, navigate])

  const passwordStrength = (pw) => {
    if (pw.length === 0) return null
    if (pw.length < 6) return { label: 'Too short', color: 'bg-red-400', width: 'w-1/4' }
    if (pw.length < 8) return { label: 'Weak', color: 'bg-orange-400', width: 'w-2/4' }
    if (/[A-Z]/.test(pw) && /[0-9]/.test(pw) && pw.length >= 10)
      return { label: 'Strong', color: 'bg-green-400', width: 'w-full' }
    return { label: 'Fair', color: 'bg-yellow-400', width: 'w-3/4' }
  }

  const strength = passwordStrength(password)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      const { data } = await axios.post(backendUrl + '/api/user/reset-password', { token, password })
      if (data.success) {
        setDone(true)
      } else {
        toast.error(data.message)
        if (data.message.includes('expired') || data.message.includes('Invalid')) {
          setTimeout(() => navigate('/forgot-password'), 2000)
        }
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className='min-h-[80vh] flex items-center justify-center px-4 py-12'>
        <div className='w-full max-w-md bg-white border-2 border-gray-200 rounded-xl p-8 text-center'>
          <div className='flex justify-center mb-5'>
            <div className='w-16 h-16 bg-green-50 rounded-full flex items-center justify-center'>
              <svg className='w-8 h-8 text-green-500' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
              </svg>
            </div>
          </div>
          <h2 className='text-2xl font-semibold text-gray-800 mb-3'>Password reset!</h2>
          <p className='text-gray-500 text-sm leading-relaxed mb-7'>
            Your password has been successfully updated. You can now login with your new password.
          </p>
          <Link
            to='/login'
            className='inline-block bg-primary text-white px-8 py-2.5 rounded-lg font-medium hover:bg-blue-600 transition-colors text-sm'
          >
            Login now
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
                <path strokeLinecap='round' strokeLinejoin='round' d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' />
              </svg>
            </div>
          </div>

          <div className='text-center mb-7'>
            <h2 className='text-2xl font-semibold text-gray-800 mb-2'>Set new password</h2>
            <p className='text-sm text-gray-500'>
              Your new password must be at least 8 characters.
            </p>
          </div>

          {/* New password */}
          <div className='mb-4'>
            <label className='block text-sm font-medium text-gray-700 mb-1.5'>New password</label>
            <div className='relative'>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder='Enter new password'
                className='w-full px-3 py-2.5 pr-10 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none text-gray-700'
                required
              />
              <button
                type='button'
                onClick={() => setShowPassword(v => !v)}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
              >
                {showPassword ? (
                  <svg className='w-4.5 h-4.5 w-5 h-5' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21' />
                  </svg>
                ) : (
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                    <path strokeLinecap='round' strokeLinejoin='round' d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                  </svg>
                )}
              </button>
            </div>
            {/* Strength bar */}
            {strength && (
              <div className='mt-2'>
                <div className='h-1.5 bg-gray-100 rounded-full overflow-hidden'>
                  <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                </div>
                <p className={`text-xs mt-1 ${strength.color.replace('bg-', 'text-')}`}>{strength.label}</p>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div className='mb-6'>
            <label className='block text-sm font-medium text-gray-700 mb-1.5'>Confirm password</label>
            <div className='relative'>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder='Re-enter new password'
                className={`w-full px-3 py-2.5 pr-10 border-2 rounded-lg focus:outline-none text-gray-700 transition-colors ${
                  confirm && confirm !== password ? 'border-red-300 focus:border-red-400' : 'border-gray-300 focus:border-primary'
                }`}
                required
              />
              <button
                type='button'
                onClick={() => setShowConfirm(v => !v)}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
              >
                {showConfirm ? (
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21' />
                  </svg>
                ) : (
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                    <path strokeLinecap='round' strokeLinejoin='round' d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                  </svg>
                )}
              </button>
            </div>
            {confirm && confirm !== password && (
              <p className='text-xs text-red-400 mt-1'>Passwords do not match</p>
            )}
          </div>

          <button
            type='submit'
            disabled={loading || !password || !confirm}
            className='w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
          >
            {loading ? (
              <span className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
            ) : 'Reset password'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ResetPassword
