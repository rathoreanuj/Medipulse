const termsSections = [
  {
    title: '1. Acceptance of Terms',
    points: [
      'By accessing or using MediPulse, you agree to these Terms of Service.',
      'If you do not agree with these terms, do not use the platform.'
    ]
  },
  {
    title: '2. Scope of Service',
    points: [
      'MediPulse enables appointment booking, doctor-patient communication, and related healthcare workflow features.',
      'MediPulse does not replace emergency care. In urgent situations, contact local emergency services immediately.'
    ]
  },
  {
    title: '3. Account Responsibilities',
    points: [
      'Users must provide accurate information and keep account credentials secure.',
      'You are responsible for activity performed using your account.',
      'You must notify us promptly if you suspect unauthorized access.'
    ]
  },
  {
    title: '4. Medical Disclaimer',
    points: [
      'Doctors are independent medical professionals responsible for their own medical advice and treatment decisions.',
      'Platform tools such as symptom suggestions or summaries are assistive and are not a substitute for professional diagnosis.',
      'Always follow licensed medical guidance for treatment, prescriptions, and emergencies.'
    ]
  },
  {
    title: '5. Appointments, Cancellations, and Payments',
    points: [
      'Appointment slots are subject to doctor availability and confirmation rules.',
      'Cancellation, refund, and rescheduling outcomes depend on platform policies and payment provider terms.',
      'Premium plans and featured listings are billed according to the plan selected at checkout.'
    ]
  },
  {
    title: '6. Acceptable Use',
    points: [
      'Do not misuse the platform, impersonate others, submit abusive content, or attempt unauthorized access.',
      'Do not upload harmful code or interfere with service operations.',
      'Violation may result in suspension or termination of access.'
    ]
  },
  {
    title: '7. Notifications and Communications',
    points: [
      'MediPulse may send transactional communications such as OTPs, reminders, and care-related updates.',
      'By using the service, you consent to essential service notifications needed for platform functionality.'
    ]
  },
  {
    title: '8. Intellectual Property',
    points: [
      'Platform branding, interface, and software components are owned by MediPulse or its licensors.',
      'You may not copy, reverse engineer, or redistribute platform components except as permitted by law.'
    ]
  },
  {
    title: '9. Limitation of Liability',
    points: [
      'To the extent permitted by law, MediPulse is not liable for indirect, incidental, or consequential damages.',
      'MediPulse is not responsible for clinical decisions made by independent practitioners.'
    ]
  },
  {
    title: '10. Suspension and Termination',
    points: [
      'We may suspend or terminate accounts that violate these terms, legal requirements, or security expectations.',
      'Certain obligations, including legal compliance and dispute provisions, survive termination.'
    ]
  },
  {
    title: '11. Governing Law and Disputes',
    points: [
      'These terms are governed by applicable laws in the operating jurisdiction of MediPulse.',
      'Disputes should first be attempted to be resolved through support and good-faith discussion.'
    ]
  },
  {
    title: '12. Updates to Terms',
    points: [
      'We may revise these Terms of Service from time to time.',
      'Continued use after updates means you accept the revised terms.'
    ]
  }
]

const TermsOfService = () => {
  return (
    <div className='max-w-5xl mx-auto px-4 py-10 sm:py-14'>
      <div className='bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-10'>
        <h1 className='text-3xl sm:text-4xl font-bold text-gray-900'>Terms of Service</h1>
        <p className='mt-3 text-sm text-gray-500'>Effective date: March 18, 2026</p>

        <p className='mt-6 text-gray-700 leading-7'>
          These Terms of Service govern your use of MediPulse. Please read them carefully before using the
          platform as a patient, doctor, or administrator.
        </p>

        <div className='mt-8 space-y-7'>
          {termsSections.map((section) => (
            <section key={section.title}>
              <h2 className='text-lg sm:text-xl font-semibold text-gray-900'>{section.title}</h2>
              <ul className='mt-3 space-y-2'>
                {section.points.map((point) => (
                  <li key={point} className='text-gray-700 leading-7 flex gap-2'>
                    <span className='mt-2 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0' />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section className='mt-8 border-t border-gray-200 pt-6'>
          <h2 className='text-lg sm:text-xl font-semibold text-gray-900'>Need Help?</h2>
          <p className='mt-3 text-gray-700 leading-7'>
            For questions about these terms, please contact us through the support channels available on MediPulse.
          </p>
        </section>
      </div>
    </div>
  )
}

export default TermsOfService
