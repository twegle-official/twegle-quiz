import 'dotenv/config'
import { connectDB, disconnectDB } from '../config/db.js'
import Puzzle from '../models/Puzzle.js'

// One-off / re-runnable command to load the starter puzzles into the real
// database, published and ready to solve. Run with: npm run seed:puzzles
// Safe to re-run — upserts by question text instead of duplicating. All
// riddles here are original/traditional public-domain puzzle phrasing, not
// adapted from any copyrighted collection.
//
// IMPORTANT — emoji must never depict the answer itself: the emoji renders
// right next to the question, visible before "Reveal Answer" is tapped (see
// PuzzleView.jsx/PuzzleCard.jsx). Several of these originally used an emoji
// of the literal answer object (🤧 for "a cold," 🎹 for "a piano," 👣 for
// "footsteps") — reported directly as the puzzle spoiling itself before any
// guessing happened. Fixed by swapping those to a neutral 🤔, or to an emoji
// that only reflects something already stated in the question text (💊 for
// the pills riddle, 🖼️ for the photo riddle — both objects the question
// itself already names, not the hidden answer).
const puzzles = [
  // --- Easy ---
  {
    question: 'What has hands but can\'t clap?',
    answer: 'A clock.',
    difficulty: 'easy',
    emoji: '🤔',
    gradient: 'from-sky-400 to-blue-500',
    status: 'published',
  },
  {
    question: 'What has to be broken before you can use it?',
    answer: 'An egg.',
    difficulty: 'easy',
    emoji: '🤔',
    gradient: 'from-amber-400 to-orange-500',
    status: 'published',
  },
  {
    question: 'I\'m tall when I\'m young and short when I\'m old. What am I?',
    answer: 'A candle.',
    difficulty: 'easy',
    emoji: '🤔',
    gradient: 'from-red-400 to-orange-400',
    status: 'published',
  },
  {
    question: 'What has a face and two hands but no arms or legs?',
    answer: 'A clock.',
    difficulty: 'easy',
    emoji: '🤔',
    gradient: 'from-violet-400 to-indigo-500',
    status: 'published',
  },
  {
    question: 'What gets wetter the more it dries?',
    answer: 'A towel.',
    difficulty: 'easy',
    emoji: '🤔',
    gradient: 'from-emerald-400 to-teal-500',
    status: 'published',
  },
  {
    question: 'क्या चीज़ है जो हर सुबह टूटती है?',
    answer: 'दिन (सुबह)।',
    difficulty: 'easy',
    emoji: '🤔',
    gradient: 'from-pink-400 to-rose-400',
    language: 'hi',
    status: 'published',
  },
  {
    question: 'मेरे पास शहर हैं, पर एक भी घर नहीं; जंगल हैं, पर एक भी पेड़ नहीं; पानी है, पर एक बूंद भी नहीं। मैं क्या हूं?',
    answer: 'एक नक्शा (मैप)।',
    difficulty: 'easy',
    emoji: '🤔',
    gradient: 'from-sky-400 to-blue-500',
    language: 'hi',
    status: 'published',
  },
  {
    question: 'जितना इसे काटो, उतना ही यह बड़ा होता जाता है। यह क्या है?',
    answer: 'एक गड्ढा (होल)।',
    difficulty: 'easy',
    emoji: '🤔',
    gradient: 'from-amber-400 to-orange-500',
    language: 'hi',
    status: 'published',
  },
  {
    question: 'मेरे बहुत सारे दांत हैं, पर मैं कभी खाना नहीं खाती। मैं क्या हूं?',
    answer: 'एक कंघी।',
    difficulty: 'easy',
    emoji: '🤔',
    gradient: 'from-violet-400 to-indigo-500',
    language: 'hi',
    status: 'published',
  },
  {
    question: 'मैं हमेशा ऊपर जाती हूं पर कभी नीचे नहीं आती। मैं क्या हूं?',
    answer: 'आपकी उम्र।',
    difficulty: 'easy',
    emoji: '🎂',
    gradient: 'from-emerald-400 to-teal-500',
    language: 'hi',
    status: 'published',
  },

  // --- Medium ---
  {
    question: 'I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?',
    answer: 'An echo.',
    difficulty: 'medium',
    emoji: '🔊',
    gradient: 'from-fuchsia-400 to-pink-500',
    status: 'published',
  },
  {
    question: 'The more you take, the more you leave behind. What am I?',
    answer: 'Footsteps.',
    difficulty: 'medium',
    emoji: '🤔',
    gradient: 'from-lime-400 to-green-500',
    status: 'published',
  },
  {
    question: 'What can travel around the world while staying in a corner?',
    answer: 'A postage stamp.',
    difficulty: 'medium',
    emoji: '🌍',
    gradient: 'from-purple-400 to-fuchsia-500',
    status: 'published',
  },
  {
    question: 'What has many keys but can\'t open a single lock?',
    answer: 'A piano.',
    difficulty: 'medium',
    emoji: '🔑',
    gradient: 'from-cyan-400 to-sky-500',
    status: 'published',
  },
  {
    question: 'What word becomes shorter when you add two letters to it?',
    answer: '"Short" — add "er" to make "shorter."',
    difficulty: 'medium',
    emoji: '🔤',
    gradient: 'from-amber-400 to-orange-500',
    status: 'published',
  },
  {
    question: 'दो बहनें हैं: एक रात को जन्म लेती है और दिन में मर जाती है, दूसरी दिन को जन्म लेती है और रात में मर जाती है। वे कौन हैं?',
    answer: 'दिन और रात (सूरज और चाँद के प्रतीक)।',
    difficulty: 'medium',
    emoji: '🤔',
    gradient: 'from-violet-400 to-indigo-500',
    language: 'hi',
    status: 'published',
  },
  {
    question: 'मेरे पास "की" (key) हैं, पर कोई दरवाज़ा नहीं खुलता। मेरे पास "स्पेस" है, पर कोई कमरा नहीं। आप मुझ पर "एंटर" कर सकते हैं, पर "एग्ज़िट" नहीं मिलता। मैं क्या हूं?',
    answer: 'कीबोर्ड।',
    difficulty: 'medium',
    emoji: '⌨️',
    gradient: 'from-cyan-400 to-sky-500',
    language: 'hi',
    status: 'published',
  },
  {
    question: 'एक आदमी दसवीं मंज़िल पर रहता है। रोज़ सुबह वह लिफ्ट से नीचे जाता है और काम पर निकल जाता है। शाम को वापस आकर वह लिफ्ट में सिर्फ सातवीं मंज़िल तक जाता है, और बाकी तीन मंज़िलें सीढ़ियों से चढ़ता है — सिवाय बारिश वाले दिनों के, जब वह सीधा दसवीं मंज़िल तक लिफ्ट लेता है। ऐसा क्यों?',
    answer: 'वह एक बौना (छोटे कद का) आदमी है और लिफ्ट के बटन में सिर्फ सातवीं मंज़िल तक ही उसका हाथ पहुंचता है। बारिश के दिन उसके पास छाता होता है, जिससे वह ऊपर के बटन को दबा पाता है।',
    difficulty: 'medium',
    emoji: '🌂',
    gradient: 'from-purple-400 to-fuchsia-500',
    language: 'hi',
    status: 'published',
  },
  {
    question: 'एक टोकरी में 6 सेब हैं। आपको वो सेब 6 बच्चों को इस तरह बांटने हैं कि हर बच्चे को एक सेब मिले, लेकिन टोकरी में भी एक सेब बचा रहे। यह कैसे संभव है?',
    answer: 'छठे बच्चे को टोकरी समेत सेब दे दो — इस तरह उसे भी सेब मिल जाता है और टोकरी में भी एक सेब (उसी के अंदर) बचा रहता है।',
    difficulty: 'medium',
    emoji: '🧺',
    gradient: 'from-lime-400 to-green-500',
    language: 'hi',
    status: 'published',
  },
  {
    question: 'अगर आज से दो दिन पहले शुक्रवार था, तो कल कौन सा दिन होगा?',
    answer: 'सोमवार। (दो दिन पहले शुक्रवार था, यानी आज रविवार है — इसलिए कल सोमवार होगा।)',
    difficulty: 'medium',
    emoji: '📅',
    gradient: 'from-amber-400 to-orange-500',
    language: 'hi',
    status: 'published',
  },

  // --- Hard ---
  {
    question: 'A man is looking at a photo. Someone asks, "Whose photo is that?" He replies, "Brothers and sisters, I have none. But that man\'s father is my father\'s son." Who is in the photo?',
    answer: 'His own son.',
    difficulty: 'hard',
    emoji: '🖼️',
    gradient: 'from-sky-400 to-blue-500',
    status: 'published',
  },
  {
    question: 'A doctor gives a patient three pills, telling them to take one every 30 minutes. How long do the pills last?',
    answer: '1 hour — the first pill is taken immediately, the second 30 minutes later, the third 30 minutes after that.',
    difficulty: 'hard',
    emoji: '💊',
    gradient: 'from-emerald-400 to-teal-500',
    status: 'published',
  },
  {
    question: 'What can you catch but not throw?',
    answer: 'A cold.',
    difficulty: 'hard',
    emoji: '🤔',
    gradient: 'from-red-400 to-orange-400',
    status: 'published',
  },
  {
    question: 'A father is exactly 4 times as old as his son today. In 20 years, he will be exactly twice as old as his son. How old are they right now?',
    answer: 'The son is 10 and the father is 40. Check it: 40 = 4 × 10 today, and in 20 years that\'s 60 and 30 — and 60 is exactly double 30.',
    difficulty: 'hard',
    emoji: '🧮',
    gradient: 'from-cyan-400 to-blue-500',
    status: 'published',
  },
  {
    question: 'You have a 3-liter jug and a 5-liter jug, with no other markings on them. How can you measure out exactly 4 liters of water?',
    answer: 'Fill the 5-liter jug completely, then pour it into the 3-liter jug until that one is full — leaving exactly 2 liters in the 5-liter jug. Empty the 3-liter jug, pour that 2 liters into it, then fill the 5-liter jug again and top off the 3-liter jug (which only needs 1 more liter). That leaves exactly 4 liters in the 5-liter jug.',
    difficulty: 'hard',
    emoji: '🧪',
    gradient: 'from-teal-400 to-emerald-500',
    status: 'published',
  },
  {
    question: 'You have 8 identical-looking balls, but one is secretly heavier than the rest. Using a balance scale only twice, how do you find the heavier ball?',
    answer: 'Split the balls into three groups: 3, 3, and 2. Weigh the two groups of 3 against each other. If they balance, the heavier ball is in the group of 2 — weigh those two against each other to find it. If one group of 3 is heavier, take those 3 balls and weigh any two of them against each other — if they balance, the third one is the heavy one; if not, the heavier side has it.',
    difficulty: 'hard',
    emoji: '⚖️',
    gradient: 'from-slate-400 to-gray-500',
    status: 'published',
  },
  {
    question: 'एक पिता की उम्र आज अपने बेटे से ठीक 4 गुना है। 20 साल बाद, वह अपने बेटे से ठीक 2 गुना उम्र का होगा। आज दोनों की उम्र कितनी है?',
    answer: 'बेटे की उम्र 10 साल और पिता की उम्र 40 साल है। जांच करें: आज 40 = 4 × 10, और 20 साल बाद यह 60 और 30 हो जाएगी — और 60, 30 का ठीक दोगुना है।',
    difficulty: 'hard',
    emoji: '🧮',
    gradient: 'from-cyan-400 to-blue-500',
    language: 'hi',
    status: 'published',
  },
  {
    question: 'आपके पास एक 3 लीटर और एक 5 लीटर का जग है, जिन पर कोई और निशान नहीं हैं। आप ठीक 4 लीटर पानी कैसे नापेंगे?',
    answer: '5 लीटर वाला जग पूरा भरें, फिर उसे 3 लीटर वाले जग में तब तक डालें जब तक वो भर न जाए — इससे 5 लीटर वाले जग में ठीक 2 लीटर बचेगा। 3 लीटर वाला जग खाली करें, उसमें वो 2 लीटर डाल दें, फिर 5 लीटर वाला जग फिर से भरें और उससे 3 लीटर वाले जग को भरें (जिसे भरने के लिए सिर्फ 1 लीटर चाहिए)। इस तरह 5 लीटर वाले जग में ठीक 4 लीटर बचेगा।',
    difficulty: 'hard',
    emoji: '🧪',
    gradient: 'from-teal-400 to-emerald-500',
    language: 'hi',
    status: 'published',
  },
  {
    question: 'आपके पास 8 एक जैसी दिखने वाली गेंदें हैं, लेकिन उनमें से एक चुपके से बाकी सबसे थोड़ी भारी है। सिर्फ दो बार तराज़ू (बैलेंस स्केल) का इस्तेमाल करके आप भारी गेंद कैसे ढूंढेंगे?',
    answer: 'गेंदों को तीन समूहों में बांटें: 3, 3 और 2। तीन-तीन वाले दोनों समूहों को तौलें। अगर वो बराबर हों, तो भारी गेंद उन 2 में से एक है — उन दोनों को तौलकर पता लगाएं। अगर एक समूह भारी निकले, तो उन 3 में से कोई भी दो गेंदें तौलें — बराबर हों तो तीसरी गेंद भारी है, वरना जो पलड़ा झुके वो भारी गेंद है।',
    difficulty: 'hard',
    emoji: '⚖️',
    gradient: 'from-slate-400 to-gray-500',
    language: 'hi',
    status: 'published',
  },
  {
    question: 'एक आदमी एक तस्वीर की तरफ इशारा करके कहता है, "मेरे कोई भाई-बहन नहीं हैं, लेकिन इस आदमी के पिता मेरे पिता के बेटे हैं।" तस्वीर में कौन है?',
    answer: 'उसका अपना बेटा। चूंकि उसका कोई भाई-बहन नहीं है, इसलिए "मेरे पिता का बेटा" खुद वही आदमी है — यानी तस्वीर वाले आदमी के पिता खुद वही बोलने वाला आदमी है, तो तस्वीर में उसका अपना बेटा है।',
    difficulty: 'hard',
    emoji: '🖼️',
    gradient: 'from-sky-400 to-blue-500',
    language: 'hi',
    status: 'published',
  },
  {
    question: 'आप इसे पकड़ सकते हैं, पर फेंक नहीं सकते। यह क्या है?',
    answer: 'जुकाम (सर्दी-ज़ुकाम)।',
    difficulty: 'hard',
    emoji: '🤔',
    gradient: 'from-red-400 to-orange-400',
    language: 'hi',
    status: 'published',
  },

  // --- Picture puzzle (uses a fixed Lorem Picsum seed — royalty-free,
  // swap for any real themed image any time via the admin panel — no
  // upload pipeline exists yet, see BACKEND.md). The question/answer below
  // must actually match whatever this seed's photo shows — the original
  // question ("what everyday object is this a close-up of?") described a
  // generic zoomed rebus shot, but the photo this seed actually returns is
  // a full scenic landscape (a person standing on Trolltunga, a famous
  // cliff in Norway), not a close-up of anything — reported directly as
  // effectively spoiling itself, since there was nothing left to guess. ---
  {
    question: 'This famous cliff juts straight out over a fjord and is one of the most photographed hiking spots in the world. Do you know its name or country?',
    answer: 'It\'s Trolltunga ("Troll\'s Tongue") in Norway — a flat slab of rock jutting horizontally off a mountain, a popular (and slightly terrifying) photo spot after a long hike.',
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
