"use client";

import { WifiOff } from "lucide-react";
import { useSaheli } from "@/providers/AppProviders";

export function OfflineIndicator() {
  const { isOnline, t } = useSaheli();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-between gap-2 rounded-2xl border border-amber-400 bg-amber-50 px-4 py-2.5 text-xs sm:text-sm font-medium text-amber-950"
    >
      <div className="flex items-center gap-2">
        <WifiOff className="h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
        <span>
          {t.badges.offline} — Bundled educational guides stay available; AI chat and report processing require connectivity.
        </span>
      </div>
    </div>
  );
}
