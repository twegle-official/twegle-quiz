import 'dotenv/config'
import { connectDB, disconnectDB } from '../config/db.js'
import Quiz from '../models/Quiz.js'

// One-off / re-runnable command to load the starter quizzes into the real
// database, published and ready to view. Run with: npm run seed:quizzes
// Safe to re-run — upserts by slug instead of duplicating.
const quizzes = [
  {
    title: "What's Your Skincare Personality?",
    slug: 'skincare-type',
    category: 'beauty',
    description: "A few dramatic questions and we'll diagnose your face's whole vibe.",
    emoji: '🧴',
    gradient: 'from-pink-400 to-rose-400',
    status: 'published',
    questions: [
      {
        text: "It's 2pm. Your face is...",
        options: [
          { text: 'Basically a mirror. I could signal ships with my forehead.', result: 'oily' },
          { text: 'Auditioning for a desert documentary. Send moisturizer.', result: 'dry' },
          { text: 'Having an identity crisis — oily up top, dry down south.', result: 'combination' },
          { text: "Weirdly fine? Suspicious, but I'll take it.", result: 'normal' },
        ],
      },
      {
        text: 'You try a new product. What happens?',
        options: [
          { text: 'Instant breakout. My face said "absolutely not."', result: 'oily' },
          { text: 'It evaporates faster than my Monday motivation.', result: 'dry' },
          { text: 'My face turns tomato-red within five minutes.', result: 'sensitive' },
          { text: 'Nothing dramatic. Honestly kind of anticlimactic.', result: 'normal' },
        ],
      },
      {
        text: 'Your pores, describe them:',
        options: [
          { text: 'Visible from space.', result: 'oily' },
          { text: 'What pores? I have smooth, tight, dehydrated skin.', result: 'dry' },
          { text: 'Huge on the T-zone, witness protection everywhere else.', result: 'combination' },
          { text: 'Small, tidy, minding their own business.', result: 'normal' },
        ],
      },
      {
        text: 'How does your skin handle a hot summer day?',
        options: [
          { text: 'Turns into a glazed donut by noon.', result: 'oily' },
          { text: 'Flakes like a croissant left out overnight.', result: 'dry' },
          { text: 'T-zone throws a pool party, cheeks stay dry and unbothered.', result: 'combination' },
          { text: 'Handles it like a champ. No notes.', result: 'normal' },
        ],
      },
      {
        text: 'Pick your skincare superpower wish:',
        options: [
          { text: 'Turn my face from oil rig to matte museum.', result: 'oily' },
          { text: 'Just... hydration. Is that too much to ask?', result: 'dry' },
          { text: 'Calm the redness before it becomes a whole mood.', result: 'sensitive' },
          { text: 'Get my whole face to agree on ONE skin type.', result: 'combination' },
        ],
      },
    ],
    results: [
      { key: 'oily', emoji: '✨', title: 'The Human Disco Ball', description: "You shine — literally. By 2pm your face could double as a flashlight. A gentle foaming cleanser and an oil-free moisturizer are about to become your new best friends. Sunscreen is still non-negotiable." },
      { key: 'dry', emoji: '🏜️', title: 'The Sahara Situation', description: "Your skin is out here reenacting a desert documentary. Ceramides, hyaluronic acid, and a genuinely rich moisturizer are about to become your whole personality — in a good way." },
      { key: 'combination', emoji: '🌗', title: 'The Skin With Two Faces', description: "Oily T-zone, calm cheeks — your face genuinely cannot make up its mind. Multi-masking isn't just a skincare technique for you, it's basically diplomacy." },
      { key: 'normal', emoji: '🌿', title: 'The Suspiciously Fine One', description: "Balanced, low-drama, main-character energy. Honestly a little annoying how easy you have it — keep doing gentle basics and sunscreen, and don't jinx it." },
      { key: 'sensitive', emoji: '🍅', title: 'The Human Mood Ring', description: "Your skin reacts to literally everything — new pillowcase, spicy food, mild inconvenience. Fragrance-free, minimal-ingredient products are the peace treaty your face needs." },
    ],
  },
  {
    title: 'Which Bollywood Era Are You?',
    slug: 'bollywood-era',
    category: 'entertainment',
    description: 'Your taste in drama, songs, and questionable fight choreography, decoded.',
    emoji: '🎬',
    gradient: 'from-amber-400 to-orange-500',
    status: 'published',
    questions: [
      {
        text: 'Pick a breakup scene:',
        options: [
          { text: 'Runs through a train station in the rain, very dramatically.', result: 'golden' },
          { text: 'Dances it out solo in a mustard field.', result: 'ninties' },
          { text: 'Entire friend group flies in from 3 countries for an intervention.', result: 'y2k' },
          { text: 'Sends one really well-written text and moves on.', result: 'modern' },
        ],
      },
      {
        text: 'Your ideal hero entrance:',
        options: [
          { text: 'Slow-motion walk while pigeons dramatically take flight.', result: 'golden' },
          { text: 'Jumps off a moving bicycle, hair still perfect.', result: 'ninties' },
          { text: 'Helicopter lands directly into the wedding.', result: 'y2k' },
          { text: 'Just... shows up. Late. Still somehow gets the girl.', result: 'modern' },
        ],
      },
      {
        text: 'Pick a fight scene:',
        options: [
          { text: 'One punch sends twelve goons flying into a wall.', result: 'golden' },
          { text: 'Fight breaks out at a wedding over a misunderstanding.', result: 'ninties' },
          { text: 'Entire fight is choreographed to a love-song remix.', result: 'y2k' },
          { text: 'Argument happens entirely through passive-aggressive texts.', result: 'modern' },
        ],
      },
      {
        text: 'Your dream soundtrack:',
        options: [
          { text: 'A ghazal so sad it makes the rain outside worse.', result: 'golden' },
          { text: 'A duet in the Swiss Alps for absolutely no plot reason.', result: 'ninties' },
          { text: 'The club banger that plays at literally every wedding since.', result: 'y2k' },
          { text: 'Moody indie track over a doom-scrolling montage.', result: 'modern' },
        ],
      },
      {
        text: 'Perfect ending to your love story:',
        options: [
          { text: "Tragic and poetic — even the villain is crying.", result: 'golden' },
          { text: 'Big joint-family blessing under a very large tree.', result: 'ninties' },
          { text: 'Multi-crore wedding, minimum three costume changes.', result: 'y2k' },
          { text: 'Quiet coffee, ambiguous ending, sequel rights reserved.', result: 'modern' },
        ],
      },
    ],
    results: [
      { key: 'golden', emoji: '🎞️', title: 'The Golden Weepy Classic', description: "You're pure black-and-white tragedy with a side of poetry. Somewhere, a violin starts playing just because you walked past a window." },
      { key: 'ninties', emoji: '🌼', title: 'The Mustard Field Romantic', description: "Sweet, wholesome, and allergic to conflict lasting more than one misunderstanding. You'd absolutely break into song in a foreign country for no reason." },
      { key: 'y2k', emoji: '💃', title: 'The Multi-Crore Masala Icon', description: "Loud, glittery, and gloriously extra — your love story needs a helicopter, a full dance number, and at least one dramatic slow clap." },
      { key: 'modern', emoji: '🎥', title: 'The Moody Realist', description: "Real, a little chaotic, and allergic to endings that wrap up too neatly. Your love story is basically a five-star review waiting to happen." },
    ],
  },
  {
    title: 'Guess Your Aesthetic',
    slug: 'aesthetic',
    category: 'lifestyle',
    description: 'Cottagecore? Dark academia? Y2K? Let your snack choices decide.',
    emoji: '🌈',
    gradient: 'from-violet-400 to-indigo-500',
    status: 'published',
    questions: [
      {
        text: 'Your dream Saturday:',
        options: [
          { text: 'Making bread I definitely did not need to make.', result: 'cottagecore' },
          { text: "Dramatically reading a 700-page book I'll never finish.", result: 'academia' },
          { text: 'A thrift haul plus one song stuck in my head for a week.', result: 'y2k' },
          { text: 'Doing literally nothing and being extremely proud of it.', result: 'minimalist' },
        ],
      },
      {
        text: 'Pick a home decor crisis:',
        options: [
          { text: 'I own more dried flowers than actual furniture.', result: 'cottagecore' },
          { text: 'My bookshelf has become a structural safety hazard.', result: 'academia' },
          { text: 'My room glows in the dark from all the string lights.', result: 'y2k' },
          { text: "I own one chair. It's very nice. That's the whole room.", result: 'minimalist' },
        ],
      },
      {
        text: 'Your emotional support item:',
        options: [
          { text: 'A cardigan that has seen things.', result: 'cottagecore' },
          { text: 'A coffee-stained notebook of half-finished thoughts.', result: 'academia' },
          { text: 'Butterfly clips. All of them. At once.', result: 'y2k' },
          { text: 'A candle I will never light because it "ruins the aesthetic."', result: 'minimalist' },
        ],
      },
      {
        text: 'Pick a soundtrack for your life:',
        options: [
          { text: 'Folk music and the sound of bread rising.', result: 'cottagecore' },
          { text: 'Sad piano that makes grocery shopping feel cinematic.', result: 'academia' },
          { text: 'Anything from a playlist called "guilty pleasure 2003."', result: 'y2k' },
          { text: 'Silence. Beautiful, intentional silence.', result: 'minimalist' },
        ],
      },
      {
        text: 'Your honest reaction to clutter:',
        options: [
          { text: 'More is more. Add another dried flower.', result: 'cottagecore' },
          { text: 'It\'s not clutter, it\'s "curated chaos."', result: 'academia' },
          { text: 'Clutter? I call it "vibes."', result: 'y2k' },
          { text: "Physically cannot relax until it's gone.", result: 'minimalist' },
        ],
      },
    ],
    results: [
      { key: 'cottagecore', emoji: '🌾', title: 'Certified Bread-Baking Softie', description: "You radiate slow mornings, garden dirt under your nails, and main-character energy in a flowy dress. Emotionally, you are a warm loaf of homemade bread." },
      { key: 'academia', emoji: '📚', title: 'The Dramatic Library Dweller', description: "Moody, bookish, and one candlelit dinner away from starting a secret society. You've never met a cardigan — or an existential crisis — you didn't like." },
      { key: 'y2k', emoji: '💿', title: 'The Glitter Time Traveler', description: "Loud, nostalgic, and unbothered — you brought early-2000s chaos back and honestly, we needed it. Butterfly clips as a personality trait? Iconic." },
      { key: 'minimalist', emoji: '⚪', title: "The Calm in Everyone Else's Chaos", description: "One chair, zero clutter, maximum peace. You'd rather own five things you love than fifty things stressing you out — and honestly, respect." },
    ],
  },
]

