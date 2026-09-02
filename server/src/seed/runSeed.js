import 'dotenv/config'
import connectDB from '../config/db.js'
import Parcel from '../models/Parcel.js'
import demoParcelGeoJSON from '../data/demoParcels.js'

/**
 * Seeds the `parcels` collection with clearly-labelled DEMO parcel geometries
 * (isDemo: true). It does NOT create fake production land records, users, etc.
 * Run with: npm run seed
 */
async function seedDemoParcels() {
  await connectDB()

  const docs = demoParcelGeoJSON.features.map((f) => ({
    ulpin: f.properties.ulpin,
    surveyNumber: f.properties.surveyNumber,
    village: 'Demo Village',
    taluk: 'Demo Taluk',
    district: f.properties.landUse ? deriveDistrict(f) : 'Demo District',
    state: f.properties.ulpin.startsWith('CH') ? 'Chandigarh' : 'Tamil Nadu',
    area: f.properties.area,
    areaUnit: 'acres',
    landUse: f.properties.landUse.toLowerCase(),
    ownershipStatus: f.properties.ownershipStatus.toLowerCase(),
    isDemo: true,
    geometry: f.geometry,
  }))

  await Parcel.deleteMany({ isDemo: true })
  const inserted = await Parcel.insertMany(docs)
  console.log(`✔ Seeded ${inserted.length} demo parcels into 'parcels' collection.`)
  process.exit(0)
}

function deriveDistrict(f) {
  const ulpin = f.properties.ulpin
  if (ulpin.includes('MDU')) return 'Madurai'
  if (ulpin.includes('CHN')) return 'Chennai'
  if (ulpin.includes('CBE')) return 'Coimbatore'
  if (ulpin.includes('TRZ')) return 'Tiruchirappalli'
  if (ulpin.includes('CH-')) return 'Chandigarh'
  return 'Demo District'
}

seedDemoParcels().catch((err) => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})
