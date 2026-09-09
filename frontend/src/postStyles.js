// Per-category visual style for Post cards (jokes, funny lines, quotes,
// motivational quotes), matching the colorful treatment quiz cards already
// have. Gradient values must match strings already safelisted in
// gradients.js — see that file for why (Tailwind can't see dynamic classes).
export const POST_CATEGORY_STYLE = {
  joke: { emoji: '😂', label: 'Jokes', hi: 'चुटकुले', gradient: 'from-amber-400 to-orange-500' },
  'funny-line': { emoji: '😜', label: 'Funny Lines', hi: 'फनी लाइनें', gradient: 'from-fuchsia-400 to-pink-500' },
  quote: { emoji: '💬', label: 'Quotes', hi: 'कोट्स', gradient: 'from-cyan-400 to-sky-500' },
  'motivational-quote': { emoji: '💪', label: 'Motivational', hi: 'मोटिवेशनल', gradient: 'from-lime-400 to-green-500' },
}
