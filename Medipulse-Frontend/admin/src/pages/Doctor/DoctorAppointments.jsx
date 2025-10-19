import React from 'react'
import { useContext, useEffect } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'

const DoctorAppointments = () => {

  const { dToken, appointments, getAppointments, cancelAppointment, completeAppointment } = useContext(DoctorContext)
  const { slotDateFormat, calculateAge, currency } = useContext(AppContext)

  useEffect(() => {
    if (dToken) {
      getAppointments()
    }
  }, [dToken, getAppointments])

  return (
    <div className='w-full max-w-7xl p-6'>

      {/* Appointments Table */}
      <div className='bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden'>
        
        {/* Table Header */}
        <div className='hidden sm:grid sm:grid-cols-[0.5fr_2.5fr_1fr_1fr_2.5fr_1fr_1.5fr] bg-gray-50 border-b border-gray-200 py-3 px-6'>
          <p className='text-xs font-semibold text-gray-600 uppercase'>#</p>
          <p className='text-xs font-semibold text-gray-600 uppercase'>Patient</p>
          <p className='text-xs font-semibold text-gray-600 uppercase'>Payment</p>
          <p className='text-xs font-semibold text-gray-600 uppercase'>Age</p>
          <p className='text-xs font-semibold text-gray-600 uppercase'>Date & Time</p>
          <p className='text-xs font-semibold text-gray-600 uppercase'>Fee</p>
          <p className='text-xs font-semibold text-gray-600 uppercase'>Action</p>
        </div>

        {/* Table Body */}
        <div className='divide-y divide-gray-200 max-h-[calc(100vh-250px)] overflow-y-auto'>
          {appointments.length === 0 ? (
            <div className='text-center py-12'>
              <svg className='w-16 h-16 mx-auto text-gray-300 mb-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
              </svg>
              <p className='text-gray-500 font-medium'>No appointments found</p>
              <p className='text-gray-400 text-sm mt-1'>Your appointments will appear here</p>
            </div>
          ) : (
            appointments.map((item, index) => (
              <div 
                className='grid grid-cols-1 sm:grid-cols-[0.5fr_2.5fr_1fr_1fr_2.5fr_1fr_1.5fr] items-center py-4 px-6 hover:bg-gray-50 transition-colors' 
                key={index}
              >
                {/* Index */}
                <p className='text-gray-600 font-medium hidden sm:block'>{index + 1}</p>

                {/* Patient Info */}
                <div className='flex items-center gap-3'>
                  <img 
                    src={item.userData.image} 
                    className='w-10 h-10 rounded-full object-cover border border-gray-200' 
                    alt={item.userData.name} 
                  />
                  <div>
                    <p className='font-medium text-gray-800'>{item.userData.name}</p>
                    <p className='text-xs text-gray-500 sm:hidden'>Age: {calculateAge(item.userData.dob)}</p>
                  </div>
                </div>

                {/* Payment Method */}
                <div className='hidden sm:block'>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                    item.payment 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                      : 'bg-gray-100 text-gray-700 border border-gray-300'
                  }`}>
                    {item.payment ? 'Online' : 'Cash'}
                  </span>
                </div>

                {/* Age */}
                <p className='text-gray-600 hidden sm:block'>{calculateAge(item.userData.dob)}</p>

                {/* Date & Time */}
                <div className='text-gray-600'>
                  <p className='font-medium'>{slotDateFormat(item.slotDate)}</p>
                  <p className='text-xs text-gray-500'>{item.slotTime}</p>
                </div>

                {/* Fee */}
                <p className='text-gray-800 font-semibold'>{currency}{item.amount}</p>

                {/* Status/Action */}
                <div>
                  {item.cancelled ? (
                    <span className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 text-xs font-semibold rounded-full border border-red-200'>
                      <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 20 20'>
                        <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z' clipRule='evenodd' />
                      </svg>
                      Cancelled
                    </span>
                  ) : item.isCompleted ? (
                    <span className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-200'>
                      <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 20 20'>
                        <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                      </svg>
                      Completed
                    </span>
                  ) : (
                    <div className='flex gap-2'>
                      <button 
                        onClick={() => completeAppointment(item._id)}
                        className='inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50 border border-green-200 rounded-lg transition-colors'
                        title='Mark as Complete'
                      >
                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                        </svg>
                      </button>
                      <button 
                        onClick={() => cancelAppointment(item._id)}
                        className='inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors'
                        title='Cancel'
                      >
                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  )
}

export default DoctorAppointments