import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import { toast } from 'react-toastify';

// Load Stripe with your publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const PaymentSuccess = ({ onDone }) => (
    <div className="flex flex-col items-center justify-center py-6 text-center animate-fade-in">
        {/* Animated checkmark circle */}
        <div className="relative w-24 h-24 mb-6">
            <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle
                    cx="50" cy="50" r="46"
                    fill="none" stroke="#22c55e" strokeWidth="6"
                    strokeDasharray="289" strokeDashoffset="0"
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
                <polyline
                    points="28,52 44,68 72,36"
                    fill="none" stroke="#22c55e" strokeWidth="6"
                    strokeLinecap="round" strokeLinejoin="round"
                />
            </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h3>
        <p className="text-gray-500 mb-1">Your appointment has been confirmed.</p>
        <p className="text-gray-400 text-sm mb-8">A confirmation has been saved to your appointments.</p>
        <button
            onClick={onDone}
            className="px-8 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors duration-200 shadow-lg"
        >
            View My Appointments
        </button>
    </div>
);

const CheckoutForm = ({ clientSecret, appointmentId, onSuccess, onCancel, backendUrl, token }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [paid, setPaid] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setLoading(true);

        try {
            const cardElement = elements.getElement(CardElement);

            const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: cardElement,
                },
            });

            if (error) {
                toast.error(error.message);
                setLoading(false);
                return;
            }

            if (paymentIntent.status === 'succeeded') {
                // Verify payment on backend
                const { data } = await axios.post(
                    backendUrl + '/api/payment/verify-payment',
                    {
                        paymentIntentId: paymentIntent.id,
                        appointmentId: appointmentId,
                    },
                    { headers: { token } }
                );

                if (data.success) {
                    toast.success('Payment successful! Appointment confirmed.');
                    setPaid(true);
                } else {
                    toast.error('Payment verification failed');
                }
            }
        } catch (error) {
            console.log(error);
            toast.error('Payment failed');
        } finally {
            setLoading(false);
        }
    };

    const cardStyle = {
        style: {
            base: {
                color: '#32325d',
                fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                fontSmoothing: 'antialiased',
                fontSize: '16px',
                '::placeholder': {
                    color: '#aab7c4',
                },
            },
            invalid: {
                color: '#fa755a',
                iconColor: '#fa755a',
            },
        },
    };

    if (paid) {
        return <PaymentSuccess onDone={onSuccess} />;
    }

    return (
        <>
            <h2 className="text-2xl font-semibold mb-4">Complete Payment</h2>
            <p className="text-gray-600 mb-6">
                Enter your card details to complete the appointment booking
            </p>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-4 border border-gray-300 rounded-lg">
                <CardElement options={cardStyle} />
            </div>
            
            <div className="flex gap-3">
                <button
                    type="submit"
                    disabled={!stripe || loading}
                    className="flex-1 bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {loading ? 'Processing...' : 'Pay Now'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={loading}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    Cancel
                </button>
            </div>

            <div className="text-sm text-gray-600 text-center">
                <p>Test Card: 4242 4242 4242 4242</p>
                <p>Use any future date and any 3-digit CVC</p>
            </div>
        </form>
        </>
    );
};

const StripeCheckout = ({ clientSecret, appointmentId, onSuccess, onCancel, backendUrl, token }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm
                        clientSecret={clientSecret}
                        appointmentId={appointmentId}
                        onSuccess={onSuccess}
                        onCancel={onCancel}
                        backendUrl={backendUrl}
                        token={token}
                    />
                </Elements>
            </div>
        </div>
    );
};

export default StripeCheckout;