quizzes.push(
  {
    title: "What's Your Procrastination Style?",
    slug: 'procrastination-style',
    category: 'lifestyle',
    description: "It's due tomorrow. What are you doing instead of it?",
    emoji: '⏰',
    gradient: 'from-emerald-400 to-teal-500',
    status: 'published',
    questions: [
      {
        text: "It's midnight and the deadline is tomorrow morning. You are:",
        options: [
          { text: 'Deep cleaning my room for the first time in months.', result: 'cleaner' },
          { text: "Watching 'just one more' episode. It's been four.", result: 'binge' },
          { text: 'Reorganizing my to-do list instead of doing anything on it.', result: 'planner' },
          { text: 'Actually starting the work. Panic is a great motivator.', result: 'lastminute' },
        ],
      },
      {
        text: 'Your browser right now has:',
        options: [
          { text: "47 tabs, none of which are the thing you're supposed to be doing.", result: 'binge' },
          { text: "A very detailed spreadsheet you didn't need to make.", result: 'planner' },
          { text: "Cleaning supplies tabs. You're buying a mop at 1am.", result: 'cleaner' },
          { text: 'The actual work. Finally. Barely.', result: 'lastminute' },
        ],
      },
      {
        text: "A friend asks if you've started the project. You say:",
        options: [
          { text: 'Almost done! (You have not started.)', result: 'lastminute' },
          { text: "I've made a plan for a plan.", result: 'planner' },
          { text: 'I organized my desk instead, does that count?', result: 'cleaner' },
          { text: "Can't talk, I'm mid-binge.", result: 'binge' },
        ],
      },
      {
        text: 'Your ideal productivity hack:',
        options: [
          { text: 'A body double who just watches me not work.', result: 'binge' },
          { text: "Fifteen color-coded sticky notes I'll never look at again.", result: 'planner' },
          { text: "A spotless desk. Somehow that's step one, always.", result: 'cleaner' },
          { text: 'Adrenaline. Straight adrenaline.', result: 'lastminute' },
        ],
      },
      {
        text: 'When the deadline finally arrives:',
        options: [
          { text: "Turns out panic really is a superpower.", result: 'lastminute' },
          { text: "You're weirdly calm because you planned for this chaos.", result: 'planner' },
          { text: "You submit it from an extremely clean room.", result: 'cleaner' },
          { text: 'You surface from the finale, blinking, and get to work.', result: 'binge' },
        ],
      },
    ],
    results: [
      { key: 'lastminute', emoji: '🔥', title: 'The Adrenaline Junkie', description: "You don't procrastinate, you're just... running on a very specific fuel: pure panic. Somehow it always works out. Somehow." },
      { key: 'planner', emoji: '📋', title: 'The Fake Planner', description: "You've built a beautiful, detailed plan for doing the thing. The plan itself has become the procrastination. It's very impressive. It is not the thing." },
      { key: 'cleaner', emoji: '🧹', title: 'The Suspicious Cleaner', description: "Nothing makes you want to deep-clean a bathroom quite like a looming deadline. Your house has never looked better. Your inbox has never looked worse." },
      { key: 'binge', emoji: '📺', title: 'The Episode Hostage', description: "You said 'one more episode' six episodes ago. The deadline is now a distant memory. So is the plot of episode one." },
    ],
  },
  {
    title: 'Which Chai/Coffee Order Are You?',
    slug: 'chai-coffee-order',
    category: 'lifestyle',
    description: 'How you take your morning drink says a lot about you.',
    emoji: '☕',
    gradient: 'from-sky-400 to-blue-500',
    status: 'published',
    questions: [
      {
        text: 'How do you take your morning drink?',
        options: [
          { text: 'Extra strong, extra sweet, no negotiations.', result: 'strong' },
          { text: "Whatever's fastest, I'm already late.", result: 'instant' },
          { text: 'An elaborate order with three modifications.', result: 'extra' },
          { text: 'Black, no sugar, no fuss.', result: 'simple' },
        ],
      },
      {
        text: 'Your energy before your first sip:',
        options: [
          { text: 'A crime scene documentary, minus the calm narrator.', result: 'strong' },
          { text: 'Functional. Barely. Do not make eye contact.', result: 'instant' },
          { text: 'Excited — this drink is basically my whole personality.', result: 'extra' },
          { text: "Fine. I'm fine. I don't need this, I want this.", result: 'simple' },
        ],
      },
      {
        text: 'Pick a cafe order style:',
        options: [
          { text: 'Double shot, no water, straight to the vein.', result: 'strong' },
          { text: "Whatever's on the counter, I'll take it.", result: 'instant' },
          { text: 'Oat milk, extra foam, one pump, alphabetized.', result: 'extra' },
          { text: 'House blend. No modifications. Respectfully.', result: 'simple' },
        ],
      },
      {
        text: 'Your reaction when the order comes out wrong:',
        options: [
          { text: 'This is weak. This is basically flavored water.', result: 'strong' },
          { text: "Doesn't matter, I needed the caffeine, not the experience.", result: 'instant' },
          { text: 'Genuine crisis. This changes the whole vibe of my day.', result: 'extra' },
          { text: 'Mild disappointment, quietly filed away forever.', result: 'simple' },
        ],
      },
      {
        text: 'Your ideal chai/coffee moment:',
        options: [
          { text: 'Strong enough to wake the neighbors.', result: 'strong' },
          { text: 'However fast gets it into my system.', result: 'instant' },
          { text: 'A whole ritual, ideally photographed.', result: 'extra' },
          { text: 'Quiet, simple, no drama, just the drink.', result: 'simple' },
        ],
      },
    ],
    results: [
      { key: 'strong', emoji: '💪', title: 'The Double-Shot Diehard', description: "You don't drink coffee or chai, you drink jet fuel. Subtlety was never the assignment. Neither was sleep, apparently." },
      { key: 'instant', emoji: '⚡', title: 'The Just-Get-It-In-Me Type', description: 'You don\'t care about ceremony, you care about function. The drink is a delivery system, and you are always, always running late.' },
      { key: 'extra', emoji: '✨', title: 'The Full Ritual Main Character', description: "Your order has more modifications than a legal contract, and honestly, it should be photographed. This isn't just a drink, it's a whole scene." },
      { key: 'simple', emoji: '⚫', title: 'The No-Fuss Purist', description: "No syrup, no sugar, no 17-word order. You know exactly what you like, and you are not interested in anyone's opinion about it." },
    ],
  }
)

