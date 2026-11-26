import { AppLanguage } from "@/types/saheli";

export interface TranslationDict {
  tagline: string;
  welcomeHeadline: string;
  welcomeSub: string;
  getStarted: string;
  exploreDemo: string;
  skip: string;
  continueBtn: string;
  backBtn: string;
  finishSetup: string;
  nav: {
    home: string;
    journey: string;
    ai: string;
    reports: string;
    profile: string;
    care: string;
    symptoms: string;
  };
  badges: {
    demoMode: string;
    liveMode: string;
    comingSoon: string;
    offline: string;
    educationalOnly: string;
  };
  onboarding: {
    langTitle: string;
    langSubtitle: string;
    stageTitle: string;
    stageSubtitle: string;
    personalTitle: string;
    personalSubtitle: string;
    consentTitle: string;
    consentSubtitle: string;
  };
  common: {
    save: string;
    saving: string;
    saved: string;
    retry: string;
    cancel: string;
    upload: string;
    loading: string;
    resetDemo: string;
    clinicianSummary: string;
    askSaheli: string;
    needCare: string;
  };
}

export const TRANSLATIONS: Record<AppLanguage, TranslationDict> = {
  "en-IN": {
    tagline: "Every Phase. Every Change. Always by Your Side.",
    welcomeHeadline: "Your health. Your journey. Your Saheli.",
    welcomeSub:
      "A calm, private companion for menstrual health, pregnancy, and postpartum recovery—built for clear understanding in English, Hindi, and Hinglish.",
    getStarted: "Get Started",
    exploreDemo: "Explore Demo",
    skip: "Skip for now",
    continueBtn: "Continue",
    backBtn: "Back",
    finishSetup: "Enter Saheli",
    nav: {
      home: "Home",
      journey: "Journey",
      ai: "Saheli AI",
      reports: "Reports",
      profile: "Profile",
      care: "Care",
      symptoms: "Journal",
    },
    badges: {
      demoMode: "Synthetic Demo Mode",
      liveMode: "Live Backend",
      comingSoon: "Coming Soon",
      offline: "Offline — Limited Mode",
      educationalOnly: "Educational support only — not a medical diagnosis",
    },
    onboarding: {
      langTitle: "Choose your preferred language",
      langSubtitle: "You can switch between English, Hindi, and Hinglish anytime.",
      stageTitle: "Where are you in your journey?",
      stageSubtitle: "Saheli adapts its colour palette, guidance, and tools to your stage.",
      personalTitle: "Personalise your experience",
      personalSubtitle: "Everything here is optional. Share only what feels helpful.",
      consentTitle: "Privacy & memory consent",
      consentSubtitle: "You decide what Saheli remembers. Health memory stays off unless you opt in.",
    },
    common: {
      save: "Save Check-in",
      saving: "Saving...",
      saved: "Saved",
      retry: "Retry",
      cancel: "Cancel",
      upload: "Upload Report",
      loading: "Loading...",
      resetDemo: "Reset Demo Data",
      clinicianSummary: "Clinician Summary",
      askSaheli: "Ask Saheli AI",
      needCare: "Care & Support",
    },
  },
  "hi-IN": {
    tagline: "हर चरण। हर बदलाव। हमेशा आपके साथ।",
    welcomeHeadline: "आपका स्वास्थ्य। आपकी यात्रा। आपकी सहेली।",
    welcomeSub:
      "मासिक धर्म, गर्भावस्था और प्रसवोत्तर देखभाल के लिए एक शांत, सुरक्षित साथी — हिंदी, हिंग्लिश और अंग्रेजी में।",
    getStarted: "शुरू करें",
    exploreDemo: "डेमो देखें",
    skip: "अभी छोड़ें",
    continueBtn: "आगे बढ़ें",
    backBtn: "पीछे",
    finishSetup: "सहेली शुरू करें",
    nav: {
      home: "होम",
      journey: "यात्रा",
      ai: "सहेली AI",
      reports: "रिपोर्ट्स",
      profile: "प्रोफ़ाइल",
      care: "देखभाल",
      symptoms: "लक्षण",
    },
    badges: {
      demoMode: "सिंथेटिक डेमो मोड",
      liveMode: "लाइव बैकएंड",
      comingSoon: "जल्द आ रहा है",
      offline: "ऑफ़लाइन — सीमित सुविधा",
      educationalOnly: "केवल शैक्षिक जानकारी — यह चिकित्सकीय निदान नहीं है",
    },
    onboarding: {
      langTitle: "अपनी पसंदीदा भाषा चुनें",
      langSubtitle: "आप कभी भी अंग्रेजी, हिंदी या हिंग्लिश में बदल सकती हैं।",
      stageTitle: "आप अभी किस चरण में हैं?",
      stageSubtitle: "सहेली आपके चरण के अनुसार रंग, जानकारी और टूल्स बदलती है।",
      personalTitle: "अपना अनुभव व्यक्तिगत बनाएं",
      personalSubtitle: "यहाँ सब कुछ वैकल्पिक है। केवल वही साझा करें जो उपयोगी लगे।",
      consentTitle: "गोपनीयता और सहमति",
      consentSubtitle: "सहेली क्या याद रखे, यह आप तय करती हैं। सहमति के बिना मेमोरी बंद रहती है।",
    },
    common: {
      save: "चेक-इन सहेजें",
      saving: "सहेजा जा रहा है...",
      saved: "सहेजा गया",
      retry: "पुनः प्रयास करें",
      cancel: "रद्द करें",
      upload: "रिपोर्ट अपलोड करें",
      loading: "लोड हो रहा है...",
      resetDemo: "डेमो रीसेट करें",
      clinicianSummary: "डॉक्टर सारांश",
      askSaheli: "सहेली AI से पूछें",
      needCare: "देखभाल सहायता",
    },
  },
  "hi-Latn": {
    tagline: "Har Phase. Har Badlav. Hamesha Aapke Saath.",
    welcomeHeadline: "Aapki health. Aapka safar. Aapki Saheli.",
    welcomeSub:
      "Menstrual health, pregnancy aur postpartum care ke liye ek shaant, private saathi — English, Hindi aur Hinglish mein.",
    getStarted: "Shuru Karein",
    exploreDemo: "Demo Dekhein",
    skip: "Abhi skip karein",
    continueBtn: "Aage Badhein",
    backBtn: "Peeche",
    finishSetup: "Saheli Kholen",
    nav: {
      home: "Home",
      journey: "Journey",
      ai: "Saheli AI",
      reports: "Reports",
      profile: "Profile",
      care: "Care",
      symptoms: "Journal",
    },
    badges: {
      demoMode: "Synthetic Demo Mode",
      liveMode: "Live Backend",
      comingSoon: "Coming Soon",
      offline: "Offline — Limited Mode",
      educationalOnly: "Sirf educational jaankari — yeh medical diagnosis nahi hai",
    },
    onboarding: {
      langTitle: "Apni pasandida bhasha chunein",
      langSubtitle: "Aap kabhi bhi English, Hindi ya Hinglish switch kar sakti hain.",
      stageTitle: "Aap abhi kis stage mein hain?",
      stageSubtitle: "Saheli aapke stage ke hisaab se theme, tools aur guidance adapt karti hai.",
      personalTitle: "Apna experience personalise karein",
      personalSubtitle: "Yahan sab optional hai. Sirf wahi share karein jo helpful lage.",
      consentTitle: "Privacy aur memory consent",
      consentSubtitle: "Aap decide karti hain Saheli kya yaad rakhe. Consent ke bina memory off rehti hai.",
    },
    common: {
      save: "Check-in Save Karein",
      saving: "Save ho raha hai...",
      saved: "Save ho gaya",
      retry: "Dobara Try Karein",
      cancel: "Cancel",
      upload: "Report Upload Karein",
      loading: "Load ho raha hai...",
      resetDemo: "Demo Reset Karein",
      clinicianSummary: "Doctor Summary",
      askSaheli: "Saheli AI se Poochhein",
      needCare: "Care Support",
    },
  },
};
