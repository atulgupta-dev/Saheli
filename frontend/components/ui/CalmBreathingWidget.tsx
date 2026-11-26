"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Pause, Play, Wind } from "lucide-react";

const PHASES = [
  { label: "Breathe in gently", seconds: 4, scale: 1.24 },
  { label: "Hold softly", seconds: 4, scale: 1.24 },
  { label: "Exhale slowly", seconds: 6, scale: 0.92 },
];

export function CalmBreathingWidget() {
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(PHASES[0].seconds);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev > 1) return prev - 1;
        const nextIdx = (phaseIdx + 1) % PHASES.length;
        setPhaseIdx(nextIdx);
        return PHASES[nextIdx].seconds;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [running, phaseIdx]);

  const currentPhase = PHASES[phaseIdx];

  return (
    <div className="saheli-soft-card p-4 sm:p-5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3.5">
        <motion.div
          animate={running ? { scale: currentPhase.scale } : { scale: 1 }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, var(--stage-secondary), var(--stage-primary))",
          }}
        >
          {running ? (
            <span className="font-editorial text-lg font-semibold">{secondsLeft}s</span>
          ) : (
            <Wind className="h-5 w-5" />
          )}
        </motion.div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--stage-text-muted)" }}>
            Guided Calm Pause
          </p>
          <p className="font-editorial text-lg font-semibold">
            {running ? currentPhase.label : "1-minute grounding breath"}
          </p>
          <p className="text-xs" style={{ color: "var(--stage-text-muted)" }}>
            Relaxation aid only — not a medical therapy.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          if (running) {
            setRunning(false);
            setPhaseIdx(0);
            setSecondsLeft(PHASES[0].seconds);
          } else {
            setRunning(true);
          }
        }}
        className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full px-4 text-xs font-bold text-white"
        style={{ backgroundColor: "var(--stage-primary)" }}
      >
        {running ? (
          <>
            <Pause className="h-3.5 w-3.5" /> Pause
          </>
        ) : (
          <>
            <Play className="h-3.5 w-3.5" /> Start
          </>
        )}
      </button>
    </div>
  );
}