quizzes.push(
  {
    title: "What's Your Korean Beauty Standard Type?",
    slug: 'korean-beauty-standard',
    category: 'beauty',
    description: 'KBS, glass skin, and everything in between — find your type.',
    emoji: '🌸',
    gradient: 'from-red-400 to-orange-400',
    status: 'published',
    questions: [
      {
        text: 'Your skincare routine has how many steps?',
        options: [
          { text: 'Just the basics — cleanse, moisturize, done.', result: 'minimal' },
          { text: '10 steps, minimum. Every. Single. Day.', result: 'glass_skin' },
          { text: "Whatever's trending on my FYP this week.", result: 'trend' },
          { text: 'SPF and vibes, honestly.', result: 'minimal' },
        ],
      },
      {
        text: 'Pick a makeup look:',
        options: [
          { text: "Bare 'glass skin' glow, dewy and luminous.", result: 'glass_skin' },
          { text: 'Soft gradient lips and puppy eyeliner.', result: 'aegyo' },
          { text: "Bold, editorial, whatever's viral right now.", result: 'trend' },
          { text: 'No makeup, just really good skincare.', result: 'minimal' },
        ],
      },
      {
        text: 'Your ideal hair look:',
        options: [
          { text: 'Perfectly straight, glass-like shine.', result: 'glass_skin' },
          { text: 'Soft waves with cute bangs.', result: 'aegyo' },
          { text: "Whatever color idols are dyeing this comeback season.", result: 'trend' },
          { text: 'Low maintenance, natural texture.', result: 'minimal' },
        ],
      },
      {
        text: "Pick a beauty product you'd hoard:",
        options: [
          { text: 'Essence and serums, layers of them.', result: 'glass_skin' },
          { text: 'Tinted lip balm in the cutest shade.', result: 'aegyo' },
          { text: "Whatever the latest idol-endorsed brand drops.", result: 'trend' },
          { text: "A really good sunscreen. That's it.", result: 'minimal' },
        ],
      },
      {
        text: 'Your beauty philosophy:',
        options: [
          { text: "Glow so good people think it's lighting, not skincare.", result: 'glass_skin' },
          { text: 'Cute over everything, always.', result: 'aegyo' },
          { text: "If it's trending, I'm trying it.", result: 'trend' },
          { text: 'Less is more, always has been.', result: 'minimal' },
        ],
      },
    ],
    results: [
      { key: 'glass_skin', emoji: '✨', title: 'Glass Skin Perfectionist', description: "Dewy, luminous, and reflective enough to check your notifications in. Your 10-step routine isn't overkill, it's a lifestyle." },
      { key: 'aegyo', emoji: '🎀', title: 'Aegyo Cutie', description: "Soft gradient lips, puppy eyeliner, and an aesthetic that's basically a permanent 'cute overload' warning." },
      { key: 'trend', emoji: '📱', title: 'Trend Chaser', description: "Whatever's viral this comeback season is already in your routine. Your FYP basically curates your entire beauty cabinet." },
      { key: 'minimal', emoji: '🧴', title: 'Minimalist Glow', description: 'SPF, moisturizer, and zero patience for a 10-step routine. Your skin looks great and your shelf stays empty.' },
    ],
  },
  {
    title: 'Which Squishy Are You?',
    slug: 'squishy-personality',
    category: 'fun',
    description: 'Slow-rise, bouncy, or scented — your squishy collection says a lot.',
    emoji: '🧸',
    gradient: 'from-fuchsia-400 to-pink-500',
    status: 'published',
    questions: [
      {
        text: 'Pick a squish speed:',
        options: [
          { text: 'Slow-rise, dramatic, I take my time.', result: 'slow_rise' },
          { text: 'Bouncy and quick, back to shape in a snap.', result: 'bouncy' },
          { text: 'Extra soft, barely holds a shape at all.', result: 'super_soft' },
          { text: 'Scented and squishy, full sensory experience.', result: 'scented' },
        ],
      },
      {
        text: 'Your favorite squishy shape:',
        options: [
          { text: 'A cute food item, bread or a bun.', result: 'slow_rise' },
          { text: 'An animal with a big derpy face.', result: 'bouncy' },
          { text: 'Something round and cloud-soft.', result: 'super_soft' },
          { text: 'Whatever smells like strawberries.', result: 'scented' },
        ],
      },
      {
        text: 'How do you display your squishy collection?',
        options: [
          { text: 'Lined up perfectly, biggest to smallest.', result: 'slow_rise' },
          { text: 'Squished constantly, they never get to rest.', result: 'bouncy' },
          { text: 'In a big soft pile, all mixed together.', result: 'super_soft' },
          { text: 'Near my desk so I can sniff them while working.', result: 'scented' },
        ],
      },
      {
        text: 'Pick a squishy activity:',
        options: [
          { text: 'Watching it slowly rise back up, very zen.', result: 'slow_rise' },
          { text: 'Squish-testing every single one, repeatedly.', result: 'bouncy' },
          { text: "Just holding it. It's basically a stress pillow.", result: 'super_soft' },
          { text: 'Sniffing it before doing literally anything else.', result: 'scented' },
        ],
      },
      {
        text: 'Your squishy collecting philosophy:',
        options: [
          { text: 'Quality over quantity, each one is special.', result: 'slow_rise' },
          { text: 'The bouncier, the better.', result: 'bouncy' },
          { text: 'Softness is the only stat that matters.', result: 'super_soft' },
          { text: "If it smells good, it's coming home with me.", result: 'scented' },
        ],
      },
    ],
    results: [
      { key: 'slow_rise', emoji: '🍞', title: 'The Zen Slow-Riser', description: 'Patient, calm, and a little dramatic about it — watching your squishy slowly puff back up is basically meditation.' },
      { key: 'bouncy', emoji: '🐰', title: 'The Bounce-Back Kid', description: "Quick, resilient, and can't stop squish-testing. You bounce back from everything, squishy included." },
      { key: 'super_soft', emoji: '☁️', title: 'The Cloud Softie', description: 'Softness is a personality trait at this point. Your squishies barely hold a shape and neither do your Sunday plans.' },
      { key: 'scented', emoji: '🍓', title: 'The Sniff-Tester', description: 'Smell comes first, shape comes second. Your collection doubles as a very soft perfume counter.' },
    ],
  },
  {
    title: "What's Your Blind Bag Energy?",
    slug: 'blind-bag-energy',
    category: 'fun',
    description: 'Ripper, guesser, or savorer — how do you handle the mystery?',
    emoji: '🎁',
    gradient: 'from-lime-400 to-green-500',
    status: 'published',
    questions: [
      {
        text: 'You just bought a blind bag. First move:',
        options: [
          { text: 'Shake it gently, try to guess what\'s inside.', result: 'guesser' },
          { text: 'Rip it open immediately, no patience for mystery.', result: 'ripper' },
          { text: "Check online first for 'how to tell which one it is' hacks.", result: 'researcher' },
          { text: 'Open it slowly, savoring every second.', result: 'savorer' },
        ],
      },
      {
        text: 'You get a duplicate of one you already have. Reaction:',
        options: [
          { text: 'Mild disappointment, add it to the trade pile.', result: 'researcher' },
          { text: 'Immediate crisis, this changes everything.', result: 'ripper' },
          { text: 'Actually kind of happy, now I have two.', result: 'savorer' },
          { text: "Already calculating my odds for the next one.", result: 'guesser' },
        ],
      },
      {
        text: 'Your blind bag collection strategy:',
        options: [
          { text: 'Buy one at a time, savor the whole series.', result: 'savorer' },
          { text: 'Buy a whole box, maximize my odds.', result: 'researcher' },
          { text: 'Impulse buy whenever I see one at checkout.', result: 'ripper' },
          { text: 'Study weight and shake patterns like a detective.', result: 'guesser' },
        ],
      },
      {
        text: "Pick a reaction to the 'rare' one:",
        options: [
          { text: 'I called it! I guessed right!', result: 'guesser' },
          { text: 'SCREAMING. Immediately telling everyone.', result: 'ripper' },
          { text: 'Quietly thrilled, admiring it in its packaging.', result: 'savorer' },
          { text: 'Already looking up how much it resells for.', result: 'researcher' },
        ],
      },
      {
        text: 'Your ideal blind bag purchase:',
        options: [
          { text: 'One at a time, building the anticipation.', result: 'savorer' },
          { text: 'A full case, no guessing required.', result: 'researcher' },
          { text: "Whatever's closest to the register, impulse mode on.", result: 'ripper' },
          { text: "One I've already predicted based on shape clues.", result: 'guesser' },
        ],
      },
    ],
    results: [
      { key: 'guesser', emoji: '🔍', title: 'The Shake-and-Guess Detective', description: "You've basically got a PhD in blind bag forensics. Weight, shape, sound — nothing gets past your detective instincts." },
      { key: 'ripper', emoji: '💥', title: 'Zero-Patience Ripper', description: 'Mystery is cute in theory, but you want to know NOW. The packaging never stood a chance.' },
      { key: 'researcher', emoji: '📊', title: 'The Odds Calculator', description: "You buy strategically, trade smart, and always know which one is 'rare' before anyone else does." },
      { key: 'savorer', emoji: '🎀', title: 'The Anticipation Savorer', description: "The suspense is the best part. You'd rather enjoy the mystery a little longer than rush straight to the reveal." },
    ],
  },
  {
    title: 'Which K-pop Idol Position Are You?',
    slug: 'kpop-idol-position',
    category: 'kpop',
    description: 'Visual, main vocal, main dancer, or rapper — find your idol role.',
    emoji: '🎤',
    gradient: 'from-cyan-400 to-sky-500',
    status: 'published',
    questions: [
      {
        text: "At group practice, you're usually:",
        options: [
          { text: 'Front and center, all eyes on me.', result: 'visual_main' },
          { text: 'Hitting the high note everyone remembers.', result: 'main_vocal' },
          { text: 'Landing the sharpest move in the choreo.', result: 'main_dancer' },
          { text: 'Freestyling a verse nobody asked for but everyone loves.', result: 'rapper' },
        ],
      },
      {
        text: 'Your friends would describe you as:',
        options: [
          { text: 'The photogenic one, camera loves me.', result: 'visual_main' },
          { text: 'The one who can actually sing, no autotune needed.', result: 'main_vocal' },
          { text: 'The one who remembers every dance step perfectly.', result: 'main_dancer' },
          { text: 'The one with all the confidence and punchlines.', result: 'rapper' },
        ],
      },
      {
        text: 'Pick a stage moment:',
        options: [
          { text: 'The dramatic center pose during the bridge.', result: 'visual_main' },
          { text: 'The killer high note that gets the whole crowd screaming.', result: 'main_vocal' },
          { text: 'The intense dance break, sharp and precise.', result: 'main_dancer' },
          { text: 'The rap verse that goes viral as a sound clip.', result: 'rapper' },
        ],
      },
      {
        text: 'Your talent show move would be:',
        options: [
          { text: 'Just standing there looking effortlessly good.', result: 'visual_main' },
          { text: 'A vocal run that leaves everyone speechless.', result: 'main_vocal' },
          { text: 'A full choreographed routine, no mistakes.', result: 'main_dancer' },
          { text: 'An original rap you wrote yourself.', result: 'rapper' },
        ],
      },
      {
        text: 'Your idol energy in one word:',
        options: [
          { text: 'Visual.', result: 'visual_main' },
          { text: 'Powerhouse.', result: 'main_vocal' },
          { text: 'Precision.', result: 'main_dancer' },
          { text: 'Swagger.', result: 'rapper' },
        ],
      },
    ],
    results: [
      { key: 'visual_main', emoji: '📸', title: 'The Visual', description: "Effortlessly photogenic, center of every group shot. You didn't ask to be this camera-ready, it just happens." },
      { key: 'main_vocal', emoji: '🎶', title: 'The Main Vocal', description: 'That high note is YOUR moment and everyone knows it. Powerhouse voice, zero autotune needed.' },
      { key: 'main_dancer', emoji: '💃', title: 'The Main Dancer', description: "Sharp, precise, and always perfectly on beat. The choreographer's favorite and the fan cams' main character." },
      { key: 'rapper', emoji: '🎤', title: 'The Rapper', description: 'Confidence, punchlines, and a verse people are still quoting. You bring the swagger the group needed.' },
    ],
  },
  {
    title: 'Which K-pop Comeback Era Are You?',
    slug: 'kpop-comeback-era',
    category: 'kpop',
    description: 'Bright, dark, retro, or soft — find your comeback concept.',
    emoji: '💿',
    gradient: 'from-purple-400 to-fuchsia-500',
    status: 'published',
    questions: [
      {
        text: 'Pick a comeback concept:',
        options: [
          { text: 'Bright, colorful, pure happy energy.', result: 'bright' },
          { text: 'Dark, moody, concept-video chaos.', result: 'dark' },
          { text: 'Retro throwback, Y2K sampling and all.', result: 'retro' },
          { text: 'Soft, emotional, ballad-coded.', result: 'soft' },
        ],
      },
      {
        text: 'Your ideal music video setting:',
        options: [
          { text: 'Neon set, candy colors, pure chaos energy.', result: 'bright' },
          { text: 'Abandoned warehouse, dramatic lighting, plot twist.', result: 'dark' },
          { text: 'A set that looks pulled straight from 2003.', result: 'retro' },
          { text: 'Rain against a window, very emotional.', result: 'soft' },
        ],
      },
      {
        text: 'Pick a title track vibe:',
        options: [
          { text: 'Upbeat and addictive, stuck in your head for weeks.', result: 'bright' },
          { text: 'Intense, cinematic, builds to a huge drop.', result: 'dark' },
          { text: 'Nostalgic synths, dance-able, throwback bassline.', result: 'retro' },
          { text: 'Piano-led, vocals-forward, quietly devastating.', result: 'soft' },
        ],
      },
      {
        text: 'Your fan-chant energy:',
        options: [
          { text: 'Screaming the chorus with the whole stadium.', result: 'bright' },
          { text: 'Silent until the drop, then losing it completely.', result: 'dark' },
          { text: 'Doing the retro choreo trend with everyone online.', result: 'retro' },
          { text: 'Crying quietly while filming for the fancam.', result: 'soft' },
        ],
      },
      {
        text: "Pick your era's outfit:",
        options: [
          { text: 'Rainbow colors, matching the concept perfectly.', result: 'bright' },
          { text: 'All black, dramatic silhouettes.', result: 'dark' },
          { text: 'Denim and platform shoes, straight out of Y2K.', result: 'retro' },
          { text: 'Soft pastels, flowing fabric.', result: 'soft' },
        ],
      },
    ],
    results: [
      { key: 'bright', emoji: '🌈', title: 'The Bright Comeback', description: "Pure sugar-rush energy — the kind of title track that's stuck in everyone's head within a single listen." },
      { key: 'dark', emoji: '🖤', title: 'The Dark Concept Era', description: 'Moody, cinematic, and a little unhinged in the best way. Your comeback trailer alone broke the internet.' },
      { key: 'retro', emoji: '📼', title: 'The Retro Throwback', description: 'Y2K synths, nostalgic sampling, and a choreo trend that took over every app simultaneously.' },
      { key: 'soft', emoji: '🌙', title: 'The Soft Ballad Era', description: 'Emotional, vocals-forward, and quietly the one that made everyone cry in the group chat.' },
    ],
  }
)

