// Per-category visual style for Stories, matching the colorful treatment
// quiz/post cards already have. Gradient values must match strings already
// safelisted in gradients.js — see that file for why (Tailwind can't see
// dynamic classes).
export const STORY_CATEGORY_STYLE = {
  horror: { emoji: '👻', label: 'Horror', hi: 'हॉरर', gradient: 'from-red-400 to-orange-400' },
  comedy: { emoji: '😂', label: 'Comedy', hi: 'कॉमेडी', gradient: 'from-amber-400 to-orange-500' },
  romance: { emoji: '💕', label: 'Romance', hi: 'रोमांस', gradient: 'from-pink-400 to-rose-400' },
  mystery: { emoji: '🕵️', label: 'Mystery', hi: 'मिस्ट्री', gradient: 'from-violet-400 to-indigo-500' },
  moral: { emoji: '📚', label: 'Moral Tales', hi: 'नैतिक कहानियां', gradient: 'from-emerald-400 to-teal-500' },
  motivational: { emoji: '💪', label: 'Motivational', hi: 'मोटिवेशनल', gradient: 'from-lime-400 to-green-500' },
}
