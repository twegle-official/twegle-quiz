import 'dotenv/config'
import { connectDB, disconnectDB } from '../config/db.js'
import Puzzle from '../models/Puzzle.js'

// One-off / re-runnable command to load the starter puzzles into the real
// database, published and ready to solve. Run with: npm run seed:puzzles
// Safe to re-run — upserts by question text instead of duplicating. All
// riddles here are original/traditional public-domain puzzle phrasing, not
// adapted from any copyrighted collection.
const puzzles = [
  // --- Easy ---
  {
    question: 'What has hands but can\'t clap?',
    answer: 'A clock.',
    difficulty: 'easy',
    emoji: '🕐',
    gradient: 'from-sky-400 to-blue-500',
    status: 'published',
  },
  {
    question: 'What has to be broken before you can use it?',
    answer: 'An egg.',
    difficulty: 'easy',
    emoji: '🥚',
    gradient: 'from-amber-400 to-yellow-500',
    status: 'published',
  },
  {
    question: 'I\'m tall when I\'m young and short when I\'m old. What am I?',
    answer: 'A candle.',
    difficulty: 'easy',
    emoji: '🕯️',
    gradient: 'from-orange-400 to-red-400',
    status: 'published',
  },
  {
    question: 'What has a face and two hands but no arms or legs?',
    answer: 'A clock.',
    difficulty: 'easy',
    emoji: '⏰',
    gradient: 'from-violet-400 to-indigo-500',
    status: 'published',
  },
  {
    question: 'What gets wetter the more it dries?',
    answer: 'A towel.',
    difficulty: 'easy',
    emoji: '🧺',
    gradient: 'from-cyan-400 to-teal-500',
    status: 'published',
  },
  {
    question: 'क्या चीज़ है जो हर सुबह टूटती है?',
    answer: 'दिन (सुबह)।',
    difficulty: 'easy',
    emoji: '🌅',
    gradient: 'from-pink-400 to-rose-500',
    language: 'hi',
    status: 'published',
  },

  // --- Medium ---
  {
    question: 'I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?',
    answer: 'An echo.',
    difficulty: 'medium',
    emoji: '🔊',
    gradient: 'from-fuchsia-400 to-purple-500',
    status: 'published',
  },
  {
    question: 'The more you take, the more you leave behind. What am I?',
    answer: 'Footsteps.',
    difficulty: 'medium',
    emoji: '👣',
    gradient: 'from-emerald-400 to-green-500',
    status: 'published',
  },
  {
    question: 'What can travel around the world while staying in a corner?',
    answer: 'A postage stamp.',
    difficulty: 'medium',
    emoji: '✉️',
    gradient: 'from-red-400 to-pink-500',
    status: 'published',
  },
  {
    question: 'What has many keys but can\'t open a single lock?',
    answer: 'A piano.',
    difficulty: 'medium',
    emoji: '🎹',
    gradient: 'from-gray-500 to-gray-700',
    status: 'published',
  },
  {
    question: 'What word becomes shorter when you add two letters to it?',
    answer: '"Short" — add "er" to make "shorter."',
    difficulty: 'medium',
    emoji: '🔤',
    gradient: 'from-lime-400 to-green-500',
    status: 'published',
  },
  {
    question: 'दो बहनें हैं: एक रात को जन्म लेती है और दिन में मर जाती है, दूसरी दिन को जन्म लेती है और रात में मर जाती है। वे कौन हैं?',
    answer: 'दिन और रात (सूरज और चाँद के प्रतीक)।',
    difficulty: 'medium',
    emoji: '🌗',
    gradient: 'from-indigo-400 to-blue-600',
    language: 'hi',
    status: 'published',
  },

  // --- Hard ---
  {
    question: 'A man is looking at a photo. Someone asks, "Whose photo is that?" He replies, "Brothers and sisters, I have none. But that man\'s father is my father\'s son." Who is in the photo?',
    answer: 'His own son.',
    difficulty: 'hard',
    emoji: '🖼️',
    gradient: 'from-slate-500 to-slate-700',
    status: 'published',
  },
  {
    question: 'A doctor gives a patient three pills, telling them to take one every 30 minutes. How long do the pills last?',
    answer: '1 hour — the first pill is taken immediately, the second 30 minutes later, the third 30 minutes after that.',
    difficulty: 'hard',
    emoji: '💊',
    gradient: 'from-teal-400 to-cyan-600',
    status: 'published',
  },
  {
    question: 'What can you catch but not throw?',
    answer: 'A cold.',
    difficulty: 'hard',
    emoji: '🤧',
    gradient: 'from-blue-400 to-indigo-600',
    status: 'published',
  },

  // --- Picture puzzle (uses Lorem Picsum placeholder — royalty-free, swap
  // for a real rebus/zoomed-photo image any time via the admin panel; same
  // placeholder-image approach the seeded Memes already use, and for the
  // same reason — no upload pipeline exists yet, see BACKEND.md). ---
  {
    question: 'Look closely at this picture. What everyday object is this a close-up of?',
    answer: 'It\'s a zoomed-in photo — take a guess, then compare notes with a friend! (Swap this for a real themed image any time.)',
    imageUrl: 'https://picsum.photos/seed/twegle-puzzle-1/600/400',
    difficulty: 'medium',
    emoji: '🖼️',
    gradient: 'from-amber-400 to-orange-500',
    status: 'published',
  },
]

async function run() {
  await connectDB()
  for (const p of puzzles) {
    await Puzzle.findOneAndUpdate({ question: p.question }, p, { upsert: true, setDefaultsOnInsert: true })
  }
  console.log(`Seeded ${puzzles.length} puzzles.`)
  await disconnectDB()
}

run()
