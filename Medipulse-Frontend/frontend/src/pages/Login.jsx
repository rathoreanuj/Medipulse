import { useContext, useEffect, useRef, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate, Link } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { assets } from '../assets/assets'

// Local helper component used only in this page.
// eslint-disable-next-line react/prop-types
const OtpInput = ({ value, onChange }) => {
  const inputs = useRef([])
  // eslint-disable-next-line react/prop-types
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
          aria-label={`OTP digit ${i + 1}`}
          value={digits[i] || ''}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className='w-11 h-12 text-center text-xl font-semibold border border-slate-300 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none text-slate-800 bg-white transition-all'
        />
      ))}
    </div>
  )
}

const Login = () => {
  // 'Sign Up' | 'Login' | 'OTP'
  const [state, setState] = useState('Sign Up')

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // OTP step
  const [otp, setOtp] = useState('')
  const [tempToken, setTempToken] = useState('')
  const [resendTimer, setResendTimer] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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
        const fullName = `${firstName} ${lastName}`.trim()
        const { data } = await axios.post(backendUrl + '/api/user/register', { name: fullName, email, password })
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

  const isEmailTouched = email.length > 0
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  // ─── OTP Verification Screen ──────────────────────────────────────────────
  if (state === 'OTP') {
    return (
      <div className='min-h-[82vh] px-4 py-8 md:py-10 flex items-center'>
        <div className='w-full max-w-6xl mx-auto rounded-3xl overflow-hidden bg-white border border-slate-200 transition-all duration-300'>
          <div className='flex flex-col md:flex-row min-h-[650px]'>
            <section className='md:w-1/2 bg-gradient-to-br from-white via-slate-50 to-blue-50/50 text-slate-900 p-6 sm:p-10 md:p-12 flex items-center'>
              <form onSubmit={onVerifyOtp} className='w-full'>
                <div className='mb-8'>
                  <p className='text-xs font-semibold uppercase tracking-[0.22em] text-primary/80 mb-2'>Medipulse Verify</p>
                  <h2 className='text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900'>Check your email</h2>
                  <p className='text-sm text-slate-600 mt-3 leading-relaxed'>
                    We sent a 6-digit verification code to <span className='font-semibold text-slate-800'>{email}</span>
                  </p>
                </div>

                <div className='mb-5'>
                  <label className='text-xs font-medium text-slate-600 mb-2 block'>Enter OTP</label>
                  <OtpInput value={otp} onChange={setOtp} />
                </div>

                <button
                  type='submit'
                  disabled={loading || otp.length !== 6}
                  className='w-full bg-primary text-white py-3.5 rounded-xl font-semibold shadow-[0_10px_25px_-15px_rgba(37,99,235,0.95)] hover:bg-blue-700 hover:translate-y-[-1px] hover:shadow-[0_18px_30px_-18px_rgba(37,99,235,0.9)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none flex items-center justify-center gap-2'
                >
                  {loading ? (
                    <span className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                  ) : 'Verify & Login'}
                </button>

                <div className='mt-5 text-sm text-slate-600'>
                  Didn&apos;t receive the code?{' '}
                  {resendTimer > 0 ? (
                    <span className='text-slate-500 font-medium'>Resend in {resendTimer}s</span>
                  ) : (
                    <button
                      type='button'
                      onClick={handleResend}
                      disabled={loading}
                      className='text-primary font-semibold hover:text-blue-700 underline underline-offset-2 disabled:opacity-50'
                    >
                      Resend code
                    </button>
                  )}
                </div>

                <button
                  type='button'
                  onClick={() => { setState('Login'); setOtp(''); setTempToken('') }}
                  className='mt-4 text-sm text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1'
                >
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' d='M15 19l-7-7 7-7' />
                  </svg>
                  Back to login
                </button>
              </form>
            </section>

            <section className='relative md:w-1/2 bg-primary overflow-hidden'>
              <img
                src={assets.appointment_img}
                alt='Healthcare professionals'
                className='absolute bottom-0 right-0 h-[78%] w-[84%] object-contain z-10 transition-transform duration-500 hover:scale-[1.02]'
              />
              <div className='absolute inset-x-0 top-0 p-6 md:p-8 text-white z-20'>
                <p className='text-xs uppercase tracking-[0.28em] text-blue-100/95 mb-3'>Medipulse</p>
                <h2 className='text-2xl md:text-[2rem] font-semibold leading-tight max-w-md'>
                  Better care starts with one secure account
                </h2>
                <p className='text-sm text-blue-50/95 mt-3 max-w-sm leading-relaxed'>
                  Book appointments, chat with doctors, and manage 
                  <br />
                  your health journey in one place.
                </p>
                <div className='mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/20 text-xs font-medium text-blue-50/95'>
                  <span className='w-2 h-2 bg-emerald-300 rounded-full animate-pulse' />
                  Secure and HIPAA-inspired workflow
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    )
  }

  // ─── Login / Sign Up Screen ───────────────────────────────────────────────
  return (
    <div className='min-h-[82vh] px-4 py-8 md:py-10 flex items-center'>
      <div className='w-full max-w-6xl mx-auto rounded-3xl overflow-hidden bg-white border border-slate-200 transition-all duration-300'>
        <div className='flex flex-col md:flex-row min-h-[650px]'>
          <section className='md:w-1/2 bg-gradient-to-br from-white via-slate-50 to-blue-50/50 text-slate-900 p-6 sm:p-10 md:p-12 flex items-center'>
            <form onSubmit={onSubmitHandler} className='w-full'>
              <div className='mb-8'>
                <h1 className='text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900'>
                  {state === 'Sign Up' ? 'Create account' : 'Sign in'}
                </h1>
                <p className='text-sm text-slate-600 mt-3'>
                  {state === 'Sign Up' ? (
                    <>
                      Already registered?{' '}
                      <button
                        type='button'
                        onClick={() => setState('Login')}
                        className='text-primary hover:text-blue-700 underline underline-offset-2 font-medium'
                      >
                        Sign in
                      </button>
                    </>
                  ) : (
                    <>
                      Don&apos;t have an account yet?{' '}
                      <button
                        type='button'
                        onClick={() => setState('Sign Up')}
                        className='text-primary hover:text-blue-700 underline underline-offset-2 font-medium'
                      >
                        Create account
                      </button>
                    </>
                  )}
                </p>
              </div>

              <div className='space-y-4'>
                {state === 'Sign Up' && (
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                    <div>
                      <label htmlFor='firstName' className='text-xs font-medium text-slate-600 mb-1.5 block'>First name</label>
                      <div className='relative'>
                        <span className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400'>
                          <svg className='w-4 h-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                            <path strokeLinecap='round' strokeLinejoin='round' d='M15 19a4 4 0 00-8 0M11 12a4 4 0 100-8 4 4 0 000 8z' />
                          </svg>
                        </span>
                        <input
                          id='firstName'
                          onChange={(e) => setFirstName(e.target.value)}
                          value={firstName}
                          className='w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none transition-all'
                          type='text'
                          placeholder='First name'
                          autoComplete='given-name'
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor='lastName' className='text-xs font-medium text-slate-600 mb-1.5 block'>Last name</label>
                      <div className='relative'>
                        <span className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400'>
                          <svg className='w-4 h-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                            <path strokeLinecap='round' strokeLinejoin='round' d='M15 19a4 4 0 00-8 0M11 12a4 4 0 100-8 4 4 0 000 8z' />
                          </svg>
                        </span>
                        <input
                          id='lastName'
                          onChange={(e) => setLastName(e.target.value)}
                          value={lastName}
                          className='w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none transition-all'
                          type='text'
                          placeholder='Last name'
                          autoComplete='family-name'
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor='email' className='text-xs font-medium text-slate-600 mb-1.5 block'>Email address</label>
                  <div className='relative'>
                    <span className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400'>
                      <svg className='w-4 h-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                        <path strokeLinecap='round' strokeLinejoin='round' d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                      </svg>
                    </span>
                    <input
                      id='email'
                      onChange={(e) => setEmail(e.target.value)}
                      value={email}
                      className='w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none transition-all'
                      type='email'
                      placeholder='you@example.com'
                      autoComplete='email'
                      aria-invalid={isEmailTouched && !isEmailValid}
                      required
                    />
                  </div>
                  {isEmailTouched && !isEmailValid && (
                    <p className='text-xs text-red-500 mt-1'>Please enter a valid email address.</p>
                  )}
                </div>

                <div>
                  <div className='flex items-center justify-between mb-1.5'>
                    <label htmlFor='password' className='text-xs font-medium text-slate-600'>Password</label>
                    {state === 'Login' && (
                      <Link to='/forgot-password' className='text-xs text-primary hover:text-blue-700'>
                        Forgot password?
                      </Link>
                    )}
                  </div>
                  <div className='relative'>
                    <span className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400'>
                      <svg className='w-4 h-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                        <path strokeLinecap='round' strokeLinejoin='round' d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2h-1V9a5 5 0 00-10 0v2H6a2 2 0 00-2 2v6a2 2 0 002 2zm3-10V9a3 3 0 016 0v2H9z' />
                      </svg>
                    </span>
                    <input
                      id='password'
                      onChange={(e) => setPassword(e.target.value)}
                      value={password}
                      className='w-full pl-10 pr-12 py-3 rounded-xl bg-white border border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none transition-all'
                      type={showPassword ? 'text' : 'password'}
                      placeholder={state === 'Sign Up' ? 'Create a password' : 'Enter your password'}
                      autoComplete={state === 'Sign Up' ? 'new-password' : 'current-password'}
                      minLength={8}
                      required
                    />
                    <button
                      type='button'
                      onClick={() => setShowPassword(prev => !prev)}
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors'
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg className='w-4 h-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                          <path strokeLinecap='round' strokeLinejoin='round' d='M3 3l18 18M10.58 10.58A2 2 0 0013.42 13.42M9.88 5.09A10.94 10.94 0 0112 5c5.52 0 10 7 10 7a19.6 19.6 0 01-4.22 4.88M6.61 6.61C3.35 8.63 2 12 2 12a19.53 19.53 0 005.19 5.21M14.12 14.12A3 3 0 019.88 9.88' />
                        </svg>
                      ) : (
                        <svg className='w-4 h-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                          <path strokeLinecap='round' strokeLinejoin='round' d='M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z' />
                          <circle cx='12' cy='12' r='3' />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className='text-xs text-slate-500 mt-1'>Use at least 8 characters for better security.</p>
                </div>

                <button
                  type='submit'
                  disabled={loading}
                  className='w-full mt-2 bg-primary text-white py-3.5 rounded-xl font-semibold shadow-[0_10px_25px_-15px_rgba(37,99,235,0.95)] hover:bg-blue-700 hover:translate-y-[-1px] hover:shadow-[0_18px_30px_-18px_rgba(37,99,235,0.9)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none flex items-center justify-center gap-2'
                >
                  {loading ? (
                    <span className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                  ) : state === 'Sign Up' ? 'Create account' : 'Sign in'}
                </button>
                <p className='text-xs text-slate-500 text-center mt-3'>Trusted by patients and doctors across India.</p>
              </div>

              <div className='flex items-center gap-3 my-6'>
                <hr className='flex-1 border-slate-300' />
                <span className='text-xs text-slate-500'>or continue with</span>
                <hr className='flex-1 border-slate-300' />
              </div>

              <div className='w-full flex justify-center'>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast.error('Google sign-in failed. Please try again.')}
                  useOneTap={false}
                  text={state === 'Sign Up' ? 'signup_with' : 'signin_with'}
                  shape='rectangular'
                  theme='outline'
                  size='large'
                  width='330'
                />
              </div>
            </form>
          </section>

          <section className='relative md:w-1/2 bg-primary overflow-hidden'>
            <img
              src={assets.appointment_img}
              alt='Healthcare professionals'
              className='absolute bottom-0 right-0 h-[78%] w-[84%] object-contain z-10 transition-transform duration-500 hover:scale-[1.02]'
            />
            <div className='absolute inset-x-0 top-0 p-6 md:p-8 text-white z-20'>
              <p className='text-xs uppercase tracking-[0.28em] text-blue-100/95 mb-3'>Medipulse</p>
              <h2 className='text-2xl md:text-[2rem] font-semibold leading-tight max-w-md'>
                Better care starts with one secure account
              </h2>
              <p className='text-sm text-blue-50/95 mt-3 max-w-sm leading-relaxed'>
                Book appointments, chat with doctors, and manage your health journey in one place.
              </p>
              <div className='mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/20 text-xs font-medium text-blue-50/95'>
                <span className='w-2 h-2 bg-emerald-300 rounded-full animate-pulse' />
                Secure and HIPAA-inspired workflow
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default Login