import { useEffect, useState } from 'react'

const FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']

// Cycles a random face while `rolling` is true (a quick "shuffling" feel
// instead of the number just appearing), then settles on the real `roll`
// once it lands. Two CSS keyframe animations (index.css) layer on top of
// that face-cycling for an actual "tumbling" motion: `dice-tumble` spins
// and squashes the die continuously while rolling, `dice-settle` gives it
// one quick bounce-in when it lands on the real result — switched via a
// `key` prop so React remounts (and therefore replays) the settle
// animation every time a fresh roll value arrives, not just on first mount.
export default function DiceDisplay({ roll, rolling }) {
  const [face, setFace] = useState(roll || 1) // which die face (1-6) is currently shown

  useEffect(() => {
    if (!rolling) {
      if (roll) setFace(roll)
      return
    }
    const interval = setInterval(() => setFace(1 + Math.floor(Math.random() * 6)), 90)
    return () => clearInterval(interval)
  }, [rolling, roll])

  return (
    <div
      className={`inline-flex items-center justify-center w-16 h-16 sm:w-14 sm:h-14 rounded-2xl bg-white dark:bg-gray-800 border-2 border-violet-300 dark:border-violet-600 shadow text-5xl sm:text-4xl leading-none ${
        rolling ? 'animate-dice-tumble' : 'animate-dice-settle'
      }`}
      key={rolling ? 'rolling' : `settled-${face}`}
    >
      {FACES[face - 1]}
    </div>
  )
}
