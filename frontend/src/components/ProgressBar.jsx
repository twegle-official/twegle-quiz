export default function ProgressBar({ current, total }) {
  const percent = Math.round((current / total) * 100)
  return (
    <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden mb-6">
      <div
        className="h-full bg-violet-500 transition-all duration-300"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
