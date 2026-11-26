import { z } from "zod";

export const symptomFormSchema = z.object({
  symptoms: z.array(z.string()).min(1, "Select at least one symptom or add a note."),
  severity: z.enum(["mild", "moderate", "severe"]),
  notes: z.string().max(600, "Keep notes under 600 characters.").optional(),
});

export const onboardingPersonalSchema = z.object({
  gestational_week: z.coerce.number().min(4).max(42).optional(),
  last_period_date: z.string().optional(),
  typical_cycle_length: z.coerce.number().min(20).max(45).optional(),
  weeks_postpartum: z.coerce.number().min(0).max(104).optional(),
});

export const MAX_REPORT_SIZE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_REPORT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

export function validateReportFile(file: File): string | null {
  if (!ALLOWED_REPORT_TYPES.has(file.type)) {
    return "Unsupported file format. Please upload a PDF, JPEG, or PNG report.";
  }
  if (file.size > MAX_REPORT_SIZE_BYTES) {
    return "File exceeds 10 MB limit. Please upload a smaller scan or compressed PDF.";
  }
  return null;
}
