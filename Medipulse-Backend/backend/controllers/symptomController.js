import OpenAI from 'openai';
import doctorModel from '../models/doctorModel.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Medical specialities we support — must match the enum in the DB
const SUPPORTED_SPECIALITIES = [
    'General physician', 'Gynecologist', 'Dermatologist',
    'Pediatricians', 'Neurologist', 'Gastroenterologist',
    'Cardiologist', 'Orthopedic', 'Psychiatrist', 'ENT Specialist',
    'Ophthalmologist', 'Urologist', 'Dentist', 'Pulmonologist',
];

const SYSTEM_PROMPT = `
You are MediPulse AI — a medical triage assistant for a doctor-booking platform in India.

Given a patient's symptom description, respond with ONLY valid JSON (no markdown, no extra text) in this exact structure:
{
  "speciality": "<one of the supported specialities>",
  "urgency": "low" | "medium" | "high",
  "urgencyReason": "<one short sentence explaining urgency>",
  "suggestion": "<2-3 sentences of friendly, non-alarming advice>",
  "keywords": ["<symptom1>", "<symptom2>", "<symptom3>"]
}

Supported specialities: ${SUPPORTED_SPECIALITIES.join(', ')}.

Rules:
- Never diagnose. Never prescribe medication.
- Always recommend booking a doctor.
- Urgency "high" means symptoms could be serious and need prompt attention.
- If symptoms are unclear, choose "General physician".
- keywords should be 2-4 short symptom words extracted from the patient's input.
`.trim();

const checkSymptoms = async (req, res) => {
    try {
        const { symptoms } = req.body;

        if (!symptoms || symptoms.trim().length < 5) {
            return res.json({ success: false, message: 'Please describe your symptoms in more detail.' });
        }

        if (symptoms.trim().length > 1000) {
            return res.json({ success: false, message: 'Symptom description is too long. Please be concise.' });
        }

        // Call OpenAI
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: `Patient says: "${symptoms.trim()}"` },
            ],
            temperature: 0.3,
            max_tokens: 300,
        });

        const raw = completion.choices[0]?.message?.content?.trim();

        let aiResult;
        try {
            aiResult = JSON.parse(raw);
        } catch {
            console.error('OpenAI returned non-JSON:', raw);
            return res.json({ success: false, message: 'AI response parsing failed. Please try again.' });
        }

        // Normalise speciality to match DB values
        const matchedSpeciality = SUPPORTED_SPECIALITIES.find(
            s => s.toLowerCase() === (aiResult.speciality || '').toLowerCase()
        ) || 'General physician';

        // Fetch top 3 matching doctors sorted by rating, then featured
        const doctors = await doctorModel
            .find({ speciality: matchedSpeciality, available: true })
            .select('name speciality image fees averageRating totalReviews experience isFeatured address')
            .sort({ isFeatured: -1, averageRating: -1 })
            .limit(3)
            .lean();

        return res.json({
            success: true,
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
        // Graceful degradation — OpenAI key missing or quota exceeded
        if (error?.status === 401 || error?.code === 'invalid_api_key') {
            return res.json({ success: false, message: 'AI service not configured. Please add your OpenAI API key.' });
        }
        if (error?.status === 429) {
            return res.json({ success: false, message: 'AI service is busy. Please try again in a moment.' });
        }
        res.json({ success: false, message: 'Symptom check failed. Please try again.' });
    }
};

export { checkSymptoms };
