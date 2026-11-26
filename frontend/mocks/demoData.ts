import {
  AppointmentItem,
  ChatMessageItem,
  MotherHealthMetrics,
  ReportRecord,
  SymptomJournalEntry,
  UserProfile,
} from "@/types/saheli";

export const DEMO_PROFILES: Record<"menstrual" | "pregnancy" | "postpartum", UserProfile> = {
  menstrual: {
    user_id: "demo_ananya_menstrual",
    display_name: "Ananya (Demo)",
    active_stage: "menstrual",
    locale: "en-IN",
    consent: {
      store_conversations: true,
      store_reports: true,
    },
    stage_profiles: {
      menstrual: {
        last_period_date: "2026-11-12",
        typical_cycle_length: 28,
        typical_period_length: 5,
      },
      pregnancy: {
        gestational_week: 24,
        estimated_due_date: "2027-03-18",
        trimester: 2,
      },
      postpartum: {
        weeks_postpartum: 6,
        wellness_goals: ["Restorative sleep", "Gentle mobility", "Emotional check-ins"],
      },
    },
    is_demo: true,
  },
  pregnancy: {
    user_id: "demo_meera_pregnancy",
    display_name: "Meera (Demo)",
    active_stage: "pregnancy",
    locale: "hi-Latn",
    consent: {
      store_conversations: true,
      store_reports: true,
    },
    stage_profiles: {
      pregnancy: {
        gestational_week: 24,
        estimated_due_date: "2027-03-18",
        trimester: 2,
      },
      menstrual: {
        last_period_date: "2026-06-05",
        typical_cycle_length: 29,
        typical_period_length: 5,
      },
      postpartum: {
        weeks_postpartum: 4,
        wellness_goals: ["Sleep balance", "Pelvic comfort"],
      },
    },
    is_demo: true,
  },
  postpartum: {
    user_id: "demo_kavya_postpartum",
    display_name: "Kavya (Demo)",
    active_stage: "postpartum",
    locale: "en-IN",
    consent: {
      store_conversations: true,
      store_reports: false,
    },
    stage_profiles: {
      postpartum: {
        weeks_postpartum: 6,
        wellness_goals: ["Sleep recovery", "Hydration", "Mood check-ins"],
      },
      pregnancy: {
        gestational_week: 24,
        estimated_due_date: "2027-03-18",
        trimester: 2,
      },
      menstrual: {
        last_period_date: "2026-11-10",
        typical_cycle_length: 28,
        typical_period_length: 5,
      },
    },
    is_demo: true,
  },
};

export const DEMO_SYMPTOMS: SymptomJournalEntry[] = [
  {
    entry_id: "sym_demo_preg_1",
    stage: "pregnancy",
    reported_at: "2026-11-25T10:30:00Z",
    symptoms: ["back_pain", "fatigue"],
    severity: "mild",
    notes: "Mild lower back tiredness after afternoon walk.",
    safety: {
      level: "informational",
      message: "Mild fatigue and back ache are commonly logged in week 24. Rest with side support and stay hydrated.",
      rule_ids: ["PREG_INFO_BACK_FATIGUE"],
    },
    is_demo: true,
  },
  {
    entry_id: "sym_demo_preg_2",
    stage: "pregnancy",
    reported_at: "2026-11-23T18:15:00Z",
    symptoms: ["swelling"],
    severity: "mild",
    notes: "Slight ankle puffiness in the evening; resolved after elevating feet.",
    safety: {
      level: "consult",
      message: "Monitor swelling. If swelling becomes sudden in face/hands or pairs with severe headache or blurred vision, seek urgent care.",
      rule_ids: ["PREG_CONSULT_MILD_EDEMA"],
    },
    is_demo: true,
  },
  {
    entry_id: "sym_demo_mens_1",
    stage: "menstrual",
    reported_at: "2026-11-13T09:00:00Z",
    symptoms: ["cramps", "fatigue"],
    severity: "moderate",
    notes: "Day 2 of cycle; warm compress helped.",
    safety: {
      level: "informational",
      message: "Logged in your synthetic menstrual demo journal.",
      rule_ids: [],
    },
    is_demo: true,
  },
  {
    entry_id: "sym_demo_post_1",
    stage: "postpartum",
    reported_at: "2026-11-24T07:20:00Z",
    symptoms: ["sleep_difficulty", "fatigue"],
    severity: "moderate",
    notes: "Broken sleep overnight; rested 45 mins in afternoon.",
    safety: {
      level: "informational",
      message: "Logged in your synthetic postpartum wellness demo journal.",
      rule_ids: [],
    },
    is_demo: true,
  },
];

