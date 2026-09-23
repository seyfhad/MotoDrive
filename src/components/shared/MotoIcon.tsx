import React from 'react';

interface MotoIconProps {
  className?: string;
  size?: number | string;
  useImage?: boolean;
}

/**
 * MotoIcon renders the exact MotoDrive motorcycle icon matching the app's official icon:
 * Retro orange scooter with headlight beam and two riders wearing orange helmets.
 */
export const MotoIcon: React.FC<MotoIconProps> = ({
  className = 'w-5 h-5',
  size,
  useImage = false,
}) => {
  const style = size
    ? { width: typeof size === 'number' ? `${size}px` : size, height: typeof size === 'number' ? `${size}px` : size }
    : undefined;

  if (useImage) {
    return (
      <img
        src="/icon.jpg"
        alt="MotoDrive"
        className={`object-cover rounded-xl shrink-0 ${className}`}
        style={style}
      />
    );
  }

  // Precise SVG vector reproducing the exact icon:
  // - Retro orange scooter with curved body & headlight beam
  // - White handlebar & angled steering post
  // - Two riders with slate bodies & round orange helmets with black visors
  // - Two wheels with dark tires, white rims, dark centers
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 inline-block align-middle ${className}`}
      style={style}
    >
      <defs>
        {/* Scooter body gradient */}
        <linearGradient id="scooterGrad" x1="20" y1="50" x2="70" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>

        {/* Headlight beam gradient */}
        <linearGradient id="beamGrad" x1="68" y1="36" x2="88" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef08a" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
        </linearGradient>

        {/* Helmet gradient */}
        <linearGradient id="helmetGrad" x1="30" y1="18" x2="55" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fba71a" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
      </defs>

      {/* Soft ground shadow */}
      <ellipse cx="49" cy="80" rx="32" ry="5.5" fill="#020617" opacity="0.6" />

      {/* Headlight beam */}
      <polygon points="69,32 86,34 83,43 67,39" fill="url(#beamGrad)" />

      {/* Rear Wheel */}
      <g>
        <circle cx="31" cy="71" r="9" fill="#1e293b" />
        <circle cx="31" cy="71" r="6" fill="#f8fafc" />
        <circle cx="31" cy="71" r="3" fill="#0f172a" />
      </g>

      {/* Front Wheel */}
      <g>
        <circle cx="72" cy="70" r="9" fill="#1e293b" />
        <circle cx="72" cy="70" r="6" fill="#f8fafc" />
        <circle cx="72" cy="70" r="3" fill="#0f172a" />
      </g>

      {/* Main Scooter Body */}
      {/* Curved chassis */}
      <path
        d="M23 68 C 23 52, 33 49, 44 49 L 60 51 C 63 51, 67 56, 73 69 L 62 70 C 60 63, 56 62, 37 62 C 34 62, 30 65, 29 70 Z"
        fill="url(#scooterGrad)"
      />

      {/* Front steering column shield */}
      <path
        d="M59 52 L 67 31 L 70 32 L 62 55 Z"
        fill="#d97706"
      />

      {/* Horizontal decorative side accent */}
      <path
        d="M38 60 L 59 60 L 57 62 L 40 62 Z"
        fill="#9a3412"
        opacity="0.8"
      />

      {/* Handlebar */}
      <rect x="58" y="28" width="12" height="3" rx="1.5" fill="#f8fafc" />

      {/* Two Riders */}
      {/* Rear Passenger Body */}
      <path
        d="M36 32 C 36 32, 38 48, 38 56 C 38 58, 43 59, 45 56 C 45 50, 42 36, 42 32 Z"
        fill="#475569"
      />

      {/* Front Driver Body & Arm */}
      <path
        d="M48 30 C 48 30, 50 48, 50 56 C 50 58, 55 58, 57 55 C 57 48, 54 36, 54 30 Z"
        fill="#475569"
      />
      {/* Front Driver Arm reaching handlebar */}
      <path
        d="M52 38 L 67 32 L 67 35 L 53 41 Z"
        fill="#334155"
      />

      {/* Rear Passenger Helmet */}
      <g>
        <circle cx="39" cy="26" r="6.2" fill="url(#helmetGrad)" />
        {/* Visor */}
        <path d="M40 22 C 43 22, 45 24, 45 26 C 45 28, 43 30, 40 30 Z" fill="#0f172a" />
      </g>

      {/* Front Driver Helmet */}
      <g>
        <circle cx="51" cy="22" r="7" fill="url(#helmetGrad)" />
        {/* Visor */}
        <path d="M52 18 C 56 18, 58 20, 58 23 C 58 26, 56 28, 52 28 Z" fill="#0f172a" />
      </g>
    </svg>
  );
};
