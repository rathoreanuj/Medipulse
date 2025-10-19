import React, { useContext, useState } from 'react'
import { toast } from 'react-toastify'
import axios from 'axios'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'

const AddDoctor = () => {

    const [docImg, setDocImg] = useState(false)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [experience, setExperience] = useState('1 Year')
    const [fees, setFees] = useState('')
    const [about, setAbout] = useState('')
    const [speciality, setSpeciality] = useState('General physician')
    const [degree, setDegree] = useState('')
    const [address1, setAddress1] = useState('')
    const [address2, setAddress2] = useState('')

    const { backendUrl } = useContext(AppContext)
    const { aToken } = useContext(AdminContext)

    const onSubmitHandler = async (event) => {
        event.preventDefault()

        try {

            if (!docImg) {
                return toast.error('Image Not Selected')
            }

            const formData = new FormData();

            formData.append('image', docImg)
            formData.append('name', name)
            formData.append('email', email)
            formData.append('password', password)
            formData.append('experience', experience)
            formData.append('fees', Number(fees))
            formData.append('about', about)
            formData.append('speciality', speciality)
            formData.append('degree', degree)
            formData.append('address', JSON.stringify({ line1: address1, line2: address2 }))

            // console log formdata            
            formData.forEach((value, key) => {
                console.log(`${key}: ${value}`);
            });

            const { data } = await axios.post(backendUrl + '/api/admin/add-doctor', formData, { headers: { aToken } })
            if (data.success) {
                toast.success(data.message)
                setDocImg(false)
                setName('')
                setPassword('')
                setEmail('')
                setAddress1('')
                setAddress2('')
                setDegree('')
                setAbout('')
                setFees('')
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }

    }

    return (
        <form onSubmit={onSubmitHandler} className='p-6 w-full max-w-5xl'>

            <div className='bg-white border border-gray-200 rounded-lg shadow-sm'>
                
                {/* Image Upload Section */}
                <div className='px-6 py-6 border-b border-gray-200'>
                    <h2 className='text-sm font-semibold text-gray-700 mb-4'>Doctor Photo</h2>
                    <div className='flex items-center gap-4'>
                        <label htmlFor="doc-img" className='cursor-pointer'>
                            <div className='w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 overflow-hidden bg-gray-50 hover:border-primary transition-colors flex items-center justify-center'>
                                {docImg ? (
                                    <img className='w-full h-full object-cover' src={URL.createObjectURL(docImg)} alt="Doctor" />
                                ) : (
                                    <div className='text-center'>
                                        <svg className='w-8 h-8 mx-auto text-gray-400 mb-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
                                        </svg>
                                        <span className='text-xs text-gray-500'>Upload</span>
                                    </div>
                                )}
                            </div>
                        </label>
                        <input onChange={(e) => setDocImg(e.target.files[0])} type="file" id="doc-img" hidden accept='image/*' />
                        <div>
                            <p className='text-sm font-medium text-gray-700'>Upload doctor&apos;s picture</p>
                            <p className='text-xs text-gray-500 mt-1'>JPG, PNG or JPEG (max. 5MB)</p>
                        </div>
                    </div>
                </div>

                {/* Form Fields */}
                <div className='px-6 py-6'>
                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>

                        {/* Left Column */}
                        <div className='space-y-4'>

                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1.5'>Doctor Name</label>
                                <input 
                                    onChange={e => setName(e.target.value)} 
                                    value={name} 
                                    className='w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 focus:outline-none focus:border-primary transition-colors' 
                                    type="text" 
                                    placeholder='Enter full name' 
                                    required 
                                />
                            </div>

                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1.5'>Email Address</label>
                                <input 
                                    onChange={e => setEmail(e.target.value)} 
                                    value={email} 
                                    className='w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 focus:outline-none focus:border-primary transition-colors' 
                                    type="email" 
                                    placeholder='doctor@example.com' 
                                    required 
                                />
                            </div>

                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1.5'>Password</label>
                                <input 
                                    onChange={e => setPassword(e.target.value)} 
                                    value={password} 
                                    className='w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 focus:outline-none focus:border-primary transition-colors' 
                                    type="password" 
                                    placeholder='Set a strong password' 
                                    required 
                                />
                            </div>

                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1.5'>Experience</label>
                                <select 
                                    onChange={e => setExperience(e.target.value)} 
                                    value={experience} 
                                    className='w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 focus:outline-none focus:border-primary transition-colors bg-white'
                                >
                                    <option value="1 Year">1 Year</option>
                                    <option value="2 Years">2 Years</option>
                                    <option value="3 Years">3 Years</option>
                                    <option value="4 Years">4 Years</option>
                                    <option value="5 Years">5 Years</option>
                                    <option value="6 Years">6 Years</option>
                                    <option value="7 Years">7 Years</option>
                                    <option value="8 Years">8 Years</option>
                                    <option value="9 Years">9 Years</option>
                                    <option value="10 Years">10 Years</option>
                                </select>
                            </div>

                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1.5'>Consultation Fee</label>
                                <input 
                                    onChange={e => setFees(e.target.value)} 
                                    value={fees} 
                                    className='w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 focus:outline-none focus:border-primary transition-colors' 
                                    type="number" 
                                    placeholder='Enter fee amount' 
                                    required 
                                />
                            </div>

                        </div>

                        {/* Right Column */}
                        <div className='space-y-4'>

                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1.5'>Speciality</label>
                                <select 
                                    onChange={e => setSpeciality(e.target.value)} 
                                    value={speciality} 
                                    className='w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 focus:outline-none focus:border-primary transition-colors bg-white'
                                >
                                    <option value="General physician">General physician</option>
                                    <option value="Gynecologist">Gynecologist</option>
                                    <option value="Dermatologist">Dermatologist</option>
                                    <option value="Pediatricians">Pediatricians</option>
                                    <option value="Neurologist">Neurologist</option>
                                    <option value="Gastroenterologist">Gastroenterologist</option>
                                </select>
                            </div>

                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1.5'>Education / Degree</label>
                                <input 
                                    onChange={e => setDegree(e.target.value)} 
                                    value={degree} 
                                    className='w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 focus:outline-none focus:border-primary transition-colors' 
                                    type="text" 
                                    placeholder='e.g., MBBS, MD' 
                                    required 
                                />
                            </div>

                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1.5'>Clinic Address</label>
                                <input 
                                    onChange={e => setAddress1(e.target.value)} 
                                    value={address1} 
                                    className='w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 focus:outline-none focus:border-primary transition-colors mb-2' 
                                    type="text" 
                                    placeholder='Street address' 
                                    required 
                                />
                                <input 
                                    onChange={e => setAddress2(e.target.value)} 
                                    value={address2} 
                                    className='w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 focus:outline-none focus:border-primary transition-colors' 
                                    type="text" 
                                    placeholder='City, State, ZIP' 
                                    required 
                                />
                            </div>

                        </div>

                    </div>

                    {/* About Doctor Section */}
                    <div className='mt-6'>
                        <label className='block text-sm font-medium text-gray-700 mb-1.5'>About Doctor</label>
                        <textarea 
                            onChange={e => setAbout(e.target.value)} 
                            value={about} 
                            className='w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 focus:outline-none focus:border-primary transition-colors resize-none' 
                            rows={5} 
                            placeholder='Write a brief description about the doctor, their expertise, and qualifications...'
                            required
                        ></textarea>
                    </div>
                </div>

                {/* Submit Button */}
                <div className='px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg'>
                    <button 
                        type='submit' 
                        className='bg-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-600 transition-colors'
                    >
                        Add Doctor
                    </button>
                </div>

            </div>

        </form>
    )
}

export default AddDoctor