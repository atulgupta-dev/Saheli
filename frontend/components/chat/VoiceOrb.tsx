"use client";

import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { VoiceState } from "@/lib/speech/useSpeech";

interface VoiceOrbProps {
  state: VoiceState;
  onClick: () => void;
  disabled?: boolean;
}

const STATE_LABELS: Record<VoiceState, string> = {
  idle: "Tap orb to speak",
  listening: "Listening... tap to stop",
  processing: "Thinking...",
  speaking: "Speaking... tap to stop",
  error: "Voice unavailable — type below",
};

const WAVE_BARS = [16, 28, 42, 58, 36, 66, 48, 32, 54, 38, 22, 14];

export function VoiceOrb({ state, onClick, disabled }: VoiceOrbProps) {
  const isListening = state === "listening";
  const isSpeaking = state === "speaking";
  const isProcessing = state === "processing";
  const isError = state === "error";

  return (
    <div className="relative flex flex-col items-center gap-3 py-2">
      {/* Flowing Aura Background Waves */}
      <svg
        viewBox="0 0 360 120"
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 w-full max-w-md opacity-45"
        aria-hidden="true"
      >
        <path
          d="M0 60 C 80 15, 160 105, 240 55 C 295 22, 330 78, 360 55"
          fill="none"
          stroke="var(--stage-secondary)"
          strokeWidth="18"
          strokeLinecap="round"
        />
      </svg>

      <div className="relative flex items-center justify-center">
        {(isListening || isSpeaking) && (
          <motion.span
            aria-hidden="true"
            className="absolute h-44 w-44 rounded-full"
            style={{ backgroundColor: "var(--stage-muted-accent)" }}
            animate={{ scale: [0.95, 1.22, 0.95], opacity: [0.65, 0.15, 0.65] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        <motion.button
          type="button"
          disabled={disabled || isProcessing}
          onClick={onClick}
          aria-label={STATE_LABELS[state]}
          whileTap={{ scale: 0.95 }}
          animate={
            isIdleOrActive(state)
              ? { scale: isListening || isSpeaking ? [1, 1.05, 1] : [1, 1.025, 1] }
              : undefined
          }
          transition={{
            duration: isListening || isSpeaking ? 1.2 : 3.6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative z-10 flex h-36 w-36 sm:h-40 sm:w-40 items-center justify-center rounded-full shadow-[0_20px_50px_-12px_var(--stage-primary)] ring-8 ring-white/75 disabled:opacity-70"
          style={{
            background: isError
              ? "radial-gradient(circle at 35% 30%, #FCA5A5 0%, #DC2626 65%, #991B1B 100%)"
              : "radial-gradient(circle at 32% 28%, #EFE5FC 0%, var(--stage-secondary) 40%, var(--stage-primary) 100%)",
          }}
        >
          {isError ? (
            <AlertCircle className="h-10 w-10 text-white" aria-hidden="true" />
          ) : isProcessing ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
              className="h-16 w-16 rounded-full border-4 border-white/30 border-t-white"
            />
          ) : (
            <div className="flex items-center gap-1" aria-hidden="true">
              {WAVE_BARS.map((h, i) => (
                <motion.span
                  key={i}
                  className="w-1 rounded-full bg-white/95"
                  animate={{
                    height:
                      isListening || isSpeaking
                        ? [Math.max(10, h * 0.4), h, Math.max(12, h * 0.5)]
                        : [Math.max(8, h * 0.45), Math.max(14, h * 0.65), Math.max(8, h * 0.45)],
                  }}
                  transition={{
                    duration: isListening || isSpeaking ? 0.55 + (i % 4) * 0.12 : 2.2 + (i % 3) * 0.25,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          )}
        </motion.button>
      </div>

      <p className="text-xs font-bold" style={{ color: "var(--stage-text-muted)" }} aria-live="polite">
        {STATE_LABELS[state]}
      </p>
    </div>
  );
}

function isIdleOrActive(state: VoiceState) {
  return state === "idle" || state === "listening" || state === "speaking";
}
