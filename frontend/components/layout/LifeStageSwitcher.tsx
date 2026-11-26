"use client";

import { Flower2, HeartHandshake, Sparkles } from "lucide-react";
import { LIFE_STAGE_CONFIGS } from "@/config/life-stages";
import { STAGE_THEMES } from "@/config/themes";
import { useSaheli } from "@/providers/AppProviders";
import { LifeStage } from "@/types/saheli";

const STAGE_ORDER: LifeStage[] = ["menstrual", "pregnancy", "postpartum"];

const STAGE_ICONS: Record<LifeStage, typeof Sparkles> = {
  menstrual: Flower2,
  pregnancy: Sparkles,
  postpartum: HeartHandshake,
};

export function LifeStageSwitcher({ compact = false }: { compact?: boolean }) {
  const { activeStage, setStage, language } = useSaheli();

  return (
    <div
      role="tablist"
      aria-label="Life stage switcher"
      className={`inline-flex flex-wrap gap-1.5 rounded-2xl p-1 ${
        compact ? "w-full justify-between" : ""
      }`}
      style={{
        backgroundColor: "var(--stage-surface-muted)",
        border: "1px solid var(--stage-border)",
      }}
    >
      {STAGE_ORDER.map((stage) => {
        const active = activeStage === stage;
        const cfg = LIFE_STAGE_CONFIGS[stage];
        const tokens = STAGE_THEMES[stage];
        const Icon = STAGE_ICONS[stage];
        return (
          <button
            key={stage}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => setStage(stage)}
            className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition-all ${
              compact ? "flex-1" : ""
            } ${active ? "text-white shadow-sm" : "hover:bg-white/60"}`}
            style={
              active
                ? { backgroundColor: tokens.primary }
                : { color: "var(--stage-text)" }
            }
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{cfg.label[language]}</span>
          </button>
        );
      })}
    </div>
  );
}
