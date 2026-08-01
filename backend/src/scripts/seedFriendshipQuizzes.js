import 'dotenv/config'
import { connectDB, disconnectDB } from '../config/db.js'
import FriendshipQuiz from '../models/FriendshipQuiz.js'

// One-off / re-runnable command to load starter friendship-quiz templates.
// Run with: npm run seed:friendship-quizzes
// Safe to re-run — upserts by slug instead of duplicating.
const quizzes = [
  {
    title: 'How Well Does Anyone Know Me?',
    slug: 'how-well-do-you-know-me',
    description: 'Answer honestly about yourself, then send the link to a friend and see how many they get right!',
    emoji: '🤝',
    gradient: 'from-fuchsia-400 to-pink-500',
    language: 'en',
    status: 'published',
    questions: [
      {
        text: "What's my go-to comfort food when I'm having a rough day?",
        options: ['🍕 Pizza', '🍜 Noodles / Maggi', '🍫 Chocolate', '🍛 Home-cooked comfort food'],
      },
      {
        text: "If I could have one superpower, I'd pick...",
        options: ['⏰ Time travel', '🦸 Flying', '🧠 Mind reading', '👻 Invisibility'],
      },
      {
        text: 'My biggest pet peeve is...',
        options: [
          '😤 People being late',
          '📱 Loud phone calls in public',
          '🧦 A messy room',
          '🗣️ Being interrupted',
        ],
      },
      {
        text: 'My dream vacation destination is...',
        options: ['🏔️ Mountains', '🏖️ A beach', '🏙️ A big city', '🏕️ A nature retreat'],
      },
      {
        text: 'My hidden talent is...',
        options: ['🎤 Singing', '💃 Dancing', '🍳 Cooking', '✍️ Writing or poetry'],
      },
      {
        text: 'My perfect lazy Sunday involves...',
        options: ['😴 Sleeping in all day', '📺 Binge-watching shows', '📚 Reading a book', '🚶 A long walk'],
      },
      {
        text: "I'm most likely to binge-watch...",
        options: ['😂 Comedy', '😱 Horror / thriller', '💕 Romance', '🕵️ Mystery / crime'],
      },
      {
        text: 'If I won the lottery tomorrow, the first thing I\'d buy is...',
        options: [
          '✈️ A trip around the world',
          '🏠 A house',
          '📱 The latest gadgets',
          "💰 I'd just save it all",
        ],
      },
    ],
  },
  {
    title: 'मुझे कितना जानते हो?',
    slug: 'mujhe-kitna-jaante-ho',
    description: 'अपने बारे में सच-सच जवाब दो, फिर लिंक किसी दोस्त को भेजो और देखो वो कितना सही अंदाज़ा लगाता है!',
    emoji: '🤝',
    gradient: 'from-fuchsia-400 to-pink-500',
    language: 'hi',
    status: 'published',
    questions: [
      {
        text: 'बुरे दिन में मेरा कम्फर्ट फूड क्या है?',
        options: ['🍕 पिज़्ज़ा', '🍜 मैगी', '🍫 चॉकलेट', '🍛 घर का खाना'],
      },
      {
        text: 'अगर मुझे कोई सुपरपावर मिले, तो मैं चुनूंगा/चुनूंगी...',
        options: ['⏰ टाइम ट्रैवल', '🦸 उड़ना', '🧠 मन की बात पढ़ना', '👻 गायब हो जाना'],
      },
      {
        text: 'मेरी सबसे बड़ी चिड़ है...',
        options: [
          '😤 लोगों का लेट आना',
          '📱 पब्लिक में तेज़ आवाज़ में बात करना',
          '🧦 बिखरा हुआ कमरा',
          '🗣️ बीच में टोकना',
        ],
      },
      {
        text: 'मेरी ड्रीम वेकेशन डेस्टिनेशन है...',
        options: ['🏔️ पहाड़', '🏖️ बीच', '🏙️ बड़ा शहर', '🏕️ जंगल / नेचर'],
      },
      {
        text: 'मेरा छुपा हुआ टैलेंट है...',
        options: ['🎤 गाना', '💃 डांस', '🍳 कुकिंग', '✍️ लिखना / शायरी'],
      },
      {
        text: 'मेरा परफेक्ट संडे कैसा होता है?',
        options: ['😴 दिन भर सोना', '📺 वेब सीरीज़ देखना', '📚 किताब पढ़ना', '🚶 लंबी वॉक पर जाना'],
      },
      {
        text: 'मैं सबसे ज़्यादा क्या देखना पसंद करूंगा/करूंगी?',
        options: ['😂 कॉमेडी', '😱 हॉरर / थ्रिलर', '💕 रोमांस', '🕵️ मिस्ट्री / क्राइम'],
      },
      {
        text: 'अगर कल लॉटरी लग जाए, तो सबसे पहले क्या खरीदूंगा/खरीदूंगी?',
        options: ['✈️ पूरी दुनिया घूमना', '🏠 घर', '📱 लेटेस्ट गैजेट्स', '💰 सब बचा लूंगा/लूंगी'],
      },
    ],
  },
  {
    title: 'How Well Do You Know My Entertainment Taste?',
    slug: 'my-entertainment-taste',
    description: 'Movies, music, and guilty pleasures — fill it in, send the link, see who really knows your taste.',
    emoji: '🎬',
    gradient: 'from-purple-400 to-fuchsia-500',
    language: 'en',
    status: 'published',
    questions: [
      {
        text: 'My favorite movie genre is...',
        options: ['🎭 Drama', '😂 Comedy', '💥 Action', '💕 Romance'],
      },
      {
        text: "If I could meet one Bollywood star, it'd be...",
        options: ['🎬 A classic legend', '🌟 A current superstar', '🎤 A singer-actor', '😎 A comedian'],
      },
      {
        text: 'My guilty-pleasure watch is...',
        options: ['📺 Reality TV', '💔 Soap operas', '🎪 Reality dance/talent shows', '🦸 Superhero movies'],
      },
      {
        text: 'I always cry during...',
        options: ['😢 Sad family scenes', '💍 Wedding/reunion scenes', '🐶 Anything with animals', "😤 I don't cry, ever"],
      },
      {
        text: 'My go-to karaoke song type is...',
        options: ['🎤 Old Bollywood classics', '🎶 Current chartbusters', '💃 Item numbers', '🎸 English pop/rock'],
      },
      {
        text: 'The last thing I binge-watched was...',
        options: ['📺 A web series', '🎬 A movie marathon', '📻 A music show', '🏏 Sports highlights'],
      },
    ],
  },
  {
    title: 'मेरा एंटरटेनमेंट टेस्ट कितना जानते हो?',
    slug: 'mera-entertainment-taste',
    description: 'फिल्में, गाने और गिल्टी प्लेज़र्स — भरो, लिंक भेजो, देखो कौन सच में आपका टेस्ट जानता है।',
    emoji: '🎬',
    gradient: 'from-purple-400 to-fuchsia-500',
    language: 'hi',
    status: 'published',
    questions: [
      {
        text: 'मेरी पसंदीदा मूवी जॉनर है...',
        options: ['🎭 ड्रामा', '😂 कॉमेडी', '💥 एक्शन', '💕 रोमांस'],
      },
      {
        text: 'अगर मैं किसी एक बॉलीवुड स्टार से मिल सकूं, तो वो होगा...',
        options: ['🎬 एक क्लासिक लीजेंड', '🌟 आजकल का सुपरस्टार', '🎤 सिंगर-एक्टर', '😎 कोई कॉमेडियन'],
      },
      {
        text: 'मेरा गिल्टी-प्लेज़र वॉच है...',
        options: ['📺 रियलिटी टीवी', '💔 सोप ओपेरा', '🎪 डांस/टैलेंट शो', '🦸 सुपरहीरो फिल्में'],
      },
      {
        text: 'मैं हमेशा रोता/रोती हूं...',
        options: ['😢 इमोशनल फैमिली सीन में', '💍 शादी/रीयूनियन सीन में', '🐶 जानवरों वाली किसी भी चीज़ में', '😤 मैं कभी नहीं रोता/रोती'],
      },
      {
        text: 'मेरा कराओके सॉन्ग टाइप है...',
        options: ['🎤 पुराने बॉलीवुड क्लासिक्स', '🎶 आजकल के हिट गाने', '💃 आइटम नंबर्स', '🎸 इंग्लिश पॉप/रॉक'],
      },
      {
        text: 'मैंने आखिरी बार जो बिंज-वॉच किया वो था...',
        options: ['📺 कोई वेब सीरीज़', '🎬 मूवी मैराथन', '📻 म्यूज़िक शो', '🏏 स्पोर्ट्स हाइलाइट्स'],
      },
    ],
  },
]

async function main() {
  await connectDB()

  for (const q of quizzes) {
    await FriendshipQuiz.findOneAndUpdate({ slug: q.slug }, q, { upsert: true, returnDocument: 'after' })
    console.log(`Seeded: ${q.title}`)
  }

  await disconnectDB()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