// --- Hindi versions of all 10 quizzes (natively written, not translated) ---
quizzes.push(
  {
    title: 'आपकी स्किनकेयर पर्सनैलिटी क्या है?',
    slug: 'skincare-type-hi',
    category: 'beauty',
    description: 'कुछ मजेदार सवाल और हम बता देंगे आपके चेहरे का पूरा मूड।',
    emoji: '🧴',
    gradient: 'from-pink-400 to-rose-400',
    language: 'hi',
    status: 'published',
    questions: [
      {
        text: 'दोपहर 2 बजे आपका चेहरा...',
        options: [
          { text: 'एकदम शीशे जैसा चमक रहा है, माथे से रोशनी टकरा रही है।', result: 'oily' },
          { text: 'रेगिस्तान डॉक्यूमेंट्री जैसा लग रहा है, मॉइस्चराइज़र भेजो।', result: 'dry' },
          { text: 'पहचान का संकट है — ऊपर से ऑयली, नीचे से ड्राई।', result: 'combination' },
          { text: 'अजीब तरह से ठीक है? शक तो होता है, पर चलेगा।', result: 'normal' },
        ],
      },
      {
        text: 'नया प्रोडक्ट लगाने पर क्या होता है?',
        options: [
          { text: 'तुरंत पिंपल्स, चेहरे ने साफ मना कर दिया।', result: 'oily' },
          { text: 'सोमवार की मोटिवेशन से भी तेज़ उड़ जाता है।', result: 'dry' },
          { text: 'पांच मिनट में चेहरा टमाटर बन जाता है।', result: 'sensitive' },
          { text: 'कुछ खास नहीं होता, थोड़ा बोरिंग सा है ईमानदारी से।', result: 'normal' },
        ],
      },
      {
        text: 'अपने पोर्स के बारे में बताएं:',
        options: [
          { text: 'स्पेस से भी दिखते हैं।', result: 'oily' },
          { text: 'पोर्स? मेरी तो स्मूद, टाइट, ड्राई स्किन है।', result: 'dry' },
          { text: 'टी-ज़ोन पर बड़े, बाकी जगह लापता।', result: 'combination' },
          { text: 'छोटे, साफ-सुथरे, अपने काम से काम रखते हैं।', result: 'normal' },
        ],
      },
      {
        text: 'गर्मी के दिन आपकी स्किन कैसे रिएक्ट करती है?',
        options: [
          { text: 'दोपहर तक ग्लेज़्ड डोनट बन जाती है।', result: 'oily' },
          { text: 'रात भर रखे क्रॉइसैंट जैसे परत दर परत उतरती है।', result: 'dry' },
          { text: 'टी-ज़ोन पूल पार्टी करता है, गाल ड्राई और बेफिक्र रहते हैं।', result: 'combination' },
          { text: 'बिल्कुल चैंपियन की तरह हैंडल करती है, कोई शिकायत नहीं।', result: 'normal' },
        ],
      },
      {
        text: 'स्किनकेयर की एक विश टिकल चुनें:',
        options: [
          { text: 'चेहरे को ऑयल रिग से मैट म्यूज़ियम बना दो।', result: 'oily' },
          { text: 'बस... हाइड्रेशन। इतना मांगना ज़्यादा है क्या?', result: 'dry' },
          { text: 'रेडनेस शांत हो जाए इससे पहले कि वो मूड बन जाए।', result: 'sensitive' },
          { text: 'पूरा चेहरा किसी एक स्किन टाइप पर सहमत हो जाए।', result: 'combination' },
        ],
      },
    ],
    results: [
      { key: 'oily', emoji: '✨', title: 'ह्यूमन डिस्को बॉल', description: 'आप चमकते हैं — सच में। दोपहर तक आपका चेहरा फ्लैशलाइट का काम कर सकता है। जेंटल फोमिंग क्लींज़र और ऑयल-फ्री मॉइस्चराइज़र अब आपके सबसे अच्छे दोस्त बनने वाले हैं। सनस्क्रीन अब भी ज़रूरी है।' },
      { key: 'dry', emoji: '🏜️', title: 'सहारा सिचुएशन', description: 'आपकी स्किन रेगिस्तान डॉक्यूमेंट्री जी रही है। सेरामाइड्स, हायलूरॉनिक एसिड और एक असली रिच मॉइस्चराइज़र अब आपकी पूरी पर्सनैलिटी बनने वाले हैं — अच्छे तरीके से।' },
      { key: 'combination', emoji: '🌗', title: 'दो चेहरों वाली स्किन', description: 'ऑयली टी-ज़ोन, शांत गाल — आपका चेहरा सच में डिसाइड नहीं कर पाता। मल्टी-मास्किंग सिर्फ एक तकनीक नहीं, आपके लिए तो डिप्लोमेसी है।' },
      { key: 'normal', emoji: '🌿', title: 'शक वाली परफेक्ट स्किन', description: 'बैलेंस्ड, कम ड्रामा, मेन-कैरेक्टर एनर्जी। ईमानदारी से थोड़ा इर्रिटेटिंग है कि आपको कितना आसान मिला है — बस जेंटल बेसिक्स और सनस्क्रीन जारी रखें, जिंक्स मत करना।' },
      { key: 'sensitive', emoji: '🍅', title: 'ह्यूमन मूड रिंग', description: 'आपकी स्किन हर छोटी बात पर रिएक्ट करती है — नया तकिया कवर, मसालेदार खाना, मामूली परेशानी। फ्रेगरेंस-फ्री, मिनिमल-इनग्रेडिएंट प्रोडक्ट्स ही आपके चेहरे की शांति संधि हैं।' },
    ],
  },
  {
    title: 'आप कौन से बॉलीवुड एरा से हैं?',
    slug: 'bollywood-era-hi',
    category: 'entertainment',
    description: 'आपका ड्रामा, गाने और अजीब फाइट सीन्स का टेस्ट बताएगा आपका एरा।',
    emoji: '🎬',
    gradient: 'from-amber-400 to-orange-500',
    language: 'hi',
    status: 'published',
    questions: [
      {
        text: 'एक ब्रेकअप सीन चुनें:',
        options: [
          { text: 'स्टेशन पर बारिश में बहुत ड्रामाई तरीके से दौड़ना।', result: 'golden' },
          { text: 'सरसों के खेत में अकेले डांस करते हुए भूल जाना।', result: 'ninties' },
          { text: 'पूरा फ्रेंड ग्रुप 3 देशों से इंटरवेंशन के लिए आ जाता है।', result: 'y2k' },
          { text: 'एक बढ़िया लिखा हुआ मैसेज भेजकर आगे बढ़ जाना।', result: 'modern' },
        ],
      },
      {
        text: 'आपकी आइडियल हीरो एंट्री:',
        options: [
          { text: 'स्लो-मोशन वॉक, कबूतर भी ड्रामाई तरीके से उड़ते हैं।', result: 'golden' },
          { text: 'साइकिल से कूदना, बाल फिर भी परफेक्ट।', result: 'ninties' },
          { text: 'हेलीकॉप्टर सीधा शादी में लैंड करता है।', result: 'y2k' },
          { text: 'बस... आ जाता है। लेट से। फिर भी दिल जीत लेता है।', result: 'modern' },
        ],
      },
      {
        text: 'एक फाइट सीन चुनें:',
        options: [
          { text: 'एक घूंसे से बारह गुंडे उड़ जाते हैं।', result: 'golden' },
          { text: 'शादी में गलतफहमी से फाइट शुरू हो जाती है।', result: 'ninties' },
          { text: 'पूरी फाइट लव सॉन्ग रीमिक्स पर कोरियोग्राफ्ड है।', result: 'y2k' },
          { text: 'पूरी बहस पैसिव-अग्रेसिव टेक्स्ट में होती है।', result: 'modern' },
        ],
      },
      {
        text: 'आपका ड्रीम साउंडट्रैक:',
        options: [
          { text: 'इतनी दर्द भरी ग़ज़ल कि बाहर की बारिश भी उदास हो जाए।', result: 'golden' },
          { text: 'स्विस आल्प्स में ड्युएट, बिना किसी वजह के।', result: 'ninties' },
          { text: 'वो क्लब बैंगर जो आज भी हर शादी में बजता है।', result: 'y2k' },
          { text: 'डूम-स्क्रोलिंग मोंटाज पर मूडी इंडी ट्रैक।', result: 'modern' },
        ],
      },
      {
        text: 'आपकी लव स्टोरी का परफेक्ट अंत:',
        options: [
          { text: 'ट्रैजिक और शायराना — विलेन भी रो रहा है।', result: 'golden' },
          { text: 'बड़े पेड़ के नीचे पूरे परिवार का आशीर्वाद।', result: 'ninties' },
          { text: 'करोड़ों की शादी, कम से कम तीन ड्रेस चेंज।', result: 'y2k' },
          { text: 'शांत कॉफी, खुला अंत, सीक्वल के चांस बाकी।', result: 'modern' },
        ],
      },
    ],
    results: [
      { key: 'golden', emoji: '🎞️', title: 'गोल्डन इमोशनल क्लासिक', description: 'आप ब्लैक-एंड-व्हाइट ट्रेजेडी और शायरी के मिक्स हैं। कहीं ना कहीं, कोई वायलिन बज उठता है जब आप खिड़की के पास से गुज़रते हैं।' },
      { key: 'ninties', emoji: '🌼', title: 'सरसों के खेत वाला रोमांस', description: 'प्यारे, सीधे-सादे, और किसी भी गलतफहमी को एक सीन से ज़्यादा नहीं टिकने देते। आप बिना किसी वजह के विदेश में गाना गा सकते हैं।' },
      { key: 'y2k', emoji: '💃', title: 'करोड़ों का मसाला आइकॉन', description: 'लाउड, चमकदार, और पूरी तरह एक्स्ट्रा — आपकी लव स्टोरी को हेलीकॉप्टर, फुल डांस नंबर और कम से कम एक ड्रामाई स्लो क्लैप चाहिए।' },
      { key: 'modern', emoji: '🎥', title: 'मॉडर्न रियलिस्ट', description: 'रियल, थोड़े अस्त-व्यस्त, और बहुत साफ-सुथरे अंत से एलर्जी। आपकी लव स्टोरी किसी रिव्यू जैसी लगती है।' },
    ],
  },
  {
    title: 'आपका एस्थेटिक क्या है?',
    slug: 'aesthetic-hi',
    category: 'lifestyle',
    description: 'कॉटेजकोर? डार्क अकादमिया? Y2K? आपकी स्नैक चॉइस बताएगी।',
    emoji: '🌈',
    gradient: 'from-violet-400 to-indigo-500',
    language: 'hi',
    status: 'published',
    questions: [
      {
        text: 'आपका ड्रीम शनिवार:',
        options: [
          { text: 'बिना ज़रूरत के ब्रेड बनाना।', result: 'cottagecore' },
          { text: '700 पन्नों की किताब पढ़ना जो कभी खत्म नहीं होगी।', result: 'academia' },
          { text: 'थ्रिफ्ट शॉपिंग और एक गाना जो हफ्ते भर दिमाग में बजता रहे।', result: 'y2k' },
          { text: 'कुछ भी न करना और उस पर बहुत गर्व महसूस करना।', result: 'minimalist' },
        ],
      },
      {
        text: 'एक होम डेकोर क्राइसिस चुनें:',
        options: [
          { text: 'मेरे पास फर्नीचर से ज़्यादा सूखे फूल हैं।', result: 'cottagecore' },
          { text: 'मेरी किताबों की शेल्फ अब खतरे की निशानी बन गई है।', result: 'academia' },
          { text: 'मेरा कमरा स्ट्रिंग लाइट्स से अंधेरे में चमकता है।', result: 'y2k' },
          { text: 'मेरे पास एक कुर्सी है। बहुत अच्छी है। बस यही पूरा कमरा है।', result: 'minimalist' },
        ],
      },
      {
        text: 'आपकी इमोशनल सपोर्ट चीज़:',
        options: [
          { text: 'एक कार्डिगन जिसने बहुत कुछ देखा है।', result: 'cottagecore' },
          { text: 'कॉफी के दाग वाली एक नोटबुक, आधे-अधूरे विचारों से भरी।', result: 'academia' },
          { text: 'बटरफ्लाई क्लिप्स। सारी। एक साथ।', result: 'y2k' },
          { text: "एक कैंडल जो मैं कभी नहीं जलाऊंगा क्योंकि 'वाइब खराब हो जाएगी'।", result: 'minimalist' },
        ],
      },
      {
        text: 'अपनी ज़िंदगी के लिए एक साउंडट्रैक चुनें:',
        options: [
          { text: 'फोक म्यूज़िक और ब्रेड फूलने की आवाज़।', result: 'cottagecore' },
          { text: 'उदास पियानो जो ग्रॉसरी शॉपिंग को भी सिनेमाई बना दे।', result: 'academia' },
          { text: "'गिल्टी प्लेज़र 2003' नाम की किसी प्लेलिस्ट से कुछ भी।", result: 'y2k' },
          { text: 'खामोशी। खूबसूरत, जानबूझकर की गई खामोशी।', result: 'minimalist' },
        ],
      },
      {
        text: 'बिखरे सामान पर आपकी ईमानदार प्रतिक्रिया:',
        options: [
          { text: 'ज़्यादा हमेशा बेहतर है। एक और सूखा फूल जोड़ दो।', result: 'cottagecore' },
          { text: "ये बिखराव नहीं है, ये 'क्यूरेटेड कैओस' है।", result: 'academia' },
          { text: "बिखराव? मैं इसे 'वाइब्स' कहता हूं।", result: 'y2k' },
          { text: 'जब तक साफ नहीं होता, चैन नहीं मिलता।', result: 'minimalist' },
        ],
      },
    ],
    results: [
      { key: 'cottagecore', emoji: '🌾', title: 'सर्टिफाइड ब्रेड-बेकिंग सॉफ्टी', description: 'आप धीमी सुबहों, बगीचे की मिट्टी और फ्लोई ड्रेस में मेन-कैरेक्टर एनर्जी बिखेरते हैं। इमोशनली, आप एक गरम घर के बने ब्रेड जैसे हैं।' },
      { key: 'academia', emoji: '📚', title: 'ड्रामाई लाइब्रेरी वाला', description: 'मूडी, किताबी, और एक कैंडललाइट डिनर दूर एक सीक्रेट सोसाइटी शुरू करने से। आपको कार्डिगन और एग्ज़िस्टेंशियल क्राइसिस दोनों पसंद हैं।' },
      { key: 'y2k', emoji: '💿', title: 'ग्लिटर टाइम ट्रैवलर', description: 'लाउड, नॉस्टैल्जिक, और बेफिक्र — आप 2000s का कैओस वापस लाए और सच कहें तो ज़रूरत थी। बटरफ्लाई क्लिप्स एक पर्सनैलिटी ट्रेट? आइकॉनिक।' },
      { key: 'minimalist', emoji: '⚪', title: 'बाकी सबके कैओस में शांति', description: 'एक कुर्सी, ज़ीरो बिखराव, मैक्सिमम सुकून। आप पचास चीज़ों की टेंशन लेने से बेहतर पांच पसंदीदा चीज़ें रखना चुनेंगे।' },
    ],
  },
  {
    title: 'आपकी टालमटोल स्टाइल क्या है?',
    slug: 'procrastination-style-hi',
    category: 'lifestyle',
    description: 'कल सबमिशन है। आप उसकी जगह क्या कर रहे हैं?',
    emoji: '⏰',
    gradient: 'from-emerald-400 to-teal-500',
    language: 'hi',
    status: 'published',
    questions: [
      {
        text: 'आधी रात है और सुबह डेडलाइन है। आप:',
        options: [
          { text: 'महीनों बाद पहली बार पूरा कमरा साफ कर रहे हैं।', result: 'cleaner' },
          { text: "'बस एक और एपिसोड' देख रहे हैं। चार हो चुके हैं।", result: 'binge' },
          { text: 'टू-डू लिस्ट दोबारा बना रहे हैं, उसमें कुछ किए बिना।', result: 'planner' },
          { text: 'असल में काम शुरू कर रहे हैं। पैनिक बढ़िया मोटिवेशन है।', result: 'lastminute' },
        ],
      },
      {
        text: 'आपके ब्राउज़र में अभी:',
        options: [
          { text: '47 टैब्स हैं, जिनमें से कोई भी असली काम का नहीं।', result: 'binge' },
          { text: 'एक बहुत डिटेल्ड स्प्रेडशीट है जिसकी ज़रूरत नहीं थी।', result: 'planner' },
          { text: 'सफाई के सामान के टैब्स हैं। रात 1 बजे पोंछा खरीद रहे हैं।', result: 'cleaner' },
          { text: 'असली काम है। आखिरकार। बस मुश्किल से।', result: 'lastminute' },
        ],
      },
      {
        text: 'दोस्त पूछता है क्या प्रोजेक्ट शुरू किया। आप कहते हैं:',
        options: [
          { text: 'लगभग खत्म! (शुरू ही नहीं किया।)', result: 'lastminute' },
          { text: 'मैंने एक प्लान के लिए प्लान बनाया है।', result: 'planner' },
          { text: 'इसकी जगह डेस्क साफ किया, क्या वो गिनती में आता है?', result: 'cleaner' },
          { text: 'बात नहीं कर सकता, बीच में हूं।', result: 'binge' },
        ],
      },
      {
        text: 'आपका आइडियल प्रोडक्टिविटी हैक:',
        options: [
          { text: 'कोई साथ बैठे जो बस मुझे काम न करते देखे।', result: 'binge' },
          { text: 'पंद्रह कलर-कोडेड स्टिकी नोट्स जिन्हें मैं फिर कभी नहीं देखूंगा।', result: 'planner' },
          { text: 'बिल्कुल साफ डेस्क। किसी वजह से हमेशा यही पहला स्टेप होता है।', result: 'cleaner' },
          { text: 'एड्रेनलिन। सीधा एड्रेनलिन।', result: 'lastminute' },
        ],
      },
      {
        text: 'जब आखिरकार डेडलाइन आती है:',
        options: [
          { text: 'पता चलता है पैनिक सच में एक सुपरपावर है।', result: 'lastminute' },
          { text: 'आप अजीब तरह से शांत हैं क्योंकि इसी कैओस की तैयारी की थी।', result: 'planner' },
          { text: 'आप बहुत साफ कमरे से सबमिट करते हैं।', result: 'cleaner' },
          { text: 'आप फाइनाले से बाहर आते हैं, आंखें झपकाते हुए, काम पर लगते हैं।', result: 'binge' },
        ],
      },
    ],
    results: [
      { key: 'lastminute', emoji: '🔥', title: 'एड्रेनलिन जंकी', description: 'आप टालमटोल नहीं करते, आप बस एक खास फ्यूल पर चलते हैं: शुद्ध पैनिक। किसी तरह हमेशा हो जाता है। किसी तरह।' },
      { key: 'planner', emoji: '📋', title: 'नकली प्लानर', description: 'आपने काम करने का एक खूबसूरत, डिटेल्ड प्लान बनाया है। प्लान खुद ही टालमटोल बन गया है। बहुत इम्प्रेसिव है। पर काम नहीं है।' },
      { key: 'cleaner', emoji: '🧹', title: 'शक वाला सफाई कर्मी', description: 'डेडलाइन के करीब आते ही बाथरूम साफ करने का मन करता है। घर कभी इतना अच्छा नहीं दिखा, इनबॉक्स कभी इतना खराब नहीं दिखा।' },
      { key: 'binge', emoji: '📺', title: 'एपिसोड होस्टेज', description: "आपने 'एक और एपिसोड' छह एपिसोड पहले कहा था। डेडलाइन अब एक धुंधली याद है। एपिसोड 1 की कहानी भी।" },
    ],
  },
  {
    title: 'आपका चाय/कॉफी ऑर्डर क्या कहता है?',
    slug: 'chai-coffee-order-hi',
    category: 'lifestyle',
    description: 'आप सुबह की चाय/कॉफी कैसे लेते हैं, यह बहुत कुछ बताता है।',
    emoji: '☕',
    gradient: 'from-sky-400 to-blue-500',
    language: 'hi',
    status: 'published',
    questions: [
      {
        text: 'आप अपनी सुबह की ड्रिंक कैसे लेते हैं?',
        options: [
          { text: 'एकदम कड़क, एकदम मीठी, कोई बहस नहीं।', result: 'strong' },
          { text: 'जो भी सबसे तेज़ मिले, पहले से लेट हूं।', result: 'instant' },
          { text: 'तीन बदलावों वाला एक पूरा ऑर्डर।', result: 'extra' },
          { text: 'बिना दूध, बिना चीनी, बिना झंझट।', result: 'simple' },
        ],
      },
      {
        text: 'पहले घूंट से पहले आपकी एनर्जी:',
        options: [
          { text: 'किसी क्राइम सीन डॉक्यूमेंट्री जैसी, बस शांत नैरेटर नहीं।', result: 'strong' },
          { text: 'काम चल रहा है। मुश्किल से। आंख मत मिलाना।', result: 'instant' },
          { text: 'उत्साहित — यह ड्रिंक मेरी पूरी पर्सनैलिटी है।', result: 'extra' },
          { text: 'ठीक हूं। मुझे इसकी ज़रूरत नहीं, बस चाहिए।', result: 'simple' },
        ],
      },
      {
        text: 'कैफे में ऑर्डर करने का तरीका चुनें:',
        options: [
          { text: 'डबल शॉट, बिना पानी, सीधा नस में।', result: 'strong' },
          { text: 'काउंटर पर जो भी हो, वही ले लूंगा।', result: 'instant' },
          { text: 'ओट मिल्क, एक्स्ट्रा फोम, एक पंप, सब सेट किया हुआ।', result: 'extra' },
          { text: 'हाउस ब्लेंड। कोई बदलाव नहीं। पूरे सम्मान से।', result: 'simple' },
        ],
      },
      {
        text: 'जब ऑर्डर गलत आता है, आपकी प्रतिक्रिया:',
        options: [
          { text: 'यह तो कमज़ोर है। बस स्वाद वाला पानी है।', result: 'strong' },
          { text: 'फर्क नहीं पड़ता, कैफीन चाहिए था, एक्सपीरियंस नहीं।', result: 'instant' },
          { text: 'असली संकट। पूरा दिन का मूड बदल गया।', result: 'extra' },
          { text: 'हल्की निराशा, चुपचाप दिल में दबा ली।', result: 'simple' },
        ],
      },
      {
        text: 'आपका आइडियल चाय/कॉफी पल:',
        options: [
          { text: 'इतनी कड़क कि पड़ोसी जाग जाएं।', result: 'strong' },
          { text: 'जो भी तेज़ी से अंदर पहुंच जाए।', result: 'instant' },
          { text: 'एक पूरी रस्म, हो सके तो फोटो के साथ।', result: 'extra' },
          { text: 'शांत, सादा, कोई ड्रामा नहीं, बस ड्रिंक।', result: 'simple' },
        ],
      },
    ],
    results: [
      { key: 'strong', emoji: '💪', title: 'डबल-शॉट डाइहार्ड', description: 'आप चाय-कॉफी नहीं, जेट फ्यूल पीते हैं। हल्कापन कभी आपकी चॉइस नहीं रहा। नींद भी नहीं, लगता है।' },
      { key: 'instant', emoji: '⚡', title: 'बस-अंदर-डालो टाइप', description: 'आपको रस्म से मतलब नहीं, काम से मतलब है। ड्रिंक सिर्फ डिलीवरी सिस्टम है, और आप हमेशा, हमेशा लेट हैं।' },
      { key: 'extra', emoji: '✨', title: 'फुल रिचुअल मेन कैरेक्टर', description: 'आपके ऑर्डर में किसी कॉन्ट्रैक्ट से ज़्यादा शर्तें हैं, और ईमानदारी से, इसकी फोटो खिंचनी चाहिए। यह सिर्फ ड्रिंक नहीं, पूरा सीन है।' },
      { key: 'simple', emoji: '⚫', title: 'नो-फस प्योरिस्ट', description: 'कोई सिरप नहीं, चीनी नहीं, 17 शब्दों का ऑर्डर नहीं। आपको पता है क्या पसंद है, और किसी की राय नहीं चाहिए।' },
    ],
  },
  {
    title: 'आपका कोरियन ब्यूटी स्टैंडर्ड टाइप क्या है?',
    slug: 'korean-beauty-standard-hi',
    category: 'beauty',
    description: 'KBS, ग्लास स्किन और बीच का सब कुछ — अपना टाइप ढूंढें।',
    emoji: '🌸',
    gradient: 'from-red-400 to-orange-400',
    language: 'hi',
    status: 'published',
    questions: [
      {
        text: 'आपकी स्किनकेयर रूटीन में कितने स्टेप्स हैं?',
        options: [
          { text: 'बस बेसिक्स — क्लींज़, मॉइस्चराइज़, खत्म।', result: 'minimal' },
          { text: '10 स्टेप्स, कम से कम। हर एक दिन।', result: 'glass_skin' },
          { text: 'जो भी इस हफ्ते मेरी FYP पर ट्रेंड कर रहा है।', result: 'trend' },
          { text: 'SPF और वाइब्स, ईमानदारी से।', result: 'minimal' },
        ],
      },
      {
        text: 'एक मेकअप लुक चुनें:',
        options: [
          { text: "बेयर 'ग्लास स्किन' ग्लो, ड्यूई और चमकदार।", result: 'glass_skin' },
          { text: 'सॉफ्ट ग्रेडिएंट लिप्स और पपी आईलाइनर।', result: 'aegyo' },
          { text: 'बोल्ड, एडिटोरियल, जो भी अभी वायरल है।', result: 'trend' },
          { text: 'कोई मेकअप नहीं, बस बहुत अच्छी स्किनकेयर।', result: 'minimal' },
        ],
      },
      {
        text: 'आपका आइडियल हेयर लुक:',
        options: [
          { text: 'एकदम स्ट्रेट, शीशे जैसी चमक।', result: 'glass_skin' },
          { text: 'सॉफ्ट वेव्स के साथ क्यूट बैंग्स।', result: 'aegyo' },
          { text: 'जो भी रंग आइडल्स इस कमबैक सीज़न में लगा रहे हैं।', result: 'trend' },
          { text: 'कम मेंटेनेंस, नेचुरल टेक्सचर।', result: 'minimal' },
        ],
      },
      {
        text: 'एक ब्यूटी प्रोडक्ट चुनें जो आप जमा करेंगे:',
        options: [
          { text: 'एसेंस और सीरम, परतों में।', result: 'glass_skin' },
          { text: 'सबसे प्यारे शेड में टिंटेड लिप बाम।', result: 'aegyo' },
          { text: 'जो भी लेटेस्ट आइडल-एंडोर्स्ड ब्रांड लॉन्च करे।', result: 'trend' },
          { text: 'एक बहुत अच्छा सनस्क्रीन। बस यही।', result: 'minimal' },
        ],
      },
      {
        text: 'आपकी ब्यूटी फिलॉसफी:',
        options: [
          { text: 'इतना ग्लो कि लोग सोचें लाइटिंग है, स्किनकेयर नहीं।', result: 'glass_skin' },
          { text: 'क्यूटनेस हर चीज़ से ऊपर, हमेशा।', result: 'aegyo' },
          { text: 'अगर ट्रेंडिंग है, तो मैं ट्राई कर रहा हूं।', result: 'trend' },
          { text: 'कम ही ज़्यादा है, हमेशा से।', result: 'minimal' },
        ],
      },
    ],
    results: [
      { key: 'glass_skin', emoji: '✨', title: 'ग्लास स्किन परफेक्शनिस्ट', description: "ड्यूई, चमकदार, और इतनी रिफ्लेक्टिव कि उसमें नोटिफिकेशन चेक हो जाए। आपकी 10-स्टेप रूटीन ओवरकिल नहीं, लाइफस्टाइल है।" },
      { key: 'aegyo', emoji: '🎀', title: 'एग्यो क्यूटी', description: "सॉफ्ट ग्रेडिएंट लिप्स, पपी आईलाइनर, और एक एस्थेटिक जो हमेशा 'क्यूट ओवरलोड' वॉर्निंग जैसी है।" },
      { key: 'trend', emoji: '📱', title: 'ट्रेंड चेज़र', description: 'जो भी इस कमबैक सीज़न वायरल है वो पहले से आपकी रूटीन में है। आपकी FYP ही आपका पूरा ब्यूटी कैबिनेट चलाती है।' },
      { key: 'minimal', emoji: '🧴', title: 'मिनिमलिस्ट ग्लो', description: 'SPF, मॉइस्चराइज़र, और 10-स्टेप रूटीन के लिए ज़ीरो सब्र। आपकी स्किन बढ़िया दिखती है और शेल्फ खाली रहती है।' },
    ],
  },
  {
    title: 'आप कौन सी स्क्विशी हैं?',
    slug: 'squishy-personality-hi',
    category: 'fun',
    description: 'स्लो-राइज़, बाउंसी, या खुशबूदार — आपका स्क्विशी कलेक्शन बहुत कुछ कहता है।',
    emoji: '🧸',
    gradient: 'from-fuchsia-400 to-pink-500',
    language: 'hi',
    status: 'published',
    questions: [
      {
        text: 'अपनी स्क्विश स्पीड चुनें:',
        options: [
          { text: 'स्लो-राइज़, ड्रामाई, मुझे टाइम लगता है।', result: 'slow_rise' },
          { text: 'बाउंसी और तेज़, एक झटके में वापस शेप में।', result: 'bouncy' },
          { text: 'एक्स्ट्रा सॉफ्ट, शेप बमुश्किल टिकती है।', result: 'super_soft' },
          { text: 'खुशबूदार और स्क्विशी, पूरा सेंसरी एक्सपीरियंस।', result: 'scented' },
        ],
      },
      {
        text: 'आपकी पसंदीदा स्क्विशी शेप:',
        options: [
          { text: 'कोई प्यारी फूड आइटम, ब्रेड या बन।', result: 'slow_rise' },
          { text: 'एक जानवर जिसका बड़ा सा भोला चेहरा हो।', result: 'bouncy' },
          { text: 'कुछ गोल और बादल जैसा सॉफ्ट।', result: 'super_soft' },
          { text: 'जो भी स्ट्रॉबेरी जैसी खुशबू दे।', result: 'scented' },
        ],
      },
      {
        text: 'आप अपना स्क्विशी कलेक्शन कैसे रखते हैं?',
        options: [
          { text: 'बिल्कुल लाइन में, सबसे बड़े से सबसे छोटे तक।', result: 'slow_rise' },
          { text: 'हमेशा दबाई जाती हैं, कभी आराम नहीं मिलता।', result: 'bouncy' },
          { text: 'एक बड़े सॉफ्ट ढेर में, सब मिक्स।', result: 'super_soft' },
          { text: 'डेस्क के पास ताकि काम करते हुए सूंघ सकूं।', result: 'scented' },
        ],
      },
      {
        text: 'एक स्क्विशी एक्टिविटी चुनें:',
        options: [
          { text: 'धीरे-धीरे वापस उठते देखना, बहुत ज़ेन।', result: 'slow_rise' },
          { text: 'हर एक को बार-बार दबाकर टेस्ट करना।', result: 'bouncy' },
          { text: 'बस पकड़े रहना। यह एक स्ट्रेस पिलो जैसा है।', result: 'super_soft' },
          { text: 'कुछ भी करने से पहले उसे सूंघना।', result: 'scented' },
        ],
      },
      {
        text: 'आपकी स्क्विशी कलेक्ट करने की फिलॉसफी:',
        options: [
          { text: 'क्वालिटी, क्वांटिटी से ज़्यादा, हर एक खास है।', result: 'slow_rise' },
          { text: 'जितनी बाउंसी, उतनी बेहतर।', result: 'bouncy' },
          { text: 'सॉफ्टनेस ही एकमात्र चीज़ है जो मायने रखती है।', result: 'super_soft' },
          { text: 'अगर खुशबू अच्छी है, तो घर आ रही है।', result: 'scented' },
        ],
      },
    ],
    results: [
      { key: 'slow_rise', emoji: '🍞', title: 'ज़ेन स्लो-राइज़र', description: 'धैर्यवान, शांत, और थोड़े ड्रामाई। स्क्विशी को धीरे-धीरे फूलते देखना आपके लिए मेडिटेशन जैसा है।' },
      { key: 'bouncy', emoji: '🐰', title: 'बाउंस-बैक किड', description: 'तेज़, मज़बूत, और टेस्ट करना बंद नहीं कर सकते। आप हर चीज़ से वापस उछल आते हैं, स्क्विशी समेत।' },
      { key: 'super_soft', emoji: '☁️', title: 'क्लाउड सॉफ्टी', description: 'सॉफ्टनेस अब एक पर्सनैलिटी ट्रेट बन चुकी है। आपकी स्क्विशी की शेप नहीं टिकती, ना ही आपके संडे प्लान्स।' },
      { key: 'scented', emoji: '🍓', title: 'स्निफ-टेस्टर', description: 'खुशबू पहले, शेप बाद में। आपका कलेक्शन एक बहुत सॉफ्ट परफ्यूम काउंटर जैसा भी है।' },
    ],
  },
  {
    title: 'आपकी ब्लाइंड बैग एनर्जी क्या है?',
    slug: 'blind-bag-energy-hi',
    category: 'fun',
    description: 'रिपर, गेसर, या सेवरर — आप मिस्ट्री को कैसे हैंडल करते हैं?',
    emoji: '🎁',
    gradient: 'from-lime-400 to-green-500',
    language: 'hi',
    status: 'published',
    questions: [
      {
        text: 'आपने अभी एक ब्लाइंड बैग खरीदा। पहला कदम:',
        options: [
          { text: 'हल्के से हिलाकर अंदाज़ा लगाना कि अंदर क्या है।', result: 'guesser' },
          { text: 'तुरंत फाड़ देना, मिस्ट्री के लिए सब्र नहीं।', result: 'ripper' },
          { text: "पहले ऑनलाइन चेक करना 'कैसे पता करें कौन सा है' हैक्स।", result: 'researcher' },
          { text: 'धीरे-धीरे खोलना, हर सेकंड एन्जॉय करते हुए।', result: 'savorer' },
        ],
      },
      {
        text: 'आपको वही डुप्लीकेट मिलता है जो पहले से है। रिएक्शन:',
        options: [
          { text: 'हल्की निराशा, ट्रेड पाइल में डाल दो।', result: 'researcher' },
          { text: 'तुरंत संकट, अब सब कुछ बदल गया।', result: 'ripper' },
          { text: 'असल में खुश, अब दो हैं।', result: 'savorer' },
          { text: 'अगले वाले के लिए पहले से चांस कैलकुलेट कर रहा हूं।', result: 'guesser' },
        ],
      },
      {
        text: 'आपकी ब्लाइंड बैग कलेक्शन स्ट्रैटेजी:',
        options: [
          { text: 'एक बार में एक खरीदना, पूरी सीरीज़ एन्जॉय करना।', result: 'savorer' },
          { text: 'पूरा बॉक्स खरीदना, चांस मैक्सिमाइज़ करना।', result: 'researcher' },
          { text: 'काउंटर पर दिखते ही इम्पल्स में खरीद लेना।', result: 'ripper' },
          { text: 'वज़न और हिलाने के पैटर्न को डिटेक्टिव की तरह स्टडी करना।', result: 'guesser' },
        ],
      },
      {
        text: "'रेयर' वाले पर रिएक्शन चुनें:",
        options: [
          { text: 'मैंने कहा था! मेरा अंदाज़ा सही था!', result: 'guesser' },
          { text: 'चिल्लाना। तुरंत सबको बताना।', result: 'ripper' },
          { text: 'चुपचाप खुश, पैकेजिंग में ही निहारते हुए।', result: 'savorer' },
          { text: 'पहले से इसकी रीसेल वैल्यू चेक कर रहा हूं।', result: 'researcher' },
        ],
      },
      {
        text: 'आपकी आइडियल ब्लाइंड बैग खरीदारी:',
        options: [
          { text: 'एक बार में एक, इंतज़ार का मज़ा लेते हुए।', result: 'savorer' },
          { text: 'पूरा केस, कोई अंदाज़ा लगाने की ज़रूरत नहीं।', result: 'researcher' },
          { text: 'काउंटर के सबसे पास वाला, इम्पल्स मोड ऑन।', result: 'ripper' },
          { text: 'जो मैंने शेप के क्लूज़ से पहले ही अंदाज़ा लगा लिया।', result: 'guesser' },
        ],
      },
    ],
    results: [
      { key: 'guesser', emoji: '🔍', title: 'शेक-एंड-गेस डिटेक्टिव', description: 'आपके पास ब्लाइंड बैग फोरेंसिक्स की पीएचडी जैसी है। वज़न, शेप, आवाज़ — कुछ भी आपकी डिटेक्टिव नज़र से नहीं बचता।' },
      { key: 'ripper', emoji: '💥', title: 'ज़ीरो-पेशेंस रिपर', description: 'मिस्ट्री थ्योरी में क्यूट है, पर आपको अभी जानना है। पैकेजिंग के पास कोई चांस नहीं था।' },
      { key: 'researcher', emoji: '📊', title: 'ऑड्स कैलकुलेटर', description: "आप स्ट्रैटेजी से खरीदते हैं, स्मार्ट ट्रेड करते हैं, और हमेशा पहले से जानते हैं कौन सा 'रेयर' है।" },
      { key: 'savorer', emoji: '🎀', title: 'एंटिसिपेशन सेवरर', description: 'सस्पेंस ही सबसे अच्छा हिस्सा है। आप जल्दी रिवील की जगह थोड़ी देर और मिस्ट्री एन्जॉय करना पसंद करेंगे।' },
    ],
  },
  {
    title: 'आप कौन सी K-pop आइडल पोज़िशन हैं?',
    slug: 'kpop-idol-position-hi',
    category: 'kpop',
    description: 'विज़ुअल, मेन वोकल, मेन डांसर, या रैपर — अपना आइडल रोल ढूंढें।',
    emoji: '🎤',
    gradient: 'from-cyan-400 to-sky-500',
    language: 'hi',
    status: 'published',
    questions: [
      {
        text: 'ग्रुप प्रैक्टिस में आप आमतौर पर:',
        options: [
          { text: 'सबसे आगे, सबकी नज़रें मुझ पर।', result: 'visual_main' },
          { text: 'वो हाई नोट लगा रहे हैं जो सब याद रखते हैं।', result: 'main_vocal' },
          { text: 'कोरियो का सबसे शार्प मूव कर रहे हैं।', result: 'main_dancer' },
          { text: 'एक वर्स फ्रीस्टाइल कर रहे हैं जो किसी ने नहीं मांगा पर सबको पसंद है।', result: 'rapper' },
        ],
      },
      {
        text: 'आपके दोस्त आपको कैसे बताएंगे:',
        options: [
          { text: 'फोटोजेनिक वाला, कैमरा मुझे पसंद करता है।', result: 'visual_main' },
          { text: 'जो असल में गा सकता है, ऑटोट्यून की ज़रूरत नहीं।', result: 'main_vocal' },
          { text: 'जिसे हर डांस स्टेप परफेक्टली याद है।', result: 'main_dancer' },
          { text: 'जिसके पास पूरा कॉन्फिडेंस और पंचलाइन्स हैं।', result: 'rapper' },
        ],
      },
      {
        text: 'एक स्टेज मोमेंट चुनें:',
        options: [
          { text: 'ब्रिज के दौरान वो ड्रामाई सेंटर पोज़।', result: 'visual_main' },
          { text: 'वो जानलेवा हाई नोट जिससे पूरी भीड़ चिल्ला उठे।', result: 'main_vocal' },
          { text: 'वो इंटेंस डांस ब्रेक, शार्प और प्रिसाइज़।', result: 'main_dancer' },
          { text: 'वो रैप वर्स जो साउंड क्लिप बनकर वायरल हो जाए।', result: 'rapper' },
        ],
      },
      {
        text: 'आपका टैलेंट शो मूव क्या होगा:',
        options: [
          { text: 'बस खड़े रहना और बेफिक्री से अच्छा दिखना।', result: 'visual_main' },
          { text: 'एक वोकल रन जो सबको खामोश कर दे।', result: 'main_vocal' },
          { text: 'एक पूरी कोरियोग्राफ्ड रूटीन, कोई गलती नहीं।', result: 'main_dancer' },
          { text: 'एक ओरिजिनल रैप जो आपने खुद लिखा।', result: 'rapper' },
        ],
      },
      {
        text: 'एक शब्द में आपकी आइडल एनर्जी:',
        options: [
          { text: 'विज़ुअल।', result: 'visual_main' },
          { text: 'पावरहाउस।', result: 'main_vocal' },
          { text: 'प्रिसीज़न।', result: 'main_dancer' },
          { text: 'स्वैगर।', result: 'rapper' },
        ],
      },
    ],
    results: [
      { key: 'visual_main', emoji: '📸', title: 'द विज़ुअल', description: 'बेफिक्री से फोटोजेनिक, हर ग्रुप शॉट के सेंटर में। आपने यह मांगा नहीं, बस ऐसे ही हो जाता है।' },
      { key: 'main_vocal', emoji: '🎶', title: 'मेन वोकल', description: 'वो हाई नोट आपका पल है और सबको पता है। पावरहाउस आवाज़, ऑटोट्यून की ज़रूरत नहीं।' },
      { key: 'main_dancer', emoji: '💃', title: 'मेन डांसर', description: "शार्प, प्रिसाइज़, और हमेशा बीट पर परफेक्ट। कोरियोग्राफर का पसंदीदा और फैन कैम्स का मेन कैरेक्टर।" },
      { key: 'rapper', emoji: '🎤', title: 'द रैपर', description: 'कॉन्फिडेंस, पंचलाइन्स, और एक वर्स जिसे लोग अब भी कोट करते हैं। आप वो स्वैगर लाए जो ग्रुप को चाहिए था।' },
    ],
  },
  {
    title: 'आप कौन सा K-pop कमबैक एरा हैं?',
    slug: 'kpop-comeback-era-hi',
    category: 'kpop',
    description: 'ब्राइट, डार्क, रेट्रो, या सॉफ्ट — अपना कमबैक कॉन्सेप्ट ढूंढें।',
    emoji: '💿',
    gradient: 'from-purple-400 to-fuchsia-500',
    language: 'hi',
    status: 'published',
    questions: [
      {
        text: 'एक कमबैक कॉन्सेप्ट चुनें:',
        options: [
          { text: 'चमकीला, रंगीन, पूरी खुशी वाली एनर्जी।', result: 'bright' },
          { text: 'डार्क, मूडी, कॉन्सेप्ट-वीडियो कैओस।', result: 'dark' },
          { text: 'रेट्रो थ्रोबैक, Y2K सैंपलिंग सब कुछ।', result: 'retro' },
          { text: 'सॉफ्ट, इमोशनल, बैलेड-कोडेड।', result: 'soft' },
        ],
      },
      {
        text: 'आपकी आइडियल म्यूज़िक वीडियो सेटिंग:',
        options: [
          { text: 'नियॉन सेट, कैंडी कलर्स, पूरा कैओस।', result: 'bright' },
          { text: 'छोड़ा हुआ गोदाम, ड्रामाई लाइटिंग, प्लॉट ट्विस्ट।', result: 'dark' },
          { text: 'एक सेट जो सीधा 2003 से निकला लगे।', result: 'retro' },
          { text: 'खिड़की पर बारिश, बहुत इमोशनल।', result: 'soft' },
        ],
      },
      {
        text: 'एक टाइटल ट्रैक वाइब चुनें:',
        options: [
          { text: 'अपबीट और नशीला, हफ्तों दिमाग में बजता रहे।', result: 'bright' },
          { text: 'इंटेंस, सिनेमाई, बड़े ड्रॉप तक बिल्ड करे।', result: 'dark' },
          { text: 'नॉस्टैल्जिक सिंथ्स, डांस करने लायक, थ्रोबैक बेसलाइन।', result: 'retro' },
          { text: 'पियानो-लेड, वोकल्स आगे, चुपचाप दिल तोड़ने वाला।', result: 'soft' },
        ],
      },
      {
        text: 'आपकी फैन-चांट एनर्जी:',
        options: [
          { text: 'पूरे स्टेडियम के साथ कोरस चिल्लाना।', result: 'bright' },
          { text: 'ड्रॉप तक खामोश, फिर पूरी तरह खो जाना।', result: 'dark' },
          { text: 'सबके साथ रेट्रो कोरियो ट्रेंड करना।', result: 'retro' },
          { text: 'फैनकैम के लिए फिल्म करते हुए चुपचाप रोना।', result: 'soft' },
        ],
      },
      {
        text: 'अपने एरा की ड्रेस चुनें:',
        options: [
          { text: 'इंद्रधनुषी रंग, कॉन्सेप्ट से परफेक्ट मैच।', result: 'bright' },
          { text: 'पूरी तरह काला, ड्रामाई सिल्हूट।', result: 'dark' },
          { text: 'डेनिम और प्लेटफॉर्म शूज़, सीधे Y2K से।', result: 'retro' },
          { text: 'सॉफ्ट पेस्टल, बहता हुआ कपड़ा।', result: 'soft' },
        ],
      },
    ],
    results: [
      { key: 'bright', emoji: '🌈', title: 'द ब्राइट कमबैक', description: 'शुद्ध शुगर-रश एनर्जी — वो टाइटल ट्रैक जो एक बार सुनते ही सबके दिमाग में बज जाए।' },
      { key: 'dark', emoji: '🖤', title: 'द डार्क कॉन्सेप्ट एरा', description: 'मूडी, सिनेमाई, और थोड़ा पागलपन भरा, अच्छे तरीके से। आपके कमबैक ट्रेलर ने ही इंटरनेट तोड़ दिया।' },
      { key: 'retro', emoji: '📼', title: 'द रेट्रो थ्रोबैक', description: 'Y2K सिंथ्स, नॉस्टैल्जिक सैंपलिंग, और एक कोरियो ट्रेंड जिसने हर ऐप पर एक साथ कब्ज़ा कर लिया।' },
      { key: 'soft', emoji: '🌙', title: 'द सॉफ्ट बैलेड एरा', description: 'इमोशनल, वोकल्स आगे, और चुपचाप वो जिसने पूरे ग्रुप चैट को रुला दिया।' },
    ],
  }
)

