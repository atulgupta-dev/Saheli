"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Footprints,
  Heart,
  Minus,
  Moon,
  Plus,
  RotateCcw,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { LIFE_STAGE_CONFIGS, getMilestoneForWeek } from "@/config/life-stages";
import { MOTION } from "@/config/motion";
import { useSaheli } from "@/providers/AppProviders";
import { SaheliLogo } from "@/components/ui/SaheliLogo";
import { SymptomCheckinSheet } from "@/components/symptoms/SymptomCheckinSheet";

const ALL_WEEKS = Array.from({ length: 40 }, (_, i) => i + 1);

export function PregnancyDashboard() {
  const {
    profile,
    language,
    motherMetrics,
    updateMotherMetrics,
    reports,
    appointments,
    symptoms,
    mode,
    showToast,
  } = useSaheli();

  const currentWeek = profile.stage_profiles.pregnancy?.gestational_week ?? 24;
  const dueDate = profile.stage_profiles.pregnancy?.estimated_due_date ?? "2027-03-18";

  const [exploredWeek, setExploredWeek] = useState<number>(currentWeek);
  const [explorerTab, setExplorerTab] = useState<"baby" | "mother" | "checklist">("baby");
  const [checklistDone, setChecklistDone] = useState<Record<string, boolean>>({
    hydrate: true,
    vitamins: true,
    questions: false,
  });
  const [kickCount, setKickCount] = useState<number>(4);
  const [kickLastTime, setKickLastTime] = useState<string>("Today • Session active");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [presetSymptom, setPresetSymptom] = useState<string | undefined>();
  const [sleepEditing, setSleepEditing] = useState(false);
  const [sleepDraft, setSleepDraft] = useState("7.3");
  const [timelineFilter, setTimelineFilter] = useState<
    "all" | "symptoms" | "appointments" | "reports"
  >("all");
  const [expandedTimelineId, setExpandedTimelineId] = useState<string | null>(null);
  const weekBtnRefs = useRef<Record<number, HTMLButtonElement | null>>({});

  useEffect(() => {
    const el = weekBtnRefs.current[exploredWeek];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [exploredWeek]);

  const milestone = getMilestoneForWeek(exploredWeek);
  const pct = Math.round((exploredWeek / 40) * 100);
  const remainingWeeks = Math.max(0, 40 - currentWeek);
  const pregReports = reports.filter((r) => r.stage === "pregnancy");
  const latestReport = pregReports[0];
  const pregSymptoms = symptoms.filter((s) => s.stage === "pregnancy");
  const stageCfg = LIFE_STAGE_CONFIGS.pregnancy;

  const trimesterLabel =
    milestone.trimester === 1
      ? "First Trimester"
      : milestone.trimester === 2
        ? "Second Trimester"
        : "Third Trimester";

  const waterValue = motherMetrics.water_litres?.value ?? 0;
  const waterTarget = motherMetrics.water_litres?.target_litres ?? 2.8;
  const waterPct = Math.min(100, Math.round((waterValue / waterTarget) * 100));

  const adjustWater = (delta: number) => {
    const next = Math.max(0, Math.min(5, Number((waterValue + delta).toFixed(2))));
    updateMotherMetrics({
      ...motherMetrics,
      water_litres: {
        value: next,
        target_litres: waterTarget,
        recorded_at: "Logged just now",
      },
    });
    showToast(`Water logged: ${next} L`);
  };

  const handleSleepSave = () => {
    const val = Number(sleepDraft);
    if (!val || val <= 0 || val > 24) return;
    updateMotherMetrics({
      ...motherMetrics,
      sleep_hours: {
        value: val,
        recorded_at: "Self-logged just now",
        source: "User entry",
      },
    });
    setSleepEditing(false);
    showToast("Sleep updated");
  };

  const handleRecordKick = () => {
    setKickCount((k) => k + 1);
    setKickLastTime(
      `Last logged at ${new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })}`
    );
  };

  const openSymptomSheet = (symptomId?: string) => {
    setPresetSymptom(symptomId);
    setSheetOpen(true);
  };

  const timelineEvents = useMemo(() => {
    const items: {
      id: string;
      kind: "symptoms" | "appointments" | "reports";
      dateLabel: string;
      title: string;
      subtitle: string;
      detail: string;
      href?: string;
    }[] = [];

    for (const s of pregSymptoms.slice(0, 3)) {
      items.push({
        id: s.entry_id,
        kind: "symptoms",
        dateLabel: new Date(s.reported_at).toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
        }),
        title: `Logged: ${s.symptoms.join(", ")}`,
        subtitle: `Intensity: ${s.severity}${s.is_demo ? " • Synthetic Demo" : ""}`,
        detail: s.safety.message || s.notes || "Recorded in pregnancy symptom journal.",
        href: "/symptoms",
      });
    }

    for (const a of appointments.slice(0, 2)) {
      items.push({
        id: a.id,
        kind: "appointments",
        dateLabel: new Date(a.date).toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
        }),
        title: a.title,
        subtitle: a.clinician,
        detail: a.notes,
        href: "/care",
      });
    }

    for (const r of pregReports.slice(0, 2)) {
      items.push({
        id: r.report_id,
        kind: "reports",
        dateLabel: r.extracted.report_date ?? "Recent",
        title: `Ultrasound / Lab: ${r.file_name}`,
        subtitle: `${r.status === "completed" ? "Analysis ready" : r.status} • Week ${r.extracted.gestational_age_weeks ?? "—"}`,
        detail: r.explanations[0] || "Open report reader for citations.",
        href: "/reports",
      });
    }

    return timelineFilter === "all"
      ? items
      : items.filter((item) => item.kind === timelineFilter);
  }, [pregSymptoms, appointments, pregReports, timelineFilter]);

  const formattedDueDate = useMemo(() => {
    const parsed = new Date(dueDate);
    if (Number.isNaN(parsed.getTime())) return dueDate;
    return parsed.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [dueDate]);

  return (
    <div className="space-y-6">
      {/* 1. IMMERSIVE LAYERED HERO SECTION */}
      <section
        aria-label="Pregnancy journey hero"
        className="relative overflow-hidden rounded-[32px] border p-5 sm:p-7"
        style={{
          borderColor: "var(--stage-border)",
          background:
            "radial-gradient(circle at 58% 36%, #EFE7FA 0%, #F8F5FC 56%, #FFFFFF 100%)",
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-xs sm:text-sm font-semibold" style={{ color: "var(--stage-text-muted)" }}>
              Good morning, {(profile.display_name || "Meera").replace(" (Demo)", "")}
            </p>
            <h2 className="font-editorial text-3xl sm:text-4xl font-semibold leading-tight mt-0.5">
              Your Pregnancy Journey
            </h2>
          </div>
          {mode === "demo" && (
            <span
              className="rounded-full px-3 py-1 text-[11px] font-bold"
              style={{
                backgroundColor: "var(--stage-badge-bg)",
                color: "var(--stage-badge-text)",
              }}
            >
              Synthetic Demo
            </span>
          )}
        </div>

        {/* Sculptural Baby Orb + Layered Floating Cards */}
        <div className="relative mt-5 grid grid-cols-1 md:grid-cols-12 items-center gap-4">
          <div className="order-2 md:order-1 md:col-span-3 flex md:flex-col gap-3">
            <div className="flex-1 rounded-[24px] bg-white/92 p-4 shadow-sm border backdrop-blur-sm" style={{ borderColor: "var(--stage-border)" }}>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--stage-text-muted)" }}>
                {exploredWeek === currentWeek ? "Week" : "Exploring"}
              </p>
              <p
                className="font-editorial text-5xl sm:text-6xl font-semibold leading-none my-1"
                style={{ color: "var(--stage-primary-dark)" }}
              >
                {exploredWeek}
              </p>
              <p className="text-xs sm:text-sm font-semibold">{trimesterLabel}</p>
            </div>
          </div>

          <div className="order-1 md:order-2 md:col-span-6 flex flex-col items-center justify-center">
            <motion.div
              animate={MOTION.heroFloat}
              className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full overflow-hidden shadow-[0_18px_48px_-14px_rgba(121,82,179,0.45)] ring-4 ring-white/80"
            >
              <img
                src="/illustrations/pregnancy-hero.jpg"
                alt="Illustrative baby inside a pastel lavender womb orb"
                className="h-full w-full object-cover"
              />
            </motion.div>
          </div>

          <div className="order-3 md:col-span-3 grid grid-cols-2 md:grid-cols-1 gap-3">
            <div className="rounded-[24px] bg-white/92 p-3.5 shadow-sm border backdrop-blur-sm" style={{ borderColor: "var(--stage-border)" }}>
              <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: "var(--stage-text-muted)" }}>
                <Calendar className="h-4 w-4" style={{ color: "var(--stage-primary)" }} />
                <span>Due Date</span>
              </div>
              <p className="mt-1 text-sm sm:text-base font-bold">{formattedDueDate}</p>
            </div>

            <div className="rounded-[24px] bg-white/92 p-3.5 shadow-sm border backdrop-blur-sm" style={{ borderColor: "var(--stage-border)" }}>
              <p className="text-lg sm:text-xl font-extrabold" style={{ color: "var(--stage-primary-dark)" }}>
                {remainingWeeks} weeks
              </p>
              <p className="text-xs font-medium" style={{ color: "var(--stage-text-muted)" }}>
                remaining (from W{currentWeek})
              </p>
            </div>
          </div>
        </div>

        {/* Lavender Progress Bar */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span style={{ color: "var(--stage-text-muted)" }}>
              Gestational Milestone Progress
            </span>
            <span style={{ color: "var(--stage-primary-dark)" }}>{pct}%</span>
          </div>
          <div
            className="h-3 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: "var(--stage-muted-accent)" }}
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Pregnancy progress ${pct} percent`}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, var(--stage-secondary), var(--stage-primary))",
              }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={MOTION.stage}
            />
          </div>
          <p className="text-[11px]" style={{ color: "var(--stage-text-muted)" }}>
            Educational illustration only — not a scan or measurement of your baby.
          </p>
        </div>

        {/* Mother's Health Asymmetric Interactive Strip */}
        <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Heart Rate */}
          <div className="rounded-[22px] bg-white/95 p-3.5 border space-y-1" style={{ borderColor: "var(--stage-border)" }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color: "var(--stage-text-muted)" }}>
                Heart Rate
              </span>
              <Heart className="h-4 w-4 text-rose-500" aria-hidden="true" />
            </div>
            <p className="text-lg font-extrabold">
              {motherMetrics.heart_rate_bpm
                ? `${motherMetrics.heart_rate_bpm.value} bpm`
                : "Not logged"}
            </p>
            <svg viewBox="0 0 80 18" className="w-full h-4" aria-hidden="true">
              <path
                d="M2 12 L18 11 L26 5 L34 15 L44 9 L58 10 L78 6"
                fill="none"
                stroke="#E11D48"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.55"
              />
            </svg>
          </div>

          {/* Sleep */}
          <div className="rounded-[22px] bg-white/95 p-3.5 border space-y-1" style={{ borderColor: "var(--stage-border)" }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color: "var(--stage-text-muted)" }}>
                Sleep
              </span>
              <Moon className="h-4 w-4" style={{ color: "var(--stage-primary)" }} aria-hidden="true" />
            </div>
            <p className="text-lg font-extrabold">
              {motherMetrics.sleep_hours
                ? `${Math.floor(motherMetrics.sleep_hours.value)}h ${Math.round((motherMetrics.sleep_hours.value % 1) * 60)}m`
                : "Not logged"}
            </p>
            {sleepEditing ? (
              <div className="flex gap-1 pt-0.5">
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="16"
                  value={sleepDraft}
                  onChange={(e) => setSleepDraft(e.target.value)}
                  aria-label="Sleep hours"
                  className="w-14 rounded-lg border px-1.5 py-0.5 text-xs"
                />
                <button
                  type="button"
                  onClick={handleSleepSave}
                  className="rounded-lg px-2 py-0.5 text-[11px] font-bold text-white"
                  style={{ backgroundColor: "var(--stage-primary)" }}
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSleepEditing(true)}
                className="text-[11px] font-bold underline"
                style={{ color: "var(--stage-primary-dark)" }}
              >
                Update sleep
              </button>
            )}
          </div>

          {/* Interactive Hydration Bar */}
          <div className="rounded-[22px] bg-white/95 p-3.5 border space-y-1.5" style={{ borderColor: "var(--stage-border)" }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color: "var(--stage-text-muted)" }}>
                Water
              </span>
              <Droplets className="h-4 w-4 text-sky-600" aria-hidden="true" />
            </div>
            <p className="text-lg font-extrabold">{waterValue} L</p>
            <div className="h-1.5 w-full rounded-full bg-sky-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-sky-500 transition-all"
                style={{ width: `${waterPct}%` }}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Decrease water by 250ml"
                onClick={() => adjustWater(-0.25)}
                className="flex h-6 w-6 items-center justify-center rounded-full border hover:bg-black/5"
              >
                <Minus className="h-3 w-3" />
              </button>
              <button
                type="button"
                aria-label="Add 250ml water"
                onClick={() => adjustWater(0.25)}
                className="inline-flex items-center gap-0.5 text-[11px] font-bold underline"
                style={{ color: "var(--stage-primary-dark)" }}
              >
                <Plus className="h-3 w-3" /> 250 ml
              </button>
            </div>
          </div>

          {/* Symptoms Trigger */}
          <button
            type="button"
            onClick={() => openSymptomSheet()}
            className="rounded-[22px] bg-white/95 p-3.5 border text-left space-y-1 transition hover:shadow-md active:scale-[0.98]"
            style={{ borderColor: "var(--stage-border)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color: "var(--stage-text-muted)" }}>
                Symptoms
              </span>
              <Stethoscope className="h-4 w-4" style={{ color: "var(--stage-primary)" }} aria-hidden="true" />
            </div>
            <p className="text-lg font-extrabold">{pregSymptoms.length} logged</p>
            <span className="inline-block text-[11px] font-bold underline" style={{ color: "var(--stage-primary-dark)" }}>
              + Daily Check-in
            </span>
          </button>
        </div>

        {/* One-Tap Symptom & Movement Bar */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--stage-text-muted)" }}>
            Quick log:
          </span>
          {["back_pain", "fatigue", "swelling", "nausea"].map((id) => {
            const sym = stageCfg.symptoms.find((s) => s.id === id);
            if (!sym) return null;
            return (
              <button
                key={id}
                type="button"
                onClick={() => openSymptomSheet(id)}
                className="min-h-[36px] rounded-full border bg-white px-3.5 text-xs font-semibold hover:bg-white/80 active:scale-95 transition"
                style={{ borderColor: "var(--stage-border)" }}
              >
                + {sym.label[language]}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => openSymptomSheet("severe_headache_vision")}
            className="min-h-[36px] rounded-full border border-rose-300 bg-rose-50 px-3.5 text-xs font-bold text-rose-900 hover:bg-rose-100 active:scale-95 transition"
          >
            Check Urgent Sign
          </button>
        </div>
      </section>

      {/* 2. INTERACTIVE WEEK EXPLORER (Weeks 1–40 + Trimester Jumps + Tabs) */}
      <section className="saheli-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous week"
              onClick={() => setExploredWeek((w) => Math.max(1, w - 1))}
              className="flex h-10 w-10 items-center justify-center rounded-full border hover:bg-black/5"
              style={{ borderColor: "var(--stage-border)" }}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h3 className="font-editorial text-xl sm:text-2xl font-semibold">
              Week {exploredWeek}
            </h3>
            <button
              type="button"
              aria-label="Next week"
              onClick={() => setExploredWeek((w) => Math.min(40, w + 1))}
              className="flex h-10 w-10 items-center justify-center rounded-full border hover:bg-black/5"
              style={{ borderColor: "var(--stage-border)" }}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { label: "1st Tri", week: 8 },
              { label: "2nd Tri", week: 20 },
              { label: "3rd Tri", week: 32 },
            ].map((tri) => (
              <button
                key={tri.label}
                type="button"
                onClick={() => setExploredWeek(tri.week)}
                className="min-h-[34px] rounded-full border bg-white px-3 text-[11px] font-bold hover:bg-black/5"
                style={{ borderColor: "var(--stage-border)" }}
              >
                {tri.label}
              </button>
            ))}

            {exploredWeek !== currentWeek && (
              <button
                type="button"
                onClick={() => setExploredWeek(currentWeek)}
                className="inline-flex min-h-[34px] items-center gap-1 rounded-full px-3 text-[11px] font-bold"
                style={{
                  backgroundColor: "var(--stage-badge-bg)",
                  color: "var(--stage-badge-text)",
                }}
              >
                <RotateCcw className="h-3 w-3" />
                Week {currentWeek}
              </button>
            )}
          </div>
        </div>

        {/* Interactive Baby / Mother / Checklist Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center saheli-soft-card p-4">
          <div className="sm:col-span-4 flex justify-center">
            <img
              src="/illustrations/pregnancy-hero.jpg"
              alt="Educational baby milestone illustration"
              className="h-36 w-36 rounded-3xl object-cover shadow-sm"
            />
          </div>
          <div className="sm:col-span-8 space-y-3">
            <div className="inline-flex rounded-full bg-white p-1 border" style={{ borderColor: "var(--stage-border)" }}>
              {(
                [
                  { id: "baby", label: "Baby Growth" },
                  { id: "mother", label: "Mother Care" },
                  { id: "checklist", label: "Week Checklist" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setExplorerTab(tab.id)}
                  className={`min-h-[34px] rounded-full px-3 text-xs font-bold transition ${
                    explorerTab === tab.id ? "text-white" : ""
                  }`}
                  style={
                    explorerTab === tab.id
                      ? { backgroundColor: "var(--stage-primary)" }
                      : undefined
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {explorerTab === "baby" && (
              <div className="space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--stage-primary-dark)" }}>
                  {milestone.sizeComparison[language]}
                </p>
                <p className="text-sm leading-relaxed">{milestone.summary[language]}</p>
              </div>
            )}

            {explorerTab === "mother" && (
              <div className="space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--stage-primary-dark)" }}>
                  Everyday Care Tip
                </p>
                <p className="text-sm leading-relaxed">{milestone.motherTip[language]}</p>
              </div>
            )}

            {explorerTab === "checklist" && (
              <div className="space-y-1.5">
                {[
                  { id: "hydrate", label: "Log daily water & rest hours" },
                  { id: "vitamins", label: "Confirm doctor-prescribed supplements" },
                  { id: "questions", label: "Note questions for next prenatal checkup" },
                ].map((item) => (
                  <label key={item.id} className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(checklistDone[item.id])}
                      onChange={(e) =>
                        setChecklistDone((prev) => ({
                          ...prev,
                          [item.id]: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 accent-[var(--stage-primary)]"
                    />
                    <span className={checklistDone[item.id] ? "line-through opacity-60" : ""}>
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Swipeable 1–40 Week Selector */}
        <div
          className="flex gap-1.5 overflow-x-auto no-scrollbar snap-x py-1"
          role="listbox"
          aria-label="Pregnancy weeks 1 to 40"
        >
          {ALL_WEEKS.map((wk) => {
            const active = wk === exploredWeek;
            const isRecorded = wk === currentWeek;
            return (
              <button
                key={wk}
                ref={(el) => {
                  weekBtnRefs.current[wk] = el;
                }}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => setExploredWeek(wk)}
                className={`snap-center min-h-[44px] min-w-[44px] shrink-0 rounded-2xl text-sm font-bold transition ${
                  active ? "text-white shadow-md scale-105" : "hover:bg-black/5"
                }`}
                style={
                  active
                    ? { backgroundColor: "var(--stage-primary)" }
                    : isRecorded
                      ? {
                          backgroundColor: "var(--stage-badge-bg)",
                          color: "var(--stage-badge-text)",
                        }
                      : undefined
                }
              >
                {wk}
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. INTERACTIVE FETAL MOVEMENT LOG + LATEST REPORT + CONTEXTUAL AI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Movement / Kick Counter */}
        <section className="lg:col-span-4 saheli-card p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h3 className="font-editorial text-xl font-semibold">Movement Log</h3>
              <Footprints className="h-5 w-5" style={{ color: "var(--stage-primary)" }} />
            </div>
            <p className="text-xs" style={{ color: "var(--stage-text-muted)" }}>
              {kickLastTime}
            </p>
          </div>

          <div className="saheli-soft-card p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider opacity-70">
                Counted Today
              </p>
              <p className="font-editorial text-4xl font-semibold">{kickCount}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={handleRecordKick}
                className="saheli-pill-cta min-h-[42px] rounded-full px-4 text-xs font-bold active:scale-95 transition"
              >
                +1 Movement
              </button>
              <button
                type="button"
                onClick={() => setKickCount(0)}
                className="text-[11px] font-semibold underline opacity-75"
              >
                Reset session
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openSymptomSheet("reduced_fetal_movement")}
            className="text-left text-[11px] font-bold text-rose-800 underline"
          >
            Feeling noticeably fewer movements? Log urgent check →
          </button>
        </section>

        {/* Latest Report Card */}
        <section className="lg:col-span-4 saheli-card p-5 space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-editorial text-xl font-semibold">Latest Ultrasound</h3>
            <Link
              href="/reports"
              className="text-xs font-bold underline"
              style={{ color: "var(--stage-primary-dark)" }}
            >
              All Reports
            </Link>
          </div>

          {latestReport ? (
            <div className="flex items-center gap-3 saheli-soft-card p-3">
              <img
                src="/illustrations/ultrasound-demo.jpg"
                alt="Ultrasound scan thumbnail"
                className="h-16 w-20 shrink-0 rounded-2xl object-cover"
              />
              <div className="min-w-0 space-y-1">
                <span className="inline-block rounded-full bg-emerald-100 text-emerald-900 px-2 py-0.5 text-[10px] font-bold">
                  Analysed
                </span>
                <p className="truncate text-xs font-bold">{latestReport.file_name}</p>
                <Link
                  href="/reports"
                  className="inline-flex items-center gap-1 text-xs font-bold"
                  style={{ color: "var(--stage-primary-dark)" }}
                >
                  View Findings <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-xs" style={{ color: "var(--stage-text-muted)" }}>
              Upload a synthetic scan to see cited findings.
            </p>
          )}

          <Link
            href="/reports"
            className="saheli-pill-cta flex min-h-[44px] items-center justify-center rounded-full text-xs font-bold"
          >
            Upload New Report
          </Link>
        </section>

        {/* Contextual Saheli AI Card */}
        <section className="lg:col-span-4 saheli-card p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <SaheliLogo size={36} animated />
            <div>
              <h3 className="font-editorial text-xl font-semibold">Ask Saheli AI</h3>
              <p className="text-[11px]" style={{ color: "var(--stage-text-muted)" }}>
                Hindi, Hinglish &amp; English
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            {stageCfg.aiPrompts[language].map((prompt) => (
              <Link
                key={prompt}
                href={`/chat?q=${encodeURIComponent(prompt)}`}
                className="flex min-h-[40px] items-center justify-between gap-2 rounded-2xl border bg-white px-3.5 py-2 text-xs font-semibold hover:bg-black/[0.03]"
                style={{ borderColor: "var(--stage-border)" }}
              >
                <span className="flex items-center gap-1.5 truncate">
                  <Sparkles className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--stage-primary)" }} />
                  <span className="truncate">{prompt}</span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* 4. EXPANDABLE PREGNANCY TIMELINE */}
      <section className="saheli-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-editorial text-xl font-semibold">Pregnancy Timeline</h3>
          <div className="flex flex-wrap gap-1.5">
            {(["all", "symptoms", "appointments", "reports"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setTimelineFilter(f)}
                className={`min-h-[36px] rounded-full px-3.5 text-xs font-bold capitalize transition ${
                  timelineFilter === f ? "text-white" : "border bg-white"
                }`}
                style={
                  timelineFilter === f
                    ? { backgroundColor: "var(--stage-primary)" }
                    : { borderColor: "var(--stage-border)" }
                }
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="relative pl-6 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-purple-200">
          {timelineEvents.map((ev) => {
            const expanded = expandedTimelineId === ev.id;
            return (
              <div key={ev.id} className="relative">
                <span
                  aria-hidden="true"
                  className="absolute -left-[21px] top-4 h-3 w-3 rounded-full ring-4 ring-white"
                  style={{ backgroundColor: "var(--stage-primary)" }}
                />
                <button
                  type="button"
                  onClick={() => setExpandedTimelineId(expanded ? null : ev.id)}
                  className="w-full text-left saheli-soft-card p-4 transition hover:shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold" style={{ color: "var(--stage-primary-dark)" }}>
                        {ev.dateLabel}
                      </p>
                      <p className="text-sm font-bold">{ev.title}</p>
                      <p className="text-xs" style={{ color: "var(--stage-text-muted)" }}>
                        {ev.subtitle}
                      </p>
                    </div>
                    <ChevronRight
                      className={`h-4 w-4 shrink-0 transition-transform ${
                        expanded ? "rotate-90" : ""
                      }`}
                    />
                  </div>
                  {expanded && (
                    <div className="mt-3 pt-2 border-t text-xs space-y-2" style={{ borderColor: "var(--stage-border)" }}>
                      <p>{ev.detail}</p>
                      {ev.href && (
                        <Link
                          href={ev.href}
                          className="inline-flex items-center gap-1 font-bold underline"
                          style={{ color: "var(--stage-primary-dark)" }}
                        >
                          Open details <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  )}
                </button>
              </div>
            );
          })}
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
