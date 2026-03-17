import OpenAI from 'openai';
import jwt from 'jsonwebtoken';
import appointmentModel from '../models/appointmentModel.js';
import userModel from '../models/userModel.js';
import { sendConsultationSummaryEmail } from '../services/emailService.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SUMMARY_SYSTEM_PROMPT = `
You are a medical documentation assistant for MediPulse.
Given brief doctor notes about a consultation, produce a structured clinical summary in ONLY valid JSON (no markdown):
{
  "chiefComplaint": "<1 sentence — why the patient came>",
  "assessment": "<1-2 sentences — doctor's clinical impression based on notes>",
  "recommendations": ["<recommendation 1>", "<recommendation 2>", "<recommendation 3>"],
  "medications": ["<medication/advice 1>", "<medication/advice 2>"],
  "followUp": "<when/how the patient should follow up>",
  "disclaimer": "This summary is AI-generated from doctor notes for informational purposes only. It does not replace professional medical advice. Always follow your doctor's instructions."
}
Rules:
- Keep language friendly and clear — patient will read this.
- Do NOT invent diagnoses. Only use what is in the notes.
- If a section has no information, provide a sensible generic statement.
- recommendations should be 2-4 actionable bullet points.
- medications should list any mentioned drugs, or general advice if none mentioned.
`.trim();

// ── Keyword-based fallback summary ──────────────────────────────────────────
const buildFallbackSummary = (notes, doctorName) => ({
    chiefComplaint: 'Patient attended a video consultation as documented.',
    assessment: `Based on the consultation with Dr. ${doctorName}, an assessment was conducted and advice was provided as noted.`,
    recommendations: [
        'Follow the doctor\'s advice carefully.',
        'Take any prescribed medications as directed.',
        'Maintain a healthy lifestyle — adequate rest, hydration, and nutrition.',
        'Monitor your symptoms and contact us if they worsen.',
    ],
    medications: notes?.trim()
        ? [`As discussed during consultation: ${notes.slice(0, 200)}`]
        : ['Please follow up with your doctor regarding any prescriptions.'],
    followUp: 'Book a follow-up appointment on MediPulse if symptoms persist or as advised by your doctor.',
    disclaimer: "This summary is AI-generated from doctor notes for informational purposes only. It does not replace professional medical advice. Always follow your doctor's instructions.",
});

// ── Main controller ──────────────────────────────────────────────────────────
const generateConsultationSummary = async (req, res) => {
    try {
        const { appointmentId, notes } = req.body;
        const dtoken = req.headers.dtoken;

        if (!appointmentId) return res.json({ success: false, message: 'Appointment ID required' });
        if (!dtoken) return res.json({ success: false, message: 'Doctor authentication required' });

        // Verify doctor JWT
        let doctorId;
        try {
            const decoded = jwt.verify(dtoken, process.env.JWT_SECRET);
            doctorId = decoded.id;
        } catch {
            return res.json({ success: false, message: 'Invalid or expired doctor token' });
        }

        // Load appointment
        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment) return res.json({ success: false, message: 'Appointment not found' });
        if (appointment.docId !== doctorId) return res.json({ success: false, message: 'Not authorized' });

        const patientEmail = appointment.userData?.email;
        const patientName  = appointment.userData?.name || 'Patient';
        const doctorName   = appointment.docData?.name  || 'Doctor';

        if (!patientEmail) return res.json({ success: false, message: 'Patient email not found' });

        let summary;
        let usedFallback = false;

        // Try OpenAI
        try {
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: SUMMARY_SYSTEM_PROMPT },
                    { role: 'user', content: `Doctor: Dr. ${doctorName}\nPatient: ${patientName}\nConsultation notes: "${notes || 'No notes provided'}"\nSpeciality: ${appointment.docData?.speciality || 'General'}` },
                ],
                temperature: 0.4,
                max_tokens: 500,
            });

            const raw = completion.choices[0]?.message?.content?.trim();
            try {
                summary = JSON.parse(raw);
            } catch {
                console.warn('OpenAI non-JSON summary, using fallback');
            }
        } catch (aiError) {
            console.warn('OpenAI summary failed, using fallback:', aiError?.message);
        }

        if (!summary) {
            summary = buildFallbackSummary(notes, doctorName);
            usedFallback = true;
        }

        // Send email to patient
        await sendConsultationSummaryEmail(patientEmail, patientName, doctorName, summary);

        // Mark appointment as completed with summary
        await appointmentModel.findByIdAndUpdate(appointmentId, {
            isCompleted: true,
            consultationSummary: summary,
            summaryGeneratedAt: Date.now(),
        });

        return res.json({
            success: true,
            summary,
            usedFallback,
            message: `Consultation summary emailed to ${patientEmail}`,
        });

    } catch (error) {
        console.error('Summary generation error:', error?.message);
        res.json({ success: false, message: 'Failed to generate summary. Please try again.' });
    }
};

export { generateConsultationSummary };