quizzes.push(
  {
    title: "What's Your Texting Personality?",
    slug: 'texting-personality',
    category: 'fun',
    description: "Some reply in one word. Some send essays. Some just... never reply.",
    emoji: '💬',
    gradient: 'from-cyan-400 to-sky-500',
    status: 'published',
    questions: [
      {
        text: "Someone texts 'hey, you up?' at 11pm. Your reply:",
        options: [
          { text: '"yeah"', result: 'oneword' },
          { text: 'Three paragraphs recapping your entire day', result: 'paragraph' },
          { text: '"hey!!" then "so anyway" then "wait actually" — three separate texts', result: 'double' },
          { text: 'Seen 11:01pm. Reply sent Thursday.', result: 'ghost' },
        ],
      },
      {
        text: 'Your text message length is usually:',
        options: [
          { text: 'Under 5 words', result: 'oneword' },
          { text: 'A full essay with proper punctuation', result: 'paragraph' },
          { text: 'Split across 6 different bubbles', result: 'double' },
          { text: "N/A, you communicate exclusively in read receipts", result: 'ghost' },
        ],
      },
      {
        text: "A friend asks 'what's wrong?' after one weird text. You:",
        options: [
          { text: 'Reply "nothing" and mean it', result: 'oneword' },
          { text: 'Explain the entire backstory in vivid detail', result: 'paragraph' },
          { text: 'Send 10 texts that somehow explain nothing', result: 'double' },
          { text: 'Leave them on read for dramatic effect', result: 'ghost' },
        ],
      },
      {
        text: 'Your typing indicator behavior:',
        options: [
          { text: "Rarely even shows, replies come fast and short", result: 'oneword' },
          { text: "Shows for 3 minutes because you're crafting a masterpiece", result: 'paragraph' },
          { text: 'Shows, stops, shows again — five times', result: 'double' },
          { text: 'What typing indicator? You disabled read receipts years ago', result: 'ghost' },
        ],
      },
      {
        text: 'When someone leaves you on read, you:',
        options: [
          { text: "Don't notice, you're also bad at replying", result: 'oneword' },
          { text: 'Write out exactly how that made you feel, unprompted', result: 'paragraph' },
          { text: 'Send "hello???" then "wow ok" then just call them', result: 'double' },
          { text: 'Understand completely. Professional courtesy.', result: 'ghost' },
        ],
      },
    ],
    results: [
      { key: 'oneword', emoji: '🔤', title: 'The One-Word Reply', description: "Efficient. Mysterious. Slightly terrifying to overthinkers. You say \"k\" and mean it." },
      { key: 'paragraph', emoji: '📝', title: 'The Paragraph Writer', description: 'Every text is a personal essay with an intro, body, and conclusion. Group chats fear your voice notes.' },
      { key: 'double', emoji: '💬', title: 'The Double Texter', description: 'Why send one text when five will do? Your chat history looks like a countdown.' },
      { key: 'ghost', emoji: '👻', title: 'The Seen-Zone Legend', description: "You read it. You know you read it. They know you read it. Nobody's mad, everyone's used to it." },
    ],
  }
)

