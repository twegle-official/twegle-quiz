import { useEffect, useState } from 'react'

const FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']

// Cycles a random face while `rolling` is true (a quick "shuffling" feel
// instead of the number just appearing), then settles on the real `roll`
// once it lands.
export default function DiceDisplay({ roll, rolling }) {
  const [face, setFace] = useState(roll || 1)

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
      className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white dark:bg-gray-800 border-2 border-violet-300 dark:border-violet-600 shadow text-4xl leading-none ${rolling ? 'animate-bounce' : ''}`}
    >
      {FACES[face - 1]}
    </div>
  )
}
