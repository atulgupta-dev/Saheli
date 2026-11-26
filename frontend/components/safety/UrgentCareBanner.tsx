"use client";

import Link from "next/link";
import { AlertTriangle, FileText, MapPin, X } from "lucide-react";
import { SafetyAssessment } from "@/types/saheli";

interface UrgentCareBannerProps {
  safety: SafetyAssessment;
  onDismiss?: () => void;
}

export function UrgentCareBanner({ safety, onDismiss }: UrgentCareBannerProps) {
  if (safety.level !== "urgent" && safety.level !== "consult") return null;

  const isUrgent = safety.level === "urgent";

  return (
    <section
      role={isUrgent ? "alert" : "status"}
      aria-live={isUrgent ? "assertive" : "polite"}
      className={`relative overflow-hidden rounded-[28px] border-2 p-5 sm:p-6 shadow-md ${
        isUrgent
          ? "border-[#BE294D] bg-[#FFF4F6] text-[#3F121D]"
          : "border-amber-500 bg-amber-50 text-amber-950"
      }`}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-8 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white ${
                  isUrgent ? "bg-[#BE294D]" : "bg-amber-600"
                }`}
              >
                <AlertTriangle className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider">
                  {isUrgent ? "URGENT CARE RECOMMENDED" : "CONSULT CLINICIAN"}
                  {safety.rule_ids && safety.rule_ids.length > 0
                    ? ` • ${safety.rule_ids.join(", ")}`
                    : ""}
                </p>
                <h2 className="font-editorial text-2xl sm:text-3xl font-semibold leading-tight">
                  {isUrgent ? "Seek Medical Care Soon" : "Monitor & Consult"}
                </h2>
              </div>
            </div>

            {!isUrgent && onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                aria-label="Dismiss notice"
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/5"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          <p className="text-sm font-semibold leading-relaxed">{safety.message}</p>

          {safety.next_steps && safety.next_steps.length > 0 && (
            <ul className="space-y-1 text-xs sm:text-sm list-disc pl-5">
              {safety.next_steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ul>
          )}

          <p className="text-[11px] opacity-80">
            Educational safety guidance only — Saheli AI does not diagnose conditions or replace emergency care.
          </p>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <Link
              href="/care"
              className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full px-6 text-sm font-bold text-white shadow-sm ${
                isUrgent ? "bg-[#A62447] hover:bg-[#8E1C3B]" : "bg-amber-700 hover:bg-amber-800"
              }`}
            >
              <MapPin className="h-4 w-4" aria-hidden="true" />
              Find Nearby Care
            </Link>
            <Link
              href="/symptoms#clinician-summary"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-current/25 bg-white px-6 text-sm font-bold hover:bg-white/90"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              Create Clinician Summary
            </Link>
          </div>
        </div>

        {/* Clinician Illustration on Desktop/Tablet (Design Book Page 15) */}
        <div className="hidden md:flex md:col-span-4 justify-end">
          <img
            src="/illustrations/clinician-care.jpg"
            alt="Clinician support illustration"
            className="h-44 w-44 rounded-3xl object-cover shadow-xs"
          />
        </div>
      </div>
    </section>
  );
}
