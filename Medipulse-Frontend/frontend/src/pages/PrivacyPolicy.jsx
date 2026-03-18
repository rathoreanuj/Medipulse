const sections = [
  {
    title: '1. Information We Collect',
    points: [
      'Account data such as name, email, phone number, date of birth, and profile details.',
      'Appointment and consultation data including doctor selection, time slots, chat messages, and video consultation metadata.',
      'Health-related information that you voluntarily provide, such as symptoms, consultation notes, and review comments.',
      'Payment and subscription metadata from payment providers. We do not store full card details on our servers.'
    ]
  },
  {
    title: '2. How We Use Your Information',
    points: [
      'To provide core services including appointments, messaging, reminders, and premium plan features.',
      'To improve care coordination between patients and doctors on the platform.',
      'To send transactional communications such as OTPs, appointment reminders, and important service notifications.',
      'To maintain platform safety, detect abuse, and comply with legal obligations.'
    ]
  },
  {
    title: '3. Healthcare Data and Confidentiality',
    points: [
      'Health-related information is treated as sensitive personal data and access is limited by role-based authorization.',
      'Doctors can access only the records required to deliver care for their assigned appointments.',
      'Administrative access is limited to operational and compliance purposes.'
    ]
  },
  {
    title: '4. Sharing of Information',
    points: [
      'We may share information with doctors, payment processors, cloud hosting vendors, and communication providers to deliver the service.',
      'We do not sell personal data to third parties.',
      'We may disclose information when required by law, legal process, or to protect user safety and platform integrity.'
    ]
  },
  {
    title: '5. Data Retention',
    points: [
      'We retain account and consultation-related records for as long as needed to provide services, resolve disputes, and meet legal requirements.',
      'When no longer required, data is deleted or anonymized according to operational and legal constraints.'
    ]
  },
  {
    title: '6. Security Practices',
    points: [
      'We use authentication, access controls, and monitored infrastructure to protect personal information.',
      'No platform can guarantee absolute security. Users should protect account credentials and report suspected misuse promptly.'
    ]
  },
  {
    title: '7. Your Choices and Rights',
    points: [
      'You may update profile information from your account.',
      'You may request correction or deletion of data, subject to medical, financial, and legal retention obligations.',
      'You may contact us for privacy-related requests and grievance resolution.'
    ]
  },
  {
    title: '8. Children and Minors',
    points: [
      'MediPulse is intended for users who can legally consent to healthcare and digital services in their jurisdiction.',
      'If a minor uses the service, a parent or legal guardian should supervise account and medical interactions.'
    ]
  },
  {
    title: '9. Policy Updates',
    points: [
      'We may update this Privacy Policy periodically to reflect legal, technical, or product changes.',
      'Material changes will be posted on this page with an updated effective date.'
    ]
  }
]

const PrivacyPolicy = () => {
  return (
    <div className='max-w-5xl mx-auto px-4 py-10 sm:py-14'>
      <div className='bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-10'>
        <h1 className='text-3xl sm:text-4xl font-bold text-gray-900'>Privacy Policy</h1>
        <p className='mt-3 text-sm text-gray-500'>Effective date: March 18, 2026</p>

        <p className='mt-6 text-gray-700 leading-7'>
          MediPulse is a healthcare appointment and consultation platform. This Privacy Policy explains how we
          collect, use, and protect personal information when you use our services as a patient, doctor, or
          administrator.
        </p>

        <div className='mt-8 space-y-7'>
          {sections.map((section) => (
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
          <h2 className='text-lg sm:text-xl font-semibold text-gray-900'>10. Contact for Privacy Matters</h2>
          <p className='mt-3 text-gray-700 leading-7'>
            For privacy concerns, data requests, or grievance redressal, contact us from the support section on
            MediPulse or via the Contact page.
          </p>
        </section>
      </div>
    </div>
  )
}

export default PrivacyPolicy
