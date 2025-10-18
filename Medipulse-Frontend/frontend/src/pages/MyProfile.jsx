import { useContext, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'

const MyProfile = () => {

    const [isEdit, setIsEdit] = useState(false)
    const [image, setImage] = useState(false)
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)

    const { token, backendUrl, userData, setUserData, loadUserProfileData } = useContext(AppContext)

    // Validation functions
    const validateName = (name) => {
        if (!name || name.trim().length === 0) {
            return "Name is required"
        }
        if (name.trim().length < 3) {
            return "Name must be at least 3 characters"
        }
        if (!/^[a-zA-Z\s]+$/.test(name)) {
            return "Name should only contain letters and spaces"
        }
        return ""
    }

    const validatePhone = (phone) => {
        if (!phone || phone.trim().length === 0) {
            return "Phone number is required"
        }
        // Remove spaces and dashes for validation
        const cleanPhone = phone.replace(/[\s-]/g, '')
        if (!/^\d{10}$/.test(cleanPhone)) {
            return "Phone number must be 10 digits"
        }
        return ""
    }

    const validateAddress = (address) => {
        if (!address.line1 || address.line1.trim().length === 0) {
            return "Address line 1 is required"
        }
        if (address.line1.trim().length < 5) {
            return "Address must be at least 5 characters"
        }
        return ""
    }

    const validateDob = (dob) => {
        if (!dob) {
            return "Date of birth is required"
        }
        const birthDate = new Date(dob)
        const today = new Date()
        const age = today.getFullYear() - birthDate.getFullYear()
        if (age < 0 || age > 150) {
            return "Please enter a valid date of birth"
        }
        if (age < 13) {
            return "You must be at least 13 years old"
        }
        return ""
    }

    const validateGender = (gender) => {
        if (!gender || gender === "Not Selected") {
            return "Please select your gender"
        }
        return ""
    }

    const validateForm = () => {
        const newErrors = {}
        
        const nameError = validateName(userData.name)
        if (nameError) newErrors.name = nameError

        const phoneError = validatePhone(userData.phone)
        if (phoneError) newErrors.phone = phoneError

        const addressError = validateAddress(userData.address)
        if (addressError) newErrors.address = addressError

        const dobError = validateDob(userData.dob)
        if (dobError) newErrors.dob = dobError

        const genderError = validateGender(userData.gender)
        if (genderError) newErrors.gender = genderError

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleFieldChange = (field, value) => {
        setUserData(prev => ({ ...prev, [field]: value }))
        // Clear error for this field when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }))
        }
    }

    const handleAddressChange = (line, value) => {
        setUserData(prev => ({ ...prev, address: { ...prev.address, [line]: value } }))
        if (errors.address) {
            setErrors(prev => ({ ...prev, address: '' }))
        }
    }

    const updateUserProfileData = async () => {
        // Validate form before submitting
        if (!validateForm()) {
            toast.error('Please fix all errors before saving')
            return
        }

        setLoading(true)

        try {
            const formData = new FormData();

            formData.append('name', userData.name.trim())
            formData.append('phone', userData.phone.trim())
            formData.append('address', JSON.stringify(userData.address))
            formData.append('gender', userData.gender)
            formData.append('dob', userData.dob)

            image && formData.append('image', image)

            const { data } = await axios.post(backendUrl + '/api/user/update-profile', formData, { headers: { token } })

            if (data.success) {
                toast.success(data.message)
                await loadUserProfileData()
                setIsEdit(false)
                setImage(false)
                setErrors({})
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = () => {
        setIsEdit(false)
        setImage(false)
        setErrors({})
        loadUserProfileData() // Reload original data
    }

    return userData ? (
        <div className='max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8'>
            {/* Header */}
          

            <div className='bg-white rounded-2xl shadow-lg p-6 sm:p-8'>
                {/* Profile Picture Section */}
                <div className='flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b'>
                    <div className='relative'>
                        {isEdit ? (
                            <label htmlFor='image' className='cursor-pointer group'>
                                <div className='relative'>
                                    <img 
                                        className='w-32 h-32 rounded-full object-cover border-4 border-primary shadow-lg group-hover:opacity-75 transition-opacity' 
                                        src={image ? URL.createObjectURL(image) : userData.image} 
                                        alt="Profile" 
                                    />
                                    <div className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity'>
                                        <img className='w-10 h-10' src={assets.upload_icon} alt="Upload" />
                                    </div>
                                </div>
                                <input 
                                    onChange={(e) => setImage(e.target.files[0])} 
                                    type="file" 
                                    id="image" 
                                    accept="image/*"
                                    hidden 
                                />
                            </label>
                        ) : (
                            <img 
                                className='w-32 h-32 rounded-full object-cover border-4 border-primary shadow-lg' 
                                src={userData.image} 
                                alt="Profile" 
                            />
                        )}
                    </div>

                    <div className='flex-1 text-center sm:text-left'>
                        {isEdit ? (
                            <div>
                                <input 
                                    className={`text-2xl font-bold bg-gray-50 border-2 ${errors.name ? 'border-red-500' : 'border-gray-200'} rounded-lg px-4 py-2 w-full max-w-md focus:outline-none focus:border-primary transition-colors`}
                                    type="text" 
                                    onChange={(e) => handleFieldChange('name', e.target.value)}
                                    value={userData.name}
                                    placeholder="Enter your full name"
                                />
                                {errors.name && <p className='text-red-500 text-sm mt-1 flex items-center gap-1'>
                                    <span>⚠️</span> {errors.name}
                                </p>}
                            </div>
                        ) : (
                            <h2 className='text-3xl font-bold text-gray-800'>{userData.name}</h2>
                        )}
                        <p className='text-gray-500 mt-2 flex items-center justify-center sm:justify-start gap-2'>
                            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                            </svg>
                            Patient
                        </p>
                    </div>
                </div>

                {/* Contact Information */}
                <div className='mt-8'>
                    <div className='flex items-center gap-2 mb-4'>
                        <svg className='w-6 h-6 text-primary' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                        </svg>
                        <h3 className='text-xl font-semibold text-gray-800'>Contact Information</h3>
                    </div>
                    
                    <div className='grid gap-6'>
                        {/* Email */}
                        <div className='bg-gray-50 rounded-xl p-4'>
                            <label className='text-sm font-medium text-gray-600 block mb-2'>Email Address</label>
                            <div className='flex items-center gap-2'>
                                <svg className='w-5 h-5 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                                </svg>
                                <p className='text-blue-600 font-medium'>{userData.email}</p>
                                <span className='ml-auto bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full'>Verified</span>
                            </div>
                        </div>

                        {/* Phone */}
                        <div className='bg-gray-50 rounded-xl p-4'>
                            <label className='text-sm font-medium text-gray-600 block mb-2'>Phone Number</label>
                            {isEdit ? (
                                <div>
                                    <div className='flex items-center gap-2'>
                                        <svg className='w-5 h-5 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' />
                                        </svg>
                                        <input 
                                            className={`flex-1 bg-white border-2 ${errors.phone ? 'border-red-500' : 'border-gray-200'} rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-colors`}
                                            type="tel" 
                                            onChange={(e) => handleFieldChange('phone', e.target.value)}
                                            value={userData.phone}
                                            placeholder="Enter 10-digit phone number"
                                        />
                                    </div>
                                    {errors.phone && <p className='text-red-500 text-sm mt-2 flex items-center gap-1'>
                                        <span>⚠️</span> {errors.phone}
                                    </p>}
                                </div>
                            ) : (
                                <div className='flex items-center gap-2'>
                                    <svg className='w-5 h-5 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' />
                                    </svg>
                                    <p className='text-gray-800 font-medium'>{userData.phone}</p>
                                </div>
                            )}
                        </div>

                        {/* Address */}
                        <div className='bg-gray-50 rounded-xl p-4'>
                            <label className='text-sm font-medium text-gray-600 block mb-2'>Address</label>
                            {isEdit ? (
                                <div className='space-y-3'>
                                    <div className='flex items-start gap-2'>
                                        <svg className='w-5 h-5 text-gray-400 mt-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
                                        </svg>
                                        <div className='flex-1'>
                                            <input 
                                                className={`w-full bg-white border-2 ${errors.address ? 'border-red-500' : 'border-gray-200'} rounded-lg px-4 py-2 mb-2 focus:outline-none focus:border-primary transition-colors`}
                                                type="text" 
                                                onChange={(e) => handleAddressChange('line1', e.target.value)}
                                                value={userData.address.line1}
                                                placeholder="Street address, apartment, suite, etc."
                                            />
                                            <input 
                                                className='w-full bg-white border-2 border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-colors'
                                                type="text" 
                                                onChange={(e) => handleAddressChange('line2', e.target.value)}
                                                value={userData.address.line2}
                                                placeholder="City, State, ZIP code (Optional)"
                                            />
                                        </div>
                                    </div>
                                    {errors.address && <p className='text-red-500 text-sm flex items-center gap-1 ml-7'>
                                        <span>⚠️</span> {errors.address}
                                    </p>}
                                </div>
                            ) : (
                                <div className='flex items-start gap-2'>
                                    <svg className='w-5 h-5 text-gray-400 mt-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
                                    </svg>
                                    <div>
                                        <p className='text-gray-800 font-medium'>{userData.address.line1}</p>
                                        {userData.address.line2 && <p className='text-gray-600'>{userData.address.line2}</p>}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Basic Information */}
                <div className='mt-8'>
                    <div className='flex items-center gap-2 mb-4'>
                        <svg className='w-6 h-6 text-primary' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                        </svg>
                        <h3 className='text-xl font-semibold text-gray-800'>Basic Information</h3>
                    </div>
                    
                    <div className='grid sm:grid-cols-2 gap-6'>
                        {/* Gender */}
                        <div className='bg-gray-50 rounded-xl p-4'>
                            <label className='text-sm font-medium text-gray-600 block mb-2'>Gender</label>
                            {isEdit ? (
                                <div>
                                    <select 
                                        className={`w-full bg-white border-2 ${errors.gender ? 'border-red-500' : 'border-gray-200'} rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-colors`}
                                        onChange={(e) => handleFieldChange('gender', e.target.value)}
                                        value={userData.gender}
                                    >
                                        <option value="Not Selected">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    {errors.gender && <p className='text-red-500 text-sm mt-2 flex items-center gap-1'>
                                        <span>⚠️</span> {errors.gender}
                                    </p>}
                                </div>
                            ) : (
                                <p className='text-gray-800 font-medium flex items-center gap-2'>
                                    {userData.gender === 'Male' }
                                    {userData.gender === 'Female' }
                                    {userData.gender}
                                </p>
                            )}
                        </div>

                        {/* Date of Birth */}
                        <div className='bg-gray-50 rounded-xl p-4'>
                            <label className='text-sm font-medium text-gray-600 block mb-2'>Date of Birth</label>
                            {isEdit ? (
                                <div>
                                    <input 
                                        className={`w-full bg-white border-2 ${errors.dob ? 'border-red-500' : 'border-gray-200'} rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-colors`}
                                        type='date' 
                                        onChange={(e) => handleFieldChange('dob', e.target.value)}
                                        value={userData.dob}
                                        max={new Date().toISOString().split('T')[0]}
                                    />
                                    {errors.dob && <p className='text-red-500 text-sm mt-2 flex items-center gap-1'>
                                        <span>⚠️</span> {errors.dob}
                                    </p>}
                                </div>
                            ) : (
                                <p className='text-gray-800 font-medium flex items-center gap-2'>
                                     {new Date(userData.dob).toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    })}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className='mt-8 pt-6 border-t flex flex-col sm:flex-row gap-3 justify-end'>
                    {isEdit ? (
                        <>
                            <button 
                                onClick={handleCancel}
                                disabled={loading}
                                className='px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={updateUserProfileData}
                                disabled={loading}
                                className='px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M5 13l4 4L19 7' />
                                        </svg>
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </>
                    ) : (
                        <button 
                            onClick={() => setIsEdit(true)}
                            className='px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2'
                        >
                            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                            </svg>
                            Edit Profile
                        </button>
                    )}
                </div>
            </div>
        </div>
    ) : null
}

export default MyProfile