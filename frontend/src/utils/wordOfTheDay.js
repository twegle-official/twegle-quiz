// The "Word of the Day" daily word-guessing game — English only (see
// WordOfTheDay.jsx's own file comment for why a Hindi version isn't the
// same feature, just translated). Same deterministic-by-date, no-cron-job
// pattern as pickQuizOfTheDay/pickPuzzleOfTheDay (dailyQuiz.js) and the
// backend's Horoscope — the day's word is picked purely by computing an
// index from today's date, not stored or scheduled anywhere.
import { scopedKey } from './accountScope'

// A curated list of common, everyday 5-letter English words — no slang, no
// obscure/technical terms, nothing inappropriate, matching the site's
// 8-18 audience. Order matters (it's what the daily index counts through),
// so don't reorder existing entries — only ever append new ones, the same
// rule dailyQuiz.js's own picker functions rely on implicitly by sorting
// their input first (this list has no such re-sort, so insertion order
// *is* the order used).
const WORD_LIST = [
  'ABOUT', 'ABOVE', 'ADULT', 'AFTER', 'AGAIN', 'AGENT', 'AGREE', 'AHEAD', 'ALARM', 'ALBUM',
  'ALERT', 'ALIKE', 'ALIVE', 'ALLOW', 'ALONE', 'ALONG', 'ALTER', 'ANGEL', 'ANGER', 'ANGLE',
  'ANGRY', 'APPLE', 'APPLY', 'ARENA', 'ARGUE', 'ARISE', 'ARRAY', 'ARROW', 'ASIDE', 'ASSET',
  'AVOID', 'AWAKE', 'AWARD', 'AWARE', 'BADLY', 'BAKER', 'BASIC', 'BEACH', 'BEGAN', 'BEGIN',
  'BEING', 'BELOW', 'BENCH', 'BERRY', 'BIRTH', 'BLACK', 'BLADE', 'BLAME', 'BLANK', 'BLAST',
  'BLEND', 'BLESS', 'BLIND', 'BLOCK', 'BLOOD', 'BOARD', 'BOAST', 'BONUS', 'BOOST', 'BOOTH',
  'BOUND', 'BRAIN', 'BRAND', 'BRASS', 'BRAVE', 'BREAD', 'BREAK', 'BREED', 'BRICK', 'BRIDE',
  'BRIEF', 'BRING', 'BROAD', 'BROKE', 'BROWN', 'BRUSH', 'BUILD', 'BUILT', 'BUYER', 'CABIN',
  'CANDY', 'CARGO', 'CARRY', 'CATCH', 'CAUSE', 'CHAIN', 'CHAIR', 'CHALK', 'CHAOS', 'CHARM',
  'CHART', 'CHASE', 'CHEAP', 'CHECK', 'CHEEK', 'CHEER', 'CHESS', 'CHEST', 'CHIEF', 'CHILD',
  'CHILL', 'CHOSE', 'CIVIC', 'CIVIL', 'CLAIM', 'CLASS', 'CLEAN', 'CLEAR', 'CLERK', 'CLICK',
  'CLIFF', 'CLIMB', 'CLOCK', 'CLOSE', 'CLOTH', 'CLOUD', 'CLOWN', 'COACH', 'COAST', 'COLOR',
  'COUCH', 'COUGH', 'COULD', 'COUNT', 'COURT', 'COVER', 'CRAFT', 'CRASH', 'CRAZY', 'CREAM',
  'CRIME', 'CROSS', 'CROWD', 'CROWN', 'CRUDE', 'CRUEL', 'CURVE', 'CYCLE', 'DAILY', 'DANCE',
  'DEALT', 'DEATH', 'DELAY', 'DEPTH', 'DERBY', 'DIRTY', 'DOING', 'DOUBT', 'DOZEN', 'DRAFT',
  'DRAMA', 'DRANK', 'DRAWN', 'DREAM', 'DRESS', 'DRIED', 'DRIFT', 'DRILL', 'DRINK', 'DRIVE',
  'DROVE', 'DYING', 'EAGER', 'EARLY', 'EARTH', 'EIGHT', 'ELDER', 'ELECT', 'EMPTY', 'ENJOY',
  'ENTER', 'ENTRY', 'EQUAL', 'ERROR', 'EVENT', 'EVERY', 'EXACT', 'EXIST', 'EXTRA', 'FAITH',
  'FALSE', 'FAULT', 'FIBER', 'FIELD', 'FIFTH', 'FIFTY', 'FIGHT', 'FINAL', 'FIRST', 'FIXED',
  'FLAME', 'FLASH', 'FLEET', 'FLESH', 'FLOAT', 'FLOOR', 'FLUID', 'FOCUS', 'FORCE', 'FORTH',
  'FORTY', 'FORUM', 'FOUND', 'FRAME', 'FRANK', 'FRAUD', 'FRESH', 'FRONT', 'FROST', 'FRUIT',
  'FULLY', 'FUNNY', 'GIANT', 'GIVEN', 'GLASS', 'GLOBE', 'GLORY', 'GOING', 'GRACE', 'GRADE',
  'GRAND', 'GRANT', 'GRASS', 'GRAVE', 'GREAT', 'GREEN', 'GREET', 'GRIEF', 'GROSS', 'GROUP',
  'GROWN', 'GUARD', 'GUESS', 'GUEST', 'GUIDE', 'HAPPY', 'HARSH', 'HEART', 'HEAVY', 'HELLO',
  'HENCE', 'HONOR', 'HORSE', 'HOTEL', 'HOUSE', 'HUMAN', 'HUMOR', 'HURRY', 'IDEAL', 'IMAGE',
  'IMPLY', 'INDEX', 'INNER', 'INPUT', 'ISSUE', 'IVORY', 'JEANS', 'JOINT', 'JUDGE', 'JUICE',
  'KNIFE', 'KNOCK', 'KNOWN', 'LABEL', 'LARGE', 'LASER', 'LATER', 'LAUGH', 'LAYER', 'LEARN',
  'LEAST', 'LEAVE', 'LEGAL', 'LEMON', 'LEVEL', 'LIGHT', 'LIMIT', 'LOCAL', 'LOGIC', 'LOOSE',
  'LOWER', 'LOYAL', 'LUCKY', 'LUNCH', 'MAGIC', 'MAJOR', 'MAKER', 'MARCH', 'MATCH', 'MAYBE',
  'MAYOR', 'MEANT', 'MEDAL', 'MEDIA', 'METAL', 'MIGHT', 'MINOR', 'MINUS', 'MIXED', 'MODEL',
  'MONEY', 'MONTH', 'MORAL', 'MOTOR', 'MOUNT', 'MOUSE', 'MOUTH', 'MOVIE', 'MUSIC', 'NOBLE',
  'NOISE', 'NORTH', 'NOTED', 'NOVEL', 'NURSE', 'OCCUR', 'OCEAN', 'OFFER', 'OFTEN', 'ORDER',
  'OTHER', 'OUGHT', 'OUTER', 'OWNER', 'PAINT', 'PANEL', 'PANIC', 'PAPER', 'PARTY', 'PEACE',
  'PHASE', 'PHONE', 'PHOTO', 'PIANO', 'PIECE', 'PILOT', 'PITCH', 'PIZZA', 'PLACE', 'PLAIN',
  'PLANE', 'PLANT', 'PLATE', 'PLAZA', 'POINT', 'POUND', 'POWER', 'PRESS', 'PRICE', 'PRIDE',
  'PRIME', 'PRINT', 'PRIOR', 'PRIZE', 'PROOF', 'PROUD', 'PROVE', 'QUEEN', 'QUERY', 'QUICK',
  'QUIET', 'QUITE', 'QUOTE', 'RADIO', 'RAISE', 'RALLY', 'RANGE', 'RAPID', 'RATIO', 'REACH',
  'READY', 'REALM', 'REBEL', 'REFER', 'RELAX', 'REPLY', 'RIDER', 'RIDGE', 'RIFLE', 'RIGHT',
  'RIGID', 'RIVAL', 'RIVER', 'ROBOT', 'ROCKY', 'ROUGH', 'ROUND', 'ROUTE', 'ROYAL', 'RURAL',
  'SALAD', 'SAUCE', 'SCALE', 'SCENE', 'SCOPE', 'SCORE', 'SCOUT', 'SENSE', 'SERVE', 'SEVEN',
  'SHADE', 'SHAKE', 'SHALL', 'SHAPE', 'SHARE', 'SHARP', 'SHEEP', 'SHEET', 'SHELF', 'SHELL',
  'SHIFT', 'SHINE', 'SHIRT', 'SHOCK', 'SHOOT', 'SHORT', 'SHOWN', 'SIGHT', 'SILLY', 'SINCE',
  'SIXTH', 'SIXTY', 'SKILL', 'SLEEP', 'SLICE', 'SLIDE', 'SMALL', 'SMART', 'SMELL', 'SMILE',
  'SMOKE', 'SNAKE', 'SOLAR', 'SOLID', 'SOLVE', 'SORRY', 'SOUND', 'SOUTH', 'SPACE', 'SPARE',
  'SPEAK', 'SPEED', 'SPELL', 'SPEND', 'SPICE', 'SPINE', 'SPLIT', 'SPOKE', 'SPORT', 'STAFF',
  'STAGE', 'STAKE', 'STAND', 'START', 'STATE', 'STEAM', 'STEEL', 'STEEP', 'STEER', 'STICK',
  'STIFF', 'STILL', 'STOCK', 'STONE', 'STORE', 'STORM', 'STORY', 'STRIP', 'STUCK', 'STUDY',
  'STUFF', 'STYLE', 'SUGAR', 'SUPER', 'SWEET', 'SWIFT', 'SWING', 'TABLE', 'TAKEN', 'TASTE',
  'TEACH', 'THANK', 'THEFT', 'THEIR', 'THEME', 'THERE', 'THESE', 'THICK', 'THING', 'THINK',
  'THIRD', 'THOSE', 'THREE', 'THREW', 'THROW', 'TIGER', 'TIGHT', 'TIMER', 'TITLE', 'TODAY',
  'TOKEN', 'TOPIC', 'TOTAL', 'TOUCH', 'TOUGH', 'TOWER', 'TRACK', 'TRADE', 'TRAIL', 'TRAIN',
  'TRAIT', 'TREAT', 'TREND', 'TRIAL', 'TRIBE', 'TRICK', 'TRIED', 'TRUCK', 'TRULY', 'TRUST',
  'TRUTH', 'TWICE', 'UNCLE', 'UNDER', 'UNION', 'UNITY', 'UNTIL', 'UPPER', 'URBAN', 'USAGE',
  'USUAL', 'VALID', 'VALUE', 'VIDEO', 'VIRUS', 'VISIT', 'VITAL', 'VOCAL', 'VOICE', 'WASTE',
  'WATCH', 'WATER', 'WHEAT', 'WHEEL', 'WHERE', 'WHICH', 'WHILE', 'WHITE', 'WHOLE', 'WHOSE',
  'WOMAN', 'WOMEN', 'WORLD', 'WORRY', 'WORSE', 'WORST', 'WORTH', 'WOULD', 'WOUND', 'WRITE',
  'WRONG', 'YIELD', 'YOUNG', 'YOUTH',
]

