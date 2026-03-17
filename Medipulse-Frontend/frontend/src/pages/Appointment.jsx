import { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { assets } from '../assets/assets';
import RelatedDoctors from '../components/RelatedDoctors';
import StripeCheckout from '../components/StripeCheckout';
import axios from 'axios';
import { toast } from 'react-toastify';

// ─── Inline star display ──────────────────────────────────────────────────────
const StarDisplay = ({ rating, size = 'sm' }) => {
    const sz = size === 'lg' ? 'text-xl' : 'text-sm'
    return (
        <span className='inline-flex items-center'>
            {[1,2,3,4,5].map(s => (
                <span key={s} className={`${sz} ${s <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
            ))}
        </span>
    )
}

const Appointment = () => {
    const { docId } = useParams();
    const { doctors, currencySymbol, backendUrl, token, getDoctosData } = useContext(AppContext);
    const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    const [docInfo, setDocInfo] = useState(false);
    const [docSlots, setDocSlots] = useState([]);
    const [slotIndex, setSlotIndex] = useState(0);
    const [slotTime, setSlotTime] = useState('');
    const [paymentMode, setPaymentMode] = useState('offline');
    const [consultationType, setConsultationType] = useState('in-person');

    // When video is selected, force online payment
    const handleConsultationTypeChange = (type) => {
        setConsultationType(type)
        if (type === 'video') setPaymentMode('online')
    }
    const [showStripeCheckout, setShowStripeCheckout] = useState(false);
    const [clientSecret, setClientSecret] = useState('');
    const [appointmentId, setAppointmentId] = useState('');
    const [reviews, setReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(false);

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
                // Step 1: Reserve the slot atomically
                const reserveRes = await axios.post(
                    backendUrl + '/api/user/book-appointment',
                    { docId, slotDate, slotTime, paymentMode: 'online', consultationType },
                    { headers: { token } }
                );

                if (!reserveRes.data.success) {
                    toast.error(reserveRes.data.message);
                    return;
                }

                const reservedAppointmentId = reserveRes.data.appointmentId;

                // Step 2: Create Stripe payment intent for that reservation
                const { data } = await axios.post(
                    backendUrl + '/api/payment/create-payment-intent',
                    { appointmentId: reservedAppointmentId },
                    { headers: { token } }
                );

                if (data.success) {
                    setClientSecret(data.clientSecret);
                    setAppointmentId(reservedAppointmentId);
                    setShowStripeCheckout(true);
                } else {
                    toast.error(data.message);
                }
            } else {
                // Book appointment with cash/offline payment
                const { data } = await axios.post(
                    backendUrl + '/api/user/book-appointment',
                    { docId, slotDate, slotTime, paymentMode: 'cash', consultationType },
                    { headers: { token } }
                );

                if (data.success) {
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
            fetchReviews();
        }
    }, [docInfo]);

    const fetchReviews = async () => {
        if (!docInfo?._id) return
        setLoadingReviews(true)
        try {
            const { data } = await axios.get(backendUrl + `/api/user/doctor-reviews/${docInfo._id}`)
            if (data.success) setReviews(data.reviews)
        } catch (error) {
            console.log(error)
        } finally {
            setLoadingReviews(false)
        }
    }

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
                    <div className='pt-4 border-t border-gray-200 flex items-center justify-between flex-wrap gap-3'>
                        <div>
                            <p className='text-sm text-gray-500 mb-0.5'>Appointment fee</p>
                            {consultationType === 'video' ? (
                                <div className='flex items-center gap-2'>
                                    <span className='text-sm text-gray-400 line-through'>{currencySymbol}{docInfo.fees}</span>
                                    <span className='text-lg font-bold text-green-600'>{currencySymbol}{Math.round(docInfo.fees * 0.8)}</span>
                                    <span className='text-xs font-semibold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full'>20% off</span>
                                </div>
                            ) : (
                                <span className='text-lg font-semibold text-gray-800'>{currencySymbol}{docInfo.fees}</span>
                            )}
                        </div>
                        {/* Rating Summary */}
                        {docInfo.totalReviews > 0 ? (
                            <div className='flex items-center gap-2'>
                                <StarDisplay rating={docInfo.averageRating} />
                                <span className='text-sm font-semibold text-gray-700'>{docInfo.averageRating?.toFixed(1)}</span>
                                <span className='text-xs text-gray-400'>({docInfo.totalReviews} review{docInfo.totalReviews !== 1 ? 's' : ''})</span>
                            </div>
                        ) : (
                            <span className='text-xs text-gray-400'>No reviews yet</span>
                        )}
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

                {/* Consultation Type */}
                <div className='mb-6'>
                    <h3 className='text-sm font-semibold text-gray-700 mb-3'>Consultation Type</h3>
                    <div className='flex flex-col sm:flex-row gap-3'>
                        <label className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all flex-1 ${
                            consultationType === 'in-person'
                                ? 'border-primary bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                        }`}>
                            <input
                                type='radio'
                                name='consultationType'
                                value='in-person'
                                checked={consultationType === 'in-person'}
                                onChange={(e) => handleConsultationTypeChange(e.target.value)}
                                className='w-4 h-4 text-primary'
                            />
                            <div className='flex items-center gap-2'>
                                <svg className='w-5 h-5 text-gray-600' fill='none' stroke='currentColor' strokeWidth='1.8' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' />
                                </svg>
                                <div>
                                    <p className='font-medium text-gray-800 text-sm'>In-Person Visit</p>
                                    <p className='text-xs text-gray-500'>Visit the clinic</p>
                                </div>
                            </div>
                        </label>
                        <label className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all flex-1 ${
                            consultationType === 'video'
                                ? 'border-primary bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                        }`}>
                            <input
                                type='radio'
                                name='consultationType'
                                value='video'
                                checked={consultationType === 'video'}
                                onChange={(e) => handleConsultationTypeChange(e.target.value)}
                                className='w-4 h-4 text-primary'
                            />
                            <div className='flex items-center gap-2'>
                                <svg className='w-5 h-5 text-primary' fill='none' stroke='currentColor' strokeWidth='1.8' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' d='M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' />
                                </svg>
                                <div>
                                    <p className='font-medium text-gray-800 text-sm'>Video Consultation</p>
                                    <p className='text-xs text-gray-500'>Online video call</p>
                                    <span className='inline-block mt-1 text-[11px] font-semibold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full'>
                                        20% off fee
                                    </span>
                                </div>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Payment Mode Selection */}
                <div className='mb-6'>
                    <h3 className='text-sm font-semibold text-gray-700 mb-3'>Payment Method</h3>
                    <div className='flex flex-col sm:flex-row gap-3'>
                        <label className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all flex-1 ${
                            consultationType === 'video'
                                ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                                : paymentMode === 'offline'
                                    ? 'border-primary bg-blue-50 cursor-pointer'
                                    : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                        }`}>
                            <input
                                type='radio'
                                name='paymentMode'
                                value='offline'
                                checked={paymentMode === 'offline'}
                                onChange={(e) => setPaymentMode(e.target.value)}
                                disabled={consultationType === 'video'}
                                className='w-4 h-4 text-primary'
                            />
                            <div>
                                <p className='font-medium text-gray-800'>Pay at Clinic</p>
                                <p className='text-xs text-gray-600'>
                                    {consultationType === 'video' ? 'Not available for video' : 'Cash payment'}
                                </p>
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

            {/* Patient Reviews Section */}
            <div className='mt-10'>
                <div className='flex items-center justify-between mb-5'>
                    <h2 className='text-xl font-bold text-gray-800'>Patient Reviews</h2>
                    {docInfo.totalReviews > 0 && (
                        <div className='flex items-center gap-2 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-lg'>
                            <StarDisplay rating={docInfo.averageRating} size='lg' />
                            <span className='font-bold text-gray-800'>{docInfo.averageRating?.toFixed(1)}</span>
                            <span className='text-sm text-gray-500'>/ 5 · {docInfo.totalReviews} review{docInfo.totalReviews !== 1 ? 's' : ''}</span>
                        </div>
                    )}
                </div>

                {loadingReviews ? (
                    <div className='flex items-center justify-center py-10'>
                        <svg className='w-7 h-7 animate-spin text-primary' fill='none' viewBox='0 0 24 24'>
                            <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                            <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z' />
                        </svg>
                    </div>
                ) : reviews.length === 0 ? (
                    <div className='text-center py-10 bg-gray-50 rounded-xl border border-gray-100'>
                        <p className='text-4xl mb-3'>⭐</p>
                        <p className='text-gray-500 font-medium'>No reviews yet</p>
                        <p className='text-sm text-gray-400 mt-1'>Be the first to review after your appointment</p>
                    </div>
                ) : (
                    <div className='space-y-4'>
                        {reviews.map((review) => (
                            <div key={review._id} className='bg-white border border-gray-100 rounded-xl p-5 shadow-sm'>
                                <div className='flex items-start gap-3'>
                                    {/* Avatar */}
                                    <div className='w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden'>
                                        {review.patientImage ? (
                                            <img src={review.patientImage} alt={review.patientName} className='w-full h-full object-cover' />
                                        ) : (
                                            <span className='text-primary font-bold text-sm'>{review.patientName?.[0]?.toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div className='flex-1 min-w-0'>
                                        <div className='flex items-center justify-between flex-wrap gap-2 mb-1'>
                                            <p className='font-semibold text-gray-800'>{review.patientName}</p>
                                            <span className='text-xs text-gray-400'>
                                                {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <div className='flex items-center gap-1 mb-2'>
                                            <StarDisplay rating={review.rating} />
                                            <span className='text-sm font-medium text-gray-600 ml-1'>{review.rating}/5</span>
                                        </div>
                                        {review.comment && (
                                            <p className='text-gray-600 text-sm leading-relaxed'>{review.comment}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
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
