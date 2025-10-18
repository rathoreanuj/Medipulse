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
        <div>
            <p className='pb-3 mt-12 text-lg font-medium text-gray-600 border-b'>My appointments</p>
            <div className=''>
                {appointments.map((item, index) => (
                    <div key={index} className='grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-4 border-b'>
                        <div>
                            <img className='w-36 bg-[#EAEFFF]' src={item.docData.image} alt="" />
                        </div>
                        <div className='flex-1 text-sm text-[#5E5E5E]'>
                            <p className='text-[#262626] text-base font-semibold'>{item.docData.name}</p>
                            <p>{item.docData.speciality}</p>
                            <p className='text-[#464646] font-medium mt-1'>Address:</p>
                            <p className=''>{item.docData.address.line1}</p>
                            <p className=''>{item.docData.address.line2}</p>
                            <p className=' mt-1'><span className='text-sm text-[#3C3C3C] font-medium'>Date & Time:</span> {slotDateFormat(item.slotDate)} |  {item.slotTime}</p>
                            {/* <p className='mt-1'>
                                <span className='text-sm text-[#3C3C3C] font-medium'>Payment Status:</span>{' '}
                                <span className={`font-medium ${item.payment ? 'text-green-600' : 'text-orange-600'}`}>
                                    {item.payment ? 'Paid' : 'Unpaid'}
                                </span>
                            </p> */}
                        </div>
                        <div></div>
                        <div className='flex flex-col gap-2 justify-end text-sm text-center'>
                            {item.isCompleted && <button className='sm:min-w-48 py-2 border border-green-500 rounded text-green-500'>Completed</button>}
                            {/* {!item.cancelled && !item.isCompleted && !item.payment && (
                                <button 
                                    onClick={() => payForAppointment(item._id)} 
                                    className='text-white bg-primary sm:min-w-48 py-2 border rounded hover:bg-primary/90 transition-all duration-300'
                                >
                                    Pay Now
                                </button>
                            )} */}
                            {!item.cancelled && !item.isCompleted && <button onClick={() => cancelAppointment(item._id)} className='text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-red-600 hover:text-white transition-all duration-300'>Cancel appointment</button>}
                            {item.cancelled && !item.isCompleted && <button className='sm:min-w-48 py-2 border border-red-500 rounded text-red-500'>Appointment cancelled</button>}
                        </div>
                    </div>
                ))}
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