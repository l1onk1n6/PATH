interface LogoProps {
  size?: number;
}

export function LogoIcon({ size = 36 }: LogoProps) {
  const id = `px-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Main green → teal gradient */}
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34C759" />
          <stop offset="100%" stopColor="#00C7BE" />
        </linearGradient>
        {/* Top shine like M-Suite */}
        <linearGradient id={`${id}-shine`} x1="18" y1="0" x2="18" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <rect width="36" height="36" rx="9" />
        </clipPath>
      </defs>

      {/* Background */}
      <rect width="36" height="36" rx="9" fill={`url(#${id}-bg)`} />

      {/* Subtle drop shadow on icon (inner depth) */}
      <rect
        width="36" height="36" rx="9"
        fill="none"
        stroke="rgba(0,0,0,0.12)"
        strokeWidth="0.8"
      />

      {/* Shine overlay */}
      <rect
        width="36" height="22" rx="9"
        fill={`url(#${id}-shine)`}
        clipPath={`url(#${id}-clip)`}
      />

      {/* Arrow path ↗  — "career path forward" */}
      <path
        d="M10.5 26L25.5 11"
        stroke="white"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      {/* Arrowhead */}
      <path
        d="M16 11H25.5V20.5"
        stroke="white"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LogoFull({ size = 36 }: LogoProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        filter: 'drop-shadow(0 4px 12px rgba(52,199,89,0.45))',
        flexShrink: 0,
      }}>
        <LogoIcon size={size} />
      </div>
      <div>
        <div style={{
          fontWeight: 800,
          fontSize: size * 0.44,
          letterSpacing: '-0.4px',
          lineHeight: 1,
          color: '#fff',
        }}>
          AICV
        </div>
        <div style={{
          fontSize: size * 0.28,
          color: 'rgba(255,255,255,0.45)',
          marginTop: 1,
          letterSpacing: '0.01em',
          fontWeight: 500,
        }}>
          by pixmatic
        </div>
      </div>
    </div>
  );
}
