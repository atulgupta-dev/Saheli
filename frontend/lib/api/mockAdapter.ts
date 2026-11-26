import type {
  CareSummaryRequest,
  CareSummaryResponse,
  ChatRequest,
  ChatResponse,
  ReportRecord,
  SafetyAssessment,
  SymptomJournalEntry,
  SymptomLogRequest,
  SymptomLogResponse,
} from "@/types/saheli";

const URGENT_SYMPTOM_IDS = new Set([
  "severe_headache_vision",
  "vaginal_bleeding",
  "reduced_fetal_movement",
]);

const URGENT_KEYWORDS = [
  "bleeding",
  "raktsrav",
  "khoon",
  "रक्तस्राव",
  "खून",
  "blurred vision",
  "dhundhla",
  "धुंधली",
  "severe headache",
  "tez sir dard",
  "तेज सिरदर्द",
  "reduced movement",
  "no movement",
  "halchal kam",
  "कम हलचल",
  "water broke",
  "fluid leak",
  "chest pain",
  "breathing difficulty",
];

const CONSULT_SYMPTOM_IDS = new Set(["swelling", "headache", "nausea"]);

/**
 * Deterministic demo safety check mirroring Member 2's safety contract.
 * In Live Mode, the backend safety service is authoritative and this mock is never used.
 */
export function evaluateDemoPregnancySafety(
  symptoms: string[],
  notes?: string,
  severity?: "mild" | "moderate" | "severe"
): SafetyAssessment {
  const text = `${symptoms.join(" ")} ${notes ?? ""}`.toLowerCase();
  const hasUrgentChip = symptoms.some((s) => URGENT_SYMPTOM_IDS.has(s));
  const hasUrgentKeyword = URGENT_KEYWORDS.some((kw) => text.includes(kw));

  if (hasUrgentChip || hasUrgentKeyword) {
    return {
      level: "urgent",
      message:
        "Possible pregnancy warning sign detected (reviewed demo rule). Please contact your obstetrician or visit the nearest maternity emergency centre promptly. Do not wait for symptoms to worsen.",
      rule_ids: ["DEMO_RULE_PREG_URGENT_RED_FLAG"],
      next_steps: [
        "Contact your doctor or maternity helpline immediately.",
        "If experiencing bleeding, severe headache with vision changes, or reduced baby movement, go to an emergency maternity unit now.",
        "Bring your recent reports and share the Clinician Summary below.",
      ],
    };
  }

  if (severity === "severe" || symptoms.some((s) => CONSULT_SYMPTOM_IDS.has(s))) {
    return {
      level: "consult",
      message:
        "Please monitor these symptoms and mention them at your next prenatal checkup—or call your clinic sooner if they intensify.",
      rule_ids: ["DEMO_RULE_PREG_CONSULT_MONITOR"],
      next_steps: [
        "Stay hydrated and rest in a comfortable side-lying position.",
        "Schedule or call your antenatal clinic if symptoms persist.",
      ],
    };
  }

  return {
    level: "informational",
    message:
      "Logged in your synthetic pregnancy journal. Reach out to your doctor anytime something feels unusual.",
    rule_ids: ["DEMO_RULE_PREG_INFO_LOGGED"],
  };
}

