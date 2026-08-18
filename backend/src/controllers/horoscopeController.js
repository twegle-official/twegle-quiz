import { ZODIAC_SIGNS, findZodiacSign } from '../data/zodiacSigns.js'
import { HOROSCOPE_PERIODS } from '../data/horoscopeContent.js'
import { computeHoroscope } from '../utils/horoscope.js'

// The 12-sign picker list for the homepage tab — static reference data, not
// database content, so this is just a plain mapped array, no query involved.
// Handles a request for the list of all 12 zodiac signs, translated to the requested language.
export function listZodiacSigns(req, res) {
  const lang = req.query.language === 'hi' ? 'hi' : 'en'
  res.json({
    signs: ZODIAC_SIGNS.map((s) => ({
      key: s.key,
      name: s.name[lang],
      emoji: s.emoji,
      dateRange: s.dateRange[lang],
      gradient: s.gradient,
    })),
  })
}

// Handles a request for one sign's horoscope text for a given time period (day/week/etc).
export function getHoroscope(req, res) {
  const { sign } = req.params
  const period = HOROSCOPE_PERIODS.includes(req.query.period) ? req.query.period : 'day' // defaults to "day" if no valid period was given

  if (!findZodiacSign(sign)) {
    return res.status(404).json({ error: 'That zodiac sign does not exist' })
  }

  const result = computeHoroscope(sign, period, req.query.language)
  res.json({ horoscope: result })
}
