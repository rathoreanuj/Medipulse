import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import { useNavigate, useParams, useLocation } from 'react-router-dom'

// ─── Helper ───────────────────────────────────────────────────────────────────
const parseExp = (exp = '') => parseInt(exp) || 0

// ─── FilterSection wrapper ────────────────────────────────────────────────────
const FilterSection = ({ title, children }) => (
  <div className='border-b border-gray-100 pb-4 mb-4 last:border-0 last:pb-0 last:mb-0'>
    <p className='text-xs font-bold text-gray-500 uppercase tracking-wider mb-3'>{title}</p>
    {children}
  </div>
)

const SPECIALITIES = [
  'General physician', 'Gynecologist', 'Dermatologist',
  'Pediatricians', 'Neurologist', 'Gastroenterologist',
]

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured / Relevance' },
  { value: 'rating_desc', label: 'Rating: High to Low' },
  { value: 'fee_asc', label: 'Fee: Low to High' },
  { value: 'fee_desc', label: 'Fee: High to Low' },
  { value: 'exp_desc', label: 'Experience: Most First' },
]

const RATING_OPTIONS = [
  { value: '0', label: 'Any Rating' },
  { value: '3', label: '3★ & above' },
  { value: '4', label: '4★ & above' },
  { value: '4.5', label: '4.5★ & above' },
]

const EXPERIENCE_OPTIONS = [
  { value: '', label: 'Any Experience' },
  { value: '0-5', label: '0 - 5 Years' },
  { value: '5-10', label: '5 - 10 Years' },
  { value: '10+', label: '10+ Years' },
]

const FEE_OPTIONS = [
  { value: '', label: 'Any Fee' },
  { value: 'u500', label: 'Under ₹500' },
  { value: '500-1000', label: '₹500 - ₹1,000' },
  { value: '1000+', label: '₹1,000+' },
]

