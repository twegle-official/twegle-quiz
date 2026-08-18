// A thin horizontal bar showing how far along someone is (e.g. quiz question X of Y).
export default function ProgressBar({ current, total }) {
  const percent = Math.round((current / total) * 100) // how full the bar should be, as a percentage
  return (
    <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden mb-6">
      {/* The filled-in part of the bar, sized to match progress */}
      <div
        className="h-full bg-violet-500 transition-all duration-300"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
