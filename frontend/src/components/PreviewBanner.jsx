// Shown on every public content page whenever it was opened via an admin's
// preview link, so it's unmistakable this isn't the live version a real
// visitor would land on — no wording change, no placement ambiguity.
export default function PreviewBanner() {
  return (
    <div className="max-w-xl mx-auto px-4 pt-4">
      <div className="rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 text-sm font-semibold text-center py-2">
        👁 Preview mode — this is a draft, not live on the site
      </div>
    </div>
  )
}
