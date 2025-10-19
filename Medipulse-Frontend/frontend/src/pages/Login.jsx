import { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

const Login = () => {

  const [state, setState] = useState('Sign Up')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const navigate = useNavigate()
  const { backendUrl, token, setToken } = useContext(AppContext)

  const onSubmitHandler = async (event) => {
    event.preventDefault();

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

      if (data.success) {
        localStorage.setItem('token', data.token)
        setToken(data.token)
      } else {
        toast.error(data.message)
      }

    }

  }

  useEffect(() => {
    if (token) {
      navigate('/')
    }
  }, [token, navigate])

  return (
    <div className='min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-blue-50 to-white'>
      <form onSubmit={onSubmitHandler} className='w-full max-w-md'>
        <div className='bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden'>
          
          {/* Header Section */}
          <div className='bg-blue-500 px-8 py-8 text-center'>
            <div className='w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg'>
              <svg className='w-8 h-8 text-primary' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
              </svg>
            </div>
            <h2 className='text-3xl font-bold text-white mb-2'>
              {state === 'Sign Up' ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className='text-blue-100 text-sm'>
              {state === 'Sign Up' 
                ? 'Sign up to book your medical appointments' 
                : 'Login to manage your appointments'}
            </p>
          </div>

          {/* Form Section */}
          <div className='px-8 py-8'>
            <div className='space-y-5'>
              
              {/* Full Name Field (Sign Up only) */}
              {state === 'Sign Up' && (
                <div className='space-y-2'>
                  <label className='text-sm font-semibold text-gray-700 flex items-center gap-2'>
                    <svg className='w-4 h-4 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                    </svg>
                    Full Name
                  </label>
                  <input 
                    onChange={(e) => setName(e.target.value)} 
                    value={name} 
                    className='w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none transition-colors duration-300 text-gray-700' 
                    type="text" 
                    placeholder='Enter your full name'
                    required 
                  />
                </div>
              )}

              {/* Email Field */}
              <div className='space-y-2'>
                <label className='text-sm font-semibold text-gray-700 flex items-center gap-2'>
                  <svg className='w-4 h-4 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207' />
                  </svg>
                  Email Address
                </label>
                <input 
                  onChange={(e) => setEmail(e.target.value)} 
                  value={email} 
                  className='w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none transition-colors duration-300 text-gray-700' 
                  type="email" 
                  placeholder='Enter your email'
                  required 
                />
              </div>

              {/* Password Field */}
              <div className='space-y-2'>
                <label className='text-sm font-semibold text-gray-700 flex items-center gap-2'>
                  <svg className='w-4 h-4 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' />
                  </svg>
                  Password
                </label>
                <input 
                  onChange={(e) => setPassword(e.target.value)} 
                  value={password} 
                  className='w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none transition-colors duration-300 text-gray-700' 
                  type="password" 
                  placeholder='Enter your password'
                  required 
                />
              </div>

              {/* Submit Button */}
              <button 
                type='submit'
                className='w-full bg-blue-500 text-white py-3 rounded-lg font-semibold text-base hover:bg-blue-600 transition-colors duration-300 shadow-md hover:shadow-lg mt-6 flex items-center justify-center gap-2'
              >
                {state === 'Sign Up' ? (
                  <>
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' />
                    </svg>
                    Create Account
                  </>
                ) : (
                  <>
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1' />
                    </svg>
                    Login
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Footer Section */}
          <div className='px-8 py-6 bg-gray-50 border-t border-gray-200 text-center'>
            {state === 'Sign Up' ? (
              <p className='text-sm text-gray-600'>
                Already have an account?{' '}
                <span 
                  onClick={() => setState('Login')} 
                  className='text-primary font-semibold hover:underline cursor-pointer transition-all'
                >
                  Login here
                </span>
              </p>
            ) : (
              <p className='text-sm text-gray-600'>
                Don&apos;t have an account?{' '}
                <span 
                  onClick={() => setState('Sign Up')} 
                  className='text-primary font-semibold hover:underline cursor-pointer transition-all'
                >
                  Sign up here
                </span>
              </p>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}

export default Login