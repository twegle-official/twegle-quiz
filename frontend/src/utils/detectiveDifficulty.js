// Shared difficulty display for Twegle Detective — one lookup used by the
// case tile, the case-intro screen, and the admin form's dropdown, so the
// three stay in sync automatically instead of each hardcoding its own copy.
export const DETECTIVE_DIFFICULTY_META = {
  rookie: { stars: '⭐', label: 'Rookie Detective', hi: 'नौसिखिया जासूस' },
  junior: { stars: '⭐⭐', label: 'Junior Detective', hi: 'जूनियर जासूस' },
  master: { stars: '⭐⭐⭐', label: 'Master Detective', hi: 'मास्टर जासूस' },
}

export function difficultyLabel(difficulty, language) {
  const meta = DETECTIVE_DIFFICULTY_META[difficulty] || DETECTIVE_DIFFICULTY_META.rookie
  return language === 'hi' ? meta.hi : meta.label
}
