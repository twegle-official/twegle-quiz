// Placeholder for a real ad unit (e.g. Google AdSense) — wired up once an AdSense
// account is approved. Kept as its own component so swapping in real ad code later
// only touches this one file.
//
// Renders nothing for now (2026-08-24) — AdSense flagged twegle.in "Low value
// content" during review, and a visibly empty dashed "Advertisement" box next
// to a page with very little text (a single joke/quote/puzzle line) was almost
// certainly reinforcing that impression for the reviewer, not helping it. Swap
// the `return null` below for the box (or real ad code) once approved.
export default function AdSlot() {
  return null
}
