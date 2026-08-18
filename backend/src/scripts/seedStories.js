import 'dotenv/config'
import { pathToFileURL } from 'node:url'
import { connectDB, disconnectDB } from '../config/db.js'
import Story from '../models/Story.js'

// One-off / re-runnable command to load the starter stories into the real
// database, published and ready to view. Run with: npm run seed:stories
// Safe to re-run — upserts by slug instead of duplicating. Every story here
// is original writing (not adapted from any existing published work), which
// sidesteps the copyright question entirely for the story text itself — see
// PENDING_TASKS.md for the fuller reasoning, including why the read-aloud
// feature (Web Speech API) carries no separate licensing risk.
const stories = [
  {
    title: 'The Last Guest',
    slug: 'the-last-guest',
    category: 'horror',
    emoji: '👻',
    gradient: 'from-red-400 to-orange-400',
    status: 'published',
    body: `The Shimla guesthouse only had one rule painted above the front desk: "Room 7 is always booked."

Reema laughed when the caretaker told her this. It was off-season, the building was empty, and yet Room 7's door stayed locked, its brass number polished brighter than any other on the floor.

"Booked by who?" she asked.

The old caretaker didn't look up from his ledger. "Someone who never checks out."

She thought it was a story he told nervous tourists, the kind of thing that made an ordinary guesthouse feel worth remembering. She even joked about it in her room that night, texting a photo of the locked door to her sister with the caption "haunted hotel, send help."

At 2 a.m., she woke to the soft, unmistakable sound of a key turning — not in her door, but in the one down the hall. Footsteps crossed the corridor, unhurried, and stopped outside her room.

Under the door, a shadow paused. Then, so quietly she almost convinced herself she'd imagined it, a voice said, "Almost time to switch."

In the morning, the caretaker found her sitting in the lobby with her bags already packed, refusing to explain why. He only nodded slowly and made a note in his ledger.

That evening, when the next guest checked in and asked for a room with a view, the caretaker smiled politely and said, "Everything's full tonight. Except Room 8. Room 8 just opened up."`,
  },
  {
    title: 'The Wi-Fi Password Heist',
    slug: 'the-wifi-password-heist',
    category: 'comedy',
    emoji: '📶',
    gradient: 'from-amber-400 to-orange-500',
    status: 'published',
    body: `Uncle Rakesh had changed the Wi-Fi password again, and this time nobody in the family group chat could crack it.

It had started innocently enough. Rakesh had read one article about "cyber safety" and appointed himself Chief Information Security Officer of a four-bedroom flat in Pune. The old password — everyone's birthday combined, easy enough — was gone. In its place was something only he knew, and he refused to share it "for security reasons," even with his own wife.

The family responded the way any reasonable family would: with a full covert operation.

Priya, fourteen and technically the most qualified person in the house, tried the classic move — restarting the router and hoping for the factory default. Rakesh had disabled that too. Her brother Aryan attempted to guess it based on Rakesh's obsessions: his scooter's number plate, his favorite cricketer, the name of his college roommate from 1994. Nothing worked.

It was Dadi, ninety-one years old and utterly uninterested in the drama, who solved it in four minutes. She simply asked Rakesh directly, at dinner, in front of everyone, "Beta, what's the password? I want to watch my shows."

Rakesh, incapable of denying his mother anything, wrote it on a napkin without a second thought: RakeshIsTheBest2024!

The table went silent. Then Priya started laughing so hard she nearly fell off her chair, and even Rakesh, several seconds later, had to admit it wasn't exactly Fort Knox.

The new house rule: Dadi handles all security clearance requests from now on.`,
  },
  {
    title: 'Two Cups of Chai',
    slug: 'two-cups-of-chai',
    category: 'romance',
    emoji: '☕',
    gradient: 'from-pink-400 to-rose-400',
    status: 'published',
    body: `Every morning at exactly 8:15, the same two people ordered chai from the same stall near Church Gate station, and every morning, they pretended not to notice each other.

Meher always ordered "kum meetha" — less sweet — and always paid with exact change. Vivan always asked for extra ginger and always seemed to be running two minutes late for something. For three months, this had been the entire relationship: two cups, one stall, zero conversation.

It was the stall owner, tired of watching two clearly interested people say absolutely nothing to each other, who finally broke the pattern. One rainy Tuesday, he handed Meher a cup of chai that wasn't hers.

"Extra ginger?" she said, confused. "I didn't order this."

"No," the owner said, already pouring the next cup, "but he did. Every day. For you."

She looked over at Vivan, who was suddenly very interested in his phone, ears turning a shade of red that had nothing to do with the weather.

"You've been ordering chai for a stranger for three months?" she asked.

"You're not really a stranger," he said. "I know you take it kum meetha. I know you always have exact change. I just never knew how to say anything after that."

The rain kept falling. Neither of them moved to leave. And for the first time in three months, two cups of chai went cold on the counter while two people, finally, actually talked.

They still go to the same stall every morning. They just don't need the owner to hand over the wrong cup anymore.`,
  },
  {
    title: 'The Case of the Missing Umbrella',
    slug: 'the-case-of-the-missing-umbrella',
    category: 'mystery',
    emoji: '🕵️',
    gradient: 'from-violet-400 to-indigo-500',
    status: 'published',
    body: `Inspector Naina Verma had solved bigger cases than this, but none had made her office quite so tense.

The complaint was simple: someone in the fourth-floor accounts department had taken Mr. Bhatia's umbrella — a bright yellow one, impossible to miss — and Mr. Bhatia wanted it back before the evening's monsoon downpour, and he wanted whoever did it to feel appropriately ashamed.

"Everyone's a suspect," he announced dramatically to the office, "until the umbrella is found."

Naina, who worked in HR and had somehow been recruited into this investigation purely for having "a detective's mind," decided to actually treat it like a case. She started with the timeline: the umbrella had last been seen at 9 a.m., hooked on Bhatia's chair. By lunch, it was gone.

She questioned the tea boy, who had seen nothing. She questioned the intern, who had an airtight alibi involving a two-hour print-shop errand. She questioned Priyanka from accounts, who grew suspiciously defensive about umbrellas in general, though it turned out that was just because she'd once been blamed for a similar disappearance and still hadn't forgiven the office for it.

The break came at 4 p.m., when Naina noticed the office's shared supply closet had a suspiciously umbrella-shaped bulge behind the stack of printer paper.

Inside: not one, but four umbrellas, all slightly different, all quietly forgotten by their owners over the past year and stashed there by the cleaning staff, who had simply been waiting for someone to ask.

Mr. Bhatia got his umbrella back exactly forty minutes before the rain started. He never did apologize to Priyanka, but Naina considered the case officially, triumphantly closed.`,
  },
  {
    title: 'The Farmer and the Golden Seeds',
    slug: 'the-farmer-and-the-golden-seeds',
    category: 'moral',
    emoji: '📚',
    gradient: 'from-emerald-400 to-teal-500',
    status: 'published',
    body: `In a small village beside a slow, winding river, there lived a farmer named Devraj, who was known for one thing above all else: impatience.

One year, a traveling merchant offered him a handful of seeds unlike any he had seen — seeds that shimmered faintly gold in the sunlight. "Plant these," the merchant said, "and in one season, you will have the finest crop in the region. But you must water them every day, without fail, and never dig them up to check on their progress."

Devraj planted the seeds that very evening. For the first week, he watered them dutifully, exactly as instructed. But by the second week, nothing had sprouted, and his patience — never his strongest quality — began to wear thin.

"Perhaps they need more water," he thought, and flooded the soil. Still nothing. "Perhaps they're planted too deep," he decided, and dug a little to check. Still nothing but dark, undisturbed earth.

By the third week, convinced the merchant had cheated him, Devraj dug up the entire patch in frustration, seeds and all, and found nothing but ordinary soil and a few unsprouted husks. He complained to every neighbor who would listen, calling the merchant a fraud.

Months later, on the far side of his land, in a forgotten corner where he'd once carelessly tossed a few extra seeds, Devraj found a small, unexpected patch of golden wheat, tall and glowing faintly in the evening light — untouched, unwatered by his impatient hands, left alone long enough to simply grow.

He never did figure out which seeds had been the enchanted ones. But from that day on, whenever he planted anything at all, he made himself wait.

Some things cannot be rushed, watered twice as hard, or dug up early to check. They simply need to be trusted, and left alone, to grow.`,
  },
  {
    title: 'The Marathon of One Step',
    slug: 'the-marathon-of-one-step',
    category: 'motivational',
    emoji: '💪',
    gradient: 'from-lime-400 to-green-500',
    status: 'published',
    body: `Arjun had never run more than two kilometers in his life, and yet here he was, standing at the start line of a full marathon, forty-two kilometers away from a finish line he genuinely wasn't sure he would ever see.

He hadn't trained properly. He'd signed up on a whim, six months after a health scare had quietly reminded him how little he actually moved in a day. By kilometer five, his knees ached. By kilometer twelve, his lungs burned in a way that felt personal. By kilometer twenty, exactly halfway, he stopped at a water station and seriously considered calling it a day.

An older runner beside him, easily twice his age, noticed him swaying and said something that stayed with him for the rest of the race: "Don't think about the marathon. Just think about the next lamppost."

So that's what Arjun did. He stopped thinking about forty-two kilometers, an impossible, overwhelming number, and started thinking about the next lamppost. Then the one after that. Then the next turn in the road. Then the next water station. One small, manageable piece at a time.

Somewhere around kilometer thirty, his body stopped negotiating and simply kept moving, one lamppost at a time, one turn at a time, refusing to look up at the whole impossible distance still ahead.

He crossed the finish line six hours after he'd started, dead last in his category, and he didn't care even a little. He hadn't run a marathon that day. He had run one lamppost, forty-two kilometers of them, one at a time.

Whatever impossible thing stands in front of you today, it was never asking you to do all of it at once. It was only ever asking for the next lamppost.`,
  },
  {
    title: 'सच्चा दोस्त कौन?',
    slug: 'sachcha-dost-kaun',
    category: 'moral',
    emoji: '📚',
    gradient: 'from-emerald-400 to-teal-500',
    language: 'hi',
    status: 'published',
    body: `एक छोटे से गांव में दो दोस्त रहते थे, मोहन और सोहन। दोनों बचपन से साथ थे, हर मेले में साथ जाते, हर खेल में साथ खेलते। गांव वाले कहते थे — जहां मोहन, वहां सोहन।

एक दिन दोनों जंगल के रास्ते पड़ोसी गांव जा रहे थे कि अचानक सामने से एक भालू आता दिखा। सोहन, जो पेड़ पर चढ़ना जानता था, तुरंत एक ऊंचे पेड़ पर चढ़ गया और मोहन को नीचे अकेला छोड़ दिया।

मोहन को कुछ समझ नहीं आया। उसने सुना था कि भालू मरे हुए इंसान को नहीं छूता, तो वह ज़मीन पर लेट गया और सांस रोक ली। भालू पास आया, उसे सूंघा, और यह सोचकर कि वह मर चुका है, चला गया।

जब खतरा टल गया, सोहन पेड़ से नीचे उतरा और हंसते हुए पूछा, "यार, भालू ने तेरे कान में क्या कहा?"

मोहन उठा, अपने कपड़े झाड़े, और शांति से बोला, "उसने कहा — जो मुसीबत में दोस्त को अकेला छोड़कर भाग जाए, उसके साथ आगे मत चलना।"

सोहन को अपनी गलती का एहसास हुआ, लेकिन तब तक बहुत देर हो चुकी थी। मोहन ने उस दिन के बाद रास्ता बदल लिया — दोस्ती में नहीं, बल्कि यह समझने में कि सच्चा दोस्त मुश्किल वक्त में साथ खड़ा रहता है, न कि सबसे पहले भाग जाता है।

सच्ची दोस्ती परखी जाती है, तब नहीं जब सब ठीक हो, बल्कि तब जब सब कुछ मुश्किल हो।`,
  },
  {
    title: 'एक कदम, हर दिन',
    slug: 'ek-kadam-har-din',
    category: 'motivational',
    emoji: '💪',
    gradient: 'from-lime-400 to-green-500',
    language: 'hi',
    status: 'published',
    body: `सुनीता को दर्ज़ी का काम सीखे अभी सिर्फ तीन महीने हुए थे, और पहला बड़ा ऑर्डर मिलते ही उसके हाथ कांपने लगे — पचास शादी के जोड़े, एक महीने में, अकेले उसे सिलने थे।

पहले दिन उसने पूरे पचास जोड़ों के बारे में सोचा और घबराकर सुई तक नहीं उठा पाई। उसकी दादी, जो खुद जीवन भर सिलाई करती रही थीं, उसके पास बैठीं और बोलीं, "पचास मत गिनो। आज बस एक सिलना है। कल की चिंता कल करना।"

सुनीता ने वैसा ही किया। पहले दिन एक जोड़ा सिला। दूसरे दिन एक और। कुछ दिन ऐसे भी आए जब उसे लगा कि वह कभी पूरा नहीं कर पाएगी, हाथ दर्द से भर जाते, आंखें थक जातीं। लेकिन हर बार वह सिर्फ उस दिन के एक जोड़े के बारे में सोचती, पूरे ऑर्डर के बारे में नहीं।

तीसवें दिन, जब उसने आखिरी जोड़ा पैक किया, तो उसे यकीन नहीं हुआ कि उसने सच में पचास जोड़े अकेले सिल दिए थे। उसने कभी एक महीने का काम नहीं किया था — उसने सिर्फ तीस दिन, एक-एक करके, अपना काम किया था।

जो भी बड़ा सपना आज आपके सामने खड़ा है, उसे पूरा एक साथ करने की ज़रूरत नहीं। बस आज का एक कदम उठाइए। बाकी दिन खुद-ब-खुद आते रहेंगे।`,
  },
]

// Saves each story above into the database — updates it if a story with the same slug already exists, otherwise adds it as new.
export async function seedStories() {
  for (const s of stories) {
    await Story.findOneAndUpdate({ slug: s.slug }, s, { upsert: true, returnDocument: 'after' })
  }
  console.log(`Seeded ${stories.length} stories.`)
}

// Connects to the database, runs the seeding, then disconnects.
async function main() {
  await connectDB()
  await seedStories()
  await disconnectDB()
}

// Only runs main() automatically when this file is executed directly (not when imported elsewhere).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
