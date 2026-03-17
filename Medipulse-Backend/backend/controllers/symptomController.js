import OpenAI from 'openai';
import doctorModel from '../models/doctorModel.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SUPPORTED_SPECIALITIES = [
    'General physician', 'Gynecologist', 'Dermatologist',
    'Pediatricians', 'Neurologist', 'Gastroenterologist',
    'Cardiologist', 'Orthopedic', 'Psychiatrist', 'ENT Specialist',
    'Ophthalmologist', 'Urologist', 'Dentist', 'Pulmonologist',
];

const SYSTEM_PROMPT = `
You are MediPulse AI — a medical triage assistant for a doctor-booking platform in India.
Given a patient's symptom description, respond with ONLY valid JSON (no markdown, no extra text):
{
  "speciality": "<one of the supported specialities>",
  "urgency": "low" | "medium" | "high",
  "urgencyReason": "<one short sentence>",
  "suggestion": "<2-3 sentences of friendly, non-alarming advice>",
  "keywords": ["<symptom1>", "<symptom2>", "<symptom3>"]
}
Supported specialities: ${SUPPORTED_SPECIALITIES.join(', ')}.
Rules: Never diagnose. Never prescribe. Always recommend booking a doctor. If unclear use "General physician".
`.trim();

// ─── Keyword-based fallback (works without OpenAI) ────────────────────────────
const KEYWORD_MAP = [
    { keywords: ['chest pain', 'heart', 'palpitation', 'shortness of breath', 'breathless', 'cardiac', 'irregular heartbeat'], speciality: 'Cardiologist', urgency: 'high', reason: 'Chest and heart symptoms can be serious and require prompt medical evaluation.' },
    { keywords: ['headache', 'migraine', 'seizure', 'paralysis', 'numbness', 'dizziness', 'neurological', 'memory loss', 'tremor', 'blurred vision'], speciality: 'Neurologist', urgency: 'medium', reason: 'Neurological symptoms need professional assessment.' },
    { keywords: ['skin', 'rash', 'acne', 'itch', 'eczema', 'allergy', 'hives', 'psoriasis', 'hair loss', 'nail'], speciality: 'Dermatologist', urgency: 'low', reason: 'Skin conditions are best evaluated by a specialist.' },
    { keywords: ['stomach', 'abdomen', 'nausea', 'vomit', 'diarrhea', 'constipation', 'gastric', 'ulcer', 'bloating', 'acidity', 'liver', 'jaundice'], speciality: 'Gastroenterologist', urgency: 'medium', reason: 'Digestive symptoms should be assessed promptly.' },
    { keywords: ['child', 'infant', 'baby', 'toddler', 'kid', 'pediatric', 'vaccination'], speciality: 'Pediatricians', urgency: 'medium', reason: "Children's health needs specialized care." },
    { keywords: ['bone', 'joint', 'back pain', 'fracture', 'sprain', 'knee', 'shoulder', 'arthritis', 'spine', 'orthopedic'], speciality: 'Orthopedic', urgency: 'medium', reason: 'Musculoskeletal issues need specialized evaluation.' },
    { keywords: ['anxiety', 'depression', 'mental', 'stress', 'panic', 'mood', 'insomnia', 'psychiatric', 'suicidal', 'bipolar'], speciality: 'Psychiatrist', urgency: 'medium', reason: 'Mental health concerns deserve professional attention.' },
    { keywords: ['ear', 'nose', 'throat', 'tonsil', 'sinus', 'hearing', 'cold', 'snoring', 'nasal'], speciality: 'ENT Specialist', urgency: 'low', reason: 'ENT symptoms are best evaluated by a specialist.' },
    { keywords: ['eye', 'vision', 'cataract', 'glaucoma', 'retina', 'conjunctivitis', 'spectacles'], speciality: 'Ophthalmologist', urgency: 'medium', reason: 'Eye symptoms should be checked promptly.' },
    { keywords: ['kidney', 'urine', 'bladder', 'urinary', 'prostate', 'uti', 'burning urination'], speciality: 'Urologist', urgency: 'medium', reason: 'Urinary symptoms need medical evaluation.' },
    { keywords: ['teeth', 'tooth', 'gum', 'dental', 'cavity', 'mouth', 'jaw', 'toothache'], speciality: 'Dentist', urgency: 'low', reason: 'Dental issues should be addressed by a dentist.' },
    { keywords: ['breathing', 'asthma', 'cough', 'lung', 'tuberculosis', 'pneumonia', 'bronchitis', 'wheeze', 'oxygen'], speciality: 'Pulmonologist', urgency: 'medium', reason: 'Respiratory symptoms need professional assessment.' },
    { keywords: ['period', 'pregnancy', 'gynec', 'ovary', 'uterus', 'cervical', 'vaginal', 'menstrual', 'pcos', 'fertility'], speciality: 'Gynecologist', urgency: 'medium', reason: 'Gynaecological concerns need specialist attention.' },
];

