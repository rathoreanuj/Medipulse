
import { motion } from 'framer-motion'
import { assets } from '../assets/assets'

const About = () => {
 
  return (
    <div>

      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className='bg-white border-b border-gray-200'
      >
        <div className='max-w-6xl mx-auto px-4 py-12 text-center'>
          <h1 className='text-2xl md:text-3xl font-semibold text-gray-900 mb-2'>
            About <span className='text-primary'>MediPulse</span>
          </h1>
          <p className='text-base text-gray-600 max-w-3xl mx-auto'>
            Delivering trusted healthcare through technology and compassion
          </p>
        </div>
      </motion.div>

      {/* Two Column Layout - Main Content */}
      <div className='max-w-6xl mx-auto px-4 py-16'>
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className='grid md:grid-cols-2 items-center'
        >
          {/* Left Side - Image */}
          <div className='relative'>
            <div className='absolute -top-4 -left-4 w-48 h-48 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30'></div>
            <img 
              className='relative w-full md:max-w-[360px] rounded-lg shadow-md' 
              src={assets.about_image} 
              alt="Healthcare professionals" 
            />
          </div>

          {/* Right Side - Description */}
          <div className='space-y-6'>
            <h2 className='text-2xl font-semibold text-gray-900'>
              Simplifying Healthcare Access
            </h2>
            <p className='text-gray-700 leading-relaxed'>
              Welcome to <span className='font-semibold text-primary'>MediPulse</span>, your trusted partner in managing healthcare needs conveniently and efficiently. We understand the challenges individuals face when scheduling doctor appointments and managing health records.
            </p>
            <p className='text-gray-700 leading-relaxed'>
              Our platform bridges the gap between patients and healthcare providers, making it easier to access quality care when you need it. With a network of certified doctors and seamless booking technology, we&apos;re revolutionizing the healthcare experience.
            </p>
            <div className='bg-blue-50 border-l-4 border-primary p-6 rounded-r-lg'>
              <p className='text-gray-800 font-medium'>
                &quot;MediPulse is committed to excellence in healthcare technology, continuously integrating the latest advancements to improve user experience and deliver superior service.&quot;
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Mission & Vision Section */}
      <div className='bg-white py-16'>
        <div className='max-w-6xl mx-auto px-4'>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className='text-2xl md:text-3xl font-semibold text-gray-900 text-center mb-12'
          >
            Our Mission & Vision
          </motion.h2>

          <div className='grid md:grid-cols-2 gap-8'>
            {/* Mission Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className='bg-gradient-to-br from-blue-50 to-white border-2 border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow duration-300'
            >
              <div className='flex items-center mb-4'>
                <div className='w-14 h-14 bg-primary rounded-xl flex items-center justify-center mr-4'>
                  <svg className='w-8 h-8 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                </div>
                <h3 className='text-xl font-semibold text-gray-900'>Our Mission</h3>
              </div>
              <p className='text-gray-700 leading-relaxed'>
                To provide accessible, efficient, and personalized healthcare services by connecting patients with trusted medical professionals through innovative technology. We strive to eliminate barriers in healthcare access and ensure every individual receives timely medical attention.
              </p>
            </motion.div>

            {/* Vision Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className='bg-gradient-to-br from-purple-50 to-white border-2 border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow duration-300'
            >
              <div className='flex items-center mb-4'>
                <div className='w-14 h-14 bg-violet-600 rounded-xl flex items-center justify-center mr-4'>
                  <svg className='w-8 h-8 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                  </svg>
                </div>
                <h3 className='text-xl font-semibold text-gray-900'>Our Vision</h3>
              </div>
              <p className='text-gray-700 leading-relaxed'>
                To create a seamless healthcare ecosystem where quality medical care is just a click away. We envision a future where technology empowers both patients and healthcare providers, making healthcare more transparent, affordable, and patient-centric.
              </p>
            </motion.div>
          </div>
        </div>
      </div>


      {/* Why Choose Us Section */}
      <div className='bg-white py-16'>
        <div className='max-w-6xl mx-auto px-4'>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className='text-2xl font-semibold text-gray-900 text-center mb-12'
          >
            Why Choose Us
          </motion.h2>
          
          <div className='grid md:grid-cols-3 gap-8'>
            
            {/* Efficiency Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className='bg-white border-2 border-gray-200 rounded-xl p-8 hover:border-primary hover:shadow-lg transition-all duration-300'
            >
              <div className='w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6'>
                <svg className='w-7 h-7 text-primary' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 10V3L4 14h7v7l9-11h-7z' />
                </svg>
              </div>
              <h3 className='text-xl font-bold text-gray-900 mb-3'>Efficiency</h3>
              <p className='text-gray-600 leading-relaxed'>
                Streamlined appointment scheduling that fits into your busy lifestyle with instant confirmations.
              </p>
            </motion.div>

            {/* Convenience Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className='bg-white border-2 border-gray-200 rounded-xl p-8 hover:border-primary hover:shadow-lg transition-all duration-300'
            >
              <div className='w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6'>
                <svg className='w-7 h-7 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
                </svg>
              </div>
              <h3 className='text-xl font-bold text-gray-900 mb-3'>Convenience</h3>
              <p className='text-gray-600 leading-relaxed'>
                Access to a network of trusted healthcare professionals in your area, anytime, anywhere.
              </p>
            </motion.div>

            {/* Personalization Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className='bg-white border-2 border-gray-200 rounded-xl p-8 hover:border-primary hover:shadow-lg transition-all duration-300'
            >
              <div className='w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6'>
                <svg className='w-7 h-7 text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                </svg>
              </div>
              <h3 className='text-xl font-bold text-gray-900 mb-3'>Personalization</h3>
              <p className='text-gray-600 leading-relaxed'>
                Tailored recommendations and reminders to help you stay on top of your health goals.
              </p>
            </motion.div>

          </div>
        </div>
      </div>

    </div>
  )
}

export default About
