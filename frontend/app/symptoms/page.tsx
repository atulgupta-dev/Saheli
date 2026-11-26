"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Download, FileText, Loader2, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { SymptomCheckinSheet } from "@/components/symptoms/SymptomCheckinSheet";
import { InteractiveCalendar } from "@/components/symptoms/InteractiveCalendar";
import { useSaheli } from "@/providers/AppProviders";
import { saheliApi } from "@/lib/api/client";
import { CareSummaryResponse, SymptomJournalEntry } from "@/types/saheli";

export default function SymptomsPage() {
  const {
    activeStage,
    symptoms,
    reports,
    mode,
    getApiContext,
    updateSymptomEntry,
    showToast,
  } = useSaheli();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [filterRange, setFilterRange] = useState<"all" | "weekly" | "monthly">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryResult, setSummaryResult] = useState<CareSummaryResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const stageSymptoms = useMemo(() => {
    const list = symptoms.filter((s) => s.stage === activeStage);
    if (filterRange === "all") return list;
    const now = Date.now();
    const days = filterRange === "weekly" ? 7 : 30;
    return list.filter(
      (s) => now - new Date(s.reported_at).getTime() <= days * 86400000
    );
  }, [symptoms, activeStage, filterRange]);

  const handleSaveEdit = (entry: SymptomJournalEntry) => {
    updateSymptomEntry({ ...entry, notes: editNotes.trim() || undefined });
    setEditingId(null);
    showToast("Journal note updated");
  };

  const handleGenerateSummary = async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const ctx = await getApiContext();
      const stageReports = reports
        .filter((r) => r.stage === activeStage && r.status === "completed")
        .map((r) => r.report_id);
      const res = await saheliApi.generateCareSummary(
        {
          stage: activeStage,
          report_ids: stageReports,
          include_symptoms: true,
        },
        ctx
      );
      setSummaryResult(res);
    } catch (err) {
      setSummaryError(
        err instanceof Error ? err.message : "Could not generate clinician summary."
      );
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleCopySummary = async () => {
    if (!summaryResult) return;
    await navigator.clipboard.writeText(
      `${summaryResult.summary}\n\n${summaryResult.medical_disclaimer}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSummary = () => {
    if (!summaryResult) return;
    const blob = new Blob(
      [`${summaryResult.summary}\n\n${summaryResult.medical_disclaimer}\n`],
      { type: "text/plain;charset=utf-8" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `saheli-clinician-summary-${activeStage}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell
      title="Symptom Journal"
      subtitle="Reviewed warning-sign checks & clinician summary"
    >
      {/* Prominent Daily Check-in Trigger */}
      <section className="saheli-card p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-editorial text-2xl font-semibold">How are you feeling today?</h2>
          <p className="text-xs sm:text-sm" style={{ color: "var(--stage-text-muted)" }}>
            Log symptoms with severity and notes. Urgent warning signs trigger immediate care guidance.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="saheli-pill-cta inline-flex min-h-[48px] items-center gap-2 rounded-full px-6 text-sm font-bold"
        >
          <Plus className="h-4 w-4" /> Open Daily Check-in
        </button>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5">
          <InteractiveCalendar entries={stageSymptoms} />
        </div>

        {/* Recorded Entries */}
        <section className="lg:col-span-7 saheli-card p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-editorial text-xl font-semibold">
              Recorded Entries ({stageSymptoms.length})
            </h2>
            <div className="inline-flex rounded-full border p-1" style={{ borderColor: "var(--stage-border)" }}>
              {(["all", "weekly", "monthly"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setFilterRange(r)}
                  className={`min-h-[34px] rounded-full px-3 text-xs font-bold capitalize ${
                    filterRange === r ? "text-white" : ""
                  }`}
                  style={
                    filterRange === r
                      ? { backgroundColor: "var(--stage-primary)" }
                      : undefined
                  }
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {stageSymptoms.length === 0 ? (
            <p className="text-sm py-4" style={{ color: "var(--stage-text-muted)" }}>
              No symptom entries recorded for this stage yet.
            </p>
          ) : (
            <div className="space-y-3">
              {stageSymptoms.map((entry) => (
                <article key={entry.entry_id} className="saheli-soft-card p-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm">{entry.symptoms.join(", ")}</span>
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold capitalize">
                        {entry.severity}
                      </span>
                      {entry.is_demo && (
                        <span className="text-[11px] opacity-65">(Demo)</span>
                      )}
                    </div>
                    <span className="text-xs" style={{ color: "var(--stage-text-muted)" }}>
                      {new Date(entry.reported_at).toLocaleString("en-IN")}
                    </span>
                  </div>

                  {editingId === entry.entry_id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        className="flex-1 min-h-[40px] rounded-full border bg-white px-3.5 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(entry)}
                        className="min-h-[40px] rounded-full px-4 text-xs font-bold text-white"
                        style={{ backgroundColor: "var(--stage-primary)" }}
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs opacity-85">{entry.notes || "No notes."}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(entry.entry_id);
                          setEditNotes(entry.notes || "");
                        }}
                        className="text-xs font-bold underline shrink-0"
                      >
                        Edit note
                      </button>
                    </div>
                  )}

                  {entry.safety.message && (
                    <p className="text-xs font-semibold opacity-80">
                      Assessment ({entry.safety.level}): {entry.safety.message}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Clinician Summary */}
      <section id="clinician-summary" className="saheli-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-editorial text-xl font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" style={{ color: "var(--stage-primary)" }} />
              Clinician-Ready Summary
            </h2>
            <p className="text-xs" style={{ color: "var(--stage-text-muted)" }}>
              Review before sharing or downloading for your doctor appointment.
            </p>
          </div>
          <button
            type="button"
            disabled={summaryLoading}
            onClick={handleGenerateSummary}
            className="saheli-pill-cta inline-flex min-h-[44px] items-center gap-2 rounded-full px-5 text-xs sm:text-sm font-bold disabled:opacity-60"
          >
            {summaryLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Generate Summary ({mode === "demo" ? "Demo" : "Live"})
          </button>
        </div>

        {summaryError && (
          <div role="alert" className="rounded-2xl border border-red-300 bg-red-50 p-3 text-xs font-semibold text-red-900">
            {summaryError}
          </div>
        )}

        {summaryResult && (
          <div className="saheli-soft-card p-4 space-y-3">
            <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm leading-relaxed">
              {summaryResult.summary}
            </pre>
            <p className="text-xs font-bold opacity-80">
              Disclaimer: {summaryResult.medical_disclaimer}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCopySummary}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-white border px-4 text-xs font-bold"
                style={{ borderColor: "var(--stage-border)" }}
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy text"}
              </button>
              <button
                type="button"
                onClick={handleDownloadSummary}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-white border px-4 text-xs font-bold"
                style={{ borderColor: "var(--stage-border)" }}
              >
                <Download className="h-3.5 w-3.5" />
                Download .txt
              </button>
            </div>
          </div>
        )}
      </section>

      <SymptomCheckinSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </AppShell>
  );
}