quizzes.push(
  {
    title: 'Which Monsoon Mood Are You?',
    slug: 'monsoon-mood',
    category: 'lifestyle',
    description: 'The rain just started. This says everything about how you handle it.',
    emoji: '🌧️',
    gradient: 'from-sky-400 to-blue-500',
    status: 'published',
    questions: [
      {
        text: 'It just started raining. Your first move:',
        options: [
          { text: 'Put the chai on immediately', result: 'chai' },
          { text: 'Run outside, arms open, full Bollywood mode', result: 'dance' },
          { text: 'Wrap yourself in a blanket and disappear', result: 'cozy' },
          { text: 'Check traffic apps in dread', result: 'traffic' },
        ],
      },
      {
        text: 'Your monsoon soundtrack:',
        options: [
          { text: 'Old romantic songs with your chai', result: 'chai' },
          { text: "Whatever's playing, you're already dancing", result: 'dance' },
          { text: 'Silence. Just rain sounds and a blanket.', result: 'cozy' },
          { text: 'Horns. So many horns.', result: 'traffic' },
        ],
      },
      {
        text: 'Pakoras are ready. You:',
        options: [
          { text: 'Pair them with extra-strong chai, obviously', result: 'chai' },
          { text: 'Eat them mid-dance, no regrets', result: 'dance' },
          { text: 'Eat them in bed under the blanket', result: 'cozy' },
          { text: 'Eat them while stuck in traffic, in the car', result: 'traffic' },
        ],
      },
      {
        text: 'Your window view during a downpour:',
        options: [
          { text: 'A cozy little chai-and-window moment', result: 'chai' },
          { text: "You're not looking, you're outside in it", result: 'dance' },
          { text: 'Curtains closed, do not disturb', result: 'cozy' },
          { text: 'A river where the road used to be', result: 'traffic' },
        ],
      },
      {
        text: 'Monsoon ruins your plans. You:',
        options: [
          { text: 'Make more chai and accept your fate', result: 'chai' },
          { text: 'Reschedule to... dance in it instead', result: 'dance' },
          { text: 'Already under the blanket, plans were cancelled mentally', result: 'cozy' },
          { text: 'Refresh the traffic app every 30 seconds, fuming', result: 'traffic' },
        ],
      },
    ],
    results: [
      { key: 'chai', emoji: '☕', title: 'The Chai Whisperer', description: "Rain means one thing to you: chai o'clock, on repeat until the sky clears." },
      { key: 'dance', emoji: '💃', title: 'The Rain Dancer', description: "You've watched too many Bollywood songs and it shows. First drop, you're out there living your own music video." },
      { key: 'cozy', emoji: '🛌', title: 'The Blanket Hermit', description: 'The world outside is wet and loud. Yours is warm, dry, and has no plans of leaving the bed.' },
      { key: 'traffic', emoji: '🚗', title: 'The Traffic Fury', description: 'Monsoon doesn\'t mean romance to you, it means every road in the city turning into a parking lot.' },
    ],
  }
)