const keywordFallback = (symptoms) => {
    const text = symptoms.toLowerCase();
    let best = null;
    let bestCount = 0;

    for (const entry of KEYWORD_MAP) {
        const matches = entry.keywords.filter(k => text.includes(k));
        if (matches.length > bestCount) {
            bestCount = matches.length;
            best = { ...entry, matched: matches };
        }
    }

    if (!best) {
        return {
            speciality: 'General physician',
            urgency: 'medium',
            urgencyReason: 'A general physician can evaluate your symptoms and refer you to the right specialist.',
            suggestion: 'Based on your description, we recommend consulting a General Physician who can assess your condition and guide you to the right specialist if needed. Please book an appointment at your earliest convenience.',
            keywords: symptoms.trim().split(/\s+/).slice(0, 4),
        };
    }

    return {
        speciality: best.speciality,
        urgency: best.urgency,
        urgencyReason: best.reason,
        suggestion: `Based on your symptoms, a ${best.speciality} would be best placed to help you. Please book an appointment soon. Remember — early consultation leads to better outcomes.`,
        keywords: best.matched.slice(0, 4),
    };
};

// ─── Main controller ──────────────────────────────────────────────────────────
const checkSymptoms = async (req, res) => {
    try {
        const { symptoms } = req.body;

        if (!symptoms || symptoms.trim().length < 5) {
            return res.json({ success: false, message: 'Please describe your symptoms in more detail.' });
        }
        if (symptoms.trim().length > 1000) {
            return res.json({ success: false, message: 'Symptom description is too long. Please be concise.' });
        }

        let aiResult = null;
        let usedFallback = false;

        // Try OpenAI first
        try {
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: `Patient says: "${symptoms.trim()}"` },
                ],
                temperature: 0.3,
                max_tokens: 300,
            });

            const raw = completion.choices[0]?.message?.content?.trim();
            try {
                aiResult = JSON.parse(raw);
            } catch {
                console.warn('OpenAI non-JSON response, using fallback');
            }
        } catch (aiError) {
            console.warn('OpenAI unavailable, using keyword fallback:', aiError?.message);
        }

        // Use fallback if OpenAI failed
        if (!aiResult) {
            aiResult = keywordFallback(symptoms);
            usedFallback = true;
        }

        // Normalise speciality
        const matchedSpeciality = SUPPORTED_SPECIALITIES.find(
            s => s.toLowerCase() === (aiResult.speciality || '').toLowerCase()
        ) || 'General physician';

        // Fetch top 3 matching doctors
        const doctors = await doctorModel
            .find({ speciality: matchedSpeciality, available: true })
            .select('name speciality image fees averageRating totalReviews experience isFeatured address')
            .sort({ isFeatured: -1, averageRating: -1 })
            .limit(3)
            .lean();

        return res.json({
            success: true,
            usedFallback,
            result: {
                speciality: matchedSpeciality,
                urgency: aiResult.urgency || 'medium',
                urgencyReason: aiResult.urgencyReason || '',
                suggestion: aiResult.suggestion || '',
                keywords: aiResult.keywords || [],
            },
            doctors,
        });

    } catch (error) {
        console.error('Symptom check error:', error?.message);
        res.json({ success: false, message: 'Symptom check failed. Please try again.' });
    }
};

export { checkSymptoms };

