import React from 'react';

export function FlowStreamLogo({ size = 32, className = '' }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ filter: 'drop-shadow(0 2px 8px rgba(99, 102, 241, 0.45))' }}
    >
      <defs>
        {/* Gradiente exterior */}
        <linearGradient id="fsBgGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="50%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>

        {/* Gradiente Play */}
        <linearGradient id="fsPlayGrad" x1="14" y1="12" x2="34" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e0e7ff" />
        </linearGradient>

        {/* Gradiente Onda Flow */}
        <linearGradient id="fsWaveGrad" x1="8" y1="24" x2="40" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#ec4899" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0.8" />
        </linearGradient>
      </defs>

      {/* Contenedor Squircle Moderno */}
      <rect 
        x="2" 
        y="2" 
        width="44" 
        height="44" 
        rx="13" 
        fill="url(#fsBgGrad)" 
      />
      <rect 
        x="3" 
        y="3" 
        width="42" 
        height="42" 
        rx="12" 
        stroke="rgba(255, 255, 255, 0.25)" 
        strokeWidth="1.5" 
      />

      {/* Ondas Flow / Streaming Waves */}
      <path 
        d="M10 33C14 29 18 35 22 31C26 27 30 33 34 29C36 27 38 28 40 26" 
        stroke="url(#fsWaveGrad)" 
        strokeWidth="2.5" 
        strokeLinecap="round"
        fill="none"
        opacity="0.75"
      />

      <path 
        d="M8 38C13 34 17 39 22 35C27 31 31 37 36 33C38 31 40 32 42 30" 
        stroke="url(#fsWaveGrad)" 
        strokeWidth="2" 
        strokeLinecap="round"
        fill="none"
        opacity="0.45"
      />

      {/* Triángulo Play Central Futurista */}
      <path 
        d="M19 14.5C19 13.3 20.3 12.5 21.4 13.1L32.2 19.4C33.2 20.0 33.2 21.6 32.2 22.2L21.4 28.5C20.3 29.1 19 28.3 19 27.1V14.5Z" 
        fill="url(#fsPlayGrad)" 
      />

      {/* Destello de luz superior */}
      <circle cx="34" cy="14" r="2.5" fill="#38bdf8" />
      <circle cx="34" cy="14" r="4.5" fill="#38bdf8" opacity="0.3" />
    </svg>
  );
}
