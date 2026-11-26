"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { User } from "firebase/auth";
import {
  AppLanguage,
  AppMode,
  AppointmentItem,
  ChatMessageItem,
  ConsentSettings,
  LifeStage,
  MotherHealthMetrics,
  ReportRecord,
  SafetyAssessment,
  SymptomJournalEntry,
  UserProfile,
} from "@/types/saheli";
import { STAGE_THEMES, StageThemeTokens } from "@/config/themes";
import { TRANSLATIONS, TranslationDict } from "@/lib/i18n/translations";
import {
  DEMO_APPOINTMENTS,
  DEMO_INITIAL_CHAT,
  DEMO_MOTHER_METRICS,
  DEMO_PROFILES,
  DEMO_REPORTS,
  DEMO_SYMPTOMS,
} from "@/mocks/demoData";
import {
  isFirebaseConfigured,
  signInWithEmail,
  signInWithGoogle,
  signOutFirebase,
  signUpWithEmail,
  subscribeAuthState,
} from "@/lib/firebase/client";
import { ApiClientContext, isBackendConfigured, saheliApi } from "@/lib/api/client";

const STORAGE_KEY = "saheli_app_state_v1";

interface PersistedState {
  hasCompletedOnboarding: boolean;
  mode: AppMode;
  activeStage: LifeStage;
  language: AppLanguage;
  profile: UserProfile;
  symptoms: SymptomJournalEntry[];
  reports: ReportRecord[];
  chatMessages: Record<LifeStage, ChatMessageItem[]>;
  motherMetrics: MotherHealthMetrics;
  appointments: AppointmentItem[];
}

function createInitialDemoState(stage: LifeStage = "pregnancy"): PersistedState {
  const baseProfile = structuredClone(DEMO_PROFILES[stage]);
  return {
    hasCompletedOnboarding: false,
    mode: "demo",
    activeStage: stage,
    language: baseProfile.locale,
    profile: baseProfile,
    symptoms: structuredClone(DEMO_SYMPTOMS),
    reports: structuredClone(DEMO_REPORTS),
    chatMessages: {
      menstrual: [],
      pregnancy: structuredClone(DEMO_INITIAL_CHAT),
      postpartum: [],
    },
    motherMetrics: structuredClone(DEMO_MOTHER_METRICS),
    appointments: structuredClone(DEMO_APPOINTMENTS),
  };
}

function createCleanLiveState(stage: LifeStage = "pregnancy"): PersistedState {
  return {
    hasCompletedOnboarding: true,
    mode: "live",
    activeStage: stage,
    language: "en-IN",
    profile: {
      user_id: "pending_auth",
      display_name: "Saheli Member",
      active_stage: stage,
      locale: "en-IN",
      consent: { store_conversations: false, store_reports: false },
      stage_profiles: {
        menstrual: {},
        pregnancy: { gestational_week: 24, trimester: 2 },
        postpartum: {},
      },
      is_demo: false,
    },
    symptoms: [],
    reports: [],
    chatMessages: {
      menstrual: [],
      pregnancy: [],
      postpartum: [],
    },
    motherMetrics: {},
    appointments: [],
  };
}

interface SaheliContextValue {
  hydrated: boolean;
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => void;
  mode: AppMode;
  switchMode: (mode: AppMode) => void;
  activeStage: LifeStage;
  setStage: (stage: LifeStage) => Promise<void>;
  theme: StageThemeTokens;
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: TranslationDict;
  profile: UserProfile;
  updateProfile: (updater: (prev: UserProfile) => UserProfile) => void;
  updateConsent: (consent: Partial<ConsentSettings>) => void;
  symptoms: SymptomJournalEntry[];
  addSymptomEntry: (entry: SymptomJournalEntry) => void;
  updateSymptomEntry: (entry: SymptomJournalEntry) => void;
  reports: ReportRecord[];
  addOrUpdateReport: (report: ReportRecord) => void;
  chatMessages: ChatMessageItem[];
  setStageChatMessages: (stage: LifeStage, msgs: ChatMessageItem[]) => void;
  motherMetrics: MotherHealthMetrics;
  updateMotherMetrics: (metrics: MotherHealthMetrics) => void;
  appointments: AppointmentItem[];
  addAppointment: (appt: AppointmentItem) => void;
  latestUrgentSafety: SafetyAssessment | null;
  clearLatestUrgentSafety: () => void;
  setLatestUrgentSafety: (safety: SafetyAssessment | null) => void;
  resetDemo: (profileKey?: LifeStage) => void;
  isOnline: boolean;
  firebaseUser: User | null;
  firebaseConfigured: boolean;
  backendConfigured: boolean;
  getIdToken: () => Promise<string | null>;
  loginGoogle: () => Promise<void>;
  loginEmail: (email: string, pass: string) => Promise<void>;
  registerEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  getApiContext: () => Promise<ApiClientContext>;
  toast: string | null;
  showToast: (msg: string) => void;
}

