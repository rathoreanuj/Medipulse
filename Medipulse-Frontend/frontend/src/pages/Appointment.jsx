import { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { assets } from '../assets/assets';
import RelatedDoctors from '../components/RelatedDoctors';
import StripeCheckout from '../components/StripeCheckout';
import axios from 'axios';
import { toast } from 'react-toastify';

const Appointment = () => {
    const { docId } = useParams();
    const { doctors, currencySymbol, backendUrl, token, getDoctosData } = useContext(AppContext);
    const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    const [docInfo, setDocInfo] = useState(false);
    const [docSlots, setDocSlots] = useState([]);
    const [slotIndex, setSlotIndex] = useState(0);
    const [slotTime, setSlotTime] = useState('');
    const [paymentMode, setPaymentMode] = useState('offline');
    const [showStripeCheckout, setShowStripeCheckout] = useState(false);
    const [clientSecret, setClientSecret] = useState('');
    const [appointmentId, setAppointmentId] = useState('');

    const navigate = useNavigate();

    const fetchDocInfo = async () => {
        const docInfo = doctors.find((doc) => doc._id === docId);
        setDocInfo(docInfo);
    };

    const getAvailableSolts = async () => {
        setDocSlots([]);
        let today = new Date();
        for (let i = 0; i < 7; i++) {
            let currentDate = new Date(today);
            currentDate.setDate(today.getDate() + i);

            let endTime = new Date();
            endTime.setDate(today.getDate() + i);
            endTime.setHours(21, 0, 0, 0);

            if (today.getDate() === currentDate.getDate()) {
                currentDate.setHours(currentDate.getHours() > 10 ? currentDate.getHours() + 1 : 10);
                currentDate.setMinutes(currentDate.getMinutes() > 30 ? 30 : 0);
            } else {
                currentDate.setHours(10);
                currentDate.setMinutes(0);
            }

            let timeSlots = [];

            while (currentDate < endTime) {
                let formattedTime = currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                let day = currentDate.getDate();
                let month = currentDate.getMonth() + 1;
                let year = currentDate.getFullYear();

                const slotDate = day + "_" + month + "_" + year;
                const slotTime = formattedTime;

                const isSlotAvailable = docInfo.slots_booked[slotDate] && docInfo.slots_booked[slotDate].includes(slotTime) ? false : true;

                if (isSlotAvailable) {
                    timeSlots.push({
                        datetime: new Date(currentDate),
                        time: formattedTime
                    });
                }

                currentDate.setMinutes(currentDate.getMinutes() + 30);
            }

            setDocSlots(prev => ([...prev, timeSlots]));
        }
    };

    const bookAppointment = async () => {
        if (!token) {
            toast.warning('Login to book appointment');
            return navigate('/login');
        }

        if (!slotTime) {
            toast.warning('Please select a time slot');
            return;
        }

        const date = docSlots[slotIndex][0].datetime;
        let day = date.getDate();
        let month = date.getMonth() + 1;
        let year = date.getFullYear();
        const slotDate = day + "_" + month + "_" + year;

        try {
            if (paymentMode === 'online') {
                // Create payment intent for online payment
                const { data } = await axios.post(
                    backendUrl + '/api/payment/create-payment-intent',
                    { docId, slotDate, slotTime },
                    { headers: { token } }
                );

                if (data.success) {
                    setClientSecret(data.clientSecret);
                    setAppointmentId(data.appointmentId);
                    setShowStripeCheckout(true);
                } else {
                    toast.error(data.message);
                }
            } else {
                // Book appointment with offline payment
                const { data } = await axios.post(
                    backendUrl + '/api/user/book-appointment',
                    { docId, slotDate, slotTime, paymentMode: 'offline' },
                    { headers: { token } }
                );

                if (data.success) {
                    toast.success(data.message);
                    getDoctosData();
                    navigate('/my-appointments');
                } else {
                    toast.error(data.message);
                }
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        }
    };

    const handlePaymentSuccess = () => {
        setShowStripeCheckout(false);
        getDoctosData();
        navigate('/my-appointments');
    };

    const handlePaymentCancel = () => {
        setShowStripeCheckout(false);
        toast.info('Payment cancelled');
    };

    useEffect(() => {
        if (doctors.length > 0) {
            fetchDocInfo();
        }
    }, [doctors, docId]);

    useEffect(() => {
        if (docInfo) {
            getAvailableSolts();
        }
    }, [docInfo]);

    return docInfo ? (
        <div className='max-w-6xl mx-auto px-4 py-6'>
            {/* Doctor Profile Section */}
            <div className='flex flex-col md:flex-row gap-6 mb-8'>
                {/* Doctor Image */}
                <div className='md:w-64 flex-shrink-0'>
                    <img 
                        className='w-full h-64 object-cover rounded-lg bg-blue-50' 
                        src={docInfo.image} 
                        alt={docInfo.name} 
                    />
                </div>

                {/* Doctor Info */}
                <div className='flex-1 bg-white border border-gray-200 rounded-lg p-6'>
                    {/* Name and Verification */}
                    <div className='flex items-start gap-2 mb-3'>
                        <h1 className='text-2xl font-bold text-gray-800'>{docInfo.name}</h1>
                        <img className='w-5 h-5 mt-1' src={assets.verified_icon} alt="verified" />
                    </div>

                    {/* Degree and Specialty */}
                    <div className='flex flex-wrap items-center gap-3 mb-4'>
                        <span className='text-gray-700'>{docInfo.degree}</span>
                        <span className='text-gray-400'>•</span>
                        <span className='text-gray-700'>{docInfo.speciality}</span>
                        <span className='px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full border border-gray-200'>
                            {docInfo.experience}
                        </span>
                    </div>

                    {/* About Section */}
                    <div className='mb-4'>
                        <h3 className='text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1'>
                            About
                            <img className='w-3 h-3' src={assets.info_icon} alt="" />
                        </h3>
                        <p className='text-gray-600 text-sm leading-relaxed'>{docInfo.about}</p>
                    </div>

                    {/* Appointment Fee */}
                    <div className='pt-4 border-t border-gray-200'>
                        <p className='text-sm text-gray-600'>
                            Appointment fee: <span className='text-lg font-semibold text-gray-800'>{currencySymbol}{docInfo.fees}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Booking Section */}
            <div className='bg-white border border-gray-200 rounded-lg p-6'>
                <h2 className='text-xl font-bold text-gray-800 mb-4'>Book Your Appointment</h2>
                
                {/* Select Date */}
                <div className='mb-6'>
                    <h3 className='text-sm font-semibold text-gray-700 mb-3'>Select Date</h3>
                    <div className='flex gap-2 overflow-x-auto pb-2'>
                        {docSlots.length && docSlots.map((item, index) => (
                            <div
                                onClick={() => setSlotIndex(index)}
                                key={index}
                                className={`flex flex-col items-center justify-center min-w-[70px] h-20 rounded-lg cursor-pointer border-2 transition-all ${
                                    slotIndex === index 
                                        ? 'bg-primary text-white border-primary' 
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <span className='text-xs font-medium mb-1'>
                                    {item[0] && daysOfWeek[item[0].datetime.getDay()]}
                                </span>
                                <span className='text-lg font-bold'>
                                    {item[0] && item[0].datetime.getDate()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Select Time */}
                <div className='mb-6'>
                    <h3 className='text-sm font-semibold text-gray-700 mb-3'>Select Time</h3>
                    <div className='flex flex-wrap gap-2'>
                        {docSlots.length && docSlots[slotIndex].map((item, index) => (
                            <button
                                onClick={() => setSlotTime(item.time)}
                                key={index}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border-2 ${
                                    item.time === slotTime 
                                        ? 'bg-primary text-white border-primary' 
                                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {item.time.toLowerCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Payment Mode Selection */}
                <div className='mb-6'>
                    <h3 className='text-sm font-semibold text-gray-700 mb-3'>Payment Method</h3>
                    <div className='flex flex-col sm:flex-row gap-3'>
                        <label className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all ${
                            paymentMode === 'offline' 
                                ? 'border-primary bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300'
                        }`}>
                            <input
                                type='radio'
                                name='paymentMode'
                                value='offline'
                                checked={paymentMode === 'offline'}
                                onChange={(e) => setPaymentMode(e.target.value)}
                                className='w-4 h-4 text-primary'
                            />
                            <div>
                                <p className='font-medium text-gray-800'>Pay at Clinic</p>
                                <p className='text-xs text-gray-600'>Cash payment</p>
                            </div>
                        </label>
                        <label className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all ${
                            paymentMode === 'online' 
                                ? 'border-primary bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300'
                        }`}>
                            <input
                                type='radio'
                                name='paymentMode'
                                value='online'
                                checked={paymentMode === 'online'}
                                onChange={(e) => setPaymentMode(e.target.value)}
                                className='w-4 h-4 text-primary'
                            />
                            <div>
                                <p className='font-medium text-gray-800'>Pay Online</p>
                                <p className='text-xs text-gray-600'>Card payment</p>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Book Appointment Button */}
                <button 
                    onClick={bookAppointment} 
                    className='w-full sm:w-auto bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors'
                >
                    Book Appointment
                </button>
            </div>

            {/* Related Doctors */}
            <div className='mt-10'>
                <RelatedDoctors speciality={docInfo.speciality} docId={docId} />
            </div>

            {/* Stripe Checkout Modal */}
            {showStripeCheckout && (
                <StripeCheckout
                    clientSecret={clientSecret}
                    appointmentId={appointmentId}
                    onSuccess={handlePaymentSuccess}
                    onCancel={handlePaymentCancel}
                    backendUrl={backendUrl}
                    token={token}
                />
            )}
        </div>
    ) : null;
};

export default Appointment;