export const DEMO_REPORTS: ReportRecord[] = [
  {
    report_id: "rep_demo_usg_20",
    file_name: "synthetic_anomaly_scan_week20.pdf",
    uploaded_at: "2026-11-02T11:20:00Z",
    stage: "pregnancy",
    status: "completed",
    extracted: {
      gestational_age_weeks: 20,
      report_date: "2026-11-01",
      measurements: [
        {
          name: "Composite Gestational Age (US)",
          value: "20w 2d",
          unit: null,
          reference_note: "Extracted directly from scan summary (synthetic demo)",
          page: 1,
        },
        {
          name: "Placental Location",
          value: "Posterior, upper segment",
          unit: null,
          reference_note: "Noted as clear of internal cervical os in synthetic sample",
          page: 1,
        },
        {
          name: "Amniotic Fluid Index (AFI)",
          value: "13.4",
          unit: "cm",
          reference_note: "Recorded measurement from report text",
          page: 1,
        },
        {
          name: "Fetal Heart Rate",
          value: "146",
          unit: "bpm",
          reference_note: "Single recorded reading during scan",
          page: 2,
        },
      ],
    },
    explanations: [
      "Composite Gestational Age (20w 2d) is an estimate calculated by combining routine ultrasound measurements (such as head and femur length) on the day of the scan.",
      "Posterior upper segment placenta means the placenta is attached along the back wall of the uterus, away from the cervix opening.",
      "Amniotic Fluid Index (AFI) measures pockets of protective fluid around the baby; your doctor interprets this alongside your full scan.",
    ],
    citations: [
      {
        page: 1,
        quote: "Single live intrauterine gestation; composite biometry corresponds to 20 weeks 2 days. Placenta posterior, upper segment.",
      },
      {
        page: 1,
        quote: "Amniotic fluid volume adequate (AFI: 13.4 cm).",
      },
      {
        page: 2,
        quote: "Cardiac activity present; fetal heart rate 146 bpm.",
      },
    ],
    warnings: [
      "Synthetic demonstration report for educational walkthrough only.",
      "AI explanations clarify terminology and do not replace your obstetrician's clinical review.",
    ],
    clinician_questions: [
      "Does my placenta position need any follow-up scan later in the third trimester?",
      "Are there any specific iron, calcium, or glucose tests planned for my week 24–28 visit?",
    ],
    is_demo: true,
  },
];

export const DEMO_MOTHER_METRICS: MotherHealthMetrics = {
  blood_pressure: {
    value: "114/74 mmHg",
    recorded_at: "2026-11-24 (Clinic entry)",
    source: "Synthetic demo record",
  },
  sleep_hours: {
    value: 7.2,
    recorded_at: "Last night (Self-logged)",
    source: "Synthetic demo log",
  },
  water_litres: {
    value: 2.1,
    target_litres: 2.8,
    recorded_at: "Today (Self-logged)",
  },
  heart_rate_bpm: {
    value: 82,
    recorded_at: "2026-11-24 (Clinic entry)",
    source: "Synthetic demo record",
  },
};

export const DEMO_APPOINTMENTS: AppointmentItem[] = [
  {
    id: "appt_demo_1",
    title: "Week 24 Prenatal & Glucose Screening Visit",
    date: "2026-11-29T10:30:00Z",
    clinician: "Dr. Nandini Rao (OB-GYN — Demo)",
    location: "Community Maternal Care Clinic",
    notes: "Bring week 20 ultrasound report and recent symptom summary.",
    week: 24,
    is_demo: true,
  },
  {
    id: "appt_demo_2",
    title: "Third Trimester Growth Check",
    date: "2026-12-27T11:00:00Z",
    clinician: "Dr. Nandini Rao (OB-GYN — Demo)",
    location: "Community Maternal Care Clinic",
    notes: "Planned routine check at week 28.",
    week: 28,
    is_demo: true,
  },
];

export const DEMO_INITIAL_CHAT: ChatMessageItem[] = [
  {
    id: "msg_demo_welcome",
    role: "assistant",
    content:
      "Namaste Meera! Main Saheli hoon. Aap week 24 pregnancy mein hain — aap Hindi, Hinglish ya English mein bolkar ya likhkar pooch sakti hain. (Synthetic demo companion — educational support only.)",
    timestamp: "2026-11-26T09:00:00Z",
    safety: { level: "informational", message: null },
    sources: [],
    memoryUsed: false,
  },
];

export const MENSTRUAL_DEMO_HISTORY = [
  { month: "Aug", cycleLength: 28, periodLength: 5 },
  { month: "Sep", cycleLength: 29, periodLength: 5 },
  { month: "Oct", cycleLength: 27, periodLength: 4 },
  { month: "Nov", cycleLength: 28, periodLength: 5 },
];

export const POSTPARTUM_DEMO_SLEEP = [
  { day: "Mon", hours: 5.5, mood: 3 },
  { day: "Tue", hours: 6.2, mood: 4 },
  { day: "Wed", hours: 5.8, mood: 3 },
  { day: "Thu", hours: 6.8, mood: 4 },
  { day: "Fri", hours: 6.4, mood: 4 },
  { day: "Sat", hours: 7.1, mood: 5 },
  { day: "Sun", hours: 6.5, mood: 4 },
];
