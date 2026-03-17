import React, { useState } from 'react'
import { assets } from '../assets/assets'
import SymptomChecker from './SymptomChecker'

const Header = () => {
    const [showChecker, setShowChecker] = useState(false)

    return (
        <>
        <div className='flex flex-col md:flex-row flex-wrap bg-blue-500 rounded-lg px-6 md:px-10 lg:px-20 '>

        
            <div className='md:w-1/2 flex flex-col items-start justify-center gap-4 py-10 m-auto md:py-[10vw] md:mb-[-30px]'>
                <p className='text-3xl md:text-4xl lg:text-5xl text-white font-semibold leading-tight md:leading-tight lg:leading-tight'>
                    Book Appointment <br />  With Trusted Doctors
                </p>
                <div className='flex flex-col md:flex-row items-center gap-3 text-white text-sm font-light'>
                    <img className='w-28' src={assets.group_profiles} alt="" />
                    <p>Simply browse through our extensive list of trusted doctors, <br className='hidden sm:block' /> schedule your appointment hassle-free.</p>
                </div>
                <div className='flex flex-wrap gap-3 m-auto md:m-0'>
                    <a href='#speciality' className='flex items-center gap-2 bg-white px-8 py-3 rounded-full text-[#595959] text-sm hover:scale-105 transition-all duration-300'>
                        Book appointment <img className='w-3' src={assets.arrow_icon} alt="" />
                    </a>
                    <button
                        onClick={() => setShowChecker(true)}
                        className='flex items-center gap-2 bg-white/20 hover:bg-white/30 border border-white/40 px-6 py-3 rounded-full text-white text-sm font-medium hover:scale-105 transition-all duration-300'
                    >
                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m1.636-6.364l.707.707M6.34 17.66l-.707.707M17.66 17.66l.707.707M12 21v-1M12 8a4 4 0 100 8 4 4 0 000-8z' />
                        </svg>
                        Check Symptoms with AI
                    </button>
                </div>
            </div>

            <div className='md:w-1/2 relative'>
                <img className='w-full md:absolute bottom-0 h-auto rounded-lg' src={assets.header_img} alt="" />
            </div>
        </div>

        {showChecker && <SymptomChecker onClose={() => setShowChecker(false)} />}
        </>
    )
}

export default Header