quizzes.push(
  {
    title: 'आपकी टेक्सटिंग पर्सनैलिटी क्या है?',
    slug: 'texting-personality-hi',
    category: 'fun',
    description: 'कोई एक शब्द में जवाब देता है, कोई निबंध भेजता है, कोई बस... कभी जवाब ही नहीं देता।',
    emoji: '💬',
    gradient: 'from-cyan-400 to-sky-500',
    language: 'hi',
    status: 'published',
    questions: [
      {
        text: "रात 11 बजे कोई टेक्स्ट करे 'सो रहे हो क्या?' आपका जवाब:",
        options: [
          { text: '"हाँ"', result: 'oneword' },
          { text: 'पूरे दिन की कहानी तीन पैराग्राफ में', result: 'paragraph' },
          { text: '"अरे!!" फिर "वैसे" फिर "रुको एक बात है" — तीन अलग टेक्स्ट', result: 'double' },
          { text: 'सीन 11:01 पर। जवाब गुरुवार को।', result: 'ghost' },
        ],
      },
      {
        text: 'आपके टेक्स्ट मैसेज की लंबाई आमतौर पर:',
        options: [
          { text: '5 शब्दों से कम', result: 'oneword' },
          { text: 'ठीक-ठाक विराम चिह्नों के साथ एक पूरा निबंध', result: 'paragraph' },
          { text: '6 अलग-अलग बबल्स में बंटा हुआ', result: 'double' },
          { text: 'N/A, आप सिर्फ रीड रिसीट्स में बात करते हैं', result: 'ghost' },
        ],
      },
      {
        text: "एक अजीब टेक्स्ट के बाद दोस्त पूछे 'क्या हुआ?' आप:",
        options: [
          { text: '"कुछ नहीं" कहते हो और यही मतलब भी होता है', result: 'oneword' },
          { text: 'पूरी बैकस्टोरी डिटेल में समझाते हो', result: 'paragraph' },
          { text: '10 टेक्स्ट भेजते हो जो असल में कुछ समझाते ही नहीं', result: 'double' },
          { text: 'ड्रामा के लिए सीन-ज़ोन में छोड़ देते हो', result: 'ghost' },
        ],
      },
      {
        text: 'आपका टाइपिंग इंडिकेटर बिहेवियर:',
        options: [
          { text: 'मुश्किल से दिखता है, जवाब तेज़ और छोटे आते हैं', result: 'oneword' },
          { text: 'बिहेवियर 3 मिनट तक दिखता है क्योंकि आप मास्टरपीस लिख रहे हो', result: 'paragraph' },
          { text: 'दिखता है, रुकता है, फिर दिखता है — पांच बार', result: 'double' },
          { text: 'कौन सा टाइपिंग इंडिकेटर? रीड रिसीट्स साल पहले बंद कर दिए', result: 'ghost' },
        ],
      },
      {
        text: 'कोई आपको सीन पर छोड़ दे, तो आप:',
        options: [
          { text: 'नोटिस ही नहीं करते, आप भी जवाब देने में उतने ही बुरे हो', result: 'oneword' },
          { text: 'बिना पूछे बता देते हो कि इससे कैसा महसूस हुआ', result: 'paragraph' },
          { text: '"हैलो???" फिर "वाह ठीक है" भेजते हो फिर कॉल करते हो', result: 'double' },
          { text: 'पूरी तरह समझते हो। प्रोफेशनल शिष्टाचार।', result: 'ghost' },
        ],
      },
    ],
    results: [
      { key: 'oneword', emoji: '🔤', title: 'वन-वर्ड रिप्लाई', description: 'एफिशिएंट। मिस्टीरियस। ओवरथिंकर्स के लिए थोड़ा डरावना। आप "ok" कहते हो और यही मतलब भी होता है।' },
      { key: 'paragraph', emoji: '📝', title: 'पैराग्राफ राइटर', description: 'हर टेक्स्ट एक पर्सनल निबंध है, इंट्रो-बॉडी-कॉन्क्लूज़न के साथ। ग्रुप चैट में आपकी वॉइस नोट्स से सब डरते हैं।' },
      { key: 'double', emoji: '💬', title: 'डबल टेक्सटर', description: 'एक टेक्स्ट क्यों भेजें जब पांच काम आ जाएं? आपकी चैट हिस्ट्री उल्टी गिनती जैसी लगती है।' },
      { key: 'ghost', emoji: '👻', title: 'सीन-ज़ोन लीजेंड', description: 'आपने पढ़ लिया। आपको पता है आपने पढ़ लिया। उन्हें भी पता है। किसी को गुस्सा नहीं, सबको आदत है।' },
    ],
  }
)

