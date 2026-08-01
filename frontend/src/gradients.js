// Fixed palette of card gradients. Quizzes store one of these class strings
// in their `gradient` field (set via the admin panel dropdown below).
//
// IMPORTANT: these exact strings must appear literally somewhere in the
// frontend source for Tailwind to generate the CSS for them — Tailwind scans
// source files as text at build time, it cannot see class names that only
// exist as data coming from the API/database at runtime. Do not let this list
// become free text; only ever pick from here.
export const GRADIENT_OPTIONS = [
  { label: 'Pink → Rose', value: 'from-pink-400 to-rose-400' },
  { label: 'Amber → Orange', value: 'from-amber-400 to-orange-500' },
  { label: 'Violet → Indigo', value: 'from-violet-400 to-indigo-500' },
  { label: 'Emerald → Teal', value: 'from-emerald-400 to-teal-500' },
  { label: 'Sky → Blue', value: 'from-sky-400 to-blue-500' },
  { label: 'Red → Orange', value: 'from-red-400 to-orange-400' },
  { label: 'Fuchsia → Pink', value: 'from-fuchsia-400 to-pink-500' },
  { label: 'Lime → Green', value: 'from-lime-400 to-green-500' },
  { label: 'Cyan → Sky', value: 'from-cyan-400 to-sky-500' },
  { label: 'Purple → Fuchsia', value: 'from-purple-400 to-fuchsia-500' },
]