export const WORD_LENGTH = 5
export const MAX_GUESSES = 6

// The date "Word of the Day" launched — Day 1. Every subsequent day counts
// up from here for the share text ("Twegle Word #12"), same idea as the
// real Wordle's own day-number convention. Never change this once live —
// it would renumber every day going forward.
const LAUNCH_DATE = new Date(2026, 8, 15) // September 15, 2026

function dateOnly(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function daysSince(from, to) {
  return Math.round((dateOnly(to) - dateOnly(from)) / 86400000)
}

// Turns a Date into a "YYYY-MM-DD" string, so today's game state can be
// compared against a stored date without re-deriving the day number.
function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function getTodayDateKey() {
  return dateKey(new Date())
}

// Which day number today is, counting from LAUNCH_DATE (Day 1). Used both
// to pick today's word and to label a shared result ("Twegle Word #N").
export function getDayNumber() {
  return daysSince(LAUNCH_DATE, new Date()) + 1
}

// Today's word — same word for everyone, changes once a day automatically.
// Deliberately not re-sorted (unlike pickQuizOfTheDay/pickPuzzleOfTheDay,
// which sort their input first) since this list has no other natural
// order to normalize against — its own fixed position *is* the order.
export function getTodayWord() {
  const dayNumber = getDayNumber()
  const index = ((dayNumber - 1) % WORD_LIST.length + WORD_LIST.length) % WORD_LIST.length
  return WORD_LIST[index]
}

// Scores one guess against the answer, letter by letter — the standard
// Wordle algorithm, careful with repeated letters: a repeated guessed
// letter only counts as 'present' as many times as it actually still
// appears in the answer, not once per occurrence in the guess. Two passes:
// exact matches ('correct') are claimed first, then leftover letters are
// checked for 'present' against whatever's left unclaimed in the answer.
export function evaluateGuess(guess, answer) {
  const result = new Array(WORD_LENGTH).fill('absent')
  const answerLetters = answer.split('')
  const remaining = {} // count of each answer letter not yet claimed by a 'correct'

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] === answerLetters[i]) {
      result[i] = 'correct'
    } else {
      remaining[answerLetters[i]] = (remaining[answerLetters[i]] || 0) + 1
    }
  }
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] === 'correct') continue
    const letter = guess[i]
    if (remaining[letter] > 0) {
      result[i] = 'present'
      remaining[letter] -= 1
    }
  }
  return result
}

