import doctorModel from '../models/doctorModel.js';
import logger from '../utils/logger.js';

// ─── Speciality keyword map ────────────────────────────────────────────────
const SPECIALITY_MAP = {
  'general physician': ['general', 'physician', 'gp', 'fever', 'cold', 'flu', 'cough', 'allergy', 'family doctor'],
  'gynecologist':      ['gynecologist', 'gynaecologist', 'gynae', 'pregnancy', 'obstetrics', 'women', 'periods', 'menstrual', 'fertility'],
  'dermatologist':     ['dermatologist', 'skin', 'acne', 'rash', 'eczema', 'hair loss', 'derma'],
  'pediatricians':     ['pediatrician', 'pediatric', 'child', 'children', 'baby', 'infant', 'kids', 'toddler'],
  'neurologist':       ['neurologist', 'neuro', 'brain', 'headache', 'migraine', 'epilepsy', 'nerve', 'stroke'],
  'gastroenterologist':['gastroenterologist', 'gastro', 'stomach', 'digestion', 'liver', 'gut', 'bowel', 'acid reflux', 'ibs'],
  'cardiologist':      ['cardiologist', 'cardio', 'heart', 'cardiac', 'blood pressure', 'hypertension', 'chest pain'],
  'orthopedic':        ['orthopedic', 'ortho', 'bone', 'joint', 'knee', 'spine', 'fracture', 'back pain', 'shoulder'],
  'psychiatrist':      ['psychiatrist', 'psychiatry', 'mental', 'anxiety', 'depression', 'stress', 'therapy', 'psychologist'],
  'ophthalmologist':   ['ophthalmologist', 'eye', 'vision', 'glasses', 'cataract', 'retina', 'optometrist'],
  'ent':               ['ent', 'ear', 'nose', 'throat', 'sinus', 'tonsil', 'hearing'],
  'urologist':         ['urologist', 'urology', 'kidney', 'bladder', 'urine', 'prostate'],
  'oncologist':        ['oncologist', 'cancer', 'tumor', 'chemotherapy', 'radiation', 'oncology'],
  'endocrinologist':   ['endocrinologist', 'diabetes', 'thyroid', 'hormone', 'insulin', 'sugar'],
}

// ─── Indian city list (common) ──────────────────────────────────────────────
const CITIES = [
  'delhi', 'mumbai', 'bangalore', 'bengaluru', 'hyderabad', 'chennai', 'kolkata',
  'pune', 'ahmedabad', 'jaipur', 'lucknow', 'surat', 'chandigarh', 'nagpur',
  'bhopal', 'patna', 'indore', 'vadodara', 'noida', 'gurgaon', 'gurugram',
  'coimbatore', 'kochi', 'visakhapatnam', 'agra', 'meerut', 'amritsar',
]

/**
 * POST /api/user/smart-search
 * Body: { query: string }
 * Parses natural language and returns matching doctors.
 */
const smartSearch = async (req, res) => {
  try {
    const { query } = req.body
    if (!query || query.trim().length < 2) {
      return res.json({ success: false, message: 'Please enter a search query.' })
    }

    const q = query.toLowerCase()

    // 1. Detect speciality
    let detectedSpeciality = null
    for (const [speciality, keywords] of Object.entries(SPECIALITY_MAP)) {
      if (keywords.some(kw => q.includes(kw))) {
        detectedSpeciality = speciality
        break
      }
    }

    // 2. Detect city / location
    let detectedCity = CITIES.find(city => q.includes(city)) || null

    // 3. Detect price intent
    const affordableTerms = ['affordable', 'cheap', 'low cost', 'budget', 'inexpensive', 'low fee', 'low price']
    const premiumTerms    = ['premium', 'best', 'top', 'expensive', 'high end']
    const isAffordable = affordableTerms.some(t => q.includes(t))
    const isPremium    = premiumTerms.some(t => q.includes(t))

    // 4. Detect rating intent
    const goodRatingTerms = ['good rating', 'highly rated', 'top rated', 'best rated', 'high rating', 'top doctor', 'experienced']
    const wantsHighRating = goodRatingTerms.some(t => q.includes(t))

    // 5. Detect experience preference
    const experienceMatch = q.match(/(\d+)\s*(years?|yr)\s*(of\s*)?experience/)
    const minExperience   = experienceMatch ? parseInt(experienceMatch[1]) : null

    // 6. Build MongoDB query
    const filter = { available: true }

    if (detectedSpeciality) {
      // Case-insensitive partial match for speciality
      filter.speciality = { $regex: new RegExp(detectedSpeciality, 'i') }
    }

    if (detectedCity) {
      // Search city in address object (address.line1 or address.line2)
      filter.$or = [
        { 'address.line1': { $regex: new RegExp(detectedCity, 'i') } },
        { 'address.line2': { $regex: new RegExp(detectedCity, 'i') } },
      ]
    }

    if (wantsHighRating) {
      filter.averageRating = { $gte: 4 }
    }

    // 7. Fetch
    let doctors = await doctorModel.find(filter)
      .select('-password -email -slots_booked')
      .lean()

    // 8. Filter by experience if specified
    if (minExperience) {
      doctors = doctors.filter(d => {
        const expNum = parseInt((d.experience || '').replace(/\D/g, ''))
        return !isNaN(expNum) && expNum >= minExperience
      })
    }

    // 9. Sort
    if (isAffordable) {
      doctors.sort((a, b) => (a.fees || 0) - (b.fees || 0))
    } else if (isPremium || wantsHighRating) {
      doctors.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
    } else {
      // Default: featured first, then rating
      doctors.sort((a, b) => {
        const af = a.isFeatured && a.featuredUntil && new Date(a.featuredUntil) > new Date()
        const bf = b.isFeatured && b.featuredUntil && new Date(b.featuredUntil) > new Date()
        if (af && !bf) return -1
        if (!af && bf) return 1
        return (b.averageRating || 0) - (a.averageRating || 0)
      })
    }

    // 10. Build human-readable summary of what was parsed
    const parsedFilters = []
    if (detectedSpeciality) parsedFilters.push(`Speciality: ${detectedSpeciality}`)
    if (detectedCity)       parsedFilters.push(`Location: ${detectedCity}`)
    if (isAffordable)       parsedFilters.push('Sorted by: lowest fees')
    if (wantsHighRating)    parsedFilters.push('Rating: 4★ and above')
    if (minExperience)      parsedFilters.push(`Experience: ${minExperience}+ years`)

    res.json({
      success: true,
      doctors,
      parsedFilters,
      totalFound: doctors.length,
    })
  } catch (error) {
    logger.error('Smart search error', { error: error.message })
    res.json({ success: false, message: error.message })
  }
}

export { smartSearch }
