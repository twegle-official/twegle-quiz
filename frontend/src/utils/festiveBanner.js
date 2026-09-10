// Picks which festival (if any) to show a homepage banner for today —
// same "deterministic by date, no cron job" pattern Horoscope and Daily
// Quiz already use (see dailyQuiz.js), just checking against a fixed
// calendar instead of rotating through a content pool. Purely computed
// from today's date on every page load; nothing is stored, nothing needs
// to run overnight.
//
// Fixed-date festivals (New Year, Republic Day, Independence Day,
// Christmas) are the same every year and never need updating. Diwali,
// Holi, Raksha Bandhan, and Eid al-Fitr follow the lunar calendar and
// shift by ~11-18 days (Eid) or a few weeks (the Hindu festivals) each
// year, so their dates can't be computed by formula — they're hand-listed
// per year below instead, out to 2028. When a festival has no entry for
// the current year (2029 and beyond, until someone adds more), its
// banner simply never shows — a quiet gap, not a crash. Eid al-Fitr's
// exact date also depends on moon sighting and can vary by a day or two
// even once the year is here; treat these as best-available estimates,
// not fixed civil holidays like the other three.
const FESTIVALS = [
  {
    key: 'new-year',
    emoji: '🎉',
    label: 'Happy New Year!',
    hi: 'नया साल मुबारक हो!',
    gradient: 'from-violet-500 to-fuchsia-500',
    dates: { 2026: '2026-01-01', 2027: '2027-01-01', 2028: '2028-01-01' },
  },
  {
    key: 'republic-day',
    emoji: '🇮🇳',
    label: 'Happy Republic Day!',
    hi: 'गणतंत्र दिवस की शुभकामनाएं!',
    gradient: 'from-orange-500 via-white to-green-600',
    // Middle stop reads as near-white on the gradient text/icon treatment
    // below — kept as a 3-stop tricolor rather than 2, since 2 stops alone
    // (orange→green) loses the white band that makes it read as the
    // Indian flag rather than just "an orange-to-green banner."
    dates: { 2026: '2026-01-26', 2027: '2027-01-26', 2028: '2028-01-26' },
  },
  {
    key: 'holi',
    emoji: '🎨',
    label: 'Happy Holi!',
    hi: 'होली की शुभकामनाएं!',
    gradient: 'from-pink-500 via-yellow-400 to-sky-500',
    dates: { 2026: '2026-03-04', 2027: '2027-03-22', 2028: '2028-03-10' },
  },
  {
    key: 'eid-ul-fitr',
    emoji: '🌙',
    label: 'Eid Mubarak!',
    hi: 'ईद मुबारक!',
    gradient: 'from-emerald-500 to-teal-500',
    // Estimated — see the file-level note above on moon-sighting variance.
    dates: { 2026: '2026-03-21', 2027: '2027-03-09', 2028: '2028-02-26' },
  },
  {
    key: 'independence-day',
    emoji: '🇮🇳',
    label: 'Happy Independence Day!',
    hi: 'स्वतंत्रता दिवस की शुभकामनाएं!',
    gradient: 'from-orange-500 via-white to-green-600',
    dates: { 2026: '2026-08-15', 2027: '2027-08-15', 2028: '2028-08-15' },
  },
  {
    key: 'raksha-bandhan',
    emoji: '🎀',
    label: 'Happy Raksha Bandhan!',
    hi: 'रक्षाबंधन की शुभकामनाएं!',
    gradient: 'from-amber-500 to-pink-500',
    dates: { 2026: '2026-08-28', 2027: '2027-08-17', 2028: '2028-08-05' },
  },
  {
    key: 'diwali',
    emoji: '🪔',
    label: 'Happy Diwali!',
    hi: 'दीवाली की शुभकामनाएं!',
    gradient: 'from-amber-400 via-orange-500 to-red-500',
    dates: { 2026: '2026-11-08', 2027: '2027-10-29', 2028: '2028-10-17' },
  },
  {
    key: 'christmas',
    emoji: '🎄',
    label: 'Merry Christmas!',
    hi: 'क्रिसमस की शुभकामनाएं!',
    gradient: 'from-red-500 to-green-600',
    dates: { 2026: '2026-12-25', 2027: '2027-12-25', 2028: '2028-12-25' },
  },
]

// The banner starts showing this many days before the festival itself (to
// build a little anticipation, e.g. "3 days to Diwali") and keeps showing
// through the festival day itself, then disappears the next day.
const LEAD_DAYS = 3

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function daysBetween(a, b) {
  const msPerDay = 86400000
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
  return Math.round((startOfDay(b) - startOfDay(a)) / msPerDay)
}

// Returns the currently-active festival (with how many days remain until
// it, 0 meaning "today") or null if none is in its window right now. If
// two festival windows somehow overlap, the one whose actual date is
// soonest wins — the nearer occasion is the more relevant one to lead with.
export function getActiveFestival(today = new Date()) {
  let best = null

  for (const festival of FESTIVALS) {
    const isoDate = festival.dates[today.getFullYear()]
    if (!isoDate) continue

    const [y, m, d] = isoDate.split('-').map(Number)
    const festivalDate = new Date(y, m - 1, d)
    const daysUntil = daysBetween(today, festivalDate)

    if (daysUntil < 0 || daysUntil > LEAD_DAYS) continue
    if (!best || daysUntil < best.daysUntil) {
      best = { ...festival, daysUntil }
    }
  }

  return best
}

// Exported for tests / debugging only — not used by the banner itself.
export { dateKey }
