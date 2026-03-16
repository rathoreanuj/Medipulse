import React, { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useContext } from 'react'
import { AppContext } from '../context/AppContext'

// ─── Star Rating Picker ───────────────────────────────────────────────────────
const StarPicker = ({ value, onChange }) => {
    const [hovered, setHovered] = useState(0)
    const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent']

    return (
        <div className='flex flex-col items-center gap-2'>
            <div className='flex items-center gap-1'>
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type='button'
                        onClick={() => onChange(star)}
                        onMouseEnter={() => setHovered(star)}
                        onMouseLeave={() => setHovered(0)}
                        className='text-4xl transition-transform hover:scale-110 focus:outline-none'
                        aria-label={`${star} star`}
                    >
                        <span className={`${
                            star <= (hovered || value) ? 'text-yellow-400' : 'text-gray-200'
                        } transition-colors`}>
                            ★
                        </span>
                    </button>
                ))}
            </div>
            <p className='text-sm font-medium text-gray-500 h-5'>
                {labels[hovered || value] || 'Select a rating'}
            </p>
        </div>
    )
}

// ─── RatingModal ──────────────────────────────────────────────────────────────
const RatingModal = ({ appointment, onClose, onSuccess }) => {
    const { backendUrl, token, getDoctosData } = useContext(AppContext)
    const [rating, setRating] = useState(0)
    const [comment, setComment] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!rating) return toast.error('Please select a rating')

        setLoading(true)
        try {
            const { data } = await axios.post(
                backendUrl + '/api/user/review',
                { appointmentId: appointment._id, rating, comment },
                { headers: { token } }
            )
            if (data.success) {
                toast.success('Review submitted! Thank you.')
                getDoctosData() // refresh doctor ratings in context
                onSuccess(appointment._id)
                onClose()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        /* Backdrop */
        <div
            className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden'>
                {/* Header */}
                <div className='bg-gradient-to-r from-primary to-blue-600 px-6 py-5 text-white'>
                    <div className='flex items-center justify-between'>
                        <h2 className='text-xl font-bold'>Rate Your Experience</h2>
                        <button
                            onClick={onClose}
                            className='w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors'
                        >
                            <svg className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth='2.5' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Doctor info strip */}
                <div className='flex items-center gap-3 px-6 py-4 border-b bg-blue-50'>
                    <img
                        src={appointment.docData.image}
                        alt={appointment.docData.name}
                        className='w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm'
                    />
                    <div>
                        <p className='font-semibold text-gray-800'>{appointment.docData.name}</p>
                        <p className='text-sm text-primary'>{appointment.docData.speciality}</p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className='px-6 py-5 space-y-5'>
                    {/* Stars */}
                    <div>
                        <p className='text-sm font-semibold text-gray-700 mb-3 text-center'>How would you rate this doctor?</p>
                        <StarPicker value={rating} onChange={setRating} />
                    </div>

                    {/* Comment */}
                    <div>
                        <label className='block text-sm font-semibold text-gray-700 mb-1.5'>
                            Write a review <span className='text-gray-400 font-normal'>(optional)</span>
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            maxLength={500}
                            rows={3}
                            placeholder='Share your experience with this doctor...'
                            className='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none placeholder-gray-400 transition-colors'
                        />
                        <p className='text-xs text-gray-400 text-right mt-1'>{comment.length}/500</p>
                    </div>

                    {/* Actions */}
                    <div className='flex gap-3 pt-1'>
                        <button
                            type='button'
                            onClick={onClose}
                            className='flex-1 py-2.5 border-2 border-gray-200 text-gray-600 rounded-xl font-medium hover:border-gray-300 hover:bg-gray-50 transition-colors'
                        >
                            Cancel
                        </button>
                        <button
                            type='submit'
                            disabled={loading || !rating}
                            className='flex-1 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2'
                        >
                            {loading ? (
                                <svg className='w-4 h-4 animate-spin' fill='none' viewBox='0 0 24 24'>
                                    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                                    <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z' />
                                </svg>
                            ) : '★'}
                            Submit Review
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default RatingModal
