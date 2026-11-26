"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Leaf, Moon, Sparkles } from "lucide-react";
import { LIFE_STAGE_CONFIGS } from "@/config/life-stages";
import { useSaheli } from "@/providers/AppProviders";
import { SymptomCheckinSheet } from "@/components/symptoms/SymptomCheckinSheet";
import { CalmBreathingWidget } from "@/components/ui/CalmBreathingWidget";
import { SaheliLogo } from "@/components/ui/SaheliLogo";
import { POSTPARTUM_DEMO_SLEEP } from "@/mocks/demoData";

export function PostpartumDashboard() {
  const { profile, language, symptoms, t, mode } = useSaheli();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [presetSymptom, setPresetSymptom] = useState<string | undefined>();
  const [insightMetric, setInsightMetric] = useState<"sleep" | "symptoms" | "mood">("sleep");
  const [timeRange, setTimeRange] = useState<"weekly" | "monthly">("weekly");
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(6);
  const [expandedCard, setExpandedCard] = useState<number | null>(0);

  const stageCfg = LIFE_STAGE_CONFIGS.postpartum;
  const wellnessLogs = symptoms.filter((s) => s.stage === "postpartum");
  const completedCheckins = Math.min(6, 4 + wellnessLogs.length);
  const pct = Math.round((completedCheckins / 6) * 100);
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (pct / 100) * circumference;

  const quickCategories = stageCfg.symptoms.slice(0, 4);

  const educationalCards = [
    {
      title: "Understanding Perimenopause & Transitions",
      summary: "Hormonal shifts often cause irregular cycles, hot flashes, and sleep changes years before menopause.",
      detail: "Tracking patterns calmly helps you have clearer conversations with your doctor rather than guessing triggers.",
    },
    {
      title: "Restorative Sleep Habits",
      summary: "Cooler bedroom airflow, breathable cotton bedding, and consistent wind-down cues can support rest.",
      detail: "Share persistent night sweats or insomnia with a qualified clinician before trying supplements or treatments.",
    },
    {
      title: "Questions for Your Doctor",
      summary: "Bring your sleep and symptom frequency logs to your visit for personalised medical advice.",
      detail: "Saheli AI never recommends hormone therapy or medications—use your clinician summary for medical care.",
    },
  ];

  const activeDay = POSTPARTUM_DEMO_SLEEP[selectedDayIdx];
  const adjustedHours =
    timeRange === "monthly" ? Math.min(8, activeDay.hours + 0.3) : activeDay.hours;

  return (
    <div className="space-y-6">
      <div
        role="status"
        className="saheli-soft-card flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs font-semibold"
      >
        <span className="flex items-center gap-2">
          <Leaf className="h-4 w-4 shrink-0" style={{ color: "var(--stage-primary)" }} />
          <strong>{t.badges.comingSoon}:</strong> Live AI &amp; backend sync are active for Pregnancy in MVP; Menopause &amp; Postpartum wellness runs on {mode === "demo" ? "synthetic demo data" : "local preview"}.
        </span>
      </div>

      {/* Botanical Wellness Hero */}
      <section
        className="relative overflow-hidden rounded-[32px] border p-5 sm:p-7 space-y-6"
        style={{
          borderColor: "var(--stage-border)",
          backgroundColor: "#F7F7EE",
        }}
      >
        <img
          src="/illustrations/menopause-botanical.jpg"
          alt="Botanical sage leaves and serene white blossoms"
          className="pointer-events-none absolute inset-y-0 left-0 h-full w-full sm:w-2/3 object-cover object-left opacity-80"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#F7F7EE]/25 via-[#F7F7EE]/75 to-[#F7F7EE]/98"
        />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-semibold" style={{ color: "var(--stage-text-muted)" }}>
              Good morning, {(profile.display_name || "Kavya").replace(" (Demo)", "")}
            </p>
            <h2 className="font-editorial text-3xl sm:text-4xl font-semibold">
              Your Wellness Journey
            </h2>
            <p className="text-xs max-w-xs pt-1" style={{ color: "var(--stage-text-muted)" }}>
              Engagement check-in ring (not a medical wellness score).
            </p>
          </div>

          <div className="rounded-[26px] bg-white/92 p-5 border shadow-sm backdrop-blur-xs flex flex-col items-center gap-3 min-w-[200px]" style={{ borderColor: "var(--stage-border)" }}>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--stage-text-muted)" }}>
              This Week
            </p>
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg viewBox="0 0 110 110" className="w-full h-full -rotate-90" role="img" aria-label={`${completedCheckins} of 6 check-ins this week`}>
                <circle cx="55" cy="55" r={radius} fill="none" stroke="#DCE9DB" strokeWidth="9" />
                <circle
                  cx="55"
                  cy="55"
                  r={radius}
                  fill="none"
                  stroke="#386B57"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-editorial text-2xl font-semibold">{completedCheckins}/6</span>
                <span className="text-[11px]" style={{ color: "var(--stage-text-muted)" }}>check-ins</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setPresetSymptom(undefined);
                setSheetOpen(true);
              }}
              className="saheli-pill-cta w-full min-h-[44px] rounded-full px-4 text-xs font-bold inline-flex items-center justify-center gap-1.5"
            >
              Log Today <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {quickCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setPresetSymptom(cat.id);
                setSheetOpen(true);
              }}
              className="rounded-[20px] bg-white/92 border px-3.5 py-3 text-xs sm:text-sm font-bold hover:shadow-sm transition active:scale-[0.98]"
              style={{ borderColor: "var(--stage-border)" }}
            >
              + {cat.label[language]}
            </button>
          ))}
        </div>
      </section>

      {/* Guided Breathing Pause */}
      <CalmBreathingWidget />

      {/* Wellness Insights Bar Chart */}
      <section className="saheli-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-editorial text-2xl font-semibold">Wellness Insights</h3>
          <div className="flex flex-wrap gap-2">
            <div className="inline-flex rounded-full p-1 border" style={{ borderColor: "var(--stage-border)", backgroundColor: "var(--stage-surface-muted)" }}>
              {(["weekly", "monthly"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setTimeRange(r)}
                  className={`min-h-[32px] rounded-full px-3 text-[11px] font-bold capitalize ${
                    timeRange === r ? "text-white" : ""
                  }`}
                  style={
                    timeRange === r ? { backgroundColor: "var(--stage-primary)" } : undefined
                  }
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="inline-flex rounded-full p-1 border" style={{ borderColor: "var(--stage-border)", backgroundColor: "var(--stage-surface-muted)" }}>
              {(["sleep", "symptoms", "mood"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setInsightMetric(tab)}
                  className={`min-h-[32px] rounded-full px-3.5 text-xs font-bold capitalize transition ${
                    insightMetric === tab ? "text-white shadow-xs" : ""
                  }`}
                  style={
                    insightMetric === tab
                      ? { backgroundColor: "var(--stage-primary)" }
                      : undefined
                  }
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="saheli-soft-card p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white" style={{ color: "var(--stage-primary)" }}>
                <Moon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: "var(--stage-text-muted)" }}>
                  {insightMetric === "sleep"
                    ? `Logged Sleep (${activeDay.day})`
                    : insightMetric === "mood"
                      ? `Mood Check-in (${activeDay.day})`
                      : "Logged Check-ins"}
                </p>
                <p className="font-editorial text-2xl sm:text-3xl font-semibold">
                  {insightMetric === "sleep"
                    ? `${Math.floor(adjustedHours)}h ${Math.round((adjustedHours % 1) * 60)}m`
                    : insightMetric === "mood"
                      ? `${activeDay.mood} / 5 calm`
                      : `${wellnessLogs.length} entries`}
                </p>
              </div>
            </div>
            <span className="text-xs font-bold" style={{ color: "var(--stage-primary)" }}>
              Tap any day bar
            </span>
          </div>

          <div
            className="flex items-end justify-between gap-2 h-36 pt-3"
            role="img"
            aria-label="Interactive weekly wellness bar chart"
          >
            {POSTPARTUM_DEMO_SLEEP.map((d, idx) => {
              const selected = idx === selectedDayIdx;
              const rawVal =
                insightMetric === "mood"
                  ? d.mood * 1.4
                  : timeRange === "monthly"
                    ? Math.min(8, d.hours + 0.3)
                    : d.hours;
              const hPct = Math.round((rawVal / 8) * 100);
              return (
                <button
                  key={d.day}
                  type="button"
                  onClick={() => setSelectedDayIdx(idx)}
                  className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
                >
                  <div
                    className="w-full max-w-[36px] rounded-xl transition-all"
                    style={{
                      height: `${hPct}%`,
                      backgroundColor: selected ? "#386B57" : "#8CB29D",
                    }}
                  />
                  <span className="text-xs font-bold">{d.day}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Expandable Editorial Guides */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" style={{ color: "var(--stage-primary)" }} />
          <h3 className="font-editorial text-xl font-semibold">Editorial Care Guides</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {educationalCards.map((card, i) => {
            const open = expandedCard === i;
            return (
              <button
                key={card.title}
                type="button"
                onClick={() => setExpandedCard(open ? null : i)}
                className="saheli-card p-5 text-left space-y-2 transition hover:shadow-md"
              >
                <h4 className="font-editorial text-lg font-semibold leading-snug">{card.title}</h4>
                <p className="text-xs leading-relaxed" style={{ color: "var(--stage-text-muted)" }}>
                  {card.summary}
                </p>
                {open && (
                  <p className="text-xs leading-relaxed pt-2 border-t" style={{ borderColor: "var(--stage-border)" }}>
                    {card.detail}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Contextual AI Starters */}
      <section className="saheli-card p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <SaheliLogo size={36} />
            <h3 className="font-editorial text-xl font-semibold">Ask Saheli AI</h3>
          </div>
          <Link href="/symptoms#clinician-summary" className="text-xs font-bold underline" style={{ color: "var(--stage-primary)" }}>
            Clinician Summary
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {stageCfg.aiPrompts[language].map((prompt) => (
            <Link
              key={prompt}
              href={`/chat?q=${encodeURIComponent(prompt)}`}
              className="flex min-h-[48px] items-center justify-between gap-2 rounded-2xl border bg-white px-4 py-3 text-xs sm:text-sm font-semibold hover:bg-black/[0.03]"
              style={{ borderColor: "var(--stage-border)" }}
            >
              <span className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--stage-primary)" }} />
                {prompt}
              </span>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Link>
          ))}
        </div>
      </section>

      <SymptomCheckinSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        initialSymptom={presetSymptom}
      />
    </div>
  );
}
