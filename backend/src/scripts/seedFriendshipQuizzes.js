import 'dotenv/config'
import { pathToFileURL } from 'node:url'
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
  {
    title: 'How Well Do You Know My Food Taste?',
    slug: 'my-food-taste',
    description: 'Comfort food, spice level, dream meals — fill it in, send the link, see who really knows your taste buds.',
    emoji: '🍕',
    gradient: 'from-orange-400 to-red-500',
    language: 'en',
    status: 'published',
    questions: [
      { text: 'My go-to comfort food is...', options: ['🍕 Pizza', '🍜 Noodles / Maggi', '🍫 Chocolate', '🍦 Ice cream'] },
      { text: 'The cuisine I could eat every single day is...', options: ['🍛 Indian', '🍕 Italian', '🍣 Japanese', '🌮 Mexican'] },
      { text: 'Given a choice, I always pick...', options: ['🍬 Something sweet', '🌶️ Something spicy', '🧂 Something salty', '🍋 Something tangy'] },
      { text: 'My movie-night snack of choice is...', options: ['🍿 Popcorn', '🍟 Fries', '🍪 Cookies', '🥤 Just a drink'] },
      { text: "The drink I'm most likely to order is...", options: ['🥤 Soda', '🧋 Bubble tea', '🍹 Juice', '☕ Chai / coffee'] },
      { text: "The one food I'd never dare try is...", options: ['🐛 Bugs', '🥦 Broccoli', '🐙 Octopus', '🧀 Super stinky cheese'] },
      { text: 'My dream birthday meal is...', options: ['🍰 A full cake feast', '🍕 A pizza party', '🍔 A burger night', '🍣 A sushi platter'] },
    ],
  },
  {
    title: 'मेरा फूड टेस्ट कितना जानते हो?',
    slug: 'mera-food-taste',
    description: 'कम्फर्ट फूड, तीखापन, ड्रीम मील्स — भरो, लिंक भेजो, देखो कौन सच में आपका टेस्ट जानता है।',
    emoji: '🍕',
    gradient: 'from-orange-400 to-red-500',
    language: 'hi',
    status: 'published',
    questions: [
      { text: 'मेरा कम्फर्ट फूड है...', options: ['🍕 पिज़्ज़ा', '🍜 नूडल्स / मैगी', '🍫 चॉकलेट', '🍦 आइसक्रीम'] },
      { text: 'जो खाना मैं रोज़ खा सकता/सकती हूं वो है...', options: ['🍛 इंडियन', '🍕 इटैलियन', '🍣 जापानी', '🌮 मैक्सिकन'] },
      { text: 'मौका मिले तो मैं हमेशा चुनूंगा/चुनूंगी...', options: ['🍬 मीठा', '🌶️ तीखा', '🧂 नमकीन', '🍋 खट्टा'] },
      { text: 'मूवी नाइट में मेरा फेवरेट स्नैक है...', options: ['🍿 पॉपकॉर्न', '🍟 फ्राइज़', '🍪 कुकीज़', '🥤 सिर्फ ड्रिंक'] },
      { text: 'मैं सबसे ज़्यादा कौन सी ड्रिंक ऑर्डर करूंगा/करूंगी...', options: ['🥤 सोडा', '🧋 बबल टी', '🍹 जूस', '☕ चाय/कॉफी'] },
      { text: 'जो खाना मैं कभी ट्राई नहीं करूंगा/करूंगी वो है...', options: ['🐛 कीड़े', '🥦 ब्रोकली', '🐙 ऑक्टोपस', '🧀 बहुत स्मेली चीज़'] },
      { text: 'मेरा ड्रीम बर्थडे मील है...', options: ['🍰 पूरा केक फेस्ट', '🍕 पिज़्ज़ा पार्टी', '🍔 बर्गर नाइट', '🍣 सुशी प्लेटर'] },
    ],
  },
  {
    title: 'How Well Do You Know My Gaming Habits?',
    slug: 'my-gaming-habits',
    description: 'Favorite genre, gaming style, biggest gaming fails — fill it in and see who really knows how you play.',
    emoji: '🎮',
    gradient: 'from-indigo-400 to-purple-500',
    language: 'en',
    status: 'published',
    questions: [
      { text: 'The type of game I play the most is...', options: ['🎯 Action', '🧩 Puzzle', '🏗️ Building / sandbox', '⚽ Sports'] },
      { text: "I'd rather play...", options: ['🧍 Solo', '👥 With friends', '🌐 Online with strangers', '🤷 Honestly, either'] },
      { text: 'My go-to gaming device is...', options: ['📱 Phone', '🎮 Console', '💻 PC', '🕹️ Handheld'] },
      { text: 'When I lose a game, I usually...', options: ['😤 Get frustrated', '😂 Laugh it off', '🔁 Try again right away', '🚪 Just walk away'] },
      { text: 'I do most of my gaming...', options: ['🌅 In the morning', '☀️ In the afternoon', '🌆 In the evening', '🌙 Late at night'] },
      { text: 'The game genre I avoid completely is...', options: ['👻 Horror', '🧠 Strategy', '🏎️ Racing', '🎲 Board game apps'] },
      { text: 'My biggest gaming strength is...', options: ['🏆 Winning streaks', '🗺️ Exploring everything', '🤝 Backing up my team', '🎯 Pure aim/skill'] },
    ],
  },
  {
    title: 'मेरी गेमिंग हैबिट्स कितना जानते हो?',
    slug: 'meri-gaming-habits',
    description: 'फेवरेट जॉनर, गेमिंग स्टाइल, सबसे बड़ी गेमिंग गलतियां — भरो और देखो कौन सच में जानता है आप कैसे खेलते हैं।',
    emoji: '🎮',
    gradient: 'from-indigo-400 to-purple-500',
    language: 'hi',
    status: 'published',
    questions: [
      { text: 'मैं सबसे ज़्यादा कौन सा गेम खेलता/खेलती हूं...', options: ['🎯 एक्शन', '🧩 पज़ल', '🏗️ बिल्डिंग / सैंडबॉक्स', '⚽ स्पोर्ट्स'] },
      { text: 'मुझे खेलना पसंद है...', options: ['🧍 अकेले', '👥 दोस्तों के साथ', '🌐 ऑनलाइन अजनबियों के साथ', '🤷 सच कहूं तो कोई फर्क नहीं'] },
      { text: 'मेरी फेवरेट गेमिंग डिवाइस है...', options: ['📱 फोन', '🎮 कंसोल', '💻 पीसी', '🕹️ हैंडहेल्ड'] },
      { text: 'गेम हारने पर मैं आमतौर पर...', options: ['😤 गुस्सा हो जाता/जाती हूं', '😂 हंस देता/देती हूं', '🔁 फौरन दोबारा कोशिश करता/करती हूं', '🚪 बस चला/चली जाता/जाती हूं'] },
      { text: 'मैं सबसे ज़्यादा गेम खेलता/खेलती हूं...', options: ['🌅 सुबह', '☀️ दोपहर', '🌆 शाम', '🌙 देर रात'] },
      { text: 'जो गेम जॉनर मैं पूरी तरह अवॉइड करता/करती हूं वो है...', options: ['👻 हॉरर', '🧠 स्ट्रैटेजी', '🏎️ रेसिंग', '🎲 बोर्ड गेम ऐप्स'] },
      { text: 'गेमिंग में मेरी सबसे बड़ी ताकत है...', options: ['🏆 विनिंग स्ट्रीक', '🗺️ हर जगह एक्सप्लोर करना', '🤝 टीम को सपोर्ट करना', '🎯 सटीक निशाना/स्किल'] },
    ],
  },
  {
    title: 'How Well Do You Know My Dream Life?',
    slug: 'my-dream-life',
    description: 'Dream job, dream vacation, dream everything — fill it in, send the link, see who really gets your dreams.',
    emoji: '✨',
    gradient: 'from-pink-400 to-yellow-400',
    language: 'en',
    status: 'published',
    questions: [
      { text: 'My dream job would be...', options: ['🎨 Artist', '🚀 Astronaut', '⚽ Athlete', '💼 Entrepreneur'] },
      { text: "If I had one superpower, I'd pick...", options: ['⏰ Time travel', '🦸 Flying', '🧠 Mind reading', '👻 Invisibility'] },
      { text: 'My dream vacation spot is...', options: ['🏝️ A beach island', '🏔️ The mountains', '🏙️ A big city', '🏰 A castle abroad'] },
      { text: "If I won a huge prize, the first thing I'd do is...", options: ['🎁 Buy gifts for friends', '✈️ Travel the world', '💰 Save it all', '🏠 Build my dream room'] },
      { text: 'My dream pet would be...', options: ['🐶 A dog', '🐱 A cat', '🐉 A dragon (yes, mythical)', '🦜 A parrot'] },
      { text: 'My dream house must have...', options: ['🎮 A game room', '🏊 A pool', '📚 A library', '🍿 A home theatre'] },
      { text: 'My future dream ride is...', options: ['🏍️ A bike', '🚗 A sports car', '🚁 A helicopter', '🚲 A fancy bicycle'] },
    ],
  },
  {
    title: 'मेरी ड्रीम लाइफ कितना जानते हो?',
    slug: 'meri-dream-life',
    description: 'ड्रीम जॉब, ड्रीम वेकेशन, ड्रीम सब कुछ — भरो, लिंक भेजो, देखो कौन सच में आपके सपने जानता है।',
    emoji: '✨',
    gradient: 'from-pink-400 to-yellow-400',
    language: 'hi',
    status: 'published',
    questions: [
      { text: 'मेरी ड्रीम जॉब होगी...', options: ['🎨 आर्टिस्ट', '🚀 एस्ट्रोनॉट', '⚽ एथलीट', '💼 एंटरप्रेन्योर'] },
      { text: 'अगर मेरे पास एक सुपरपावर होती, तो मैं चुनूंगा/चुनूंगी...', options: ['⏰ टाइम ट्रैवल', '🦸 उड़ना', '🧠 मन की बात पढ़ना', '👻 गायब हो जाना'] },
      { text: 'मेरी ड्रीम वेकेशन जगह है...', options: ['🏝️ बीच आइलैंड', '🏔️ पहाड़', '🏙️ बड़ा शहर', '🏰 विदेश का कोई किला'] },
      { text: 'अगर मुझे बड़ा इनाम मिले, तो सबसे पहले मैं...', options: ['🎁 दोस्तों को गिफ्ट दूंगा/दूंगी', '✈️ दुनिया घूमने निकलूंगा/निकलूंगी', '💰 सब बचा लूंगा/लूंगी', '🏠 अपना ड्रीम रूम बनवाऊंगा/बनवाऊंगी'] },
      { text: 'मेरा ड्रीम पेट होगा...', options: ['🐶 कुत्ता', '🐱 बिल्ली', '🐉 ड्रैगन (काल्पनिक ही सही)', '🦜 तोता'] },
      { text: 'मेरे ड्रीम हाउस में ज़रूर होना चाहिए...', options: ['🎮 गेम रूम', '🏊 स्विमिंग पूल', '📚 लाइब्रेरी', '🍿 होम थिएटर'] },
      { text: 'मेरी फ्यूचर ड्रीम राइड है...', options: ['🏍️ बाइक', '🚗 स्पोर्ट्स कार', '🚁 हेलीकॉप्टर', '🚲 फैंसी साइकिल'] },
    ],
  },
]

export async function seedFriendshipQuizzes() {
  for (const q of quizzes) {
    await FriendshipQuiz.findOneAndUpdate({ slug: q.slug }, q, { upsert: true, returnDocument: 'after' })
    console.log(`Seeded: ${q.title}`)
  }
}

async function main() {
  await connectDB()
  await seedFriendshipQuizzes()
  await disconnectDB()
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
