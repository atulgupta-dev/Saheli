export type LifeStage = "menstrual" | "pregnancy" | "postpartum";

export type AppLanguage = "en-IN" | "hi-IN" | "hi-Latn";

export type AppMode = "demo" | "live";

export type SafetyLevel = "informational" | "consult" | "urgent";

export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
    request_id?: string;
  };
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
}

export interface ConsentSettings {
  store_conversations: boolean;
  store_reports: boolean;
}

export interface MenstrualStageProfile {
  last_period_date?: string;
  typical_cycle_length?: number;
  typical_period_length?: number;
}

export interface PregnancyStageProfile {
  gestational_week?: number;
  estimated_due_date?: string;
  trimester?: 1 | 2 | 3;
}

export interface PostpartumStageProfile {
  weeks_postpartum?: number;
  wellness_goals?: string[];
}

export interface UserProfile {
  user_id: string;
  display_name?: string;
  active_stage: LifeStage;
  locale: AppLanguage;
  consent: ConsentSettings;
  stage_profiles: {
    menstrual?: MenstrualStageProfile;
    pregnancy?: PregnancyStageProfile;
    postpartum?: PostpartumStageProfile;
  };
  is_demo?: boolean;
}

export interface StagePatchResponse {
  active_stage: LifeStage;
}

export interface SafetyAssessment {
  level: SafetyLevel;
  message: string | null;
  rule_ids?: string[];
  next_steps?: string[];
}

export interface ChatRequest {
  stage: LifeStage;
  message: string;
  locale: AppLanguage;
  conversation_id: string | null;
  save_to_memory: boolean;
}

export interface ChatResponse {
  conversation_id: string;
  reply: string;
  sources: string[];
  safety: SafetyAssessment;
  memory_saved: boolean;
  memory_used?: boolean;
  memory_context_summary?: string | null;
}

export interface ChatMessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  safety?: SafetyAssessment;
  sources?: string[];
  memoryUsed?: boolean;
  memoryContextSummary?: string | null;
  error?: boolean;
}

export interface SymptomLogRequest {
  stage: LifeStage;
  reported_at: string;
  symptoms: string[];
  severity?: "mild" | "moderate" | "severe";
  notes?: string;
}

export interface SymptomLogResponse {
  entry_id: string;
  saved: boolean;
  safety: SafetyAssessment;
}

export interface SymptomJournalEntry {
  entry_id: string;
  stage: LifeStage;
  reported_at: string;
  symptoms: string[];
  severity: "mild" | "moderate" | "severe";
  notes?: string;
  safety: SafetyAssessment;
  is_demo?: boolean;
}

export type ReportProcessingStatus =
  | "uploading"
  | "processing"
  | "extracting"
  | "explaining"
  | "completed"
  | "failed";

export interface ReportMeasurement {
  name: string;
  value: string | null;
  unit?: string | null;
  reference_note?: string | null;
  page?: number;
}

export interface ReportCitation {
  page: number;
  quote: string;
}

export interface ReportRecord {
  report_id: string;
  file_name: string;
  uploaded_at: string;
  stage: LifeStage;
  status: ReportProcessingStatus;
  extracted: {
    gestational_age_weeks: number | null;
    report_date?: string | null;
    measurements: ReportMeasurement[];
  };
  explanations: string[];
  citations: ReportCitation[];
  warnings: string[];
  clinician_questions?: string[];
  error_message?: string;
  is_demo?: boolean;
}

export interface CareSummaryRequest {
  stage: LifeStage;
  report_ids: string[];
  include_symptoms: boolean;
}

export interface CareSummaryResponse {
  summary: string;
  references: string[];
  medical_disclaimer: string;
}

export interface MotherHealthMetrics {
  heart_rate_bpm?: { value: number; recorded_at: string; source: string };
  blood_pressure?: { value: string; recorded_at: string; source: string };
  sleep_hours?: { value: number; recorded_at: string; source: string };
  water_litres?: { value: number; target_litres: number; recorded_at: string };
}

export interface AppointmentItem {
  id: string;
  title: string;
  date: string;
  clinician: string;
  location: string;
  notes: string;
  week?: number;
  is_demo?: boolean;
}
