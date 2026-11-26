"use client";

import { motion } from "framer-motion";

export function SaheliLogo({
  size = 40,
  animated = false,
}: {
  size?: number;
  animated?: boolean;
}) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      aria-label="Saheli AI Lotus Mark"
      role="img"
      animate={animated ? { scale: [1, 1.03, 1] } : undefined}
      transition={animated ? { duration: 4, repeat: Infinity, ease: "easeInOut" } : undefined}
    >
      <defs>
        <radialGradient id="petalRose" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#F5B8CC" />
          <stop offset="100%" stopColor="#A63D62" />
        </radialGradient>
        <radialGradient id="petalLav" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#D7C3F6" />
          <stop offset="100%" stopColor="#7952B3" />
        </radialGradient>
        <radialGradient id="petalSage" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#C1DEC7" />
          <stop offset="100%" stopColor="#386B57" />
        </radialGradient>
        <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFF7D6" />
          <stop offset="100%" stopColor="#F4BE6E" />
        </radialGradient>
      </defs>

      {/* Soft sculptural outer petals */}
      <path
        d="M60 12C45 30 43 51 60 66C77 51 75 30 60 12Z"
        fill="url(#petalLav)"
        opacity="0.92"
      />
      <path
        d="M19 46C34 36 53 42 59 64C39 68 23 60 19 46Z"
        fill="url(#petalRose)"
        opacity="0.9"
      />
      <path
        d="M101 46C86 36 67 42 61 64C81 68 97 60 101 46Z"
        fill="url(#petalSage)"
        opacity="0.9"
      />
      <path
        d="M31 89C34 73 48 64 59 67C56 84 44 93 31 89Z"
        fill="url(#petalRose)"
        opacity="0.72"
      />
      <path
        d="M89 89C86 73 72 64 61 67C64 84 76 93 89 89Z"
        fill="url(#petalSage)"
        opacity="0.72"
      />

      {/* Luminous floral center */}
      <circle cx="60" cy="64" r="10.5" fill="url(#coreGlow)" />
      <circle cx="60" cy="64" r="4.5" fill="#FFFDF7" opacity="0.85" />
    </motion.svg>
  );
}
