// Small EN/HI lookup for card CTA button text and other short UI chrome
// strings — found missing during a QA sweep (2026-08-20): a card's
// title/description already correctly follow the item's own `.language`
// field (Quiz/Puzzle/Story/Friendship Quiz are all fetched pre-filtered by
// the active language toggle), but every card's button text stayed
// hardcoded in English regardless. This is the first shared translation
// helper in the codebase — everywhere else handles the EN/HI split with a
// one-off inline ternary, which doesn't scale past a string or two.
const LABELS = {
  takeQuiz: { en: 'Take the quiz →', hi: 'क्विज़ लो →' },
  alreadyTakenQuiz: { en: "You've already taken this quiz", hi: 'आपने यह क्विज़ पहले ले ली है' },
  playNow: { en: 'Play now →', hi: 'अभी खेलो →' },
  logInToPlay: { en: 'Log in to play →', hi: 'खेलने के लिए लॉग इन करो →' },
  instant: { en: '🎮 Instant', hi: '🎮 तुरंत' },
  findOut: { en: 'Find out →', hi: 'पता करो →' },
  fillItIn: { en: 'Fill it in →', hi: 'भरो →' },
  compatibility: { en: '💘 Compatibility', hi: '💘 मैच' },
  solveIt: { en: 'Solve it →', hi: 'सुलझाओ →' },
  alreadyRevealedPuzzle: { en: "You've already revealed this puzzle's answer", hi: 'आपने इस पहेली का जवाब पहले देख लिया है' },
  readAndListen: { en: '🔊 Read & Listen →', hi: '🔊 पढ़ो और सुनो →' },
  todaysHoroscope: { en: "Today's Horoscope →", hi: 'आज का राशिफल →' },
}

// Looks up one of the labels above for the given language — falls back to
// English for anything other than 'hi' (matches how every other language
// check in this codebase already treats 'en' as the implicit default).
export function ctaLabel(key, language) {
  return LABELS[key][language === 'hi' ? 'hi' : 'en']
}
