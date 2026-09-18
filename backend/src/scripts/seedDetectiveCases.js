// One-off content seed — run manually with `node src/scripts/seedDetectiveCases.js`
// (not wired into the server boot sequence, unlike the cleanup/migration
// scripts in this folder — future cases are meant to be authored through
// the admin panel, this just seeds the first 2 launch cases). Connects to
// whatever MONGODB_URI is set in the environment, same as every other
// script here.
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { pathToFileURL } from 'node:url'
import DetectiveCase from '../models/DetectiveCase.js'

dotenv.config()

export const cases = [
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
  {
    title: 'The Broken Window',
    slug: 'the-broken-window',
    description: "The classroom window facing the playground just shattered — and a cricket ball, a garden trowel, and a dog leash were all found nearby. Who's responsible?",
    intro:
      "CRASH! The window of Classroom 4B, facing the playground, just shattered into pieces. Nobody saw it happen — but three things turned up nearby: a scuffed cricket ball, a gardening trowel, and a dog leash.\n\nThree students were outside around that time. One of them broke the window. Can you figure out who — and why nobody suspected them at first?",
    difficulty: 'rookie',
    estimatedMinutes: 6,
    emoji: '🪟',
    status: 'published',
    suspects: [
      { key: 'sam', name: 'Sam', avatar: '🏏', role: 'Cricket Player', description: 'Plays cricket most afternoons with the school team.', statement: "Practice doesn't start till later, I wasn't even out there yet." },
      { key: 'priya', name: 'Priya', avatar: '🌱', role: "Gardener's Daughter", description: 'Helps her mom tend the flowerbeds by the classroom wall.', statement: "I was watering plants near the window earlier, but I left before anything happened." },
      { key: 'tom', name: 'Tom', avatar: '🐕', role: 'New Kid', description: 'Often out chasing his dog, who slipped its leash more than once this week.', statement: "My dog got loose again and I was chasing him near the gate, nowhere near the window." },
    ],
    clues: [
      { key: 'ball', title: 'A Scuffed Cricket Ball', description: 'A well-used cricket ball is found right under the broken window, among the glass.', location: 'Classroom 4B', unlocksAfter: [] },
      { key: 'grass_stains', title: 'Grass-Stained Sleeve', description: "Someone's sleeve has fresh grass stains on it, like they'd been running on the field.", location: 'Playground', unlocksAfter: [] },
      { key: 'witness_time', title: 'Lunch Bell Timing', description: 'A teacher confirms the window shattered right when the lunch bell rang — well before cricket practice usually starts.', location: 'Classroom 4B', unlocksAfter: ['ball'] },
      { key: 'dog_bark', title: 'Barking Heard Nearby', description: 'Someone remembers hearing a dog barking loudly near the school gate around that same time.', location: 'School Gate', unlocksAfter: ['grass_stains'] },
      { key: 'practice_schedule', title: 'Practice Sign-Up Sheet', description: "The cricket sign-up sheet shows today's practice was moved earlier than usual — to start right at the lunch bell.", location: 'Sports Office', unlocksAfter: ['witness_time'] },
      { key: 'muddy_shoe', title: 'Muddy Shoeprint', description: 'A muddy shoeprint matching gardening boots is found near the flowerbed by the window — but pointing away from the window, not toward it.', location: 'Flowerbed', unlocksAfter: ['dog_bark'] },
    ],
    deductionQuestions: [
      {
        question: 'What time did the window actually break, and why did that surprise people at first?',
        options: ['During cricket practice, same as always', "Right at the lunch bell — earlier than cricket practice normally starts", 'Late in the evening after everyone had gone home'],
        correctIndex: 1,
        explanation: "The Lunch Bell Timing clue shows the window broke right when the bell rang — before cricket practice usually starts, which is exactly why nobody thought of cricket right away.",
      },
      {
        question: "Which clue actually clears Priya, even though her muddy footprint was found closest to the window?",
        options: ["The footprint points away from the window, showing she'd already left", 'She was seen in the garden all morning', "She doesn't own a cricket ball"],
        correctIndex: 0,
        explanation: "A footprint pointing away from the window means Priya was leaving the area, not arriving — she'd already gone home before the ball ever hit the glass.",
      },
    ],
    hints: [
      { text: 'Check what time things normally happen versus what time they actually happened today.' },
      { text: "A footprint's direction can tell you whether someone was arriving or leaving." },
    ],
    solution: {
      correctSuspectKey: 'sam',
      explanation:
        "The Practice Sign-Up Sheet shows cricket practice was moved earlier today, starting right at the lunch bell instead of later — exactly when the window shattered. That lines up perfectly with the cricket ball found right under the broken glass and the grass stains on a sleeve from running on the field. Priya's muddy footprint looked suspicious at first, but it points away from the window, proving she'd already left before it broke. Tom really was chasing his dog, but that was over by the gate, and the barking was heard from there too — nowhere near the classroom.",
      provingClueKeys: ['ball', 'witness_time', 'practice_schedule'],
    },
  },
  {
    title: 'The Copied Homework',
    slug: 'the-copied-homework',
    description: 'Two essays about "The Best Day of My Life" turned in this week are word-for-word identical to a chapter in a library book. Who copied it — and why?',
    intro:
      "The teacher was excited to read everyone's \"Best Day of My Life\" essays — until she noticed something strange. One essay matched a whole chapter from a library book almost word for word, right down to a typo.\n\nFour classmates could have done it. Someone panicked and copied instead of writing their own — but who, and why didn't they just ask for more time?",
    difficulty: 'junior',
    estimatedMinutes: 9,
    emoji: '📖',
    status: 'published',
    suspects: [
      { key: 'aditi', name: 'Aditi', avatar: '📚', role: 'Class Topper', description: 'Always finishes assignments early and never seems stressed about deadlines.', statement: "I wrote mine three days ago. Why would I ever copy anything?" },
      { key: 'farhan', name: 'Farhan', avatar: '😅', role: 'Always Running Late', description: 'Known for finishing things at the very last minute.', statement: "I definitely wrote my own essay. It was... a really busy week." },
      { key: 'noor', name: 'Noor', avatar: '📖', role: 'Bookworm', description: 'Practically lives in the library and reads everything she can find.', statement: "I read that book ages ago, but I wrote about my own trip to my grandma's village." },
      { key: 'kabir', name: 'Kabir', avatar: '🤒', role: 'Was Out Sick', description: 'Missed the last two days of school with a bad cold.', statement: "I wasn't even at school to see the assignment properly, let alone copy anything." },
    ],
    clues: [
      { key: 'library_card', title: 'Library Checkout Card', description: 'The library checkout card shows Farhan borrowed "My Best Days," the book the essay was copied from, two days ago.', location: 'Library', unlocksAfter: [] },
      { key: 'typo', title: 'A Matching Typo', description: 'The copied essay has the exact same odd typo — "recieve" spelled wrong the same unusual way — as a line in the library book.', location: 'Classroom', unlocksAfter: [] },
      { key: 'return_date', title: 'Return Slip', description: "The book's return slip shows Farhan returned it early this morning, right before the essays were due.", location: 'Library', unlocksAfter: ['library_card'] },
      { key: 'kabir_alibi', title: "Kabir's Sick Note", description: 'The school nurse confirms Kabir was home sick for the last two days, with his parents keeping his notebook updated remotely.', location: "Nurse's Office", unlocksAfter: ['typo'] },
      { key: 'noor_alibi', title: "Noor's Own Essay", description: "Noor's actual essay, handed in days ago, is about a totally different topic — a trip to her grandmother's village — and is clearly in her own handwriting.", location: 'Classroom', unlocksAfter: ['return_date'] },
      { key: 'panic_note', title: 'A Crumpled Draft', description: "A half-finished, clearly original essay draft — abandoned partway through — is found in the bin, in Farhan's handwriting.", location: 'Classroom Bin', unlocksAfter: ['kabir_alibi', 'noor_alibi'] },
    ],
    deductionQuestions: [
      {
        question: 'Why did Farhan copy the essay instead of finishing his own?',
        options: ['He forgot the assignment was due and panicked the night before', 'He wanted to prove the teacher wrong', 'He was helping Kabir, who was absent'],
        correctIndex: 0,
        explanation: "The crumpled, abandoned draft in his own handwriting shows Farhan really did try to write his own essay first — he just ran out of time and panicked, grabbing the library book instead.",
      },
      {
        question: 'Which clues together prove Farhan actually had the exact book the essay was copied from, at the exact right time?',
        options: ['The Library Checkout Card and Return Slip', 'The crumpled draft alone', "Noor's own essay"],
        correctIndex: 0,
        explanation: 'The checkout card shows he borrowed the book two days before, and the return slip shows he gave it back the morning the essay was due — right in the window he needed it.',
      },
    ],
    hints: [
      { text: 'Check who actually had the book in their hands, and exactly when.' },
      { text: 'An abandoned draft can tell you what someone was trying to do before they gave up.' },
    ],
    solution: {
      correctSuspectKey: 'farhan',
      explanation:
        "Farhan checked out \"My Best Days\" from the library two days before the essays were due and returned it early the same morning he submitted his own — right when he'd have needed it to copy from. The matching typo in his essay is the same unusual misspelling that appears in that exact book. Aditi had already finished her own essay days earlier and had no reason to copy. Noor really had read the book, but her actual submitted essay is about something completely different, in her own handwriting. Kabir was confirmed sick at home the whole time and barely knew the assignment details. The crumpled, abandoned draft in Farhan's own handwriting — found in the bin — shows he genuinely tried to write his own essay first, ran out of time the night before, and panicked into copying instead.",
      provingClueKeys: ['library_card', 'typo', 'return_date', 'panic_note'],
    },
  },
  {
    title: 'The Science Fair Sabotage',
    slug: 'the-science-fair-sabotage',
    description: "The night before the Science Fair, the top project — a working volcano model — was found smashed. Five students had late access to the lab. Who did it, and why?",
    intro:
      "The Science Fair is tomorrow, and Ishaan's volcano model — complete with a working pump and real eruption effect — was the clear favorite to win. Tonight, someone smashed it to pieces in the locked lab.\n\nFive students had some kind of access to the lab after hours. A torn note near the wreckage hints at jealousy — but is the obvious suspect really the guilty one? Dig deeper before you accuse anyone.",
    difficulty: 'master',
    estimatedMinutes: 13,
    emoji: '🌋',
    status: 'published',
    suspects: [
      { key: 'vikram', name: 'Vikram', avatar: '🌋', role: 'Rival Volcano-Maker', description: 'Also built a volcano model this year, and the two have been quietly competing for weeks.', statement: "My volcano is way cooler anyway. Why would I even bother smashing his?" },
      { key: 'ananya', name: 'Ananya', avatar: '🤝', role: "Ishaan's Project Partner", description: 'Worked on the volcano together with Ishaan for the past month.', statement: "We had a small disagreement about the paint colors earlier. That's all it was." },
      { key: 'rohan', name: 'Rohan', avatar: '🔑', role: 'Lab Monitor', description: 'Has official keycard access and is responsible for locking up the lab every evening.', statement: "I locked up at 6 like always. Everything was fine when I left." },
      { key: 'meera', name: 'Meera', avatar: '📝', role: "Judge's Niece", description: "Nervous about her own project not being ready in time for the judges — one of whom is her aunt.", statement: "I wasn't even at school yesterday evening. I was home the whole time." },
      { key: 'devansh', name: 'Devansh', avatar: '🧹', role: "Janitor's Son", description: 'Sometimes helps his dad with evening cleanup duties around the school.', statement: "I was helping my dad clean the gym, not anywhere near the lab." },
    ],
    clues: [
      { key: 'glass_shard', title: 'A Glass Shard', description: "A shard from the volcano's beaker is stuck to a shoe-tread pattern that matches the sneakers issued only to lab monitors.", location: 'Science Lab', unlocksAfter: [] },
      { key: 'keycard_log', title: 'Keycard Entry Log', description: 'The lab door was opened again at 7:40pm — 100 minutes after the official 6:00pm lockup.', location: 'Science Lab', unlocksAfter: [] },
      { key: 'paint_argument', title: 'Overheard Argument', description: 'A teacher overheard Ananya and Ishaan arguing loudly that afternoon — something about paint colors on the volcano.', location: 'Hallway', unlocksAfter: ['glass_shard'] },
      { key: 'meera_texts', title: "Meera's Phone Records", description: "Meera's family wifi router log shows her phone was connected from home continuously all evening.", location: "Meera's House", unlocksAfter: ['keycard_log'] },
      { key: 'gym_signin', title: 'Gym Volunteer Sign-In Sheet', description: 'Confirms Devansh signed in to help his dad clean the gym from 7pm to 9pm — nowhere near the science lab.', location: 'Gym', unlocksAfter: ['paint_argument'] },
      { key: 'rohan_keycard', title: 'Whose Keycard Opened It', description: 'The 7:40pm re-entry log shows it was Rohan\'s own keycard used again — not a copied or stolen one.', location: 'Science Lab', unlocksAfter: ['meera_texts'] },
      { key: 'volcano_note', title: 'A Torn Note Near the Wreckage', description: 'A scrap of paper reads: "...told you MY volcano should win, not yours..." — no name signed.', location: 'Science Lab', unlocksAfter: ['gym_signin'] },
      { key: 'vikram_alibi', title: "Vikram's Coach Confirmation", description: 'The cricket coach and the entire team confirm Vikram was at practice across town until 8:30pm.', location: 'Cricket Ground', unlocksAfter: ['rohan_keycard', 'volcano_note'] },
    ],
    deductionQuestions: [
      {
        question: "Whose keycard reopened the lab door at 7:40pm, long after official lockup?",
        options: ["Vikram's — he must have snuck back in", "Rohan's own keycard", "Meera's, borrowed from a friend"],
        correctIndex: 1,
        explanation: "The Keycard Entry Log shows the door was reopened with Rohan's own keycard — the exact same one he uses to lock up every evening.",
      },
      {
        question: "Why does Vikram's alibi completely clear him, even though the torn note sounds exactly like jealous-rival talk?",
        options: ["His whole cricket team and coach confirm he was at practice across town until 8:30pm", "He doesn't know how volcanoes work", "He and Ishaan were never actually rivals"],
        correctIndex: 0,
        explanation: "A whole team and a coach all independently confirming the same alibi is very hard to fake — Vikram genuinely couldn't have been in the lab at 7:40pm.",
      },
      {
        question: "What was Rohan's real motive for smashing his friend's rival's project?",
        options: ["He wanted Vikram's volcano to win the fair instead", "He was angry the lab was left messy", "He was testing whether the alarm system worked"],
        correctIndex: 0,
        explanation: "Rohan is Vikram's close friend and wanted Vikram's project to win — so he used his own after-hours access to sabotage the competition and left a note meant to look like ordinary rival jealousy.",
      },
    ],
    hints: [
      { text: "A keycard log tells you exactly whose card was used — not just that a door opened." },
      { text: 'An alibi backed by many independent witnesses is hard to fake — check who has one.' },
    ],
    solution: {
      correctSuspectKey: 'rohan',
      explanation:
        "The Keycard Entry Log shows the lab was reopened at 7:40pm — 100 minutes after lockup — using Rohan's own keycard, not a stolen or copied one. The glass shard's shoe-tread pattern matches sneakers only issued to lab monitors, which fits Rohan exactly. The torn note sounds like classic rival jealousy, pointing straight at Vikram — but his whole cricket team and coach confirm he was at practice across town until 8:30pm, an alibi far too solid to fake. Ananya's argument with Ishaan was real, but it was only about paint colors, and she never went back to the lab that evening. Meera's phone and wifi records put her at home all night, and Devansh was confirmed helping his dad in the gym the entire time. Rohan, Vikram's close friend, wanted Vikram's volcano to win instead — so he used his own legitimate after-hours access to smash Ishaan's project and left the note to make it look like ordinary rivalry rather than his own doing.",
      provingClueKeys: ['keycard_log', 'rohan_keycard', 'glass_shard'],
    },
  },
  {
    title: 'The Talent Show Blackout',
    slug: 'the-talent-show-blackout',
    description: "Right before the star act, the whole auditorium went dark — and when the lights came back, the ₹15,000 star microphone was gone. Who caused the blackout, and why?",
    intro:
      "The talent show was going perfectly until the final act — the one everyone came to see. Right as it was about to start, every light in the auditorium cut out at once. By the time the lights flickered back on, the star microphone was missing from its stand.\n\nFive people had backstage access that night. The breaker didn't trip by accident — someone flipped it on purpose. Figure out who, and why.",
    difficulty: 'master',
    estimatedMinutes: 12,
    emoji: '🎤',
    status: 'published',
    suspects: [
      { key: 'karan', name: 'Karan', avatar: '🎤', role: 'Rival Singer', description: "Auditioned for the closing slot but got placed earlier in the show instead.", statement: "I was pacing backstage because I was nervous about my own act, that's all." },
      { key: 'simran', name: 'Simran', avatar: '💡', role: 'Lighting Crew Head', description: 'In charge of all the stage lighting cues for the whole show.', statement: "I was calling lighting cues from the booth the entire time. Check my walkie log." },
      { key: 'arjun', name: 'Arjun', avatar: '🎭', role: 'Backstage Manager', description: 'Has all-access backstage, including the breaker room and every prop area.', statement: "I was running around backstage all night like always. Ask anyone." },
      { key: 'naina', name: 'Naina', avatar: '🎸', role: 'Guest Band Member', description: 'Visiting from another school for a joint performance.', statement: "I don't even know where your breaker room is, I've never been backstage here." },
      { key: 'pooja', name: 'Pooja', avatar: '👗', role: 'Costume Designer', description: 'Was working near the prop table when the lights went out.', statement: "Everything went dark and I knocked the prop table over trying to find my way. Pure accident." },
    ],
    clues: [
      { key: 'breaker_log', title: 'Breaker Room Log', description: 'The maintenance log shows the master breaker was manually flipped off — not tripped by an electrical overload.', location: 'Breaker Room', unlocksAfter: [] },
      { key: 'muddy_gloves', title: 'A Pair of Work Gloves', description: 'A pair of gloves with the lighting crew\'s logo is found dropped near the breaker room.', location: 'Breaker Room', unlocksAfter: [] },
      { key: 'karan_seen', title: 'Karan Seen Backstage', description: 'A stagehand remembers seeing Karan pacing anxiously in the wings right before the blackout — but never leaving that spot.', location: 'Backstage Wings', unlocksAfter: ['breaker_log'] },
      { key: 'simran_alibi', title: "Simran's Walkie Log", description: 'A recorded timestamp shows Simran was calling lighting cues from the booth at the exact moment the breaker flipped.', location: 'Lighting Booth', unlocksAfter: ['muddy_gloves'] },
      { key: 'prop_table', title: 'Overturned Prop Table', description: 'The prop table near Pooja\'s station was knocked over in the dark — unrelated to the missing mic.', location: 'Prop Area', unlocksAfter: ['karan_seen'] },
      { key: 'naina_backstage_pass', title: "Naina's Guest Pass", description: "Records show Naina was never checked in backstage that evening — she was seated with her school's group in the audience the whole time.", location: 'Auditorium', unlocksAfter: ['simran_alibi'] },
      { key: 'mic_found', title: 'The Mic, Found', description: 'The missing microphone turns up tucked inside a gym bag under the backstage management desk.', location: 'Backstage Desk', unlocksAfter: ['prop_table', 'naina_backstage_pass'] },
      { key: 'torn_schedule', title: 'A Torn Show Schedule', description: 'A torn schedule found in the same gym bag has the closing slot circled, with "should\'ve been ME" scribbled angrily beside it.', location: 'Backstage Desk', unlocksAfter: ['mic_found'] },
    ],
    deductionQuestions: [
      {
        question: 'What does the Breaker Room Log prove about how the blackout happened?',
        options: ['It was an accidental electrical overload', 'The breaker was deliberately flipped off by hand', 'A storm knocked out the power'],
        correctIndex: 1,
        explanation: 'The log rules out an accident — the breaker was manually switched off, meaning someone caused the blackout on purpose.',
      },
      {
        question: "Why don't the dropped work gloves actually prove Simran did it, even though they have the lighting crew's logo?",
        options: ["They're spare gloves anyone backstage could grab, and her walkie log proves she was in the booth the whole time", "Simran doesn't own gloves", "The gloves were the wrong size for her"],
        correctIndex: 0,
        explanation: "Spare crew gloves sit in a shared backstage supply area that Arjun, as backstage manager, has access to — and Simran's own recorded walkie timestamp places her in the booth at the exact moment the breaker flipped.",
      },
      {
        question: 'What was written on the torn schedule found with the mic, and what did it reveal?',
        options: ['A grocery list, unrelated to the case', "The closing slot circled with \"should've been ME\" scribbled beside it — showing the culprit wanted that spot", 'A thank-you note to the star performer'],
        correctIndex: 1,
        explanation: 'That note reveals real jealousy over being passed over for the closing slot — the actual motive behind the blackout.',
      },
    ],
    hints: [
      { text: 'Not everyone backstage that night actually had a reason to be near the breaker room — check who was seen where.' },
      { text: "Sometimes the angriest-looking suspect isn't the guilty one — follow where the missing item itself turns up." },
    ],
    solution: {
      correctSuspectKey: 'arjun',
      explanation:
        "The Breaker Room Log confirms the blackout was deliberate, not an accident. The dropped gloves seem to point at Simran, since they carry the lighting crew's logo — but they're spare gloves from a shared backstage supply area that Arjun, as backstage manager, has full access to, and Simran's own walkie log places her in the booth at the exact moment the breaker flipped. Karan was seen pacing backstage, which looked suspicious, but a stagehand confirms he never left the wings — he was just nervous about his own earlier act. Pooja's overturned prop table was a genuine accident in the dark, and Naina wasn't even backstage that night. The missing mic turns up in a gym bag under Arjun's own desk, along with a torn schedule with the closing slot circled and \"should've been ME\" scribbled next to it — Arjun had auditioned for that slot and didn't get it, and used his all-access backstage role to cause the blackout and take the mic in the confusion.",
      provingClueKeys: ['breaker_log', 'mic_found', 'torn_schedule'],
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

// Only auto-runs when executed directly (`node seedDetectiveCases.js`) —
// guarded so this file can also be imported just for its `cases` export
// (e.g. to seed production over the live admin API instead of a direct
// Mongoose connection, when direct DB access isn't reachable from this
// machine). Uses pathToFileURL rather than a manual `file://` string —
// a manual version breaks on Windows, where a drive-letter path needs a
// third slash (`file:///C:/...`) that a plain prefix doesn't add.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
