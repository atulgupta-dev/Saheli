import type { AppLanguage, LifeStage } from "@/types/saheli";

export interface StageConfig {
  id: LifeStage;
  mvpLive: boolean;
  label: Record<AppLanguage, string>;
  shortLabel: Record<AppLanguage, string>;
  subtitle: Record<AppLanguage, string>;
  description: Record<AppLanguage, string>;
  symptoms: { id: string; label: Record<AppLanguage, string>; urgentHint?: boolean }[];
  aiPrompts: Record<AppLanguage, string[]>;
  reportCategories: string[];
}

export const LIFE_STAGE_CONFIGS: Record<LifeStage, StageConfig> = {
  menstrual: {
    id: "menstrual",
    mvpLive: false,
    label: {
      "en-IN": "Menstrual Health",
      "hi-IN": "मासिक धर्म स्वास्थ्य",
      "hi-Latn": "Menstrual Health",
    },
    shortLabel: {
      "en-IN": "Menstrual",
      "hi-IN": "मासिक चक्र",
      "hi-Latn": "Cycle",
    },
    subtitle: {
      "en-IN": "Understand your cycle.",
      "hi-IN": "अपने चक्र को समझें।",
      "hi-Latn": "Apne cycle ko samjhein.",
    },
    description: {
      "en-IN": "Cycle wheel, period calendar, and personal symptom patterns.",
      "hi-IN": "मासिक चक्र कैलेंडर, चरणों की जानकारी और लक्षण लॉग।",
      "hi-Latn": "Cycle wheel, period calendar aur symptom tracking.",
    },
    symptoms: [
      { id: "cramps", label: { "en-IN": "Cramps", "hi-IN": "ऐंठन", "hi-Latn": "Cramps" } },
      { id: "mood_changes", label: { "en-IN": "Mood", "hi-IN": "मूड बदलाव", "hi-Latn": "Mood" } },
      { id: "bloating", label: { "en-IN": "Bloating", "hi-IN": "पेट फूलना", "hi-Latn": "Bloating" } },
      { id: "fatigue", label: { "en-IN": "Fatigue", "hi-IN": "थकान", "hi-Latn": "Fatigue" } },
      { id: "headache", label: { "en-IN": "Headache", "hi-IN": "सिरदर्द", "hi-Latn": "Headache" } },
      { id: "acne", label: { "en-IN": "Acne", "hi-IN": "मुंहासे", "hi-Latn": "Acne" } },
    ],
    aiPrompts: {
      "en-IN": [
        "Why do menstrual cramps happen?",
        "How can I understand my cycle phases?",
        "What should I discuss with my doctor?",
      ],
      "hi-IN": [
        "पीरियड्स में ऐंठन क्यों होती है?",
        "मैं अपने मासिक चक्र के चरणों को कैसे समझूं?",
        "मुझे डॉक्टर से क्या पूछना चाहिए?",
      ],
      "hi-Latn": [
        "Periods mein cramps kyun hote hain?",
        "Main apne cycle phases ko kaise samjhun?",
        "Doctor se kya questions poochne chahiye?",
      ],
    },
    reportCategories: ["Hormone Panel (Coming Soon)", "Pelvic Scan (Coming Soon)"],
  },
  pregnancy: {
    id: "pregnancy",
    mvpLive: true,
    label: {
      "en-IN": "Pregnancy",
      "hi-IN": "गर्भावस्था",
      "hi-Latn": "Pregnancy",
    },
    shortLabel: {
      "en-IN": "Pregnancy",
      "hi-IN": "गर्भावस्था",
      "hi-Latn": "Pregnancy",
    },
    subtitle: {
      "en-IN": "Nurture your journey.",
      "hi-IN": "अपनी यात्रा को संवारें।",
      "hi-Latn": "Apne safar ka khayal rakhein.",
    },
    description: {
      "en-IN": "Week-by-week milestones, reviewed warning-sign checks, ultrasound explanations, and Hindi/Hinglish voice care.",
      "hi-IN": "सप्ताह-दर-सप्ताह मार्गदर्शन, लक्षण सुरक्षा जांच, अल्ट्रासाउंड समझ और हिंदी वॉइस सहायता।",
      "hi-Latn": "Week-by-week guidance, symptom safety checks, report samajh aur Hindi/Hinglish voice care.",
    },
    symptoms: [
      { id: "back_pain", label: { "en-IN": "Back Pain", "hi-IN": "कमर दर्द", "hi-Latn": "Back Pain" } },
      { id: "nausea", label: { "en-IN": "Nausea", "hi-IN": "जी मिचलाना", "hi-Latn": "Nausea" } },
      { id: "fatigue", label: { "en-IN": "Fatigue", "hi-IN": "थकान", "hi-Latn": "Fatigue" } },
      { id: "swelling", label: { "en-IN": "Swelling", "hi-IN": "सूजन", "hi-Latn": "Swelling" } },
      { id: "headache", label: { "en-IN": "Headache", "hi-IN": "सिरदर्द", "hi-Latn": "Headache" } },
      { id: "mild_cramps", label: { "en-IN": "Mild Cramps", "hi-IN": "हल्की ऐंठन", "hi-Latn": "Mild Cramps" } },
      { id: "severe_headache_vision", label: { "en-IN": "Severe headache + blurred vision", "hi-IN": "तेज सिरदर्द + धुंधली नजर", "hi-Latn": "Tez sir dard + blurred vision" }, urgentHint: true },
      { id: "vaginal_bleeding", label: { "en-IN": "Vaginal bleeding", "hi-IN": "रक्तस्राव", "hi-Latn": "Bleeding" }, urgentHint: true },
      { id: "reduced_fetal_movement", label: { "en-IN": "Reduced baby movement", "hi-IN": "शिशु की हलचल कम", "hi-Latn": "Baby ki halchal kam" }, urgentHint: true },
    ],
    aiPrompts: {
      "en-IN": [
        "Is this symptom normal?",
        "Explain my report",
        "Tips for this week",
      ],
      "hi-IN": [
        "क्या यह लक्षण सामान्य है?",
        "मेरी रिपोर्ट समझाएं",
        "इस सप्ताह के सुझाव",
      ],
      "hi-Latn": [
        "Kya yeh symptom normal hai?",
        "Meri report samjhao",
        "Is week ke tips",
      ],
    },
    reportCategories: ["Ultrasound", "Blood Test", "Other"],
  },
  // Preserves "postpartum" stage enum in shared/api-contracts.md while delivering the Menopause & Wellness design book experience
  postpartum: {
    id: "postpartum",
    mvpLive: false,
    label: {
      "en-IN": "Menopause",
      "hi-IN": "मेनोपॉज़ और देखभाल",
      "hi-Latn": "Menopause",
    },
    shortLabel: {
      "en-IN": "Menopause",
      "hi-IN": "मेनोपॉज़",
      "hi-Latn": "Menopause",
    },
    subtitle: {
      "en-IN": "Embrace your change.",
      "hi-IN": "शांत सहयोग के साथ बदलाव अपनाएं।",
      "hi-Latn": "Shanti aur confidence ke saath.",
    },
    description: {
      "en-IN": "Botanical wellness check-ins, sleep & mood trends, and educational menopause/postpartum care guides.",
      "hi-IN": "नींद, मूड, हॉट फ्लैश और समग्र कल्याण से जुड़ी शैक्षिक जानकारी।",
      "hi-Latn": "Sleep, mood, hot flashes aur calm wellness tracking.",
    },
    symptoms: [
      { id: "hot_flashes", label: { "en-IN": "Hot Flashes", "hi-IN": "हॉट फ्लैश", "hi-Latn": "Hot Flashes" } },
      { id: "sleep_difficulty", label: { "en-IN": "Sleep", "hi-IN": "नींद", "hi-Latn": "Sleep" } },
      { id: "mood_changes", label: { "en-IN": "Mood", "hi-IN": "मूड", "hi-Latn": "Mood" } },
      { id: "fatigue", label: { "en-IN": "Energy", "hi-IN": "ऊर्जा", "hi-Latn": "Energy" } },
      { id: "night_sweats", label: { "en-IN": "Night Sweats", "hi-IN": "रात में पसीना", "hi-Latn": "Night Sweats" } },
      { id: "body_ache", label: { "en-IN": "Joint Discomfort", "hi-IN": "जोड़ों में दर्द", "hi-Latn": "Joint Discomfort" } },
    ],
    aiPrompts: {
      "en-IN": [
        "What is perimenopause?",
        "Help me summarise my recent hot flashes.",
        "What questions should I ask my doctor?",
      ],
      "hi-IN": [
        "पेरिमेनोपॉज़ क्या होता है?",
        "मेरी नींद और लक्षणों का सारांश बताएं।",
        "डॉक्टर से क्या प्रश्न पूछें?",
      ],
      "hi-Latn": [
        "Perimenopause kya hota hai?",
        "Mere sleep aur hot flashes summarize karo.",
        "Doctor se kya questions poochhein?",
      ],
    },
    reportCategories: ["Wellness Labs (Coming Soon)", "Thyroid / CBC (Coming Soon)"],
  },
};

