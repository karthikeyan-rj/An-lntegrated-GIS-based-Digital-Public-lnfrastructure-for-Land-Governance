/**
 * Authorization / Role-Matrix validation.
 *
 * Verifies the backend's access-control invariants against a running server
 * (default http://localhost:4000). This is a live smoke test that asserts:
 *   - citizens only see their own parcels (ownership / IDOR)
 *   - public map/search never leak owner identifiers
 *   - officers are department-scoped
 *   - admins have system-wide access
 *
 * Requires the server to be running and seeded (npm run seed) first.
 * Run:  npm run validate:auth   (from backend/)
 */

const BASE = process.env.API_BASE || 'http://localhost:4000/api'
const PW = process.env.DEMO_PW || 'demo1234'

let passed = 0
let failed = 0
const failures = []

function check(name, cond, detail) {
  if (cond) {
    passed++
    console.log(`  ✔ ${name}`)
  } else {
    failed++
    failures.push(name)
    console.log(`  ✘ ${name}  ${detail || ''}`)
  }
}

async function login(email) {
  const r = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PW }),
  })
  if (!r.ok) throw new Error(`login ${email} failed: ${r.status}`)
  const j = await r.json()
  return { token: j.token, role: j.user.role }
}

async function req(token, path, method = 'GET', body) {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const r = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  let j = null
  try { j = await r.json() } catch {}
  return { status: r.status, body: j }
}

async function main() {
  // Owners: A owns p1 + p11..p20; B owns p2; C owns p8 + p26.
  const A = await login('ramanathan@email.com')
  const B = await login('meenakshi@email.com')
  const C = await login('selvam@email.com')
  const officer = await login('suresh.b@revenue.gov.in') // revenue
  const admin = await login('admin@landstack.gov.in')

  console.log('\n[1] Public surface — no owner PII leak')
  const pubList = await req(null, '/parcels')
  check('GET /parcels (public) returns 200', pubList.status === 200)
  const f0 = ((pubList.body || {}).features || [])[0] || {}
  check('/parcels feature has NO ownerName', !('ownerName' in (f0.properties || {})))

  const search = await req(null, '/parcels/search?q=38472916')
  check('GET /parcels/search returns a result', (search.body.results || []).length === 1)
  const sr0 = ((search.body || {}).results || [])[0] || {}
  check('/parcels/search result has NO ownerName', !('ownerName' in sr0))

  console.log('\n[2] Ownership scoping (IDOR)')
  const aOwn = await req(A.token, '/parcels/TN-MDU-RV-38472916')
  check('owner reads own parcel → full record', aOwn.body.canViewFullRecord === true)

  const bOwn = await req(B.token, '/parcels/TN-CHN-PM-72618345')
  check('B reads own parcel → full record', bOwn.body.canViewFullRecord === true)

  const aReadB = await req(A.token, '/parcels/TN-CHN-PM-72618345')
  check('A reads B parcel → NOT full record', aReadB.body.canViewFullRecord === false)
  check('A reading B parcel has no ownerName', !('ownerName' in (aReadB.body.parcel || {})))
  check('A reading B parcel flagged restricted', aReadB.body.parcel?.restricted === true)

  const aOwnList = await req(A.token, '/me/properties')
  check('A /me/properties count matches ownership (11)', aOwnList.body.count === 11)
  const bOwnList = await req(B.token, '/me/properties')
  check('B /me/properties count matches ownership (1)', bOwnList.body.count === 1)
  const cOwnList = await req(C.token, '/me/properties')
  check('C /me/properties count matches ownership (2)', cOwnList.body.count === 2)

  console.log('\n[3] Officer department scoping')
  const revLand = await req(officer.token, '/land-records')
  check('revenue officer reads land-records → 200', revLand.status === 200)
  const revBP = await req(officer.token, '/building-permissions')
  check('revenue officer denied building-permissions → 403', revBP.status === 403)
  const revApps = await req(officer.token, '/applications')
  check('revenue officer applications are department-scoped', (revApps.body.applications || []).every((a) => String(a.department).toLowerCase() === 'revenue'))

  console.log('\n[4] Admin system-wide access')
  const adBP = await req(admin.token, '/building-permissions')
  check('admin reads building-permissions → 200', adBP.status === 200)
  const adLand = await req(admin.token, '/land-records')
  check('admin reads land-records → 200', adLand.status === 200)
  const adPar = await req(admin.token, '/parcels/TN-CHN-PM-72618345')
  check('admin reads any parcel full record', adPar.body.canViewFullRecord === true)

  console.log('\n[5] Officer reads any parcel full record (role-based)')
  const offAny = await req(officer.token, '/parcels/TN-CHN-PM-72618345')
  check('officer reads non-owned parcel full record', offAny.body.canViewFullRecord === true)

  console.log('\n[6] Records ownership scoping for citizens')
  const cLandOther = await req(A.token, '/land-records/TN-CHN-PM-72618345')
  check('citizen A reading B ulpin record → 403', cLandOther.status === 403)
  const cLandSelf = await req(A.token, '/land-records/TN-MDU-RV-38472916')
  check('citizen A reading own ulpin record → 200', cLandSelf.status === 200)

  console.log('\n[7] Analytics role scoping')
  const adDash = await req(admin.token, '/analytics/dashboard')
  check('admin dashboard scope = all', adDash.body.scope === 'all')
  const cDash = await req(A.token, '/analytics/dashboard')
  check('citizen dashboard scope = own', cDash.body.scope === 'own')

  console.log(`\nResult: ${passed} passed, ${failed} failed`)
  if (failed) {
    console.log('Failed checks:', failures.join(', '))
    process.exit(1)
  }
}

main().catch((e) => {
  console.error('Validation could not run:', e.message)
  console.error('Ensure the backend is running and seeded (npm run seed).')
  process.exit(2)
})
