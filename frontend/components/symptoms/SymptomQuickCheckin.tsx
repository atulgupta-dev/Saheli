"use client";

import { useState } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import { LIFE_STAGE_CONFIGS } from "@/config/life-stages";
import { useSaheli } from "@/providers/AppProviders";
import { saheliApi } from "@/lib/api/client";
import { SafetyAssessment, SymptomJournalEntry } from "@/types/saheli";
import { UrgentCareBanner } from "@/components/safety/UrgentCareBanner";

export function SymptomQuickCheckin({
  compact = false,
}: {
  compact?: boolean;
}) {
  const {
    activeStage,
    language,
    mode,
    isOnline,
    t,
    getApiContext,
    addSymptomEntry,
    showToast,
  } = useSaheli();

  const stageCfg = LIFE_STAGE_CONFIGS[activeStage];
  const [selected, setSelected] = useState<string[]>([]);
  const [severity, setSeverity] = useState<"mild" | "moderate" | "severe">("mild");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastSafety, setLastSafety] = useState<SafetyAssessment | null>(null);

  const toggleSymptom = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (selected.length === 0 && !notes.trim()) {
      setErrorMsg("Select at least one symptom or add a short note.");
      return;
    }

    if (mode === "live" && !isOnline) {
      setErrorMsg(
        "Safety assessment requires connectivity in Live Mode. Could not assess symptoms while offline."
      );
      return;
    }

    setSubmitting(true);
    try {
      const ctx = await getApiContext();
      const payload = {
        stage: activeStage,
        reported_at: new Date().toISOString(),
        symptoms: selected.length > 0 ? selected : ["other"],
        severity,
        notes: notes.trim() || undefined,
      };
      const res = await saheliApi.logSymptom(payload, ctx);
      const entry: SymptomJournalEntry = {
        entry_id: res.entry_id,
        stage: activeStage,
        reported_at: payload.reported_at,
        symptoms: payload.symptoms,
        severity,
        notes: payload.notes,
        safety: res.safety,
        is_demo: mode === "demo",
      };
      addSymptomEntry(entry);
      setLastSafety(res.safety);
      setSelected([]);
      setNotes("");
      showToast(t.common.saved);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Symptom safety service is unavailable. Symptoms could not be assessed.";
      setErrorMsg(msg);
      setLastSafety(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="saheli-card p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-extrabold">Daily Symptom Check-in</h2>
          <p className="text-xs opacity-75">
            {activeStage === "pregnancy"
              ? "Connected to deterministic pregnancy warning-sign checks."
              : `${t.badges.comingSoon}: Live safety rules focus on Pregnancy in MVP; demo logging available.`}
          </p>
        </div>
        {activeStage !== "pregnancy" && (
          <span
            className="rounded-full px-3 py-1 text-xs font-bold"
            style={{
              backgroundColor: "var(--stage-badge-bg)",
              color: "var(--stage-badge-text)",
            }}
          >
            {t.badges.comingSoon}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Symptom choices">
          {stageCfg.symptoms.map((sym) => {
            const isSelected = selected.includes(sym.id);
            return (
              <button
                key={sym.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleSymptom(sym.id)}
                className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-2xl border px-3.5 py-2 text-xs sm:text-sm font-semibold transition active:scale-95 ${
                  isSelected ? "text-white shadow-sm" : "bg-white hover:bg-black/5"
                }`}
                style={
                  isSelected
                    ? {
                        backgroundColor: sym.urgentHint
                          ? "#B91C1C"
                          : "var(--stage-primary)",
                        borderColor: sym.urgentHint
                          ? "#B91C1C"
                          : "var(--stage-primary)",
                      }
                    : { borderColor: "var(--stage-border)" }
                }
              >
                {isSelected && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                <span>{sym.label[language]}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wide opacity-70">
            Severity:
          </span>
          {(["mild", "moderate", "severe"] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setSeverity(lvl)}
              className={`min-h-[38px] rounded-xl px-3 text-xs font-bold capitalize transition ${
                severity === lvl ? "text-white" : "border bg-white"
              }`}
              style={
                severity === lvl
                  ? { backgroundColor: "var(--stage-primary-dark)" }
                  : { borderColor: "var(--stage-border)" }
              }
            >
              {lvl}
            </button>
          ))}
        </div>

        {!compact && (
          <label className="block space-y-1">
            <span className="text-xs font-bold opacity-75">Optional notes</span>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add timing, triggers, or anything you want to mention to your doctor..."
              className="w-full rounded-2xl border p-3 text-sm bg-white"
              style={{ borderColor: "var(--stage-border)" }}
            />
          </label>
        )}

        {errorMsg && (
          <div
            role="alert"
            className="rounded-2xl border border-red-300 bg-red-50 p-3 text-xs sm:text-sm font-semibold text-red-900"
          >
            {errorMsg}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold text-white transition active:scale-95 disabled:opacity-60"
            style={{ backgroundColor: "var(--stage-primary)" }}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t.common.saving}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {t.common.save}
              </>
            )}
          </button>
          <span className="text-xs opacity-65">
            {mode === "demo"
              ? "Demo safety rules active"
              : "Assessed via FastAPI safety service"}
          </span>
        </div>
      </form>

      {lastSafety && lastSafety.level === "informational" && (
        <div
          role="status"
          className="saheli-soft-card p-3.5 text-xs sm:text-sm font-medium"
        >
          {lastSafety.message}
        </div>
      )}

      {lastSafety && (lastSafety.level === "urgent" || lastSafety.level === "consult") && (
        <UrgentCareBanner safety={lastSafety} />
      )}
    </div>
  );
}
