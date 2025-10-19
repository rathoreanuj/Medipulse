import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import { useNavigate, useParams } from 'react-router-dom'

const Doctors = () => {

  const { speciality } = useParams()

  const [filterDoc, setFilterDoc] = useState([])
  const [showFilter, setShowFilter] = useState(false)
  const navigate = useNavigate();

  const { doctors } = useContext(AppContext)

  const applyFilter = () => {
    if (speciality) {
      setFilterDoc(doctors.filter(doc => doc.speciality === speciality))
    } else {
      setFilterDoc(doctors)
    }
  }

  useEffect(() => {
    applyFilter()
  }, [doctors, speciality])

  return (
    <div className='max-w-7xl mx-auto px-4 py-8'>

      {/* Main Content */}
      <div className='flex flex-col sm:flex-row items-start gap-6'>
        
        {/* Mobile Filter Toggle Button */}
        <button 
          onClick={() => setShowFilter(!showFilter)} 
          className={`py-2 px-4 border-2 rounded-lg text-sm font-medium transition-all sm:hidden flex items-center gap-2 ${showFilter ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-700'}`}
        >
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z' />
          </svg>
          {showFilter ? 'Hide Filters' : 'Show Filters'}
        </button>

        {/* Sidebar Filter */}
        <div className={`flex-col gap-3 ${showFilter ? 'flex' : 'hidden sm:flex'} sm:w-64 flex-shrink-0`}>
          <div className='bg-white border border-gray-200 rounded-xl p-4 shadow-sm'>
            <h3 className='text-lg font-bold text-gray-800 mb-4 flex items-center gap-2'>
              <svg className='w-5 h-5 text-primary' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' />
              </svg>
              Specialties
            </h3>
            <div className='space-y-2'>
              <div 
                onClick={() => speciality === 'General physician' ? navigate('/doctors') : navigate('/doctors/General physician')} 
                className={`px-4 py-3 border-2 rounded-lg cursor-pointer transition-all duration-300 ${speciality === 'General physician' ? 'bg-primary text-white border-primary shadow-md' : 'border-gray-200 hover:border-primary hover:bg-blue-50'}`}
              >
                <p className='font-medium text-sm'>General Physician</p>
              </div>
              <div 
                onClick={() => speciality === 'Gynecologist' ? navigate('/doctors') : navigate('/doctors/Gynecologist')} 
                className={`px-4 py-3 border-2 rounded-lg cursor-pointer transition-all duration-300 ${speciality === 'Gynecologist' ? 'bg-primary text-white border-primary shadow-md' : 'border-gray-200 hover:border-primary hover:bg-blue-50'}`}
              >
                <p className='font-medium text-sm'>Gynecologist</p>
              </div>
              <div 
                onClick={() => speciality === 'Dermatologist' ? navigate('/doctors') : navigate('/doctors/Dermatologist')} 
                className={`px-4 py-3 border-2 rounded-lg cursor-pointer transition-all duration-300 ${speciality === 'Dermatologist' ? 'bg-primary text-white border-primary shadow-md' : 'border-gray-200 hover:border-primary hover:bg-blue-50'}`}
              >
                <p className='font-medium text-sm'>Dermatologist</p>
              </div>
              <div 
                onClick={() => speciality === 'Pediatricians' ? navigate('/doctors') : navigate('/doctors/Pediatricians')} 
                className={`px-4 py-3 border-2 rounded-lg cursor-pointer transition-all duration-300 ${speciality === 'Pediatricians' ? 'bg-primary text-white border-primary shadow-md' : 'border-gray-200 hover:border-primary hover:bg-blue-50'}`}
              >
                <p className='font-medium text-sm'>Pediatricians</p>
              </div>
              <div 
                onClick={() => speciality === 'Neurologist' ? navigate('/doctors') : navigate('/doctors/Neurologist')} 
                className={`px-4 py-3 border-2 rounded-lg cursor-pointer transition-all duration-300 ${speciality === 'Neurologist' ? 'bg-primary text-white border-primary shadow-md' : 'border-gray-200 hover:border-primary hover:bg-blue-50'}`}
              >
                <p className='font-medium text-sm'>Neurologist</p>
              </div>
              <div 
                onClick={() => speciality === 'Gastroenterologist' ? navigate('/doctors') : navigate('/doctors/Gastroenterologist')} 
                className={`px-4 py-3 border-2 rounded-lg cursor-pointer transition-all duration-300 ${speciality === 'Gastroenterologist' ? 'bg-primary text-white border-primary shadow-md' : 'border-gray-200 hover:border-primary hover:bg-blue-50'}`}
              >
                <p className='font-medium text-sm'>Gastroenterologist</p>
              </div>
            </div>
          </div>
        </div>

        {/* Doctors Grid */}
        <div className='flex-1'>
          {/* Results Count */}
          <div className='mb-4'>
            <p className='text-gray-600 text-sm'>
              {filterDoc.length} {filterDoc.length === 1 ? 'doctor' : 'doctors'} found
              {speciality && <span className='font-semibold'> in {speciality}</span>}
            </p>
          </div>

          {/* Doctors Cards */}
          {filterDoc.length === 0 ? (
            <div className='text-center py-16 bg-gray-50 rounded-xl'>
              <svg className='w-20 h-20 mx-auto text-gray-300 mb-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' />
              </svg>
              <p className='text-gray-500 text-lg font-medium'>No doctors found</p>
              <p className='text-gray-400 mt-2'>Try selecting a different specialty</p>
            </div>
          ) : (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5'>
              {filterDoc.map((item, index) => (
                <div 
                  onClick={() => { navigate(`/appointment/${item._id}`); scrollTo(0, 0) }} 
                  className='bg-white border-2 border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:shadow-lg hover:border-primary transition-all duration-300 group max-w-xs' 
                  key={index}
                >
                  {/* Doctor Image */}
                  <div className='overflow-hidden bg-blue-50'>
                    <img 
                      className='w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300' 
                      src={item.image} 
                      alt={item.name} 
                    />
                  </div>

                  {/* Doctor Info */}
                  <div className='p-4'>
                    {/* Availability Status */}
                    <div className={`flex items-center gap-1.5 mb-2 text-xs ${item.available ? 'text-green-500' : 'text-gray-500'}`}>
                      <span className={`w-2 h-2 rounded-full ${item.available ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                      <span className='font-medium'>{item.available ? 'Available' : 'Not Available'}</span>
                    </div>
                    
                    <h3 className='text-lg font-bold text-gray-800 mb-0.5 group-hover:text-primary transition-colors line-clamp-1'>
                      {item.name}
                    </h3>
                    <p className='text-gray-600 text-sm font-medium mb-3'>{item.speciality}</p>
                    
                    {/* Book Appointment Button */}
                    <button className='w-full py-2 px-3 bg-blue-50 text-gray-800 rounded-lg font-medium text-sm hover:bg-blue-100 transition-colors duration-300 flex items-center justify-center gap-2'>
                      <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                      </svg>
                      Book Appointment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Doctors