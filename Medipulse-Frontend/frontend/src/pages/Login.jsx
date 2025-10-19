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
            
            {/* Full Name Field (Sign Up only) */}
            {state === 'Sign Up' && (
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1.5'>
                  Full Name
                </label>
                <input 
                  onChange={(e) => setName(e.target.value)} 
                  value={name} 
                  className='w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none text-gray-700' 
                  type="text" 
                  placeholder='John Doe'
                  required 
                />
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1.5'>
                Email
              </label>
              <input 
                onChange={(e) => setEmail(e.target.value)} 
                value={email} 
                className='w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none text-gray-700' 
                type="email" 
                placeholder='you@example.com'
                required 
              />
            </div>

            {/* Password Field */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1.5'>
                Password
              </label>
              <input 
                onChange={(e) => setPassword(e.target.value)} 
                value={password} 
                className='w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none text-gray-700' 
                type="password" 
                placeholder='Enter your password'
                required 
              />
            </div>

            {/* Submit Button */}
            <button 
              type='submit'
              className='w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-blue-600 mt-6'
            >
              {state === 'Sign Up' ? 'Create Account' : 'Login'}
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
        </div>
      </form>
    </div>
  )
}

export default Login