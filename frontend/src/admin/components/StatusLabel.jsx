// A "published" quiz/post/friendship-quiz with a future publishAt is
// scheduled, not actually live yet — worth showing distinctly in admin list
// views so an admin isn't surprised it's not visible to real visitors.
export default function StatusLabel({ item }) {
  if (item.status === 'published' && item.publishAt && new Date(item.publishAt) > new Date()) {
    return (
      <span className="text-blue-600 dark:text-blue-400">
        scheduled for {new Date(item.publishAt).toLocaleString()}
      </span>
    )
  }
  return (
    <span className={item.status === 'published' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}>
      {item.status}
    </span>
  )
}
