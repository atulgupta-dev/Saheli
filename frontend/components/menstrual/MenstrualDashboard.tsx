"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Calendar, ChevronDown, ChevronUp, Flower2, Sparkles } from "lucide-react";
import { LIFE_STAGE_CONFIGS } from "@/config/life-stages";
import { useSaheli } from "@/providers/AppProviders";
import { CycleWheel } from "@/components/menstrual/CycleWheel";
import { InteractiveCalendar } from "@/components/symptoms/InteractiveCalendar";
import { SymptomCheckinSheet } from "@/components/symptoms/SymptomCheckinSheet";
import { SaheliLogo } from "@/components/ui/SaheliLogo";
import { MENSTRUAL_DEMO_HISTORY } from "@/mocks/demoData";

export function MenstrualDashboard() {
  const { profile, language, symptoms, t, mode } = useSaheli();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [presetSymptom, setPresetSymptom] = useState<string | undefined>();
  const [calendarExpanded, setCalendarExpanded] = useState(false);
  const [trendRange, setTrendRange] = useState<"4m" | "6m">("4m");
  const [selectedBarIdx, setSelectedBarIdx] = useState<number>(3);

  const stageCfg = LIFE_STAGE_CONFIGS.menstrual;
  const menstrualEntries = symptoms.filter((s) => s.stage === "menstrual");
  const cycleLength = profile.stage_profiles.menstrual?.typical_cycle_length ?? 28;
  const quickSymptoms = stageCfg.symptoms.slice(0, 4);

  const chartData =
    trendRange === "6m"
      ? [
          { month: "Jun", cycleLength: 29, periodLength: 5 },
          { month: "Jul", cycleLength: 28, periodLength: 4 },
          ...MENSTRUAL_DEMO_HISTORY,
        ]
      : MENSTRUAL_DEMO_HISTORY;

  const activePoint = chartData[Math.min(selectedBarIdx, chartData.length - 1)];

  return (
    <div className="space-y-6">
      <div
        role="status"
        className="saheli-soft-card flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs font-semibold"
      >
        <span className="flex items-center gap-2">
          <Flower2 className="h-4 w-4 shrink-0" style={{ color: "var(--stage-primary)" }} />
          <strong>{t.badges.comingSoon}:</strong> Live AI &amp; backend sync are active for Pregnancy in MVP; Menstrual runs on {mode === "demo" ? "synthetic demo data" : "local preview"}.
        </span>
      </div>

      {/* Editorial Hero Composition */}
      <section
        className="relative overflow-hidden rounded-[32px] border p-5 sm:p-7 space-y-6"
        style={{
          borderColor: "var(--stage-border)",
          background:
            "radial-gradient(circle at top right, #F5D9D3 0%, #FFF6F2 55%, #FFFCFA 100%)",
        }}
      >
        <div>
          <p className="text-xs sm:text-sm font-semibold" style={{ color: "var(--stage-text-muted)" }}>
            Good morning, {(profile.display_name || "Ananya").replace(" (Demo)", "")}
          </p>
          <h2 className="font-editorial text-3xl sm:text-4xl font-semibold mt-0.5">
            Your Cycle Journey
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7">
            <CycleWheel cycleDay={12} cycleLength={cycleLength} />
          </div>

          <div className="lg:col-span-5 space-y-3">
            <div className="rounded-[24px] bg-white/95 p-4 border shadow-xs flex items-center justify-between" style={{ borderColor: "var(--stage-border)" }}>
              <div>
                <p className="text-xs font-semibold" style={{ color: "var(--stage-text-muted)" }}>
                  Next Period (Est.)
                </p>
                <p className="font-editorial text-2xl font-semibold">in 16 days</p>
              </div>
              <Calendar className="h-5 w-5" style={{ color: "var(--stage-primary)" }} />
            </div>

            <div className="rounded-[24px] bg-white/95 p-4 border shadow-xs flex items-center justify-between" style={{ borderColor: "var(--stage-border)" }}>
              <div>
                <p className="text-xs font-semibold" style={{ color: "var(--stage-text-muted)" }}>
                  Cycle Length
                </p>
                <p className="font-editorial text-2xl font-semibold">{cycleLength} days</p>
              </div>
              <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ backgroundColor: "var(--stage-badge-bg)", color: "var(--stage-badge-text)" }}>
                Estimate
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setPresetSymptom(undefined);
                setSheetOpen(true);
              }}
              className="saheli-pill-cta w-full min-h-[50px] rounded-full text-sm font-bold transition active:scale-[0.98]"
            >
              Log Symptoms
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {quickSymptoms.map((sym) => (
            <button
              key={sym.id}
              type="button"
              onClick={() => {
                setPresetSymptom(sym.id);
                setSheetOpen(true);
              }}
              className="rounded-[20px] bg-white/95 border px-3.5 py-3 text-xs sm:text-sm font-bold hover:shadow-sm transition active:scale-[0.98]"
              style={{ borderColor: "var(--stage-border)" }}
            >
              + {sym.label[language]}
            </button>
          ))}
        </div>
      </section>

      {/* Expandable Cycle Calendar & Interactive Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="saheli-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-editorial text-xl font-semibold">Cycle Calendar</h3>
            <button
              type="button"
              onClick={() => setCalendarExpanded((e) => !e)}
              className="inline-flex min-h-[38px] items-center gap-1 rounded-full border px-3 text-xs font-bold"
              style={{ borderColor: "var(--stage-border)" }}
            >
              {calendarExpanded ? "Compact strip" : "Full month"}
              {calendarExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>

          {!calendarExpanded ? (
            <div className="space-y-3">
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {[10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((d) => {
                  const isPeriod = d <= 15;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setCalendarExpanded(true)}
                      className={`min-h-[54px] min-w-[44px] shrink-0 rounded-2xl flex flex-col items-center justify-center text-xs font-bold ${
                        d === 12 ? "text-white" : isPeriod ? "bg-rose-100 text-rose-950" : "bg-white border"
                      }`}
                      style={
                        d === 12
                          ? { backgroundColor: "var(--stage-primary)" }
                          : !isPeriod
                            ? { borderColor: "var(--stage-border)" }
                            : undefined
                      }
                    >
                      <span className="text-[10px] opacity-75">Nov</span>
                      <span>{d}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs" style={{ color: "var(--stage-text-muted)" }}>
                Tap any date or expand to view logged period dates, estimated windows, and journal entries.
              </p>
            </div>
          ) : (
            <InteractiveCalendar
              entries={menstrualEntries}
              loggedPeriodDays={[12, 13, 14, 15, 16]}
              estimatedPeriodDays={[21, 22, 23, 24]}
            />
          )}
        </section>

        {/* Interactive Cycle Insights Chart with Time Range Switch */}
        <section className="saheli-card p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-editorial text-xl font-semibold">Cycle Insights</h3>
              <p className="text-xs font-bold" style={{ color: "var(--stage-primary)" }}>
                {activePoint.month}: {activePoint.cycleLength}d cycle • {activePoint.periodLength}d period
              </p>
            </div>
            <div className="inline-flex rounded-full border p-1" style={{ borderColor: "var(--stage-border)" }}>
              {(
                [
                  { id: "4m", label: "4 Cycles" },
                  { id: "6m", label: "6 Cycles" },
                ] as const
              ).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setTrendRange(r.id);
                    setSelectedBarIdx(0);
                  }}
                  className={`min-h-[32px] rounded-full px-3 text-xs font-bold ${
                    trendRange === r.id ? "text-white" : ""
                  }`}
                  style={
                    trendRange === r.id
                      ? { backgroundColor: "var(--stage-primary)" }
                      : undefined
                  }
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div
            className="flex items-end justify-between gap-2.5 h-36 pt-4 px-1"
            role="img"
            aria-label="Interactive bar chart of recent cycle lengths"
          >
            {chartData.map((row, idx) => {
              const selected = idx === Math.min(selectedBarIdx, chartData.length - 1);
              const hPct = Math.round((row.cycleLength / 34) * 100);
              return (
                <button
                  key={row.month}
                  type="button"
                  onClick={() => setSelectedBarIdx(idx)}
                  className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
                >
                  <span className="text-[11px] font-bold">{row.cycleLength}d</span>
                  <div
                    className="w-full max-w-[40px] rounded-t-2xl transition-all"
                    style={{
                      height: `${hPct}%`,
                      backgroundColor: selected
                        ? "var(--stage-primary)"
                        : "var(--stage-secondary)",
                    }}
                  />
                  <span className="text-xs font-bold">{row.month}</span>
                </button>
              );
            })}
          </div>
          <p className="text-[11px]" style={{ color: "var(--stage-text-muted)" }}>
            Tap any bar to inspect recorded cycle &amp; period length. Visual summary only, not clinical diagnosis.
          </p>
        </section>
      </div>

      {/* Contextual AI Companion Card */}
      <section className="saheli-card p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <SaheliLogo size={36} />
            <h3 className="font-editorial text-xl font-semibold">Ask Saheli about your cycle</h3>
          </div>
          <span className="rounded-full px-3 py-1 text-[11px] font-bold" style={{ backgroundColor: "var(--stage-badge-bg)", color: "var(--stage-badge-text)" }}>
            {t.badges.comingSoon}
          </span>
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
