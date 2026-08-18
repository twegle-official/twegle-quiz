// Placeholder for a real ad unit (e.g. Google AdSense) — wired up once an AdSense
// account is approved. Kept as its own component so swapping in real ad code later
// only touches this one file.
export default function AdSlot({ label = 'Advertisement' }) {
  return (
    // A dashed box standing in for a future ad — shows the given label text
    <div className="w-full border border-dashed border-gray-300 dark:border-gray-700 rounded-xl py-8 text-center text-gray-400 dark:text-gray-500 text-sm">
      {label}
    </div>
  )
}