const STATE_KEY = 'twegleWordOfDayState'

// Loads today's in-progress/finished game state — guesses made so far and
// how it ended, if it has. Returns a fresh empty state if today hasn't
// been started yet, or if the stored state is from a previous day (in
// which case it's simply not read — a new day always starts clean;
// nothing needs to actively "reset," same reasoning the weekly leaderboard
// uses for not needing a reset step either).
export function loadTodayState() {
  const empty = { date: getTodayDateKey(), guesses: [], status: 'playing' }
  try {
    const stored = JSON.parse(localStorage.getItem(scopedKey(STATE_KEY)))
    if (stored && stored.date === empty.date) return stored
  } catch {
    // fall through to empty
  }
  return empty
}

export function saveTodayState(state) {
  localStorage.setItem(scopedKey(STATE_KEY), JSON.stringify(state))
}

// Builds the classic Wordle-style spoiler-free share text — a header line
// plus an emoji grid (🟩 correct, 🟨 present, ⬜ absent), no actual letters
// or the word itself anywhere in it.
export function buildShareText(guesses, answer, won) {
  const dayNumber = getDayNumber()
  const header = `Twegle Word #${dayNumber} ${won ? `${guesses.length}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`}`
  const grid = guesses
    .map((guess) =>
      evaluateGuess(guess, answer)
        .map((status) => (status === 'correct' ? '🟩' : status === 'present' ? '🟨' : '⬜'))
        .join('')
    )
    .join('\n')
  return `${header}\n${grid}\nhttps://twegle.in/games/word-of-the-day`
}
