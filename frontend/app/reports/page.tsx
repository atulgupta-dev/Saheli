"use client";

import { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  FileText,
  Loader2,
  Quote,
  RefreshCw,
  Search,
  Upload,
  X,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useSaheli } from "@/providers/AppProviders";
import { validateReportFile } from "@/lib/validation/schemas";
import { saheliApi } from "@/lib/api/client";
import { ReportProcessingStatus, ReportRecord } from "@/types/saheli";

const STATUS_LABELS: Record<ReportProcessingStatus, string> = {
  uploading: "Uploading document...",
  processing: "Processing document...",
  extracting: "Extracting recorded findings...",
  explaining: "Preparing plain-language explanation...",
  completed: "Analysed",
  failed: "Failed",
};

export default function ReportsPage() {
  const {
    activeStage,
    profile,
    reports,
    addOrUpdateReport,
    mode,
    isOnline,
    t,
    getApiContext,
    showToast,
  } = useSaheli();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "ultrasound" | "blood" | "other">("all");
  const [readerTab, setReaderTab] = useState<"report" | "findings" | "explanation">("findings");
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState<ReportProcessingStatus | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(
    reports[0]?.report_id ?? null
  );
  const [highlightedPage, setHighlightedPage] = useState<number | null>(null);

  const stageReports = useMemo(() => {
    return reports
      .filter((r) => r.stage === activeStage)
      .filter((r) => {
        if (!searchQuery.trim()) return true;
        return r.file_name.toLowerCase().includes(searchQuery.toLowerCase());
      })
      .filter((r) => {
        if (categoryFilter === "all") return true;
        const lower = r.file_name.toLowerCase();
        if (categoryFilter === "ultrasound") return lower.includes("scan") || lower.includes("usg") || lower.includes("ultrasound");
        if (categoryFilter === "blood") return lower.includes("blood") || lower.includes("cbc") || lower.includes("thyroid");
        return !lower.includes("scan") && !lower.includes("usg") && !lower.includes("blood");
      });
  }, [reports, activeStage, searchQuery, categoryFilter]);

  const activeReport: ReportRecord | undefined =
    stageReports.find((r) => r.report_id === selectedReportId) ?? stageReports[0];

  const handleFile = async (file: File) => {
    setUploadError(null);
    const validationErr = validateReportFile(file);
    if (validationErr) {
      setUploadError(validationErr);
      setStatus("failed");
      return;
    }

    if (mode === "live" && !isOnline) {
      setUploadError("Report upload requires an active internet connection in Live Mode.");
      setStatus("failed");
      return;
    }

    setLastFile(file);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("uploading");
    try {
      const ctx = await getApiContext();
      setStatus("processing");
      const result = await saheliApi.uploadReport(
        file,
        activeStage,
        profile.consent.store_reports,
        ctx,
        controller.signal
      );

      let finalResult = result;
      if (result.status !== "completed" && result.status !== "failed" && mode === "live") {
        setStatus("extracting");
        for (let attempt = 0; attempt < 6; attempt += 1) {
          await new Promise((r) => setTimeout(r, 1200));
          finalResult = await saheliApi.getReport(
            result.report_id,
            activeStage,
            file.name,
            ctx,
            controller.signal
          );
          if (finalResult.status === "completed" || finalResult.status === "failed") {
            break;
          }
        }
      }

      if (finalResult.status === "failed") {
        setStatus("failed");
        setUploadError(finalResult.error_message || "Report extraction failed on server.");
        return;
      }

      setStatus("completed");
      addOrUpdateReport(finalResult);
      setSelectedReportId(finalResult.report_id);
      setReaderTab("findings");
      showToast("Report analysed with source citations");
    } catch (err) {
      setStatus("failed");
      setUploadError(
        err instanceof Error ? err.message : "Could not process report. Please retry."
      );
    }
  };

  return (
    <AppShell
      title="My Reports"
      subtitle="Document library & transparent source-cited findings"
    >
      {activeStage !== "pregnancy" && (
        <div role="status" className="saheli-soft-card p-3.5 text-xs font-semibold">
          <strong>{t.badges.comingSoon}:</strong> Report intelligence is implemented for Pregnancy ultrasound/lab reports in MVP.
        </div>
      )}

      {/* Report Library (Design Book Page 13) */}
      <section className="saheli-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {(["all", "ultrasound", "blood", "other"] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`min-h-[38px] rounded-full px-4 text-xs font-bold capitalize transition ${
                  categoryFilter === cat ? "text-white" : "border bg-white"
                }`}
                style={
                  categoryFilter === cat
                    ? { backgroundColor: "var(--stage-primary)" }
                    : { borderColor: "var(--stage-border)" }
                }
              >
                {cat === "blood" ? "Blood Test" : cat}
              </button>
            ))}
          </div>

          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
            <input
              type="search"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-[40px] rounded-full border pl-9 pr-3 text-xs bg-white"
              style={{ borderColor: "var(--stage-border)" }}
            />
          </div>
        </div>

        {/* Document Thumbnails List */}
        {stageReports.length > 0 ? (
          <div className="space-y-2.5">
            {stageReports.map((rep) => {
              const selected = rep.report_id === activeReport?.report_id;
              const isScan =
                rep.file_name.toLowerCase().includes("scan") ||
                rep.file_name.toLowerCase().includes("usg");
              return (
                <button
                  key={rep.report_id}
                  type="button"
                  onClick={() => setSelectedReportId(rep.report_id)}
                  className={`w-full flex items-center justify-between gap-3 rounded-[22px] border p-3 text-left transition ${
                    selected ? "ring-2" : "bg-white hover:bg-black/[0.02]"
                  }`}
                  style={{
                    borderColor: selected ? "var(--stage-primary)" : "var(--stage-border)",
                    backgroundColor: selected ? "var(--stage-surface-muted)" : undefined,
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isScan ? (
                      <img
                        src="/illustrations/ultrasound-demo.jpg"
                        alt="Synthetic ultrasound scan thumbnail"
                        className="h-14 w-16 shrink-0 rounded-2xl object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-14 w-16 shrink-0 items-center justify-center rounded-2xl"
                        style={{ backgroundColor: "var(--stage-badge-bg)", color: "var(--stage-primary)" }}
                      >
                        <FileText className="h-6 w-6" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-bold text-sm">{rep.file_name}</p>
                      <p className="text-xs" style={{ color: "var(--stage-text-muted)" }}>
                        {rep.extracted.report_date ??
                          new Date(rep.uploaded_at).toLocaleDateString("en-IN")}
                        {rep.is_demo ? " • Synthetic Sample" : ""}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-100 text-emerald-900 px-3 py-1 text-[11px] font-bold">
                    {rep.status === "completed" ? "Analysed" : rep.status}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-xs py-2" style={{ color: "var(--stage-text-muted)" }}>
            No reports match this filter yet.
          </p>
        )}

        {/* Upload Dropzone + CTA */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            const dropped = e.dataTransfer.files?.[0];
            if (dropped) handleFile(dropped);
          }}
          className={`rounded-3xl border-2 border-dashed p-4 text-center transition ${
            dragActive ? "bg-purple-50" : "bg-white/60"
          }`}
          style={{ borderColor: dragActive ? "var(--stage-primary)" : "var(--stage-border)" }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/jpeg,image/png"
            className="sr-only"
            aria-label="Choose PDF or image report"
            onChange={(e) => {
              const chosen = e.target.files?.[0];
              if (chosen) handleFile(chosen);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="saheli-pill-cta inline-flex w-full sm:w-auto min-h-[48px] items-center justify-center gap-2 rounded-full px-7 text-sm font-bold"
          >
            <Upload className="h-4 w-4" />
            Upload New Report (PDF / JPEG / PNG)
          </button>
          <p className="text-[11px] mt-2" style={{ color: "var(--stage-text-muted)" }}>
            Use synthetic test reports only. Stored only if report history consent is enabled.
          </p>
        </div>

        {status && status !== "completed" && status !== "failed" && (
          <div className="saheli-soft-card flex items-center justify-between gap-3 p-3.5 text-xs font-semibold">
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {STATUS_LABELS[status]}
            </span>
            <button
              type="button"
              onClick={() => {
                abortRef.current?.abort();
                setStatus(null);
              }}
              className="inline-flex items-center gap-1 font-bold underline"
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
          </div>
        )}

        {uploadError && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-red-300 bg-red-50 p-3.5 text-xs font-semibold text-red-900"
          >
            <span className="inline-flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {uploadError}
            </span>
            {lastFile && (
              <button
                type="button"
                onClick={() => handleFile(lastFile)}
                className="inline-flex min-h-[36px] items-center gap-1 rounded-full bg-red-700 px-3 text-xs font-bold text-white"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </button>
            )}
          </div>
        )}
      </section>

      {/* Report Explanation Reader (Design Book Page 14) */}
      {activeReport && (
        <section className="saheli-card p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-editorial text-2xl font-semibold">
              {activeReport.file_name}
            </h2>
            <div className="flex gap-1.5 lg:hidden">
              {(["report", "findings", "explanation"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setReaderTab(tab)}
                  className={`min-h-[36px] rounded-full px-3.5 text-xs font-bold capitalize ${
                    readerTab === tab ? "text-white" : "border bg-white"
                  }`}
                  style={
                    readerTab === tab
                      ? { backgroundColor: "var(--stage-primary)" }
                      : { borderColor: "var(--stage-border)" }
                  }
                >
                  {tab === "findings" ? "Key Findings" : tab}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop Split View / Mobile Tabbed View */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Document Preview + Source Citations */}
            <div className={`lg:col-span-5 space-y-3 ${readerTab === "report" ? "block" : "hidden lg:block"}`}>
              <div className="overflow-hidden rounded-3xl border bg-[#1E2229] text-white" style={{ borderColor: "var(--stage-border)" }}>
                <img
                  src="/illustrations/ultrasound-demo.jpg"
                  alt="Synthetic document preview"
                  className="w-full h-48 object-cover"
                />
                <div className="p-3 text-xs flex items-center justify-between bg-black/40">
                  <span>Document Preview {activeReport.is_demo ? "(Synthetic)" : ""}</span>
                  <span>Page {highlightedPage ?? 1}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--stage-text-muted)" }}>
                  Source Citations
                </p>
                {activeReport.citations.map((cit, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setHighlightedPage(cit.page)}
                    className={`w-full text-left rounded-2xl border p-3 text-xs leading-relaxed transition ${
                      highlightedPage === cit.page ? "ring-2 bg-purple-50/70" : "bg-white"
                    }`}
                    style={{ borderColor: "var(--stage-border)" }}
                  >
                    <span className="inline-flex items-center gap-1 font-bold mr-1">
                      <Quote className="h-3 w-3" /> Page {cit.page}:
                    </span>
                    &ldquo;{cit.quote}&rdquo;
                  </button>
                ))}
              </div>
            </div>

            {/* Key Findings & AI Explanations */}
            <div className={`lg:col-span-7 space-y-5 ${readerTab !== "report" ? "block" : "hidden lg:block"}`}>
              <div className={readerTab === "explanation" ? "hidden lg:block space-y-2.5" : "space-y-2.5"}>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Key Findings (Extracted from Document)
                </p>
                <div className="space-y-2">
                  {activeReport.extracted.measurements.map((m, idx) => (
                    <button
                      key={`${m.name}-${idx}`}
                      type="button"
                      onClick={() => setHighlightedPage(m.page ?? 1)}
                      className="w-full flex items-center justify-between gap-3 rounded-2xl border bg-white p-3.5 text-left hover:bg-black/[0.02]"
                      style={{ borderColor: "var(--stage-border)" }}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        <div>
                          <p className="text-sm font-bold">
                            {m.name}: {m.value ?? "Unknown"} {m.unit ?? ""}
                          </p>
                          {m.reference_note && (
                            <p className="text-xs" style={{ color: "var(--stage-text-muted)" }}>
                              {m.reference_note}
                            </p>
                          )}
                        </div>
                      </div>
                      {m.page && (
                        <span className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold" style={{ backgroundColor: "var(--stage-badge-bg)", color: "var(--stage-badge-text)" }}>
                          p.{m.page}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className={readerTab === "findings" ? "hidden lg:block space-y-2.5" : "space-y-2.5"}>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--stage-primary-dark)" }}>
                  What This Means (AI Plain-Language Explanation)
                </p>
                <div className="saheli-soft-card p-4 space-y-2 text-xs sm:text-sm leading-relaxed">
                  {activeReport.explanations.map((exp, i) => (
                    <p key={i}>{exp}</p>
                  ))}
                </div>

                {activeReport.clinician_questions &&
                  activeReport.clinician_questions.length > 0 && (
                    <div className="rounded-2xl border p-4 space-y-1.5" style={{ borderColor: "var(--stage-border)" }}>
                      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--stage-text-muted)" }}>
                        Questions to Discuss With Your Clinician
                      </p>
                      <ul className="list-disc pl-5 text-xs space-y-1">
                        {activeReport.clinician_questions.map((q, idx) => (
                          <li key={idx}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </section>
      )}
    </AppShell>
  );
}