export async function mockChat(
  req: ChatRequest,
  context: { recentSymptoms: SymptomJournalEntry[]; consentMemory: boolean }
): Promise<ChatResponse> {
  await new Promise((r) => setTimeout(r, 450));

  if (req.stage !== "pregnancy") {
    return {
      conversation_id: req.conversation_id ?? "conv_demo_coming_soon",
      reply:
        req.locale === "hi-IN"
          ? "इस हैकाथॉन MVP में लाइव AI साथी केवल गर्भावस्था चरण के लिए सक्रिय है। मासिक धर्म और प्रसवोत्तर AI जल्द आ रहा है।"
          : req.locale === "hi-Latn"
            ? "Is hackathon MVP mein live AI companion abhi sirf Pregnancy stage ke liye active hai. Menstrual aur Postpartum AI jaldi aa raha hai (Coming Soon)."
            : "In this MVP, the live AI companion is focused on Pregnancy. Menstrual and Postpartum AI features are marked Coming Soon.",
      sources: [],
      safety: { level: "informational", message: null },
      memory_saved: false,
      memory_used: false,
    };
  }

  const safety = evaluateDemoPregnancySafety([], req.message);
  const canUseMemory = Boolean(context.consentMemory && req.save_to_memory && context.recentSymptoms.length > 0);
  const latestSymptom = context.recentSymptoms[0];
  const memorySummary = canUseMemory
    ? `Recent ${latestSymptom.severity} check-in: ${latestSymptom.symptoms.join(", ")}`
    : null;

  if (safety.level === "urgent") {
    const urgentReply =
      req.locale === "hi-IN"
        ? "आपने जो संकेत बताए हैं, उनके लिए तुरंत डॉक्टर या नजदीकी मैटरनिटी अस्पताल से संपर्क करना ज़रूरी है। यह शैक्षिक जानकारी है — कृपया देरी न करें।"
        : req.locale === "hi-Latn"
          ? "Aapne jo signs bataye hain, unke liye turant doctor ya nazdeeki maternity emergency se sampark karna zaroori hai. Kripya wait na karein."
          : "Based on what you shared, please contact your doctor or nearest maternity emergency unit right away. Educational guidance cannot replace urgent medical evaluation.";

    return {
      conversation_id: req.conversation_id ?? "conv_demo_preg",
      reply: urgentReply,
      sources: ["Reviewed Pregnancy Warning-Sign Checklist (Demo)"],
      safety,
      memory_saved: Boolean(context.consentMemory && req.save_to_memory),
      memory_used: canUseMemory,
      memory_context_summary: memorySummary,
    };
  }

  const lower = req.message.toLowerCase();
  let reply: string;

  if (lower.includes("ultrasound") || lower.includes("report") || lower.includes("स्कैन")) {
    reply =
      req.locale === "hi-IN"
        ? "आपकी डेमो अल्ट्रासाउंड रिपोर्ट (सप्ताह 20) में AFI 13.4 cm और हार्ट रेट 146 bpm दर्ज है। ये रिपोर्ट में लिखे गए तथ्य हैं — इनका चिकित्सकीय अर्थ आपके डॉक्टर के साथ समझना सबसे बेहतर है।"
        : req.locale === "hi-Latn"
          ? "Aapki demo ultrasound report (Week 20) mein AFI 13.4 cm aur fetal heart rate 146 bpm likha hai. Yeh report ke recorded facts hain — doctor se follow-up checkup mein discuss karna best rahega."
          : "Your sample Week 20 scan lists AFI at 13.4 cm and fetal heart rate at 146 bpm. These are documented scan measurements—your obstetrician interprets them in context of your full care.";
  } else if (lower.includes("summary") || lower.includes("सारांश") || lower.includes("symptom")) {
    reply = canUseMemory
      ? req.locale === "hi-Latn"
        ? `Aapke consented journal ke hisaab se haal hi mein "${latestSymptom.symptoms.join(", ")}" (${latestSymptom.severity}) log hua hai. Aaram aur hydration maintain karein aur clinic visit par share karein.`
        : `Looking at your consented journal, your recent entry noted ${latestSymptom.symptoms.join(", ")} (${latestSymptom.severity}). You can generate a one-tap Clinician Summary from the Journal or Care tab.`
      : "Turn on conversation memory consent in Profile or log a symptom check-in first so I can reflect your recorded notes here.";
  } else {
    reply =
      req.locale === "hi-IN"
        ? "गर्भावस्था के दूसरे त्रैमासिक (सप्ताह 24) में हल्की थकान या कमर दर्द सामान्य हो सकता है। पर्याप्त पानी पिएं, करवट लेकर आराम करें, और कोई भी असामान्य लक्षण दिखे तो लक्षण जर्नल में दर्ज करें।"
        : req.locale === "hi-Latn"
          ? "Week 24 ke aaspaas thakan ya halka kamar dard aam ho sakta hai. Paani peete rahein, karwat lekar aaram karein, aur agar koi naya symptom lage toh Journal mein log karein."
          : "Around week 24, gentle fatigue or lower-back ache can be common as your body adapts. Stay hydrated, take side-lying rest breaks, and log any changing symptoms in your journal.";
  }

  return {
    conversation_id: req.conversation_id ?? "conv_demo_preg",
    reply,
    sources: ["Saheli Educational Pregnancy Guide (Synthetic Demo)"],
    safety,
    memory_saved: Boolean(context.consentMemory && req.save_to_memory),
    memory_used: canUseMemory,
    memory_context_summary: memorySummary,
  };
}

