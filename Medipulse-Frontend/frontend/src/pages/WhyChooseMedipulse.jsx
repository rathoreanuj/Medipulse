import React from 'react';

export default function WhyChooseMedipulse() {
  return (
    <div>
      {/* Trust & Features Section */}
      <div className='relative  py-16 mt-16'>
        <div className='max-w-7xl mx-auto px-4'>
          <div className='text-center mb-12'>
            <h2 className='text-3xl md:text-4xl font-bold text-gray-800 mb-4'>
              Why Choose <span className='text-primary'>MediPulse</span>?
            </h2>
            <p className='text-gray-600 text-lg max-w-2xl mx-auto'>
              We are committed to providing exceptional healthcare services with a patient-first approach.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'>
            {/* Feature 1 */}
            <div className='bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2'>
              <div className='bg-primary w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg'>
                <svg className='w-8 h-8 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
              </div>
              <h3 className='font-bold text-xl text-gray-800 mb-3 text-center'>24/7 Availability</h3>
              <p className='text-gray-600 text-center leading-relaxed'>
                We&apos;re here for you round the clock with emergency services and online consultations.
              </p>
            </div>

            {/* Feature 2 */}
            <div className='bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2'>
              <div className='bg-primary w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg'>
                <svg className='w-8 h-8 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' />
                </svg>
              </div>
              <h3 className='font-bold text-xl text-gray-800 mb-3 text-center'>Expert Doctors</h3>
              <p className='text-gray-600 text-center leading-relaxed'>
                Board-certified healthcare professionals with years of experience in their specialties.
              </p>
            </div>

            {/* Feature 3 */}
            <div className='bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2'>
              <div className='bg-primary w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg'>
                <svg className='w-8 h-8 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
              </div>
              <h3 className='font-bold text-xl text-gray-800 mb-3 text-center'>Quality Care</h3>
              <p className='text-gray-600 text-center leading-relaxed'>
                Your health is our top priority with state-of-the-art facilities and personalized treatment.
              </p>
            </div>

            {/* Feature 4 */}
            <div className='bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2'>
              <div className='bg-primary w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg'>
                <svg className='w-8 h-8 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 10V3L4 14h7v7l9-11h-7z' />
                </svg>
              </div>
              <h3 className='font-bold text-xl text-gray-800 mb-3 text-center'>Quick Response</h3>
              <p className='text-gray-600 text-center leading-relaxed'>
                Fast appointment booking and quick response times for all your healthcare needs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
