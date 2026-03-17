import React, { useContext, useEffect, useState, useRef } from 'react'
import { AppContext } from '../context/AppContext'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'

const Doctors = () => {

  const { speciality } = useParams()

  const [filterDoc, setFilterDoc] = useState([])
  const [showFilter, setShowFilter] = useState(false)
  const navigate = useNavigate();

  const { doctors, backendUrl } = useContext(AppContext)

  // ─── Smart Search state ─────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)   // null = not searched yet
  const [parsedFilters, setParsedFilters] = useState([])
  const [searching, setSearching] = useState(false)
  const searchInputRef = useRef(null)

  const handleSmartSearch = async (e) => {
    e?.preventDefault()
    if (!searchQuery.trim()) return
    setSearching(true)
    setSearchResults(null)
    try {
      const { data } = await axios.post(`${backendUrl}/api/user/smart-search`, { query: searchQuery.trim() })
      if (data.success) {
        setSearchResults(data.doctors)
        setParsedFilters(data.parsedFilters || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSearching(false)
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults(null)
    setParsedFilters([])
  }

  const applyFilter = () => {
    let list = speciality ? doctors.filter(doc => doc.speciality === speciality) : [...doctors]
    // Sort: featured first → then highest average rating → then by name
    list.sort((a, b) => {
      const aFeatured = a.isFeatured && a.featuredUntil && new Date(a.featuredUntil) > new Date()
      const bFeatured = b.isFeatured && b.featuredUntil && new Date(b.featuredUntil) > new Date()
      if (aFeatured && !bFeatured) return -1
      if (!aFeatured && bFeatured) return 1
      // Both same featured status → sort by rating descending
      return (b.averageRating || 0) - (a.averageRating || 0)
    })
    setFilterDoc(list)
  }

  useEffect(() => {
    applyFilter()
  }, [doctors, speciality])

  return (
    <div className='max-w-7xl mx-auto px-4 py-8'>

      {/* ─── Smart Search Bar ──────────────────────────────────────────────── */}
      <div className='mb-6'>
        <form onSubmit={handleSmartSearch} className='flex gap-2 items-center'>
          <div className='relative flex-1'>
            <svg className='absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z' />
            </svg>
            <input
              ref={searchInputRef}
              type='text'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder='Try: "affordable cardiologist in Delhi with good ratings"'
              className='w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors bg-white shadow-sm'
            />
            {searchQuery && (
              <button type='button' onClick={clearSearch} className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'>
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            )}
          </div>
          <button
            type='submit'
            disabled={searching || !searchQuery.trim()}
            className='px-5 py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap'
          >
            {searching ? (
              <span className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
            ) : (
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 10V3L4 14h7v7l9-11h-7z' />
              </svg>
            )}
            Smart Search
          </button>
        </form>

        {/* Parsed filter tags */}
        {searchResults !== null && (
          <div className='mt-3 flex flex-wrap items-center gap-2'>
            <span className='text-xs text-gray-500 font-medium'>Detected:</span>
            {parsedFilters.length > 0 ? parsedFilters.map((f, i) => (
              <span key={i} className='inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full'>
                ✓ {f}
              </span>
            )) : (
              <span className='text-xs text-gray-400 italic'>No specific filters detected — showing all available doctors</span>
            )}
            <button onClick={clearSearch} className='ml-auto text-xs text-gray-400 hover:text-gray-600 underline'>
              Clear search
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className='flex flex-col sm:flex-row items-start gap-6'>
        
        {/* Hide sidebar when smart search is active */}
        {searchResults === null && (
        <>
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
        </> 
        )}

        {/* Doctors Grid */}
        <div className='flex-1'>
          {/* Results Count */}
          <div className='mb-4'>
            {searchResults !== null ? (
              <p className='text-gray-600 text-sm'>
                <span className='font-semibold text-primary'>{searchResults.length}</span> {searchResults.length === 1 ? 'doctor' : 'doctors'} matched your search
              </p>
            ) : (
              <p className='text-gray-600 text-sm'>
                {filterDoc.length} {filterDoc.length === 1 ? 'doctor' : 'doctors'} found
                {speciality && <span className='font-semibold'> in {speciality}</span>}
              </p>
            )}
          </div>

          {/* Doctors Cards */}
          {(() => {
            const displayDoc = searchResults !== null ? searchResults : filterDoc
            return displayDoc.length === 0 ? (
              <div className='text-center py-16 bg-gray-50 rounded-xl'>
                <svg className='w-20 h-20 mx-auto text-gray-300 mb-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' />
                </svg>
                <p className='text-gray-500 text-lg font-medium'>No doctors found</p>
                <p className='text-gray-400 mt-2'>{searchResults !== null ? 'Try a different search query' : 'Try selecting a different specialty'}</p>
                {searchResults !== null && <button onClick={clearSearch} className='mt-3 text-sm text-primary underline'>Clear search</button>}
              </div>
            ) : (
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5'>
                {displayDoc.map((item, index) => (
                  <div 
                    onClick={() => { navigate(`/appointment/${item._id}`); scrollTo(0, 0) }} 
                    className='bg-white border-2 border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:shadow-lg hover:border-primary transition-all duration-300 group max-w-xs' 
                    key={index}
                  >
                    {/* Doctor Image */}
                    <div className='overflow-hidden bg-blue-50 relative'>
                      <img 
                        className='w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300' 
                        src={item.image} 
                        alt={item.name} 
                      />
                      {item.isFeatured && item.featuredUntil && new Date(item.featuredUntil) > new Date() && (
                        <span className='absolute top-2 left-2 bg-primary text-white text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md'>
                          ⭐ Featured
                        </span>
                      )}
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
                      <p className='text-gray-600 text-sm font-medium mb-2'>{item.speciality}</p>
                      
                      {/* Rating */}
                      <div className='flex items-center gap-1.5 mb-3'>
                        {item.totalReviews > 0 ? (
                          <>
                            <div className='flex items-center'>
                              {[1,2,3,4,5].map(s => (
                                <span key={s} className={`text-base ${s <= Math.round(item.averageRating) ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                              ))}
                            </div>
                            <span className='text-sm font-semibold text-gray-700'>{item.averageRating.toFixed(1)}</span>
                            <span className='text-xs text-gray-400'>({item.totalReviews})</span>
                          </>
                        ) : (
                          <span className='text-xs text-gray-400'>No reviews yet</span>
                        )}
                      </div>
                      
                      {/* Fees — shown in smart search mode */}
                      {searchResults !== null && (
                        <p className='text-xs text-primary font-semibold mb-2'>₹{item.fees} consultation fee</p>
                      )}

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
            )
          })()}
        </div>
      </div>
    </div>
  )
}

export default Doctors