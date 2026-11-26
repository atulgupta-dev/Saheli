"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Info } from "lucide-react";

interface CyclePhase {
  id: "menstrual" | "follicular" | "ovulation" | "luteal";
  label: string;
  dayRange: [number, number];
  color: string;
  info: string;
}

const PHASES: CyclePhase[] = [
  {
    id: "menstrual",
    label: "Menstrual Phase",
    dayRange: [1, 5],
    color: "#A63D62",
    info: "Days 1–5: Uterine lining sheds. Gentle rest, warm fluids, and comfort care help ease cramps.",
  },
  {
    id: "follicular",
    label: "Follicular Phase",
    dayRange: [6, 13],
    color: "#D97C9B",
    info: "Days 6–13: Estrogen gradually rises as the body prepares an egg. Energy often feels steadier.",
  },
  {
    id: "ovulation",
    label: "Ovulation (Est.)",
    dayRange: [14, 17],
    color: "#B47EDE",
    info: "Days 14–17 (estimate): Mid-cycle window. Calendar estimates are educational only and NOT contraception.",
  },
  {
    id: "luteal",
    label: "Luteal Phase",
    dayRange: [18, 28],
    color: "#E7A0B3",
    info: "Days 18–28: Progesterone rises; bloating, tender breasts, or mood shifts can appear before the next period.",
  },
];

function getPhaseForDay(day: number): CyclePhase {
  return (
    PHASES.find((p) => day >= p.dayRange[0] && day <= p.dayRange[1]) ?? PHASES[0]
  );
}

export function CycleWheel({
  cycleDay = 12,
  cycleLength = 28,
}: {
  cycleDay?: number;
  cycleLength?: number;
}) {
  const [selectedDay, setSelectedDay] = useState<number>(cycleDay);
  const activePhase = getPhaseForDay(selectedDay);
  const dots = Array.from({ length: cycleLength }, (_, i) => i + 1);

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Segmented 28-Dot Editorial Cycle Ring (Design Book Page 3) */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
        <svg
          viewBox="0 0 260 260"
          className="w-full h-full"
          role="img"
          aria-label={`Segmented menstrual cycle ring showing cycle day ${selectedDay} of ${cycleLength}`}
        >
          <circle
            cx="130"
            cy="130"
            r="102"
            fill="none"
            stroke="#F5D9D3"
            strokeWidth="22"
            opacity="0.45"
          />
          {dots.map((day) => {
            const angle = ((day - 1) / cycleLength) * Math.PI * 2 - Math.PI / 2;
            const x = 130 + 102 * Math.cos(angle);
            const y = 130 + 102 * Math.sin(angle);
            const phase = getPhaseForDay(day);
            const isSelected = day === selectedDay;
            const isLoggedToday = day === cycleDay;

            return (
              <g
                key={day}
                className="cursor-pointer"
                onClick={() => setSelectedDay(day)}
              >
                <motion.circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 9 : isLoggedToday ? 7.5 : 5.5}
                  fill={phase.color}
                  stroke={isSelected ? "#38252E" : "#FFFFFF"}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  whileHover={{ scale: 1.2 }}
                />
              </g>
            );
          })}
        </svg>

        {/* Center Tap-to-Reset Circle */}
        <button
          type="button"
          onClick={() => setSelectedDay(cycleDay)}
          title="Tap to return to current cycle day"
          className="absolute inset-12 rounded-full bg-white/95 shadow-[0_12px_36px_-14px_rgba(166,61,98,0.28)] border flex flex-col items-center justify-center text-center px-4 transition hover:scale-[1.01]"
          style={{ borderColor: "var(--stage-border)" }}
        >
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--stage-text-muted)" }}
          >
            {selectedDay === cycleDay ? "Cycle Day" : "Exploring Day"}
          </span>
          <span
            className="font-editorial text-5xl font-semibold leading-none my-1"
            style={{ color: "var(--stage-primary)" }}
          >
            {selectedDay}
          </span>
          <span className="text-xs font-bold" style={{ color: "var(--stage-text)" }}>
            {activePhase.label}
          </span>
        </button>
      </div>

      {/* Phase Pills */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {PHASES.map((phase) => {
          const active = activePhase.id === phase.id;
          return (
            <button
              key={phase.id}
              type="button"
              onClick={() => setSelectedDay(phase.dayRange[0])}
              className={`min-h-[38px] rounded-full px-3.5 text-xs font-bold transition ${
                active ? "text-white shadow-xs" : "bg-white border"
              }`}
              style={
                active
                  ? { backgroundColor: phase.color }
                  : { borderColor: "var(--stage-border)" }
              }
            >
              {phase.label}
            </button>
          );
        })}
      </div>

      {/* Phase Explanation */}
      <div className="w-full saheli-soft-card p-4 space-y-1.5 text-left">
        <p className="text-xs sm:text-sm leading-relaxed">{activePhase.info}</p>
        <p className="flex items-start gap-1.5 text-[11px]" style={{ color: "var(--stage-text-muted)" }}>
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          Calendar estimates are educational only and must not be used as contraception or guaranteed fertility guidance.
        </p>
      </div>
    </div>
  );
}
