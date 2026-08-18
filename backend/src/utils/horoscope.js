import { ZODIAC_KEYS, findZodiacSign } from '../data/zodiacSigns.js'
import { SIGN_TRAITS, PERIOD_ACTIONS, HOROSCOPE_PERIODS, HOROSCOPE_DISCLAIMER } from '../data/horoscopeContent.js'

const MS_PER_DAY = 86400000

// A plain, auditable day-count since the Unix epoch — always increasing,
// deterministic, and doesn't need a "why did this repeat" explanation the
// way a calendar day-of-year would once a year rolls over.
function daysSinceEpoch(date) {
  return Math.floor(date.getTime() / MS_PER_DAY)
}

// One integer "date unit" per period — the coarser the period, the slower
// this changes, so a horoscope only updates roughly as often as the period
// implies (daily/weekly/monthly/yearly) without any stored state or cron
// job; the same date always produces the same unit, and therefore the same
// horoscope, computed fresh on every request.
function dateUnitForPeriod(period, date) {
  const days = daysSinceEpoch(date)
  if (period === 'day') return days
  if (period === 'week') return Math.floor(days / 7)
  if (period === 'month') return date.getFullYear() * 12 + date.getMonth()
  return date.getFullYear() // year
}

// Mixes the date unit with the sign's position in the zodiac list so that,
// for the same date, different signs land on different trait/action
// combinations rather than all showing the identical horoscope. Simple
// integer arithmetic, not a cryptographic hash — there's nothing here that
// needs to be unpredictable, only deterministic and evenly spread out.
function combinedIndex(dateUnit, signIndex) {
  return Math.abs(dateUnit * 13 + signIndex * 7)
}

// Builds the horoscope text (sign info, trait, action, disclaimer) for one sign/period/language
export function computeHoroscope(signKey, period, language, date = new Date()) {
  const sign = findZodiacSign(signKey)
  if (!sign) return null
  if (!HOROSCOPE_PERIODS.includes(period)) return null
  const lang = language === 'hi' ? 'hi' : 'en'

  const traits = SIGN_TRAITS[lang][signKey]
  const actions = PERIOD_ACTIONS[lang][period]
  const signIndex = ZODIAC_KEYS.indexOf(signKey)

  const dateUnit = dateUnitForPeriod(period, date)
  const index = combinedIndex(dateUnit, signIndex)
  const trait = traits[index % traits.length]
  const action = actions[Math.floor(index / traits.length) % actions.length]

  return {
    sign: sign.key,
    signName: sign.name[lang],
    emoji: sign.emoji,
    dateRange: sign.dateRange[lang],
    gradient: sign.gradient,
    period,
    language: lang,
    text: `${trait} ${action}`,
    disclaimer: HOROSCOPE_DISCLAIMER[lang],
  }
}
