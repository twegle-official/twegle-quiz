// One-off content seed — run manually with `node src/scripts/seedDetectiveCases.js`
// (not wired into the server boot sequence, unlike the cleanup/migration
// scripts in this folder — future cases are meant to be authored through
// the admin panel, this just seeds the first 2 launch cases). Connects to
// whatever MONGODB_URI is set in the environment, same as every other
// script here.
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import DetectiveCase from '../models/DetectiveCase.js'

dotenv.config()

const cases = [
  {
    title: 'The Missing Trophy',
    slug: 'the-missing-trophy',
    description: "The school trophy vanished hours before the big competition. Can you find out who took it — and why?",
    intro:
      "It's competition day, and the school's prized trophy is supposed to be sitting in its display case by the gym, ready to be shown off before the big match. But when Coach arrives to polish it one last time, the case is empty.\n\nThree people were seen near the classrooms and the gym around the time it disappeared. Someone knows what happened to the trophy — and it's up to you to figure out who.",
    difficulty: 'rookie',
    estimatedMinutes: 6,
    emoji: '🏆',
    status: 'published',
    suspects: [
      { key: 'alex', name: 'Alex', avatar: '🏃', role: 'Sports Captain', description: 'Team captain, been looking forward to this competition all season.', statement: 'I was at practice the whole afternoon — ask anyone on the team.' },
      { key: 'mia', name: 'Mia', avatar: '📋', role: 'Class Monitor', description: 'Always organized, keeps the classroom running on schedule.', statement: "I left the classroom at 3:15 to go home. I didn't go anywhere near the gym." },
      { key: 'ryan', name: 'Ryan', avatar: '🎨', role: 'Art Club Member', description: 'Spends every afternoon in the art room working on projects.', statement: "I was painting in the art room all afternoon. My hands are still blue, see?" },
    ],
    clues: [
      { key: 'clock', title: 'The Slow Classroom Clock', description: "Coach mentions the classroom clock has been running about 10 minutes slow all week — nobody's gotten around to fixing it.", location: 'Classroom', unlocksAfter: [] },
      { key: 'spare_key', title: 'Missing Spare Key', description: 'The spare key to the trophy display case, normally hanging in the office, is missing from its hook.', location: 'Office', unlocksAfter: [] },
      { key: 'muddy_prints', title: 'Muddy Footprints', description: 'A trail of small, muddy footprints leads from outside the classroom window toward the gym.', location: 'Hallway', unlocksAfter: ['clock'] },
      { key: 'torn_note', title: 'A Torn Note', description: 'A scrap of paper near the display case reads "...meet me by the gym at 3:15, bring the k..." — the rest is torn off.', location: 'Gym', unlocksAfter: ['spare_key'] },
      { key: 'paint_smudge', title: 'Blue Paint Smudge', description: "There's a smudge of blue paint on the trophy case's handle — the exact shade Ryan was using in art class that day.", location: 'Trophy Case', unlocksAfter: ['muddy_prints'] },
      { key: 'witness', title: "Coach's Memory", description: 'Coach remembers seeing someone in a Class Monitor sash hurrying toward the gym around 3:25 — clutching something shiny.', location: 'Gym', unlocksAfter: ['torn_note', 'paint_smudge'] },
    ],
    deductionQuestions: [
      {
        question: 'What was the real reason the trophy was taken?',
        options: ['To win the competition unfairly', "To surprise a visiting grandparent who couldn't stay long", 'To play a prank on Alex'],
        correctIndex: 1,
        explanation: "Mia's grandmother was visiting the school that day and had to leave early — Mia wanted her to see the trophy up close before she left, and planned to put it back before anyone noticed.",
      },
      {
        question: 'Which clue proves Mia was actually near the gym after the trophy went missing, even though she said she went straight home?',
        options: ['The blue paint smudge', "Coach's memory of the Class Monitor sash", "Ryan's art project"],
        correctIndex: 1,
        explanation: 'Coach clearly remembers a Class Monitor sash near the gym at 3:25 — and only Mia wears one.',
      },
    ],
    hints: [
      { text: 'Compare what time everyone says they left with something else in the room that tells time.' },
      { text: "Having paint on your hands doesn't mean you did something wrong — plenty of people could have blue paint on them." },
    ],
    solution: {
      correctSuspectKey: 'mia',
      explanation:
        "Mia said she left the classroom at 3:15 — but the classroom clock runs 10 minutes slow, so she actually left at 3:25. That's exactly when Coach saw a Class Monitor sash hurrying toward the gym. Mia's grandmother was visiting and had to leave early, so Mia borrowed the trophy to show her, planning to return it before anyone noticed. The muddy footprints and torn note (arranging to meet her grandmother by the gym) both match her path. Ryan's blue paint smudge was just a coincidence — he really was in the art room all afternoon.",
      provingClueKeys: ['clock', 'muddy_prints', 'torn_note', 'witness'],
    },
  },
  {
    title: 'The Vanishing Cupcakes',
    slug: 'the-vanishing-cupcakes',
    description: 'Two dozen cupcakes for the charity bake sale disappeared from the cafeteria fridge overnight. Who couldn\'t resist?',
    intro:
      "Tomorrow's charity bake sale was going to raise money for the animal shelter — 24 cupcakes, frosted and ready, sitting in the cafeteria fridge. This morning, the fridge is empty except for a few stray crumbs and a hastily scribbled note.\n\nFour students were in the building early today. Someone couldn't resist a taste — but who, and why did they leave a note instead of just staying quiet?",
    difficulty: 'junior',
    estimatedMinutes: 9,
    emoji: '🧁',
    status: 'published',
    suspects: [
      { key: 'priya', name: 'Priya', avatar: '📝', role: 'Bake Sale Organizer', description: "Organized the whole bake sale herself — she's more upset than anyone.", statement: "I would never touch them, I baked half of them! I got here at 7:20 and they were already gone." },
      { key: 'jordan', name: 'Jordan', avatar: '😄', role: 'Class Clown', description: "Always the first suspect when something goes missing, fair or not.", statement: "Yeah, I was here early, 7:05ish. But I didn't even go near the cafeteria, I swear." },
      { key: 'zara', name: 'Zara', avatar: '💰', role: 'Student Council Treasurer', description: 'In charge of counting the money the bake sale raises.', statement: "I was counting float money in the office from 7am. Ask Mr. Diaz, he was there too." },
      { key: 'leo', name: 'Leo', avatar: '🎺', role: 'Marching Band Member', description: "Jordan's best friend, has early band practice most mornings.", statement: "I had band practice at 7, same as always. Wasn't anywhere near the kitchen." },
    ],
    clues: [
      { key: 'sticky_note', title: 'The Apology Note', description: 'A crumpled sticky note found by the fridge reads: "sry!! will pay you back i promise" — no name signed.', location: 'Kitchen Fridge', unlocksAfter: [] },
      { key: 'fridge_log', title: 'Kitchen Entry Log', description: "The cafeteria's sign-in sheet (kept for early arrivals) shows someone entered the kitchen at 7:10am, before school officially opens.", location: 'Kitchen', unlocksAfter: [] },
      { key: 'sign_in', title: 'Front Door Sign-In', description: 'The front-door early-arrival log shows Jordan arrived at 7:05am — the earliest of any of the four.', location: 'Front Entrance', unlocksAfter: ['fridge_log'] },
      { key: 'wrapper', title: 'A Stray Wrapper', description: 'A cupcake wrapper with blue frosting is found in the music room trash bin, near the band chairs.', location: 'Music Room', unlocksAfter: ['sticky_note'] },
      { key: 'schedule', title: "Zara's Morning", description: 'The student council sign-in sheet shows Zara was counting bake-sale money in the front office starting at 7:00am, with Mr. Diaz present the whole time.', location: 'Front Office', unlocksAfter: ['fridge_log'] },
      { key: 'daycare_note', title: "Jordan's Little Sister", description: "The daycare next door confirms Jordan dropped his little sister off at 7:07am — right by the front entrance, nowhere near the kitchen.", location: 'Front Entrance', unlocksAfter: ['sign_in'] },
      { key: 'handwriting', title: 'A Familiar Scrawl', description: "The sticky note's handwriting — messy, with a looping 'g' — matches practice sheets sitting on Leo's desk almost exactly.", location: 'Classroom', unlocksAfter: ['sticky_note', 'wrapper'] },
    ],
    deductionQuestions: [
      {
        question: 'Why did Leo take the cupcakes?',
        options: ['To sell them himself and keep the money', 'Band practice ran long and he got hungry, then panicked and left a note', 'To get Jordan in trouble on purpose'],
        correctIndex: 1,
        explanation: "Leo grabbed a few cupcakes on his way to early band practice, felt bad almost immediately, and scribbled the apology note meaning to come clean later.",
      },
      {
        question: "Which clue actually clears Jordan, even though he arrived early and looked suspicious?",
        options: ['The kitchen entry log', "The daycare confirming where he really was at 7:07am", "Zara's schedule"],
        correctIndex: 1,
        explanation: 'Jordan really was in the building early — but dropping off his little sister at the front entrance, nowhere near the kitchen.',
      },
      {
        question: 'Which clue points specifically at Leo rather than just "someone" from the kitchen log?',
        options: ['The wrapper location matching band practice, plus the handwriting match', "Priya's statement", "Zara's alibi"],
        correctIndex: 0,
        explanation: "The wrapper turning up right by the band chairs, combined with the handwriting on the note matching Leo's, is what actually narrows it down to him specifically.",
      },
    ],
    hints: [
      { text: 'Being somewhere early is not the same as being guilty — check whether each person actually had a reason to be near the kitchen.' },
      { text: 'Handwriting can be as good as a fingerprint if you know where to compare it.' },
    ],
    solution: {
      correctSuspectKey: 'leo',
      explanation:
        "Leo has early band practice most mornings, which explains why he was in the building at 7:10 — right when the kitchen log shows someone entering. The cupcake wrapper turning up in the music room trash, right by the band chairs, places him at the scene. And the apology note's messy handwriting, with its distinctive looping \"g,\" matches his own notebook almost exactly. He grabbed a few cupcakes on the way to practice, felt guilty, and left the note meaning to own up later. Jordan arrived early too and looked suspicious for it, but the daycare confirms he was dropping off his sister at the front entrance the whole time — nowhere near the kitchen. Zara has a solid alibi from Mr. Diaz. And Priya, the organizer, has no reason to sabotage her own bake sale.",
      provingClueKeys: ['wrapper', 'handwriting', 'sticky_note'],
    },
  },
]

async function run() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('MONGODB_URI is not set — refusing to guess which database to seed.')
    process.exit(1)
  }
  await mongoose.connect(uri)
  console.log(`Connected to ${uri.replace(/\/\/.*@/, '//<redacted>@')}`)

  for (const data of cases) {
    const existing = await DetectiveCase.findOne({ slug: data.slug })
    if (existing) {
      console.log(`Skipping "${data.title}" — a case with slug "${data.slug}" already exists.`)
      continue
    }
    const created = await DetectiveCase.create(data)
    console.log(`Created "${created.title}" (${created.slug}, ${created.difficulty}).`)
  }

  await mongoose.disconnect()
  console.log('Done.')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