const Doctors = () => {
  const { speciality } = useParams()
  const location = useLocation()

  const [filterDoc, setFilterDoc] = useState([])
  const [showFilter, setShowFilter] = useState(false)
  const navigate = useNavigate()

  const { doctors } = useContext(AppContext)

  // ─── Extra filter state ───────────────────────────────────────────────────
  const [availOnly, setAvailOnly] = useState(false)
  const [minRating, setMinRating] = useState(0)        // 0 = any
  const [expRange, setExpRange] = useState('')          // '' | '0-5' | '5-10' | '10+'
  const [feeRange, setFeeRange] = useState('')          // '' | 'u500' | '500-1000' | '1000+'
  const [sortBy, setSortBy] = useState('featured')

  // ─── Smart Search results passed via navigation state ───────────────────
  const smartResults  = location.state?.smartResults  ?? null
  const parsedFilters = location.state?.parsedFilters ?? []
  const smartQuery    = location.state?.query         ?? ''

  const clearSmartSearch = () => navigate('/doctors', { replace: true, state: {} })
  const handleSpecialityChange = (value) => navigate(value ? `/doctors/${value}` : '/doctors')

  const activeFilterCount = [
    availOnly, minRating > 0, expRange !== '', feeRange !== '', sortBy !== 'featured',
  ].filter(Boolean).length

  const resetFilters = () => {
    setAvailOnly(false)
    setMinRating(0)
    setExpRange('')
    setFeeRange('')
    setSortBy('featured')
    navigate('/doctors')
  }

  const applyFilter = () => {
    let list = speciality ? doctors.filter(doc => doc.speciality === speciality) : [...doctors]

    // availability
    if (availOnly) list = list.filter(d => d.available)

    // min rating
    if (minRating > 0) list = list.filter(d => (d.averageRating || 0) >= minRating)

    // experience range
    if (expRange === '0-5')  list = list.filter(d => parseExp(d.experience) < 5)
    if (expRange === '5-10') list = list.filter(d => parseExp(d.experience) >= 5 && parseExp(d.experience) < 10)
    if (expRange === '10+')  list = list.filter(d => parseExp(d.experience) >= 10)

    // fee range
    if (feeRange === 'u500')     list = list.filter(d => (d.fees || 0) < 500)
    if (feeRange === '500-1000') list = list.filter(d => (d.fees || 0) >= 500 && (d.fees || 0) <= 1000)
    if (feeRange === '1000+')    list = list.filter(d => (d.fees || 0) > 1000)

    // sort
    list.sort((a, b) => {
      const aFt = a.isFeatured && a.featuredUntil && new Date(a.featuredUntil) > new Date()
      const bFt = b.isFeatured && b.featuredUntil && new Date(b.featuredUntil) > new Date()

      if (sortBy === 'featured') {
        if (aFt && !bFt) return -1
        if (!aFt && bFt) return 1
        return (b.averageRating || 0) - (a.averageRating || 0)
      }
      if (sortBy === 'rating_desc') return (b.averageRating || 0) - (a.averageRating || 0)
      if (sortBy === 'fee_asc')     return (a.fees || 0) - (b.fees || 0)
      if (sortBy === 'fee_desc')    return (b.fees || 0) - (a.fees || 0)
      if (sortBy === 'exp_desc')    return parseExp(b.experience) - parseExp(a.experience)
      return 0
    })

    setFilterDoc(list)
  }

  useEffect(() => {
    applyFilter()
  }, [doctors, speciality, availOnly, minRating, expRange, feeRange, sortBy])

  return (
    <div className='max-w-7xl mx-auto px-4 py-8'>

      {/* Smart search result banner */}
      {smartResults !== null && (
        <div className='mb-5 flex flex-wrap items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3'>
          <svg className='w-4 h-4 text-primary flex-shrink-0' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' d='M13 10V3L4 14h7v7l9-11h-7z' />
          </svg>
          <span className='text-sm text-gray-600'>Smart Search: <span className='font-semibold text-gray-800'>&ldquo;{smartQuery}&rdquo;</span></span>
          {parsedFilters.map((f, i) => (
            <span key={i} className='bg-primary/10 text-primary text-xs font-semibold px-2.5 py-0.5 rounded-full'>✓ {f}</span>
          ))}
          <button onClick={clearSmartSearch} className='ml-auto text-xs text-gray-400 hover:text-red-500 underline transition-colors'>
            Clear search
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className='flex flex-col sm:flex-row items-start gap-6'>

        {/* Hide sidebar when smart search is active */}
        {smartResults === null && (
          <>
            {/* Mobile Filter Toggle Button */}
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`py-2 px-4 border-2 rounded-lg text-sm font-medium transition-all sm:hidden flex items-center gap-2 ${showFilter ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-700'}`}
            >
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z' />
              </svg>
              Filters {activeFilterCount > 0 && <span className='bg-white text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold'>{activeFilterCount}</span>}
            </button>

            {/* Sidebar Filter */}
            <div className={`flex-col gap-4 ${showFilter ? 'flex' : 'hidden sm:flex'} sm:w-64 flex-shrink-0 sm:sticky sm:top-24 sm:max-h-[calc(100vh-7rem)] sm:overflow-y-auto`}>
              <div className='bg-white border border-gray-200 rounded-xl p-4 shadow-sm'>

                {/* Header */}
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-base font-bold text-gray-800 flex items-center gap-2'>
                    <svg className='w-4 h-4 text-primary' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z' />
                    </svg>
                    Filters
                  </h3>
                  {activeFilterCount > 0 && (
                    <button onClick={resetFilters} className='text-xs text-red-500 hover:text-red-700 font-medium transition-colors'>
                      Reset all
                    </button>
                  )}
                </div>

                {/* ── Sort By ── */}
                <FilterSection title='Sort By'>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className='w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-primary bg-white'
                  >
                    {SORT_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </FilterSection>

                {/* ── Speciality ── */}
                <FilterSection title='Speciality'>
                  <select
                    value={speciality || ''}
                    onChange={e => handleSpecialityChange(e.target.value)}
                    className='w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-primary bg-white'
                  >
                    <option value=''>All Specialities</option>
                    {SPECIALITIES.map(sp => (
                      <option key={sp} value={sp}>{sp === 'General physician' ? 'General Physician' : sp}</option>
                    ))}
                  </select>
                </FilterSection>

                {/* ── Availability ── */}
                <FilterSection title='Availability'>
                  <label className='flex items-center gap-3 cursor-pointer select-none'>
                    <div
                      onClick={() => setAvailOnly(v => !v)}
                      className={`w-10 h-5 rounded-full transition-colors duration-200 flex items-center px-0.5 ${availOnly ? 'bg-primary' : 'bg-gray-200'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${availOnly ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                    <span className='text-sm text-gray-700 font-medium'>Available Only</span>
                  </label>
                </FilterSection>

                {/* ── Min Rating ── */}
                <FilterSection title='Minimum Rating'>
                  <select
                    value={String(minRating)}
                    onChange={e => setMinRating(Number(e.target.value))}
                    className='w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-primary bg-white'
                  >
                    {RATING_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </FilterSection>

                {/* ── Experience ── */}
                <FilterSection title='Experience'>
                  <select
                    value={expRange}
                    onChange={e => setExpRange(e.target.value)}
                    className='w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-primary bg-white'
                  >
                    {EXPERIENCE_OPTIONS.map(option => (
                      <option key={option.value || 'any'} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </FilterSection>

                {/* ── Fee Range ── */}
                <FilterSection title='Consultation Fee'>
                  <select
                    value={feeRange}
                    onChange={e => setFeeRange(e.target.value)}
                    className='w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-primary bg-white'
                  >
                    {FEE_OPTIONS.map(option => (
                      <option key={option.value || 'any'} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </FilterSection>

              </div>
            </div>
          </>
        )}

        {/* Doctors Grid */}
        <div className='flex-1 min-w-0'>
          {/* Results Count + active filter chips */}
          <div className='flex flex-wrap items-center gap-2 mb-4'>
            {smartResults !== null ? (
              <p className='text-gray-600 text-sm'>
                <span className='font-semibold text-primary'>{smartResults.length}</span> {smartResults.length === 1 ? 'doctor' : 'doctors'} matched your search
              </p>
            ) : (
              <p className='text-gray-600 text-sm'>
                <span className='font-semibold text-primary'>{filterDoc.length}</span> {filterDoc.length === 1 ? 'doctor' : 'doctors'} found
                {speciality && <span className='font-semibold'> in {speciality}</span>}
              </p>
            )}
            {/* Active filter chips */}
            {availOnly && (
              <span className='inline-flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium'>
                Available only
                <button onClick={() => setAvailOnly(false)} className='ml-0.5 hover:text-red-500'>×</button>
              </span>
            )}
            {minRating > 0 && (
              <span className='inline-flex items-center gap-1 bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-medium'>
                {minRating}★+
                <button onClick={() => setMinRating(0)} className='ml-0.5 hover:text-red-500'>×</button>
              </span>
            )}
            {expRange && (
              <span className='inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium'>
                {expRange === '0-5' ? '0-5 yrs' : expRange === '5-10' ? '5-10 yrs' : '10+ yrs'}
                <button onClick={() => setExpRange('')} className='ml-0.5 hover:text-red-500'>×</button>
              </span>
            )}
            {feeRange && (
              <span className='inline-flex items-center gap-1 bg-purple-50 border border-purple-200 text-purple-700 text-xs px-2 py-0.5 rounded-full font-medium'>
                {feeRange === 'u500' ? '<₹500' : feeRange === '500-1000' ? '₹500-1k' : '₹1k+'}
                <button onClick={() => setFeeRange('')} className='ml-0.5 hover:text-red-500'>×</button>
              </span>
            )}
          </div>

          {/* Doctors Cards */}
          {(() => {
            const displayDoc = smartResults !== null ? smartResults : filterDoc
            return displayDoc.length === 0 ? (
              <div className='text-center py-16 bg-gray-50 rounded-xl'>
                <svg className='w-20 h-20 mx-auto text-gray-300 mb-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' />
                </svg>
                <p className='text-gray-500 text-lg font-medium'>No doctors found</p>
                <p className='text-gray-400 mt-2 text-sm'>
                  {smartResults !== null ? 'Try a different search query' : 'Try adjusting your filters'}
                </p>
                {smartResults !== null
                  ? <button onClick={clearSmartSearch} className='mt-3 text-sm text-primary underline'>Clear search</button>
                  : activeFilterCount > 0 && <button onClick={resetFilters} className='mt-3 text-sm text-primary underline'>Reset filters</button>
                }
              </div>
            ) : (
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5'>
                {displayDoc.map((item, index) => (
                  <div
                    onClick={() => { navigate(`/appointment/${item._id}`); scrollTo(0, 0) }}
                    className='bg-white border-2 border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:shadow-lg hover:border-primary transition-all duration-300 group'
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
                      <div className='flex items-center gap-1.5 mb-2'>
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

                      {/* Experience + Fee row */}
                      <div className='flex items-center justify-between mb-3'>
                        {item.experience && (
                          <span className='text-xs text-gray-500 flex items-center gap-1'>
                            <svg className='w-3.5 h-3.5 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                            </svg>
                            {item.experience}
                          </span>
                        )}
                        {item.fees && (
                          <span className='text-xs font-semibold text-primary'>₹{item.fees}</span>
                        )}
                      </div>

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