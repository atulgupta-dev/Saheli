import {
  ApiErrorPayload,
  AppMode,
  CareSummaryRequest,
  CareSummaryResponse,
  ChatRequest,
  ChatResponse,
  HealthResponse,
  LifeStage,
  ReportRecord,
  StagePatchResponse,
  SymptomJournalEntry,
  SymptomLogRequest,
  SymptomLogResponse,
  UserProfile,
} from "@/types/saheli";
import {
  mockCareSummary,
  mockChat,
  mockLogSymptom,
  mockUploadReport,
} from "@/lib/api/mockAdapter";

export class ApiClientError extends Error {
  code: string;
  status: number;
  requestId?: string;

  constructor(message: string, code = "API_ERROR", status = 500, requestId?: string) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
    this.requestId = requestId;
  }
}

export function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    ""
  ).replace(/\/$/, "");
}

export function isBackendConfigured(): boolean {
  return Boolean(getApiBaseUrl());
}

async function liveFetch<T>(
  path: string,
  options: RequestInit & { token?: string | null; signal?: AbortSignal } = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new ApiClientError(
      "Backend API URL is not configured (NEXT_PUBLIC_API_BASE_URL).",
      "BACKEND_UNCONFIGURED",
      503
    );
  }

  const headers = new Headers(options.headers);
  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
      signal: options.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiClientError("Request was cancelled.", "REQUEST_CANCELLED", 499);
    }
    throw new ApiClientError(
      "Could not reach the Saheli server. Please check your connection and try again.",
      "NETWORK_ERROR",
      0
    );
  }

  if (!response.ok) {
    let parsed: ApiErrorPayload | null = null;
    try {
      parsed = (await response.json()) as ApiErrorPayload;
    } catch {
      parsed = null;
    }
    throw new ApiClientError(
      parsed?.error?.message || `Request failed with status ${response.status}`,
      parsed?.error?.code || `HTTP_${response.status}`,
      response.status,
      parsed?.error?.request_id
    );
  }

  return (await response.json()) as T;
}

export interface ApiClientContext {
  mode: AppMode;
  token?: string | null;
  demoSymptoms?: SymptomJournalEntry[];
  demoReports?: ReportRecord[];
  consentMemory?: boolean;
}

export const saheliApi = {
  async health(signal?: AbortSignal): Promise<HealthResponse> {
    return liveFetch<HealthResponse>("/health", { method: "GET", signal });
  },

  async getProfile(ctx: ApiClientContext, signal?: AbortSignal): Promise<UserProfile> {
    if (ctx.mode === "demo") {
      throw new ApiClientError("Use local demo profile store in demo mode.", "DEMO_LOCAL", 200);
    }
    return liveFetch<UserProfile>("/api/v1/profile", {
      method: "GET",
      token: ctx.token,
      signal,
    });
  },

  async switchStage(
    stage: LifeStage,
    ctx: ApiClientContext,
    signal?: AbortSignal
  ): Promise<StagePatchResponse> {
    if (ctx.mode === "demo") {
      return { active_stage: stage };
    }
    return liveFetch<StagePatchResponse>("/api/v1/profile/stage", {
      method: "PATCH",
      body: JSON.stringify({ active_stage: stage }),
      token: ctx.token,
      signal,
    });
  },

  async sendChat(
    req: ChatRequest,
    ctx: ApiClientContext,
    signal?: AbortSignal
  ): Promise<ChatResponse> {
    if (ctx.mode === "demo") {
      return mockChat(req, {
        recentSymptoms: ctx.demoSymptoms ?? [],
        consentMemory: Boolean(ctx.consentMemory),
      });
    }
    return liveFetch<ChatResponse>("/api/v1/chat", {
      method: "POST",
      body: JSON.stringify(req),
      token: ctx.token,
      signal,
    });
  },

  async logSymptom(
    req: SymptomLogRequest,
    ctx: ApiClientContext,
    signal?: AbortSignal
  ): Promise<SymptomLogResponse> {
    if (ctx.mode === "demo") {
      return mockLogSymptom(req);
    }
    return liveFetch<SymptomLogResponse>("/api/v1/symptoms", {
      method: "POST",
      body: JSON.stringify(req),
      token: ctx.token,
      signal,
    });
  },

  async uploadReport(
    file: File,
    stage: LifeStage,
    consentToStore: boolean,
    ctx: ApiClientContext,
    signal?: AbortSignal
  ): Promise<ReportRecord> {
    if (ctx.mode === "demo") {
      return mockUploadReport(file, stage);
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("stage", stage);
    formData.append("consent_to_store", String(consentToStore));

    const raw = await liveFetch<
      Omit<ReportRecord, "file_name" | "uploaded_at" | "stage">
    >("/api/v1/reports", {
      method: "POST",
      body: formData,
      token: ctx.token,
      signal,
    });

    return {
      ...raw,
      file_name: file.name,
      uploaded_at: new Date().toISOString(),
      stage,
    };
  },

  async getReport(
    reportId: string,
    stage: LifeStage,
    fileName: string,
    ctx: ApiClientContext,
    signal?: AbortSignal
  ): Promise<ReportRecord> {
    const raw = await liveFetch<
      Omit<ReportRecord, "file_name" | "uploaded_at" | "stage">
    >(`/api/v1/reports/${encodeURIComponent(reportId)}`, {
      method: "GET",
      token: ctx.token,
      signal,
    });

    return {
      ...raw,
      file_name: fileName,
      uploaded_at: new Date().toISOString(),
      stage,
    };
  },

  async generateCareSummary(
    req: CareSummaryRequest,
    ctx: ApiClientContext,
    signal?: AbortSignal
  ): Promise<CareSummaryResponse> {
    if (ctx.mode === "demo") {
      return mockCareSummary(req, ctx.demoSymptoms ?? [], ctx.demoReports ?? []);
    }
    return liveFetch<CareSummaryResponse>("/api/v1/care-summary", {
      method: "POST",
      body: JSON.stringify(req),
      token: ctx.token,
      signal,
    });
  },
};
