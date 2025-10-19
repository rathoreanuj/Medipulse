import { useState } from 'react'
import { toast } from 'react-toastify'

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const validatePhone = (phone) => {
    const re = /^\d{10}$/
    return re.test(phone.replace(/[-\s]/g, ''))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required'
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Name must be at least 3 characters'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid 10-digit phone number'
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required'
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    setIsSubmitting(true)

    setTimeout(() => {
      toast.success('Message sent successfully! We will get back to you soon.')
      setFormData({ name: '', email: '', phone: '', message: '' })
      setErrors({})
      setIsSubmitting(false)
    }, 1500)
  }


  return (
    <div className='bg-white'>
      
      {/* Simple Header */}
      <div className='border-b border-gray-200'>
        <div className='max-w-6xl mx-auto px-4 py-12 text-center'>
          <h1 className='text-3xl font-semibold text-gray-900 mb-2'>Contact <span className='text-primary'>Us</span></h1>
          <p className='text-gray-600'>Get in touch with our team. We typically respond within 24 hours.</p>
        </div>
      </div>

      {/* Main Content */}
      <div className='max-w-6xl mx-auto px-4 py-12'>
        <div className='grid md:grid-cols-3 gap-10'>
          
          {/* Contact Info */}
          <div className='md:col-span-1 space-y-6'>
            
            {/* Office Address Box */}
            <div className='bg-white border-2 border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow'>
              <h3 className='text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200'>Office Address</h3>
              <p className='text-gray-700 text-sm leading-relaxed'>
                54709 Willms Station<br />
                Suite 350<br />
                Washington, USA 98101
              </p>
            </div>

            {/* Contact Box */}
            <div className='bg-white border-2 border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow'>
              <h3 className='text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200'>Contact</h3>
              <div className='text-gray-700 text-sm space-y-2'>
                <p><span className='font-medium'>Phone:</span> <a href='tel:+14155550132' className='text-primary hover:underline'>+1 (415) 555-0132</a></p>
                <p><span className='font-medium'>Email:</span> <a href='mailto:anujrathore385@gmail.com' className='text-primary hover:underline break-all'>anujrathore385@gmail.com</a></p>
              </div>
            </div>

            {/* Hours Box */}
            <div className='bg-white border-2 border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow'>
              <h3 className='text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200'>Hours</h3>
              <div className='text-gray-700 text-sm space-y-2'>
                <p><span className='font-medium'>Monday - Friday:</span> 9:00 AM - 8:00 PM</p>
                <p><span className='font-medium'>Saturday:</span> 10:00 AM - 6:00 PM</p>
                <p><span className='font-medium'>Sunday:</span> Emergency Only</p>
              </div>
            </div>

          </div>

          {/* Contact Form */}
          <div className='md:col-span-2'>
            <div className='bg-gray-50 border border-gray-200 rounded-lg p-8'>
              <h2 className='text-xl font-semibold text-gray-900 mb-6'>Send us a message</h2>
              
              <form onSubmit={handleSubmit} className='space-y-5'>
                
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1.5'>
                    Full Name *
                  </label>
                  <input
                    type='text'
                    name='name'
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-3 py-2.5 border ${
                      errors.name ? 'border-red-400' : 'border-gray-300'
                    } rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary`}
                    placeholder='John Doe'
                  />
                  {errors.name && (
                    <p className='mt-1.5 text-sm text-red-600'>{errors.name}</p>
                  )}
                </div>

                <div className='grid md:grid-cols-2 gap-5'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1.5'>
                      Email *
                    </label>
                    <input
                      type='email'
                      name='email'
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-3 py-2.5 border ${
                        errors.email ? 'border-red-400' : 'border-gray-300'
                      } rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary`}
                      placeholder='john@example.com'
                    />
                    {errors.email && (
                      <p className='mt-1.5 text-sm text-red-600'>{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1.5'>
                      Phone *
                    </label>
                    <input
                      type='tel'
                      name='phone'
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full px-3 py-2.5 border ${
                        errors.phone ? 'border-red-400' : 'border-gray-300'
                      } rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary`}
                      placeholder='1234567890'
                    />
                    {errors.phone && (
                      <p className='mt-1.5 text-sm text-red-600'>{errors.phone}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1.5'>
                    Message *
                  </label>
                  <textarea
                    name='message'
                    value={formData.message}
                    onChange={handleChange}
                    rows='5'
                    className={`w-full px-3 py-2.5 border ${
                      errors.message ? 'border-red-400' : 'border-gray-300'
                    } rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none`}
                    placeholder='Tell us how we can help you...'
                  ></textarea>
                  {errors.message && (
                    <p className='mt-1.5 text-sm text-red-600'>{errors.message}</p>
                  )}
                </div>

                <button
                  type='submit'
                  disabled={isSubmitting}
                  className='bg-primary text-white px-6 py-2.5 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium'
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>

        </div>

        {/* Map Section */}
        <div className='mt-12'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>Location</h3>
          <div className='border border-gray-200 rounded-lg overflow-hidden h-96'>
            <iframe
              src='https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.1841374373857!2d-73.98784368459418!3d40.74844097932847!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c259a9b3117469%3A0xd134e199a405a163!2sEmpire%20State%20Building!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus'
              width='100%'
              height='100%'
              style={{ border: 0 }}
              allowFullScreen=''
              loading='lazy'
              referrerPolicy='no-referrer-when-downgrade'
              title='MediPulse Clinic Location'
            ></iframe>
          </div>
        </div>
      </div>

    </div>
  )
}

export default Contact
