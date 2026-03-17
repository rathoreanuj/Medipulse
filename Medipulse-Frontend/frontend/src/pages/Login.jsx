import { useContext, useEffect, useRef, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate, Link } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'

const OtpInput = ({ value, onChange }) => {
  const inputs = useRef([])
  const digits = value.split('')

  const handleChange = (index, e) => {
    const val = e.target.value.replace(/\D/, '')
    if (!val) return
    const next = digits.slice()
    next[index] = val[val.length - 1]
    onChange(next.join(''))
    if (index < 5) inputs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      const next = digits.slice()
      if (digits[index]) {
        next[index] = ''
        onChange(next.join(''))
      } else if (index > 0) {
        inputs.current[index - 1]?.focus()
      }
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(pasted.padEnd(6, '').slice(0, 6))
    inputs.current[Math.min(pasted.length, 5)]?.focus()
  }

  return (
    <div className='flex gap-2.5 justify-center' onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={el => inputs.current[i] = el}
          type='text'
          inputMode='numeric'
          maxLength={1}
          value={digits[i] || ''}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className='w-11 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none text-gray-800 bg-white transition-colors'
        />
      ))}
    </div>
  )
}

const Login = () => {
  // 'Sign Up' | 'Login' | 'OTP'
  const [state, setState] = useState('Sign Up')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // OTP step
  const [otp, setOtp] = useState('')
  const [tempToken, setTempToken] = useState('')
  const [resendTimer, setResendTimer] = useState(0)
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()
  const { backendUrl, token, setToken } = useContext(AppContext)

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) return
    const id = setInterval(() => setResendTimer(t => t - 1), 1000)
    return () => clearInterval(id)
  }, [resendTimer])

  const onSubmitHandler = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      if (state === 'Sign Up') {
        const { data } = await axios.post(backendUrl + '/api/user/register', { name, email, password })
        if (data.success) {
          localStorage.setItem('token', data.token)
          setToken(data.token)
        } else {
          toast.error(data.message)
        }
      } else {
        const { data } = await axios.post(backendUrl + '/api/user/login', { email, password })
        if (data.success && data.requiresOtp) {
          setTempToken(data.tempToken)
          setState('OTP')
          setResendTimer(60)
          toast.success('Verification code sent to your email')
        } else {
          toast.error(data.message)
        }
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const onVerifyOtp = async (e) => {
    e.preventDefault()
    if (otp.length !== 6) {
      toast.error('Please enter the complete 6-digit code')
      return
    }
    setLoading(true)
    try {
      const { data } = await axios.post(backendUrl + '/api/user/verify-otp', { otp, tempToken })
      if (data.success) {
        localStorage.setItem('token', data.token)
        setToken(data.token)
        toast.success('Login successful!')
      } else {
        toast.error(data.message)
        if (data.message.includes('expired')) {
          setState('Login')
          setOtp('')
          setTempToken('')
        }
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setLoading(true)
    try {
      const { data } = await axios.post(backendUrl + '/api/user/login', { email, password })
      if (data.success && data.requiresOtp) {
        setTempToken(data.tempToken)
        setOtp('')
        setResendTimer(60)
        toast.success('New code sent to your email')
      } else {
        toast.error(data.message || 'Failed to resend. Please start over.')
        setState('Login')
      }
    } catch {
      toast.error('Failed to resend. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const { data } = await axios.post(backendUrl + '/api/user/google-auth', {
        credential: credentialResponse.credential,
      })
      if (data.success) {
        localStorage.setItem('token', data.token)
        setToken(data.token)
        toast.success('Signed in with Google!')
      } else {
        toast.error(data.message)
      }
    } catch {
      toast.error('Google sign-in failed. Please try again.')
    }
  }

  useEffect(() => {
    if (token) navigate('/')
  }, [token, navigate])

  // ─── OTP Verification Screen ──────────────────────────────────────────────
  if (state === 'OTP') {
    return (
      <div className='min-h-[80vh] flex items-center justify-center px-4 py-12'>
        <form onSubmit={onVerifyOtp} className='w-full max-w-md'>
          <div className='bg-white border-2 border-gray-200 rounded-xl p-8'>

            {/* Icon */}
            <div className='flex justify-center mb-5'>
              <div className='w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center'>
                <svg className='w-8 h-8 text-primary' fill='none' stroke='currentColor' strokeWidth='1.8' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                </svg>
              </div>
            </div>

            <div className='text-center mb-7'>
              <h2 className='text-2xl font-semibold text-gray-800 mb-2'>Check your email</h2>
              <p className='text-sm text-gray-500 leading-relaxed'>
                We sent a 6-digit verification code to<br />
                <span className='font-medium text-gray-700'>{email}</span>
              </p>
            </div>

            <div className='mb-6'>
              <OtpInput value={otp} onChange={setOtp} />
            </div>

            <button
              type='submit'
              disabled={loading || otp.length !== 6}
              className='w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
            >
              {loading ? (
                <span className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
              ) : 'Verify & Login'}
            </button>

            {/* Resend */}
            <div className='mt-5 text-center text-sm text-gray-500'>
              Didn&apos;t receive the code?{' '}
              {resendTimer > 0 ? (
                <span className='text-gray-400'>Resend in {resendTimer}s</span>
              ) : (
                <button
                  type='button'
                  onClick={handleResend}
                  disabled={loading}
                  className='text-primary font-medium hover:underline disabled:opacity-50'
                >
                  Resend code
                </button>
              )}
            </div>

            {/* Back */}
            <div className='mt-3 text-center'>
              <button
                type='button'
                onClick={() => { setState('Login'); setOtp(''); setTempToken('') }}
                className='text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 mx-auto'
              >
                <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' d='M15 19l-7-7 7-7' />
                </svg>
                Back to login
              </button>
            </div>
          </div>
        </form>
      </div>
    )
  }

  // ─── Login / Sign Up Screen ───────────────────────────────────────────────
  return (
    <div className='min-h-[80vh] flex items-center justify-center px-4 py-12'>
      <form onSubmit={onSubmitHandler} className='w-full max-w-md'>
        <div className='bg-white border-2 border-gray-200 rounded-lg p-8'>
          
          {/* Header */}
          <div className='mb-8'>
            <h2 className='text-2xl font-semibold text-gray-800 mb-2'>
              {state === 'Sign Up' ? 'Create Account' : 'Login'}
            </h2>
            <p className='text-sm text-gray-600'>
              {state === 'Sign Up' 
                ? 'Please sign up to book appointments' 
                : 'Please login to continue'}
            </p>
          </div>

          {/* Form Fields */}
          <div className='space-y-4'>
            
            {state === 'Sign Up' && (
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1.5'>Full Name</label>
                <input 
                  onChange={(e) => setName(e.target.value)} 
                  value={name} 
                  className='w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none text-gray-700' 
                  type='text' 
                  placeholder='John Doe'
                  required 
                />
              </div>
            )}

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1.5'>Email</label>
              <input 
                onChange={(e) => setEmail(e.target.value)} 
                value={email} 
                className='w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none text-gray-700' 
                type='email' 
                placeholder='you@example.com'
                required 
              />
            </div>

            <div>
              <div className='flex items-center justify-between mb-1.5'>
                <label className='block text-sm font-medium text-gray-700'>Password</label>
                <Link to='/forgot-password' className='text-xs text-primary hover:underline'>Forgot password?</Link>
              </div>
              <input 
                onChange={(e) => setPassword(e.target.value)} 
                value={password} 
                className='w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none text-gray-700' 
                type='password' 
                placeholder='Enter your password'
                required 
              />
            </div>

            <button 
              type='submit'
              disabled={loading}
              className='w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-blue-600 mt-6 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
            >
              {loading ? (
                <span className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
              ) : state === 'Sign Up' ? 'Create Account' : 'Login'}
            </button>
          </div>

          {/* Toggle State */}
          <div className='mt-6 text-center text-sm'>
            {state === 'Sign Up' ? (
              <p className='text-gray-600'>
                Already have an account?{' '}
                <span 
                  onClick={() => setState('Login')} 
                  className='text-primary font-medium cursor-pointer hover:underline'
                >
                  Login here
                </span>
              </p>
            ) : (
              <p className='text-gray-600'>
                Don&apos;t have an account?{' '}
                <span 
                  onClick={() => setState('Sign Up')} 
                  className='text-primary font-medium cursor-pointer hover:underline'
                >
                  Create account
                </span>
              </p>
            )}
          </div>

          {/* ── Divider ── */}
          <div className='flex items-center gap-3 my-5'>
            <hr className='flex-1 border-gray-200' />
            <span className='text-xs text-gray-400 font-medium'>OR</span>
            <hr className='flex-1 border-gray-200' />
          </div>

          {/* Google Sign-In */}
          <div className='flex justify-center'>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Google sign-in failed. Please try again.')}
              useOneTap={false}
              text={state === 'Sign Up' ? 'signup_with' : 'signin_with'}
              shape='rectangular'
              theme='outline'
              size='large'
              width='320'
            />
          </div>
        </div>
      </form>
    </div>
  )
}

export default Login