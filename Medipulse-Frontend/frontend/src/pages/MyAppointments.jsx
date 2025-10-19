import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import StripeCheckout from '../components/StripeCheckout'
import axios from 'axios'
import { toast } from 'react-toastify'

const MyAppointments = () => {

    const { backendUrl, token } = useContext(AppContext)
    const navigate = useNavigate()

    const [appointments, setAppointments] = useState([])
    const [showStripeCheckout, setShowStripeCheckout] = useState(false)
    const [clientSecret, setClientSecret] = useState('')
    const [currentAppointmentId, setCurrentAppointmentId] = useState('')

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const slotDateFormat = (slotDate) => {
        const dateArray = slotDate.split('_')
        return dateArray[0] + " " + months[Number(dateArray[1])] + " " + dateArray[2]
    }

    const getUserAppointments = async () => {
        try {

            const { data } = await axios.get(backendUrl + '/api/user/appointments', { headers: { token } })
            setAppointments(data.appointments.reverse())

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    const cancelAppointment = async (appointmentId) => {

        try {

            const { data } = await axios.post(backendUrl + '/api/user/cancel-appointment', { appointmentId }, { headers: { token } })

            if (data.success) {
                toast.success(data.message)
                getUserAppointments()
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }

    }

    const payForAppointment = async (appointmentId) => {
        try {
            const { data } = await axios.post(
                backendUrl + '/api/payment/pay-appointment',
                { appointmentId },
                { headers: { token } }
            )

            if (data.success) {
                setClientSecret(data.clientSecret)
                setCurrentAppointmentId(appointmentId)
                setShowStripeCheckout(true)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    const handlePaymentSuccess = () => {
        setShowStripeCheckout(false)
        getUserAppointments()
        toast.success('Payment completed successfully!')
    }

    const handlePaymentCancel = () => {
        setShowStripeCheckout(false)
        toast.info('Payment cancelled')
    }

    useEffect(() => {
        if (token) {
            getUserAppointments()
        }
    }, [token])

    return (
        <div className='max-w-6xl mx-auto px-4 py-8'>
            {/* Header Section */}
            <div className='mb-8 text-center'>
                <h1 className='text-3xl font-bold text-gray-800 mb-2'>My Appointments</h1>
                <p className='text-gray-600'>Manage and track all your medical appointments</p>
            </div>

            {/* Appointments List */}
            <div className='space-y-4'>
                {appointments.length === 0 ? (
                    <div className='text-center py-16 bg-gray-50 rounded-xl'>
                        <svg className='w-20 h-20 mx-auto text-gray-300 mb-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                        </svg>
                        <p className='text-gray-500 text-lg font-medium'>No appointments yet</p>
                        <p className='text-gray-400 mt-2'>Book your first appointment to get started</p>
                        <button 
                            onClick={() => navigate('/doctors')}
                            className='mt-6 px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors duration-300'
                        >
                            Find a Doctor
                        </button>
                    </div>
                ) : (
                    appointments.map((item, index) => (
                        <div 
                            key={index} 
                            className='bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden'
                        >
                            <div className='flex flex-col sm:flex-row gap-4 p-5'>
                                {/* Doctor Image */}
                                <div className='flex-shrink-0'>
                                    <img 
                                        className='w-full sm:w-32 h-32 object-cover rounded-lg bg-blue-50' 
                                        src={item.docData.image} 
                                        alt={item.docData.name} 
                                    />
                                </div>

                                {/* Appointment Details */}
                                <div className='flex-1 space-y-3'>
                                    {/* Doctor Info */}
                                    <div>
                                        <h3 className='text-xl font-bold text-gray-800 mb-1'>{item.docData.name}</h3>
                                        <p className='text-primary font-medium'>{item.docData.speciality}</p>
                                    </div>

                                    {/* Date & Time Badge */}
                                    <div className='flex items-center gap-2 bg-blue-50 w-fit px-4 py-2 rounded-lg'>
                                        <svg className='w-5 h-5 text-primary' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                                        </svg>
                                        <span className='text-gray-700 font-medium text-sm'>
                                            {slotDateFormat(item.slotDate)} at {item.slotTime}
                                        </span>
                                    </div>

                                    {/* Address */}
                                    <div className='flex items-start gap-2 text-gray-600'>
                                        <svg className='w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
                                        </svg>
                                        <div className='text-sm'>
                                            <p>{item.docData.address.line1}</p>
                                            <p>{item.docData.address.line2}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className='flex sm:flex-col gap-2 justify-end items-end sm:items-stretch'>
                                    {/* Completed Status */}
                                    {item.isCompleted && (
                                        <div className='flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-500 rounded-lg text-green-700 font-medium whitespace-nowrap'>
                                            <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                                                <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                                            </svg>
                                            <span>Completed</span>
                                        </div>
                                    )}
                                    
                                    {/* Cancel Button */}
                                    {!item.cancelled && !item.isCompleted && (
                                        <button 
                                            onClick={() => cancelAppointment(item._id)} 
                                            className='px-6 py-2 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:border-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 whitespace-nowrap'
                                        >
                                            Cancel
                                        </button>
                                    )}
                                    
                                    {/* Cancelled Status */}
                                    {item.cancelled && !item.isCompleted && (
                                        <div className='flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-500 rounded-lg text-red-700 font-medium whitespace-nowrap'>
                                            <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                                                <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z' clipRule='evenodd' />
                                            </svg>
                                            <span>Cancelled</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Stripe Checkout Modal */}
            {showStripeCheckout && (
                <StripeCheckout
                    clientSecret={clientSecret}
                    appointmentId={currentAppointmentId}
                    onSuccess={handlePaymentSuccess}
                    onCancel={handlePaymentCancel}
                    backendUrl={backendUrl}
                    token={token}
                />
            )}
        </div>
    )
}

export default MyAppointments