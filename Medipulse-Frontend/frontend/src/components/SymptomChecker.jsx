import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../context/AppContext';

const URGENCY_CONFIG = {
    low:    { label: 'Low',    color: 'text-green-600',  bg: 'bg-green-50 border-green-200',  dot: 'bg-green-500' },
    medium: { label: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', dot: 'bg-yellow-500' },
    high:   { label: 'High',   color: 'text-red-600',    bg: 'bg-red-50 border-red-200',      dot: 'bg-red-500' },
};

const StarDisplay = ({ rating }) => (
    <span className='flex items-center gap-0.5'>
        {[1, 2, 3, 4, 5].map(s => (
            <svg key={s} className={`w-3 h-3 ${s <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`} fill='currentColor' viewBox='0 0 20 20'>
                <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
            </svg>
        ))}
    </span>
);

export default function SymptomChecker({ onClose }) {
    const { backendUrl, token, currencySymbol } = useContext(AppContext);
    const navigate = useNavigate();

    const [symptoms, setSymptoms] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);   // { speciality, urgency, urgencyReason, suggestion, keywords }
    const [doctors, setDoctors] = useState([]);
    const [error, setError] = useState('');

    const examples = [
        'I have chest pain and shortness of breath',
        'My child has high fever and rash for 3 days',
        'Severe headache and blurred vision',
        'Stomach ache and nausea after eating',
    ];

    const handleCheck = async () => {
        if (!symptoms.trim()) return;
        setLoading(true);
        setError('');
        setResult(null);
        setDoctors([]);

        try {
            const { data } = await axios.post(
                `${backendUrl}/api/user/symptom-check`,
                { symptoms },
                { headers: { token } }
            );
            if (data.success) {
                setResult(data.result);
                setDoctors(data.doctors || []);
            } else {
                setError(data.message || 'Something went wrong.');
            }
        } catch {
            setError('Could not connect to AI service. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleBookDoctor = (docId) => {
        onClose();
        navigate(`/appointment/${docId}`);
    };

    const handleViewAll = () => {
        onClose();
        if (result?.speciality) navigate(`/doctors/${result.speciality}`);
        else navigate('/doctors');
    };

    const urgencyCfg = URGENCY_CONFIG[result?.urgency] || URGENCY_CONFIG.medium;

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm'>
            <div
                className='bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto'
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className='sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 px-6 py-4 flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                        <div className='w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center'>
                            <svg className='w-5 h-5 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m1.636-6.364l.707.707M6.34 17.66l-.707.707M17.66 17.66l.707.707M12 21v-1M12 8a4 4 0 100 8 4 4 0 000-8z' />
                            </svg>
                        </div>
                        <div>
                            <h2 className='font-bold text-gray-800 text-lg leading-tight'>AI Symptom Checker</h2>
                            <p className='text-xs text-gray-400'>Powered by GPT · Not a diagnosis</p>
                        </div>
                    </div>
                    <button onClick={onClose} className='w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors'>
                        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                        </svg>
                    </button>
                </div>

                <div className='p-6 space-y-5'>
                    {/* Input area */}
                    {!result && (
                        <>
                            <div>
                                <label className='block text-sm font-semibold text-gray-700 mb-2'>Describe your symptoms</label>
                                <textarea
                                    value={symptoms}
                                    onChange={e => setSymptoms(e.target.value)}
                                    placeholder='e.g. I have had a severe headache for 2 days with nausea and sensitivity to light...'
                                    rows={4}
                                    className='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all'
                                    onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleCheck(); }}
                                />
                                <p className='text-xs text-gray-400 mt-1'>Press Ctrl+Enter to analyse</p>
                            </div>

                            {/* Quick examples */}
                            <div>
                                <p className='text-xs text-gray-500 font-medium mb-2'>Quick examples:</p>
                                <div className='flex flex-wrap gap-2'>
                                    {examples.map(ex => (
                                        <button
                                            key={ex}
                                            onClick={() => setSymptoms(ex)}
                                            className='text-xs bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-600 px-3 py-1.5 rounded-full transition-colors'
                                        >
                                            {ex}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {error && (
                                <div className='bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600 flex items-start gap-2'>
                                    <svg className='w-4 h-4 mt-0.5 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                                    </svg>
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleCheck}
                                disabled={loading || !symptoms.trim()}
                                className='w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2'
                            >
                                {loading ? (
                                    <>
                                        <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                                        Analysing symptoms...
                                    </>
                                ) : (
                                    <>
                                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 10V3L4 14h7v7l9-11h-7z' />
                                        </svg>
                                        Analyse with AI
                                    </>
                                )}
                            </button>
                        </>
                    )}

                    {/* Results */}
                    {result && (
                        <>
                            {/* AI Summary */}
                            <div className={`rounded-xl border p-4 ${urgencyCfg.bg}`}>
                                <div className='flex items-start justify-between gap-3 mb-3'>
                                    <div>
                                        <p className='text-xs text-gray-500 font-medium uppercase tracking-wide mb-1'>Recommended Speciality</p>
                                        <h3 className='text-xl font-bold text-gray-800'>{result.speciality}</h3>
                                    </div>
                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${urgencyCfg.bg}`}>
                                        <span className={`w-2 h-2 rounded-full ${urgencyCfg.dot}`} />
                                        <span className={`text-xs font-semibold ${urgencyCfg.color}`}>{urgencyCfg.label} Urgency</span>
                                    </div>
                                </div>
                                {result.urgencyReason && (
                                    <p className='text-sm text-gray-600 mb-2'><span className='font-semibold'>Why:</span> {result.urgencyReason}</p>
                                )}
                                <p className='text-sm text-gray-700 leading-relaxed'>{result.suggestion}</p>

                                {result.keywords?.length > 0 && (
                                    <div className='flex flex-wrap gap-1.5 mt-3'>
                                        {result.keywords.map(kw => (
                                            <span key={kw} className='text-xs bg-white/80 text-gray-600 px-2 py-1 rounded-full border border-gray-200'>{kw}</span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Disclaimer */}
                            <div className='bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2'>
                                <svg className='w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z' />
                                </svg>
                                <p className='text-xs text-amber-700'>This is <strong>not a medical diagnosis</strong>. Always consult a qualified doctor for proper assessment and treatment.</p>
                            </div>

                            {/* Doctor cards */}
                            {doctors.length > 0 && (
                                <div>
                                    <p className='text-sm font-semibold text-gray-700 mb-3'>
                                        Top {result.speciality} doctors near you
                                    </p>
                                    <div className='space-y-3'>
                                        {doctors.map(doc => (
                                            <div key={doc._id} className='flex items-center gap-4 bg-gray-50 rounded-xl p-3 hover:bg-blue-50 transition-colors group'>
                                                <img src={doc.image} alt={doc.name} className='w-14 h-14 rounded-xl object-cover flex-shrink-0' />
                                                <div className='flex-1 min-w-0'>
                                                    <div className='flex items-center gap-1.5'>
                                                        <p className='font-semibold text-gray-800 text-sm truncate'>{doc.name}</p>
                                                        {doc.isFeatured && (
                                                            <span className='bg-yellow-100 text-yellow-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0'>PRO</span>
                                                        )}
                                                    </div>
                                                    <p className='text-xs text-gray-500'>{doc.speciality} · {doc.experience}</p>
                                                    <div className='flex items-center gap-2 mt-0.5'>
                                                        <StarDisplay rating={doc.averageRating || 0} />
                                                        <span className='text-xs text-gray-400'>{doc.averageRating ? doc.averageRating.toFixed(1) : 'New'} {doc.totalReviews ? `(${doc.totalReviews})` : ''}</span>
                                                    </div>
                                                </div>
                                                <div className='text-right flex-shrink-0'>
                                                    <p className='text-sm font-bold text-gray-800'>{currencySymbol}{doc.fees}</p>
                                                    <button
                                                        onClick={() => handleBookDoctor(doc._id)}
                                                        className='mt-1 text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg transition-colors'
                                                    >
                                                        Book Now
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={handleViewAll}
                                        className='mt-3 w-full text-sm text-blue-500 hover:text-blue-600 font-medium py-2 border border-blue-200 rounded-xl hover:bg-blue-50 transition-all'
                                    >
                                        View all {result.speciality} doctors →
                                    </button>
                                </div>
                            )}

                            {doctors.length === 0 && (
                                <div className='text-center py-4'>
                                    <p className='text-sm text-gray-500 mb-3'>No available {result.speciality} doctors found right now.</p>
                                    <button onClick={handleViewAll} className='text-sm text-blue-500 hover:text-blue-600 font-medium'>Browse all doctors →</button>
                                </div>
                            )}

                            {/* Try again */}
                            <button
                                onClick={() => { setResult(null); setDoctors([]); setSymptoms(''); }}
                                className='w-full text-sm text-gray-500 hover:text-gray-700 py-2 transition-colors'
                            >
                                ← Check different symptoms
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