export interface PregnancyMilestone {
  week: number;
  trimester: 1 | 2 | 3;
  sizeComparison: Record<AppLanguage, string>;
  summary: Record<AppLanguage, string>;
  motherTip: Record<AppLanguage, string>;
}

export const PREGNANCY_MILESTONES: PregnancyMilestone[] = [
  {
    week: 4,
    trimester: 1,
    sizeComparison: { "en-IN": "Poppy seed stage", "hi-IN": "खसखस के दाने जैसा", "hi-Latn": "Poppy seed stage" },
    summary: { "en-IN": "Early implantation completes and the amniotic sac begins forming.", "hi-IN": "प्रारंभिक आरोपण पूरा होता है।", "hi-Latn": "Early implantation complete hota hai." },
    motherTip: { "en-IN": "Start tracking prenatal vitamins and rest when tired.", "hi-IN": "आराम करें और प्रसवपूर्व देखभाल शुरू करें।", "hi-Latn": "Rest karein aur prenatal visits plan karein." },
  },
  {
    week: 8,
    trimester: 1,
    sizeComparison: { "en-IN": "Raspberry milestone", "hi-IN": "रसभरी जैसा चरण", "hi-Latn": "Raspberry milestone" },
    summary: { "en-IN": "Tiny limb buds and early facial features continue taking shape.", "hi-IN": "हाथ-पैर और चेहरे की प्रारंभिक आकृति बनती है।", "hi-Latn": "Early facial features aur limb buds develop hote hain." },
    motherTip: { "en-IN": "Small, frequent meals can ease morning nausea.", "hi-IN": "थोड़े-थोड़े अंतराल पर हल्का भोजन लें।", "hi-Latn": "Chhote frequent meals nausea mein madad karte hain." },
  },
  {
    week: 12,
    trimester: 1,
    sizeComparison: { "en-IN": "Lime milestone", "hi-IN": "नींबू के आकार का चरण", "hi-Latn": "Nimbu ke size ka phase" },
    summary: { "en-IN": "Early organ foundations continue maturing at the close of the first trimester.", "hi-IN": "पहली तिमाही के अंत में प्रारंभिक अंग विकास परिपक्व होता है।", "hi-Latn": "First trimester ke end mein early development continue hota hai." },
    motherTip: { "en-IN": "Stay hydrated and note lingering nausea for your prenatal visit.", "hi-IN": "पर्याप्त पानी पिएं और अनुभव डॉक्टर से साझा करें।", "hi-Latn": "Paani peete rahein aur notes clinic mein share karein." },
  },
  {
    week: 16,
    trimester: 2,
    sizeComparison: { "en-IN": "Avocado milestone", "hi-IN": "एवोकाडो के आकार का चरण", "hi-Latn": "Avocado ke size ka phase" },
    summary: { "en-IN": "Second trimester often brings steadier energy while muscles and bones strengthen.", "hi-IN": "दूसरी तिमाही में ऊर्जा बेहतर होती है और हड्डियां मजबूत होती हैं।", "hi-Latn": "Second trimester mein aksar energy better hoti hai." },
    motherTip: { "en-IN": "Gentle posture breaks ease lower-back tension.", "hi-IN": "हल्का स्ट्रेच कमर के तनाव में आराम दे सकता है।", "hi-Latn": "Sahi posture back tension kam karta hai." },
  },
  {
    week: 20,
    trimester: 2,
    sizeComparison: { "en-IN": "Banana milestone", "hi-IN": "केले के आकार का चरण", "hi-Latn": "Kele ke size ka phase" },
    summary: { "en-IN": "Halfway mark! Anatomy ultrasound scans are commonly scheduled around weeks 18–22.", "hi-IN": "आधा सफर पूरा! 18–22 सप्ताह में एनाटॉमी स्कैन होता है।", "hi-Latn": "Halfway mark! 18–22 weeks mein anomaly scan hota hai." },
    motherTip: { "en-IN": "Review your ultrasound terminology calmly inside Reports.", "hi-IN": "सरल भाषा में शब्दों को समझने के लिए रिपोर्ट अपलोड करें।", "hi-Latn": "Reports tab mein ultrasound report samjhein." },
  },
  {
    week: 24,
    trimester: 2,
    sizeComparison: { "en-IN": "Corn-cob milestone", "hi-IN": "भुट्टे के आकार का चरण", "hi-Latn": "Bhutte ke size ka phase" },
    summary: { "en-IN": "Your baby's skin is getting smoother and senses are developing rapidly.", "hi-IN": "शिशु की त्वचा और इंद्रियाँ तेजी से विकसित हो रही हैं; हलचल महसूस हो सकती है।", "hi-Latn": "Baby ki skin smooth ho rahi hai aur senses tezi se develop ho rahe hain." },
    motherTip: { "en-IN": "Track daily rest, water, and any swelling or headache in your journal.", "hi-IN": "दैनिक आराम, पानी और किसी भी सूजन या सिरदर्द को जर्नल में नोट करें।", "hi-Latn": "Daily rest, paani aur swelling/headache journal mein log karein." },
  },
  {
    week: 28,
    trimester: 3,
    sizeComparison: { "en-IN": "Eggplant milestone", "hi-IN": "बैंगन के आकार का चरण", "hi-Latn": "Baingan ke size ka phase" },
    summary: { "en-IN": "Welcome to the third trimester. Prenatal visits typically become more regular.", "hi-IN": "तीसरी तिमाही की शुरुआत। जांच अधिक नियमित हो सकती है।", "hi-Latn": "Third trimester shuru! Ab prenatal checkups zyada regular hote hain." },
    motherTip: { "en-IN": "Side-lying rest and preparing questions for your clinician support comfort.", "hi-IN": "करवट लेकर आराम करें और अगले चेकअप के प्रश्न तैयार रखें।", "hi-Latn": "Karwat lekar rest karein aur doctor ke liye questions ready rakhein." },
  },
  {
    week: 32,
    trimester: 3,
    sizeComparison: { "en-IN": "Squash milestone", "hi-IN": "कद्दू के आकार का चरण", "hi-Latn": "Squash ke size ka phase" },
    summary: { "en-IN": "Rapid growth continues as lungs and temperature regulation prepare for birth.", "hi-IN": "जन्म की तैयारी के साथ फेफड़े और विकास तेजी से आगे बढ़ते हैं।", "hi-Latn": "Birth ki taiyari ke saath rapid growth continue hoti hai." },
    motherTip: { "en-IN": "Keep your Care Summary updated and know urgent warning signs.", "hi-IN": "चेतावनी संकेतों की जानकारी और केयर सारांश अपडेट रखें।", "hi-Latn": "Urgent warning signs jaankar aur Care Summary updated rakhein." },
  },
  {
    week: 36,
    trimester: 3,
    sizeComparison: { "en-IN": "Papaya milestone", "hi-IN": "पपीते के आकार का चरण", "hi-Latn": "Papite ke size ka phase" },
    summary: { "en-IN": "Late third trimester: preparations for delivery and hospital bag planning begin.", "hi-IN": "तीसरी तिमाही का अंतिम चरण: डिलीवरी और अस्पताल की तैयारी करें।", "hi-Latn": "Delivery ke nazdeek: hospital bag aur care plan ready rakhein." },
    motherTip: { "en-IN": "Seek urgent care immediately if you notice bleeding, severe headache, or reduced movement.", "hi-IN": "रक्तस्राव, तेज सिरदर्द या कम हलचल दिखे तो तुरंत डॉक्टर से संपर्क करें।", "hi-Latn": "Bleeding, tez sir dard ya kam halchal ho toh turant urgent care lein." },
  },
  {
    week: 40,
    trimester: 3,
    sizeComparison: { "en-IN": "Full-term milestone", "hi-IN": "पूर्ण अवधि चरण", "hi-Latn": "Full-term milestone" },
    summary: { "en-IN": "Full term reached! Keep your maternity care contacts and clinician summary ready.", "hi-IN": "पूर्ण अवधि! अपने अस्पताल संपर्क और सारांश तैयार रखें।", "hi-Latn": "Full term! Apne hospital contacts aur summary ready rakhein." },
    motherTip: { "en-IN": "Follow your obstetrician's guidance for labour signs and admission.", "hi-IN": "प्रसव संकेतों के लिए अपने डॉक्टर के निर्देशों का पालन करें।", "hi-Latn": "Labour signs ke liye apne doctor ki guidance follow karein." },
  },
];

export function getMilestoneForWeek(week: number): PregnancyMilestone {
  const clamped = Math.max(1, Math.min(40, week));
  let best = PREGNANCY_MILESTONES[0];
  for (const m of PREGNANCY_MILESTONES) {
    if (m.week <= clamped) best = m;
  }
  return best;
}