const SaheliContext = createContext<SaheliContextValue | null>(null);

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(() => createInitialDemoState("pregnancy"));
  const [hydrated, setHydrated] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [latestUrgentSafety, setLatestUrgentSafety] = useState<SafetyAssessment | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Hydrate persisted client state safely
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedState;
        if (parsed && parsed.activeStage && parsed.profile) {
          setState(parsed);
        }
      }
    } catch {
      // Ignore corrupted local storage and keep defaults
    }
    setHydrated(true);
  }, []);

  // Persist changes (never store tokens or secrets)
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors
    }
  }, [state, hydrated]);

  // Apply CSS custom properties for active life stage
  useEffect(() => {
    const theme = STAGE_THEMES[state.activeStage];
    const root = document.documentElement;
    Object.entries(theme.cssVars).forEach(([k, v]) => {
      root.style.setProperty(k, v);
    });
    document.body.style.backgroundColor = theme.background;
    document.body.style.color = theme.text;
  }, [state.activeStage]);

  // Connectivity status
  useEffect(() => {
    setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // Register PWA service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Ignore registration errors in unsupported contexts
      });
    }
  }, []);

  // Subscribe to Firebase auth state
  useEffect(() => {
    return subscribeAuthState((user) => {
      setFirebaseUser(user);
      if (user) {
        setState((prev) => ({
          ...prev,
          profile: {
            ...prev.profile,
            user_id: user.uid,
            display_name: user.displayName || user.email || "Saheli User",
          },
        }));
      }
    });
  }, []);

  const getIdToken = useCallback(async () => {
    if (!firebaseUser) return null;
    try {
      return await firebaseUser.getIdToken();
    } catch {
      return null;
    }
  }, [firebaseUser]);

  const getApiContext = useCallback(async (): Promise<ApiClientContext> => {
    const token = state.mode === "live" ? await getIdToken() : null;
    return {
      mode: state.mode,
      token,
      demoSymptoms: state.mode === "demo" ? state.symptoms : undefined,
      demoReports: state.mode === "demo" ? state.reports : undefined,
      consentMemory: state.profile.consent.store_conversations,
    };
  }, [state.mode, state.symptoms, state.reports, state.profile.consent.store_conversations, getIdToken]);

  const setStage = useCallback(
    async (stage: LifeStage) => {
      // Preserve each stage's independent journal/reports/profile history
      setState((prev) => ({
        ...prev,
        activeStage: stage,
        profile: {
          ...prev.profile,
          active_stage: stage,
        },
      }));
      if (state.mode === "live") {
        try {
          const ctx = await getApiContext();
          await saheliApi.switchStage(stage, ctx);
        } catch {
          showToast("Stage updated locally; backend sync pending.");
        }
      }
    },
    [state.mode, getApiContext, showToast]
  );

  const setLanguage = useCallback((language: AppLanguage) => {
    setState((prev) => ({
      ...prev,
      language,
      profile: {
        ...prev.profile,
        locale: language,
      },
    }));
  }, []);

  const completeOnboarding = useCallback(() => {
    setState((prev) => ({ ...prev, hasCompletedOnboarding: true }));
  }, []);

  const switchMode = useCallback((mode: AppMode) => {
    setLatestUrgentSafety(null);
    if (mode === "demo") {
      setState((prev) => ({
        ...createInitialDemoState(prev.activeStage),
        hasCompletedOnboarding: true,
        language: prev.language,
      }));
      showToast("Switched to Synthetic Demo Mode");
    } else {
      setState((prev) => ({
        ...createCleanLiveState(prev.activeStage),
        language: prev.language,
      }));
      showToast("Switched to Live Backend Mode");
    }
  }, [showToast]);

  const resetDemo = useCallback(
    (profileKey?: LifeStage) => {
      const targetStage = profileKey ?? state.activeStage;
      const fresh = createInitialDemoState(targetStage);
      fresh.hasCompletedOnboarding = true;
      setLatestUrgentSafety(null);
      setState(fresh);
      showToast(`Loaded synthetic ${targetStage} demo profile.`);
    },
    [state.activeStage, showToast]
  );

  const updateProfile = useCallback((updater: (prev: UserProfile) => UserProfile) => {
    setState((prev) => ({
      ...prev,
      profile: updater(prev.profile),
    }));
  }, []);

  const updateConsent = useCallback((consent: Partial<ConsentSettings>) => {
    setState((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        consent: {
          ...prev.profile.consent,
          ...consent,
        },
      },
    }));
  }, []);

  const addSymptomEntry = useCallback((entry: SymptomJournalEntry) => {
    setState((prev) => ({
      ...prev,
      symptoms: [entry, ...prev.symptoms],
    }));
    if (entry.safety.level === "urgent") {
      setLatestUrgentSafety(entry.safety);
    }
  }, []);

  const updateSymptomEntry = useCallback((entry: SymptomJournalEntry) => {
    setState((prev) => ({
      ...prev,
      symptoms: prev.symptoms.map((s) => (s.entry_id === entry.entry_id ? entry : s)),
    }));
    if (entry.safety.level === "urgent") {
      setLatestUrgentSafety(entry.safety);
    }
  }, []);

  const addOrUpdateReport = useCallback((report: ReportRecord) => {
    setState((prev) => {
      const exists = prev.reports.some((r) => r.report_id === report.report_id);
      return {
        ...prev,
        reports: exists
          ? prev.reports.map((r) => (r.report_id === report.report_id ? report : r))
          : [report, ...prev.reports],
      };
    });
  }, []);

  const setStageChatMessages = useCallback((stage: LifeStage, msgs: ChatMessageItem[]) => {
    setState((prev) => ({
      ...prev,
      chatMessages: {
        ...prev.chatMessages,
        [stage]: msgs,
      },
    }));
  }, []);

  const updateMotherMetrics = useCallback((motherMetrics: MotherHealthMetrics) => {
    setState((prev) => ({ ...prev, motherMetrics }));
  }, []);

  const addAppointment = useCallback((appt: AppointmentItem) => {
    setState((prev) => ({
      ...prev,
      appointments: [appt, ...prev.appointments],
    }));
  }, []);

  const loginGoogle = useCallback(async () => {
    await signInWithGoogle();
    setState((prev) => ({ ...prev, mode: "live", hasCompletedOnboarding: true }));
    showToast("Signed in with Google");
  }, [showToast]);

  const loginEmail = useCallback(
    async (email: string, pass: string) => {
      await signInWithEmail(email, pass);
      setState((prev) => ({ ...prev, mode: "live", hasCompletedOnboarding: true }));
      showToast("Signed in");
    },
    [showToast]
  );

  const registerEmail = useCallback(
    async (email: string, pass: string) => {
      await signUpWithEmail(email, pass);
      setState((prev) => ({ ...prev, mode: "live", hasCompletedOnboarding: true }));
      showToast("Account created");
    },
    [showToast]
  );

  const logout = useCallback(async () => {
    await signOutFirebase();
    setLatestUrgentSafety(null);
    const fresh = createInitialDemoState("pregnancy");
    fresh.hasCompletedOnboarding = true;
    setState(fresh);
    showToast("Signed out safely. Session data cleared.");
  }, [showToast]);

  const value = useMemo<SaheliContextValue>(
    () => ({
      hydrated,
      hasCompletedOnboarding: state.hasCompletedOnboarding,
      completeOnboarding,
      mode: state.mode,
      switchMode,
      activeStage: state.activeStage,
      setStage,
      theme: STAGE_THEMES[state.activeStage],
      language: state.language,
      setLanguage,
      t: TRANSLATIONS[state.language],
      profile: state.profile,
      updateProfile,
      updateConsent,
      symptoms: state.symptoms,
      addSymptomEntry,
      updateSymptomEntry,
      reports: state.reports,
      addOrUpdateReport,
      chatMessages: state.chatMessages[state.activeStage] || [],
      setStageChatMessages,
      motherMetrics: state.motherMetrics,
      updateMotherMetrics,
      appointments: state.appointments,
      addAppointment,
      latestUrgentSafety,
      clearLatestUrgentSafety: () => setLatestUrgentSafety(null),
      setLatestUrgentSafety,
      resetDemo,
      isOnline,
      firebaseUser,
      firebaseConfigured: isFirebaseConfigured(),
      backendConfigured: isBackendConfigured(),
      getIdToken,
      loginGoogle,
      loginEmail,
      registerEmail,
      logout,
      getApiContext,
      toast,
      showToast,
    }),
    [
      hydrated,
      state,
      completeOnboarding,
      switchMode,
      setStage,
      setLanguage,
      updateProfile,
      updateConsent,
      addSymptomEntry,
      updateSymptomEntry,
      addOrUpdateReport,
      setStageChatMessages,
      updateMotherMetrics,
      addAppointment,
      latestUrgentSafety,
      resetDemo,
      isOnline,
      firebaseUser,
      getIdToken,
      loginGoogle,
      loginEmail,
      registerEmail,
      logout,
      getApiContext,
      toast,
      showToast,
    ]
  );

  return <SaheliContext.Provider value={value}>{children}</SaheliContext.Provider>;
}

export function useSaheli() {
  const ctx = useContext(SaheliContext);
  if (!ctx) throw new Error("useSaheli must be used inside AppProviders");
  return ctx;
}
