import 'dotenv/config'
import { pathToFileURL } from 'node:url'
import { connectDB, disconnectDB } from '../config/db.js'
import Post from '../models/Post.js'

// Re-runnable: upserts by (text, language) so re-running never duplicates.
// Run with: npm run seed:posts
const posts = [
  // --- Jokes (English) ---
  { category: 'joke', language: 'en', status: 'published', text: 'Why did the scarecrow win an award? He was outstanding in his field.' },
  { category: 'joke', language: 'en', status: 'published', text: "I told my computer I needed a break. Now it won't stop sending me KitKat ads." },
  { category: 'joke', language: 'en', status: 'published', text: "Why don't skeletons fight each other? They don't have the guts." },
  { category: 'joke', language: 'en', status: 'published', text: "I'm reading a book about anti-gravity. It's impossible to put down." },
  { category: 'joke', language: 'en', status: 'published', text: 'Why did the math book look sad? It had too many problems.' },
  { category: 'joke', language: 'en', status: 'published', text: 'I used to be a banker, but I lost interest.' },
  { category: 'joke', language: 'en', status: 'published', text: 'Why did the bicycle fall over? It was two-tired.' },
  { category: 'joke', language: 'en', status: 'published', text: "I'm on a seafood diet. I see food and I eat it." },
  { category: 'joke', language: 'en', status: 'published', text: "Parallel lines have so much in common. It's a shame they'll never meet." },
  { category: 'joke', language: 'en', status: 'published', text: 'What do you call a bear with no teeth? A gummy bear.' },

  // --- Funny Lines (English) ---
  { category: 'funny-line', language: 'en', status: 'published', text: "I'm not lazy, I'm on energy-saving mode." },
  { category: 'funny-line', language: 'en', status: 'published', text: 'My bed is a magical place where I suddenly remember everything I forgot to do.' },
  { category: 'funny-line', language: 'en', status: 'published', text: "I put the 'pro' in procrastinate." },
  { category: 'funny-line', language: 'en', status: 'published', text: "I'm on a snack diet. I've lost three snacks already." },
  { category: 'funny-line', language: 'en', status: 'published', text: 'My superpower is turning coffee into chaos.' },
  { category: 'funny-line', language: 'en', status: 'published', text: "Common sense is like deodorant — the people who need it most never use it." },
  { category: 'funny-line', language: 'en', status: 'published', text: "I'm not arguing, I'm just explaining why I'm right." },
  { category: 'funny-line', language: 'en', status: 'published', text: "My life feels like a test I didn't study for." },
  { category: 'funny-line', language: 'en', status: 'published', text: "I'm fluent in sarcasm, it's my second language." },
  { category: 'funny-line', language: 'en', status: 'published', text: 'Behind every great person is a snack they refuse to share.' },

  // --- Quotes (English, attributed) ---
  { category: 'quote', language: 'en', status: 'published', text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { category: 'quote', language: 'en', status: 'published', text: 'In the middle of difficulty lies opportunity.', author: 'Albert Einstein' },
  { category: 'quote', language: 'en', status: 'published', text: 'Be yourself; everyone else is already taken.', author: 'Oscar Wilde' },
  { category: 'quote', language: 'en', status: 'published', text: 'It always seems impossible until it is done.', author: 'Nelson Mandela' },
  { category: 'quote', language: 'en', status: 'published', text: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt' },
  { category: 'quote', language: 'en', status: 'published', text: 'Go instead where there is no path and leave a trail.', author: 'Ralph Waldo Emerson' },
  { category: 'quote', language: 'en', status: 'published', text: 'Life is what happens when you are busy making other plans.', author: 'John Lennon' },
  { category: 'quote', language: 'en', status: 'published', text: 'You miss 100% of the shots you do not take.', author: 'Wayne Gretzky' },

  // --- Motivational Quotes (English) ---
  { category: 'motivational-quote', language: 'en', status: 'published', text: 'Push yourself, because no one else is going to do it for you.' },
  { category: 'motivational-quote', language: 'en', status: 'published', text: 'Great things never come from comfort zones.' },
  { category: 'motivational-quote', language: 'en', status: 'published', text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill' },
  { category: 'motivational-quote', language: 'en', status: 'published', text: 'Believe you can and you are halfway there.', author: 'Theodore Roosevelt' },
  { category: 'motivational-quote', language: 'en', status: 'published', text: 'Do not watch the clock; do what it does. Keep going.', author: 'Sam Levenson' },
  { category: 'motivational-quote', language: 'en', status: 'published', text: 'The only limit to our realization of tomorrow is our doubts of today.', author: 'Franklin D. Roosevelt' },
  { category: 'motivational-quote', language: 'en', status: 'published', text: 'Small steps every day lead to big changes.' },
  { category: 'motivational-quote', language: 'en', status: 'published', text: 'You are stronger than you think and more capable than you know.' },

  // --- चुटकुले / Jokes (Hindi) ---
  { category: 'joke', language: 'hi', status: 'published', text: 'पप्पू: पापा, मैं बड़ा होकर डॉक्टर बनूंगा।\nपापा: बहुत अच्छा बेटा, फीस कौन देगा?\nपप्पू: वही तो डॉक्टर बनकर पूछूंगा!' },
  { category: 'joke', language: 'hi', status: 'published', text: 'टीचर: होमवर्क क्यों नहीं किया?\nपप्पू: सर, मेरी किताब ने आज छुट्टी ले ली।' },
  { category: 'joke', language: 'hi', status: 'published', text: 'मम्मी: बेटा, गणित में कितने नंबर आए?\nबेटा: पानी में जितने मच्छर होते हैं, उतने।' },
  { category: 'joke', language: 'hi', status: 'published', text: 'डॉक्टर: आपको कितनी बार हिचकी आती है?\nमरीज: गिनती करते ही हिचकी बंद हो जाती है!' },
  { category: 'joke', language: 'hi', status: 'published', text: 'एक आदमी डॉक्टर के पास गया और बोला — डॉक्टर साहब, मुझे हर पांच मिनट में भूख लगती है।\nडॉक्टर: चिंता मत करो, तुम बिल्कुल नॉर्मल हो, बस थोड़े जल्दी वाले हो।' },
  { category: 'joke', language: 'hi', status: 'published', text: 'बेटा: पापा, स्कूल जाने का मन नहीं कर रहा।\nपापा: क्यों बेटा?\nबेटा: टीचर्स मुझे पसंद नहीं करते, बच्चे भी मुझे पसंद नहीं करते।\nपापा: फिर भी जाना पड़ेगा, आखिर तुम प्रिंसिपल हो!' },
  { category: 'joke', language: 'hi', status: 'published', text: 'क्लास में टीचर ने पूछा — बताओ, धरती किस पर टिकी है?\nपप्पू: सर, कछुए की पीठ पर।\nटीचर: कछुआ किस पर खड़ा है?\nपप्पू: सर, अब बहस मत कीजिए, नीचे और भी कछुए हैं।' },
  { category: 'joke', language: 'hi', status: 'published', text: 'एक आदमी की जेब में हमेशा कंघी रहती थी, हालांकि वो गंजा था।\nपूछने पर बोला — रखी है, कभी उग आए तो काम आएगी।' },

  // --- मजेदार लाइनें / Funny Lines (Hindi) ---
  { category: 'funny-line', language: 'hi', status: 'published', text: 'आलस इतना है कि सपने में भी लेटकर ही सोचता हूं।' },
  { category: 'funny-line', language: 'hi', status: 'published', text: 'मेरा बजट ऐसा है कि महीने के आखिर में सिर्फ यादें बचती हैं।' },
  { category: 'funny-line', language: 'hi', status: 'published', text: 'मैं आलसी नहीं हूं, बस एनर्जी सेव कर रहा हूं।' },
  { category: 'funny-line', language: 'hi', status: 'published', text: 'नींद और मैं, बचपन के दोस्त हैं।' },
  { category: 'funny-line', language: 'hi', status: 'published', text: 'मेरा मूड मौसम से भी ज़्यादा बदलता है।' },
  { category: 'funny-line', language: 'hi', status: 'published', text: 'काम कल पर टालना, मेरी सबसे पुरानी आदत है।' },
  { category: 'funny-line', language: 'hi', status: 'published', text: 'चाय पर चर्चा हो या ज़िन्दगी पर, दोनों अधूरी लगती हैं बिना चाय के।' },
  { category: 'funny-line', language: 'hi', status: 'published', text: 'मेरा सारा ज्ञान गूगल की मेहरबानी है।' },

  // --- उद्धरण / Quotes (Hindi, attributed) ---
  { category: 'quote', language: 'hi', status: 'published', text: 'जो जीतते हैं वो कुछ अलग नहीं करते, वो हर काम अलग तरीके से करते हैं।', author: 'शिव खेड़ा' },
  { category: 'quote', language: 'hi', status: 'published', text: 'उठो, जागो और तब तक मत रुको जब तक लक्ष्य प्राप्त न हो जाए।', author: 'स्वामी विवेकानंद' },
  { category: 'quote', language: 'hi', status: 'published', text: 'कठिनाइयाँ हमें मजबूत बनाने के लिए आती हैं, तोड़ने के लिए नहीं।', author: 'डॉ. ए.पी.जे. अब्दुल कलाम' },
  { category: 'quote', language: 'hi', status: 'published', text: 'सपने वो नहीं जो हम सोते समय देखते हैं, सपने वो हैं जो हमें सोने नहीं देते।', author: 'डॉ. ए.पी.जे. अब्दुल कलाम' },
  { category: 'quote', language: 'hi', status: 'published', text: 'खुद पर विश्वास रखो, सफलता खुद चलकर आएगी।', author: 'स्वामी विवेकानंद' },

  // --- प्रेरणादायक विचार / Motivational Quotes (Hindi) ---
  { category: 'motivational-quote', language: 'hi', status: 'published', text: 'हर सुबह एक नई शुरुआत है, आज फिर से कोशिश करो।' },
  { category: 'motivational-quote', language: 'hi', status: 'published', text: 'मेहनत इतनी खामोशी से करो कि सफलता शोर मचा दे।' },
  { category: 'motivational-quote', language: 'hi', status: 'published', text: 'गिरने से मत डरो, ना उठने से डरो।' },
  { category: 'motivational-quote', language: 'hi', status: 'published', text: 'छोटे कदम भी मंज़िल तक पहुंचाते हैं, बस चलते रहो।' },
  { category: 'motivational-quote', language: 'hi', status: 'published', text: 'खुद पर भरोसा रखो, बाकी सब अपने आप हो जाएगा।' },
  { category: 'motivational-quote', language: 'hi', status: 'published', text: 'आज का दिन, कल की सफलता की नींव है।' },
  { category: 'motivational-quote', language: 'hi', status: 'published', text: 'हार मानने से पहले एक बार और कोशिश करो।' },
  { category: 'motivational-quote', language: 'hi', status: 'published', text: 'तुम जितना सोचते हो, उससे कहीं ज़्यादा मजबूत हो।' },

  // --- More Jokes (English) ---
  { category: 'joke', language: 'en', status: 'published', text: "Why don't eggs tell jokes? They'd crack each other up." },
  { category: 'joke', language: 'en', status: 'published', text: "I told my dog a chicken joke. She didn't find it very fowl." },
  { category: 'joke', language: 'en', status: 'published', text: 'Why did the coffee file a police report? It got mugged.' },
  { category: 'joke', language: 'en', status: 'published', text: 'I used to hate facial hair, but then it grew on me.' },
  { category: 'joke', language: 'en', status: 'published', text: 'Why did the smartphone go to therapy? It lost its contacts.' },

  // --- More Funny Lines (English) ---
  { category: 'funny-line', language: 'en', status: 'published', text: "I'm not saying I'm Batman, I'm just saying no one has ever seen me and Batman in the same room." },
  { category: 'funny-line', language: 'en', status: 'published', text: 'My diet plan: if it fits in the fridge, it fits in me.' },
  { category: 'funny-line', language: 'en', status: 'published', text: "I've got a plan, it's called 'no plan.' It's working out great." },
  { category: 'funny-line', language: 'en', status: 'published', text: 'Adulting is just googling how to do things and hoping for the best.' },
  { category: 'funny-line', language: 'en', status: 'published', text: 'I run on coffee, chaos, and mild sarcasm.' },

  // --- More Quotes (English, attributed) ---
  { category: 'quote', language: 'en', status: 'published', text: 'The best time to plant a tree was 20 years ago. The second best time is now.', author: 'Chinese Proverb' },
  { category: 'quote', language: 'en', status: 'published', text: 'What you get by achieving your goals is not as important as what you become by achieving your goals.', author: 'Zig Ziglar' },
  { category: 'quote', language: 'en', status: 'published', text: "Whether you think you can or you think you can't, you're right.", author: 'Henry Ford' },

  // --- More Motivational Quotes (English) ---
  { category: 'motivational-quote', language: 'en', status: 'published', text: 'Every expert was once a beginner.' },
  { category: 'motivational-quote', language: 'en', status: 'published', text: 'Your only limit is you.' },

  // --- और चुटकुले / More Jokes (Hindi) ---
  { category: 'joke', language: 'hi', status: 'published', text: 'पप्पू: पापा, मुझे इंजीनियर बनना है।\nपापा: क्यों बेटा?\nपप्पू: ताकि सब चीज़ें तोड़ने का लाइसेंस मिल जाए!' },
  { category: 'joke', language: 'hi', status: 'published', text: "टीचर: बताओ, 'पानी' का बहुवचन क्या है?\nपप्पू: सर, 'बाढ़'!" },
  { category: 'joke', language: 'hi', status: 'published', text: 'मम्मी: बेटा, इतनी देर से मोबाइल चला रहा है, आँखें खराब हो जाएंगी।\nबेटा: मम्मी, आँखें तो पहले से ही स्क्रीन के लिए बनी हैं!' },

  // --- और मजेदार लाइनें / More Funny Lines (Hindi) ---
  { category: 'funny-line', language: 'hi', status: 'published', text: 'मेरा वजन कम नहीं होता, बस दिल बड़ा है इसलिए थोड़ा फैला हुआ है।' },
  { category: 'funny-line', language: 'hi', status: 'published', text: 'जितना मैं प्लान बनाता हूं, उतना ही भगवान हंसता है।' },
]

export async function seedPosts() {
  for (const p of posts) {
    await Post.findOneAndUpdate(
      { text: p.text, language: p.language },
      p,
      { upsert: true, returnDocument: 'after' }
    )
  }
  console.log(`Seeded ${posts.length} posts.`)
}

async function main() {
  await connectDB()
  await seedPosts()
  await disconnectDB()
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
