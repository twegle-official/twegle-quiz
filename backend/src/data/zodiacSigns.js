// Fixed list of the 12 western zodiac signs — this is reference astronomy
// trivia (which weeks of the year a sign traditionally covers), not
// astrology content itself. The actual horoscope text lives in
// horoscopeContent.js. `gradient` values are reused from the same safelisted
// palette every other content type uses (see frontend/src/gradients.js) —
// with only 10 entries in that list and 12 signs, two gradients repeat.
export const ZODIAC_SIGNS = [
  { key: 'aries', emoji: '♈', name: { en: 'Aries', hi: 'मेष' }, dateRange: { en: 'Mar 21 – Apr 19', hi: '21 मार्च – 19 अप्रैल' }, gradient: 'from-pink-400 to-rose-400' },
  { key: 'taurus', emoji: '♉', name: { en: 'Taurus', hi: 'वृषभ' }, dateRange: { en: 'Apr 20 – May 20', hi: '20 अप्रैल – 20 मई' }, gradient: 'from-amber-400 to-orange-500' },
  { key: 'gemini', emoji: '♊', name: { en: 'Gemini', hi: 'मिथुन' }, dateRange: { en: 'May 21 – Jun 20', hi: '21 मई – 20 जून' }, gradient: 'from-violet-400 to-indigo-500' },
  { key: 'cancer', emoji: '♋', name: { en: 'Cancer', hi: 'कर्क' }, dateRange: { en: 'Jun 21 – Jul 22', hi: '21 जून – 22 जुलाई' }, gradient: 'from-emerald-400 to-teal-500' },
  { key: 'leo', emoji: '♌', name: { en: 'Leo', hi: 'सिंह' }, dateRange: { en: 'Jul 23 – Aug 22', hi: '23 जुलाई – 22 अगस्त' }, gradient: 'from-sky-400 to-blue-500' },
  { key: 'virgo', emoji: '♍', name: { en: 'Virgo', hi: 'कन्या' }, dateRange: { en: 'Aug 23 – Sep 22', hi: '23 अगस्त – 22 सितंबर' }, gradient: 'from-red-400 to-orange-400' },
  { key: 'libra', emoji: '♎', name: { en: 'Libra', hi: 'तुला' }, dateRange: { en: 'Sep 23 – Oct 22', hi: '23 सितंबर – 22 अक्टूबर' }, gradient: 'from-fuchsia-400 to-pink-500' },
  { key: 'scorpio', emoji: '♏', name: { en: 'Scorpio', hi: 'वृश्चिक' }, dateRange: { en: 'Oct 23 – Nov 21', hi: '23 अक्टूबर – 21 नवंबर' }, gradient: 'from-lime-400 to-green-500' },
  { key: 'sagittarius', emoji: '♐', name: { en: 'Sagittarius', hi: 'धनु' }, dateRange: { en: 'Nov 22 – Dec 21', hi: '22 नवंबर – 21 दिसंबर' }, gradient: 'from-cyan-400 to-sky-500' },
  { key: 'capricorn', emoji: '♑', name: { en: 'Capricorn', hi: 'मकर' }, dateRange: { en: 'Dec 22 – Jan 19', hi: '22 दिसंबर – 19 जनवरी' }, gradient: 'from-purple-400 to-fuchsia-500' },
  { key: 'aquarius', emoji: '♒', name: { en: 'Aquarius', hi: 'कुंभ' }, dateRange: { en: 'Jan 20 – Feb 18', hi: '20 जनवरी – 18 फ़रवरी' }, gradient: 'from-pink-400 to-rose-400' },
  { key: 'pisces', emoji: '♓', name: { en: 'Pisces', hi: 'मीन' }, dateRange: { en: 'Feb 19 – Mar 20', hi: '19 फ़रवरी – 20 मार्च' }, gradient: 'from-amber-400 to-orange-500' },
]

export const ZODIAC_KEYS = ZODIAC_SIGNS.map((s) => s.key)

export function findZodiacSign(key) {
  return ZODIAC_SIGNS.find((s) => s.key === key) || null
}