export async function mockLogSymptom(req: SymptomLogRequest): Promise<SymptomLogResponse> {
  await new Promise((r) => setTimeout(r, 350));
  const safety =
    req.stage === "pregnancy"
      ? evaluateDemoPregnancySafety(req.symptoms, req.notes, req.severity)
      : {
          level: "informational" as const,
          message: `Saved in synthetic ${req.stage} demo journal.`,
          rule_ids: [],
        };

  return {
    entry_id: `sym_demo_${Date.now()}`,
    saved: true,
    safety,
  };
}

export async function mockUploadReport(
  file: File,
  stage: "menstrual" | "pregnancy" | "postpartum"
): Promise<ReportRecord> {
  await new Promise((r) => setTimeout(r, 850));
  return {
    report_id: `rep_demo_${Date.now()}`,
    file_name: file.name,
    uploaded_at: new Date().toISOString(),
    stage,
    status: "completed",
    extracted: {
      gestational_age_weeks: 24,
      report_date: "2026-11-26",
      measurements: [
        {
          name: "Documented Gestational Estimate",
          value: "24w 0d",
          unit: null,
          reference_note: "Synthetic demo extraction from uploaded file",
          page: 1,
        },
        {
          name: "Amniotic Fluid Index (AFI)",
          value: "14.1",
          unit: "cm",
          reference_note: "Quoted from synthetic sample page 1",
          page: 1,
        },
      ],
    },
    explanations: [
      "This synthetic demonstration highlights only extracted report values and explains terminology in simple language.",
      "In Live Mode, Member 3's backend pipeline extracts page-cited text directly from your uploaded document.",
    ],
    citations: [
      {
        page: 1,
        quote: `Demo extraction for "${file.name}": Gestational estimate 24w 0d; AFI 14.1 cm.`,
      },
    ],
    warnings: [
      "Synthetic Demo Output — educational explanation only, not a medical diagnosis.",
    ],
    clinician_questions: [
      "Can we review these measurements together at my next prenatal appointment?",
    ],
    is_demo: true,
  };
}

export async function mockCareSummary(
  req: CareSummaryRequest,
  symptoms: SymptomJournalEntry[],
  reports: ReportRecord[]
): Promise<CareSummaryResponse> {
  await new Promise((r) => setTimeout(r, 350));
  const stageSymptoms = symptoms.filter((s) => s.stage === req.stage);
  const symptomLines =
    req.include_symptoms && stageSymptoms.length > 0
      ? stageSymptoms
          .slice(0, 5)
          .map(
            (s) =>
              `- ${new Date(s.reported_at).toLocaleDateString("en-IN")}: ${s.symptoms.join(", ")} (${s.severity})${s.notes ? ` — "${s.notes}"` : ""}`
          )
          .join("\n")
      : "- No symptom entries included.";

  const selectedReports = reports.filter((r) => req.report_ids.includes(r.report_id));
  const reportLines =
    selectedReports.length > 0
      ? selectedReports
          .map(
            (r) =>
              `- ${r.file_name} (Week ${r.extracted.gestational_age_weeks ?? "unknown"}): ${r.extracted.measurements.map((m) => `${m.name}: ${m.value ?? "unknown"}${m.unit ? ` ${m.unit}` : ""}`).join("; ")}`
          )
          .join("\n")
      : "- No reports selected.";

  return {
    summary: `SAHELI SYNTHETIC CARE SUMMARY (${req.stage.toUpperCase()})\n\nRecent Logged Symptoms:\n${symptomLines}\n\nSelected Reports:\n${reportLines}\n\nPrepared for clinician discussion.`,
    references: selectedReports.map((r) => r.file_name),
    medical_disclaimer: "For clinician review, not diagnosis",
  };
}
