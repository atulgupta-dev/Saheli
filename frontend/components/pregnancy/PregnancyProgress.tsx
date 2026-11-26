"use client";

import { motion } from "framer-motion";

interface PregnancyProgressProps {
  currentWeek: number;
  selectedWeek: number;
}

export function PregnancyProgress({
  currentWeek,
  selectedWeek,
}: PregnancyProgressProps) {
  const clamped = Math.max(4, Math.min(40, selectedWeek));
  const pct = Math.round((clamped / 40) * 100);
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-40 h-40 shrink-0">
      <svg
        viewBox="0 0 140 140"
        className="w-full h-full -rotate-90"
        role="img"
        aria-label={`Pregnancy progress: week ${clamped} of 40 (${pct}%)`}
      >
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="var(--stage-secondary)"
          strokeWidth="10"
          opacity="0.6"
        />
        <motion.circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="var(--stage-primary)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </svg>

      {/* Lightweight floating baby-development illustration inside progress ring */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center"
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg
          width="54"
          height="54"
          viewBox="0 0 64 64"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="32" cy="32" r="24" fill="var(--stage-surface-muted)" />
          <path
            d="M35 19C28 19 23 24 23 31C23 38 28 43 35 43C39 43 42 40 42 36C42 32 39 30 36 30C34 30 32 32 32 34"
            stroke="var(--stage-primary-dark)"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <circle cx="36" cy="24" r="4.5" fill="var(--stage-primary)" opacity="0.85" />
        </svg>
        <span className="text-[11px] font-extrabold tracking-tight" style={{ color: "var(--stage-primary-dark)" }}>
          {clamped === currentWeek ? `${pct}% complete` : `Viewing W${clamped}`}
        </span>
      </motion.div>
    </div>
  );
}