quizzes.push(
  {
    title: 'आपका मानसून मूड क्या है?',
    slug: 'monsoon-mood-hi',
    category: 'lifestyle',
    description: 'बारिश अभी-अभी शुरू हुई। ये बता देगा आप इसे कैसे संभालते हैं।',
    emoji: '🌧️',
    gradient: 'from-sky-400 to-blue-500',
    language: 'hi',
    status: 'published',
    questions: [
      {
        text: 'अभी-अभी बारिश शुरू हुई। आपका पहला कदम:',
        options: [
          { text: 'फौरन चाय चढ़ा दो', result: 'chai' },
          { text: 'बाहर भागो, हाथ फैलाओ, पूरा बॉलीवुड मोड', result: 'dance' },
          { text: 'कंबल में लिपटो और गायब हो जाओ', result: 'cozy' },
          { text: 'घबराकर ट्रैफिक ऐप चेक करो', result: 'traffic' },
        ],
      },
      {
        text: 'आपका मानसून साउंडट्रैक:',
        options: [
          { text: 'चाय के साथ पुराने रोमांटिक गाने', result: 'chai' },
          { text: 'जो भी बज रहा है, आप पहले से डांस कर रहे हो', result: 'dance' },
          { text: 'सन्नाटा। बस बारिश की आवाज़ और एक कंबल।', result: 'cozy' },
          { text: 'हॉर्न। ढेर सारे हॉर्न।', result: 'traffic' },
        ],
      },
      {
        text: 'पकौड़े तैयार हैं। आप:',
        options: [
          { text: 'एकदम कड़क चाय के साथ खाते हो, ज़ाहिर सी बात है', result: 'chai' },
          { text: 'डांस करते-करते खाते हो, कोई अफ़सोस नहीं', result: 'dance' },
          { text: 'बिस्तर पर कंबल के नीचे खाते हो', result: 'cozy' },
          { text: 'गाड़ी में ट्रैफिक में फंसे हुए खाते हो', result: 'traffic' },
        ],
      },
      {
        text: 'मूसलाधार बारिश में आपकी खिड़की का नज़ारा:',
        options: [
          { text: 'चाय और खिड़की वाला आरामदायक पल', result: 'chai' },
          { text: 'आप देख नहीं रहे, आप बाहर उसी में हो', result: 'dance' },
          { text: 'पर्दे बंद, डिस्टर्ब मत करो', result: 'cozy' },
          { text: 'सड़क की जगह अब एक नदी बह रही है', result: 'traffic' },
        ],
      },
      {
        text: 'मानसून आपका प्लान बिगाड़ दे, तो आप:',
        options: [
          { text: 'और चाय बना लो और किस्मत मान लो', result: 'chai' },
          { text: 'प्लान बदलो... और उसी में डांस करो', result: 'dance' },
          { text: 'पहले से कंबल में हो, प्लान तो दिमाग में ही कैंसिल हो गया था', result: 'cozy' },
          { text: 'हर 30 सेकंड में ट्रैफिक ऐप रीफ्रेश करो, गुस्से में', result: 'traffic' },
        ],
      },
    ],
    results: [
      { key: 'chai', emoji: '☕', title: 'चाय व्हिस्परर', description: 'बारिश का मतलब आपके लिए एक ही चीज़ है: चाय का टाइम, तब तक जब तक आसमान साफ़ न हो जाए।' },
      { key: 'dance', emoji: '💃', title: 'रेन डांसर', description: 'आपने बहुत सारे बॉलीवुड गाने देख लिए हैं और ये दिखता भी है। पहली बूंद गिरते ही आप अपना म्यूज़िक वीडियो जी रहे हो।' },
      { key: 'cozy', emoji: '🛌', title: 'ब्लैंकेट हर्मिट', description: 'बाहर की दुनिया गीली और शोर वाली है। आपकी दुनिया गर्म, सूखी है और बिस्तर छोड़ने का कोई इरादा नहीं।' },
      { key: 'traffic', emoji: '🚗', title: 'ट्रैफिक फ्यूरी', description: 'मानसून का मतलब आपके लिए रोमांस नहीं, शहर की हर सड़क का पार्किंग लॉट बन जाना है।' },
    ],
  }
)

// First "trivia" quiz — right/wrong questions scored numerically instead of
// personality-style option tallying. See BACKEND.md's "Non-personality
// (trivia) quizzes" section for how `type`/option.result/'correct' and
// result.minScore/maxScore work together.
quizzes.push({
  title: 'How Well Do You Know Bollywood?',
  slug: 'bollywood-trivia',
  category: 'entertainment',
  type: 'trivia',
  description: "Five real questions, no personality-quiz fudging — let's see what you actually know.",
  emoji: '🎬',
  gradient: 'from-amber-400 to-orange-500',
  status: 'published',
  questions: [
    {
      text: 'Which city is the heart of the Hindi film industry?',
      options: [
        { text: 'Mumbai', result: 'correct' },
        { text: 'Delhi', result: 'incorrect' },
        { text: 'Chennai', result: 'incorrect' },
        { text: 'Kolkata', result: 'incorrect' },
      ],
    },
    {
      text: '"Sholay" was released in which decade?',
      options: [
        { text: '1960s', result: 'incorrect' },
        { text: '1970s', result: 'correct' },
        { text: '1980s', result: 'incorrect' },
        { text: '1990s', result: 'incorrect' },
      ],
    },
    {
      text: "Whose voice is most associated with playback singing across decades of Bollywood?",
      options: [
        { text: 'Lata Mangeshkar', result: 'correct' },
        { text: 'Adele', result: 'incorrect' },
        { text: 'Celine Dion', result: 'incorrect' },
        { text: 'Whitney Houston', result: 'incorrect' },
      ],
    },
    {
      text: 'What does "playback singing" mean?',
      options: [
        { text: 'The actor sings live on set', result: 'incorrect' },
        { text: 'A singer records the song and the actor lip-syncs it on screen', result: 'correct' },
        { text: 'Songs are only played on the radio, never filmed', result: 'incorrect' },
        { text: 'The director hums the tune during editing', result: 'incorrect' },
      ],
    },
    {
      text: 'Which of these is a real, famous Bollywood production house?',
      options: [
        { text: 'Yash Raj Films', result: 'correct' },
        { text: 'Skywalker Studios', result: 'incorrect' },
        { text: 'Pixar Masala', result: 'incorrect' },
        { text: 'Bollywood Bros Pictures', result: 'incorrect' },
      ],
    },
  ],
  results: [
    { key: 'rewatch', emoji: '📼', title: 'Time For A Rewatch', minScore: 0, maxScore: 1, description: "It's okay — everyone starts somewhere. Consider this your official excuse for a Bollywood marathon." },
    { key: 'casual', emoji: '🍿', title: 'Casual Viewer', minScore: 2, maxScore: 3, description: "You know the vibe, even if the deep-cut facts aren't all locked in yet. Respectable." },
    { key: 'encyclopedia', emoji: '🏆', title: 'Bollywood Encyclopedia', minScore: 4, maxScore: 5, description: "Genuinely impressive. You didn't just watch the movies, you absorbed the whole industry." },
  ],
})

async function main() {
  await connectDB()

  for (const q of quizzes) {
    await Quiz.findOneAndUpdate({ slug: q.slug }, q, { upsert: true, returnDocument: 'after' })
    console.log(`Seeded: ${q.title}`)
  }

  await disconnectDB()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
