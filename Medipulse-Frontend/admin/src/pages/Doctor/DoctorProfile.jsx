import React, { useContext, useEffect, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { toast } from 'react-toastify'
import axios from 'axios'

const DoctorProfile = () => {

    const { dToken, profileData, setProfileData, getProfileData } = useContext(DoctorContext)
    const { currency, backendUrl } = useContext(AppContext)
    const [isEdit, setIsEdit] = useState(false)

    const updateProfile = async () => {

        try {

            const updateData = {
                address: profileData.address,
                fees: profileData.fees,
                about: profileData.about,
                available: profileData.available
            }

            const { data } = await axios.post(backendUrl + '/api/doctor/update-profile', updateData, { headers: { dToken } })

            if (data.success) {
                toast.success(data.message)
                setIsEdit(false)
                getProfileData()
            } else {
                toast.error(data.message)
            }

            setIsEdit(false)

        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }

    }

    useEffect(() => {
        if (dToken) {
            getProfileData()
        }
    }, [dToken])

    return profileData && (
        <div className='max-w-5xl px-10 pt-10 pb-7'>
            
            {/* Profile Header */}
            <div className='bg-white border-2 border-gray-200 rounded-lg p-6 mb-5'>
                <div className='flex flex-col sm:flex-row gap-6'>
                    {/* Profile Image */}
                    <div className='flex-shrink-0'>
                        <img 
                            className='w-40 h-40 object-cover border-2 border-gray-300 rounded-lg' 
                            src={profileData.image} 
                            alt={profileData.name} 
                        />
                    </div>

                    {/* Basic Info */}
                    <div className='flex-1'>
                        <h1 className='text-3xl font-semibold text-gray-800 mb-2'>
                            {profileData.name}
                        </h1>
                        <div className='flex flex-wrap items-center gap-2 text-gray-600 mb-3'>
                            <span className='font-medium'>{profileData.degree}</span>
                            <span>•</span>
                            <span>{profileData.speciality}</span>
                        </div>
                        <div className='inline-block px-3 py-1 bg-gray-100 text-gray-700 text-sm border border-gray-300 rounded'>
                            {profileData.experience}
                        </div>

                        {/* Availability */}
                        <div className='flex items-center gap-2 mt-4 pt-4 border-t border-gray-200'>
                            <input 
                                type="checkbox" 
                                onChange={() => isEdit && setProfileData(prev => ({ ...prev, available: !prev.available }))} 
                                checked={profileData.available}
                                className='w-4 h-4 rounded'
                                id='availableCheckbox'
                            />
                            <label htmlFor='availableCheckbox' className='text-sm text-gray-700'>
                                Available for appointments
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile Details */}
            <div className='bg-white border-2 border-gray-200 rounded-lg p-6'>
                
                {/* About Section */}
                <div className='mb-6'>
                    <h3 className='text-lg font-semibold text-gray-800 mb-2'>About</h3>
                    {isEdit ? (
                        <textarea 
                            onChange={(e) => setProfileData(prev => ({ ...prev, about: e.target.value }))} 
                            className='w-full border-2 border-gray-300 rounded-lg p-3 text-sm text-gray-700 focus:outline-none focus:border-primary' 
                            rows={6} 
                            value={profileData.about}
                        />
                    ) : (
                        <p className='text-sm text-gray-600 leading-relaxed'>
                            {profileData.about}
                        </p>
                    )}
                </div>

                {/* Appointment Fee */}
                <div className='mb-6 pb-6 border-b border-gray-200'>
                    <h3 className='text-lg font-semibold text-gray-800 mb-2'>Appointment Fee</h3>
                    {isEdit ? (
                        <div className='flex items-center gap-2'>
                            <span className='text-gray-700'>{currency}</span>
                            <input 
                                type='number' 
                                onChange={(e) => setProfileData(prev => ({ ...prev, fees: e.target.value }))} 
                                value={profileData.fees}
                                className='w-28 border-2 border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary'
                            />
                        </div>
                    ) : (
                        <p className='text-gray-800 font-medium'>
                            {currency} {profileData.fees}
                        </p>
                    )}
                </div>

                {/* Clinic Address */}
                <div className='mb-6'>
                    <h3 className='text-lg font-semibold text-gray-800 mb-2'>Clinic Address</h3>
                    {isEdit ? (
                        <div className='space-y-2'>
                            <input 
                                type='text' 
                                onChange={(e) => setProfileData(prev => ({ ...prev, address: { ...prev.address, line1: e.target.value } }))} 
                                value={profileData.address.line1}
                                placeholder='Address Line 1'
                                className='w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary'
                            />
                            <input 
                                type='text' 
                                onChange={(e) => setProfileData(prev => ({ ...prev, address: { ...prev.address, line2: e.target.value } }))} 
                                value={profileData.address.line2}
                                placeholder='Address Line 2'
                                className='w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary'
                            />
                        </div>
                    ) : (
                        <div className='text-sm text-gray-600'>
                            <p>{profileData.address.line1}</p>
                            <p>{profileData.address.line2}</p>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className='flex gap-3 pt-4 border-t border-gray-200'>
                    {isEdit ? (
                        <>
                            <button 
                                onClick={updateProfile} 
                                className='px-6 py-2 bg-primary text-white text-sm font-medium hover:bg-blue-600 rounded-lg'
                            >
                                Save Changes
                            </button>
                            <button 
                                onClick={() => {
                                    setIsEdit(false);
                                    getProfileData();
                                }} 
                                className='px-6 py-2 border-2 border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 rounded-lg'
                            >
                                Cancel
                            </button>
                        </>
                    ) : (
                        <button 
                            onClick={() => setIsEdit(true)} 
                            className='px-6 py-2 bg-primary text-white text-sm font-medium hover:bg-blue-600 rounded-lg'
                        >
                            Edit Profile
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default DoctorProfile