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
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 2h6v2h2a1 1 0 011 1v14a1 1 0 01-1 1H7a1 1 0 01-1-1V5a1 1 0 011-1h2V2z' />
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 7h6M9 11h6M9 15h6' />
                </svg>
              </div>
              <h3 className='font-bold text-xl text-gray-800 mb-3 text-center'>Symptom Checker (AI)</h3>
              <p className='text-gray-600 text-center leading-relaxed'>
                Enter your symptoms and get AI-assisted guidance that recommends the right medical speciality so you know which doctor to consult.
              </p>
            </div>

            {/* Feature 2 */}
            <div className='bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2'>
              <div className='bg-primary w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg'>
                <svg className='w-8 h-8 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 10l4-3v10l-4-3v-4z' />
                  <rect x='3' y='7' width='10' height='10' rx='2' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round' />
                </svg>
              </div>
              <h3 className='font-bold text-xl text-gray-800 mb-3 text-center'>Online Video Consultations</h3>
              <p className='text-gray-600 text-center leading-relaxed'>
                Secure video consultations with doctors — each visit can generate an AI-powered summary of the conversation for easy follow-up and records.
              </p>
            </div>

            {/* Feature 3 */}
            <div className='bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2'>
              <div className='bg-primary w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg'>
                <svg className='w-8 h-8 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z' />
                </svg>
              </div>
              <h3 className='font-bold text-xl text-gray-800 mb-3 text-center'>Chat with Doctors</h3>
              <p className='text-gray-600 text-center leading-relaxed'>
                Message your doctor directly to ask follow-up questions or clarify doubts between appointments — quick, private and convenient.
              </p>
            </div>

            {/* Feature 4 */}
            <div className='bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2'>
              <div className='bg-primary w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg'>
                <svg className='w-8 h-8 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <circle cx='11' cy='11' r='6' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round' />
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-4.35-4.35' />
                </svg>
              </div>
              <h3 className='font-bold text-xl text-gray-800 mb-3 text-center'>Advanced Doctor Search</h3>
              <p className='text-gray-600 text-center leading-relaxed'>
                Find the right specialist by filtering doctors by speciality, location, name, experience and patient ratings — faster and more accurate.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
