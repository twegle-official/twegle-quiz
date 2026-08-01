export default function LogoMark({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="twegle-logo-g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="20" fill="url(#twegle-logo-g)" />
      <circle cx="24" cy="28" r="4.5" fill="white" />
      <circle cx="42" cy="26" r="4.5" fill="white" />
      <path
        d="M20 40c3 5.5 9 8.5 15 7.5 5-1 9-4.5 11-9.5"
        stroke="white"
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="49" cy="16" r="3" fill="white" opacity="0.9" />
    </svg>
  )
}

export function LogoWithWordmark({ size = 36, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      <span
        className="font-extrabold bg-gradient-to-br from-violet-500 to-pink-500 bg-clip-text text-transparent"
        style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: size * 0.6 }}
      >
        Twegle
      </span>
    </span>
  )
}
