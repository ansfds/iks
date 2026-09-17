import { createContext, useContext, useEffect, useCallback, type ReactNode } from "react";

export type Language = "en" | "ar";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  dir: "ltr" | "rtl";
  t: (key: string) => string;
}

const dictionary: Record<string, Record<Language, string>> = {
  "nav.home": { en: "Home", ar: "الرئيسية" },
  "nav.about": { en: "About Us", ar: "من نحن" },
  "nav.vision": { en: "Vision & Mission", ar: "الرؤية والرسالة" },
  "nav.values": { en: "Values", ar: "قيمنا" },
  "nav.goals": { en: "Goals", ar: "أهدافنا" },
  "nav.curriculum": { en: "Services", ar: "الخدمات" },
  "nav.transfers": { en: "Transfers", ar: "التحويلات" },
  "nav.admissions": { en: "Request a Service", ar: "طلب خدمة" },
  "nav.gallery": { en: "Gallery", ar: "معرض الصور" },
  "nav.news": { en: "Updates", ar: "الأخبار والتحديثات" },
  "nav.contact": { en: "Contact Us", ar: "اتصل بنا" },

  "hero.welcome": { en: "Alwaseet Global Money Transfers", ar: "الوسيط العالمي للحوالات" },
  "hero.subtitle": {
    en: "Leaders in digital payments, transfers, and global purchasing",
    ar: "رواد في الدفع الإلكتروني والحوالات والشراء العالمي",
  },
  "hero.description": {
    en: "Integrated financial solutions for payment, transfer, and purchasing from international markets with speed, simplicity, and trust.",
    ar: "حلول مالية متكاملة للدفع والتحويل والشراء من مختلف المواقع والأسواق العالمية، بسرعة وسهولة وأمان.",
  },
  "hero.cta.primary": { en: "Request a Service", ar: "اطلب خدمة" },
  "hero.cta.secondary": { en: "About Us", ar: "من نحن" },

  "stats.students": { en: "Facebook followers", ar: "متابع على فيسبوك" },
  "stats.classrooms": { en: "Core services", ar: "خدمات رئيسية" },
  "stats.nationalities": { en: "Global payments", ar: "مدفوعات عالمية" },
  "stats.satisfaction": { en: "Secure support", ar: "دعم موثوق" },

  "about.label": { en: "About Alwaseet", ar: "عن الوسيط العالمي" },
  "about.title": {
    en: "Alwaseet Global Money Transfers provides trusted financial services for digital payments, international transfers, and online purchasing.",
    ar: "الوسيط العالمي للحوالات شركة تقدم حلولًا مالية موثوقة للدفع الإلكتروني والحوالات الخارجية والشراء من الأسواق العالمية.",
  },
  "about.body": {
    en: "We help customers complete payments, transfers, wallet top-ups, SHEIN cards, Chinese yuan payments, and dollar exchange through clear service channels and reliable follow-up.",
    ar: "نساعد العملاء على تنفيذ المدفوعات والحوالات وشحن المحافظ وبطاقات SHEIN وخدمات اليوان الصيني وبيع وشراء الدولار عبر قنوات واضحة ومتابعة موثوقة.",
  },
  "about.learnMore": { en: "Learn More", ar: "المزيد" },

  "why.title": { en: "Why Choose Alwaseet?", ar: "لماذا تختار الوسيط العالمي؟" },
  "why.subtitle": {
    en: "A clean, reliable financial service experience for transfers, payments, and global purchases.",
    ar: "تجربة مالية واضحة وموثوقة للحوالات والمدفوعات والشراء العالمي.",
  },
  "why.character.title": { en: "Trust & Clarity", ar: "موثوقية ووضوح" },
  "why.character.desc": {
    en: "Clear procedures and direct communication before every payment or transfer.",
    ar: "إجراءات واضحة وتواصل مباشر قبل تنفيذ كل دفعة أو حوالة.",
  },
  "why.facilities.title": { en: "Digital Payments", ar: "دفع إلكتروني" },
  "why.facilities.desc": {
    en: "Payment and top-up services for international stores, wallets, and digital platforms.",
    ar: "خدمات دفع وشحن للمتاجر العالمية والمحافظ والمنصات الرقمية.",
  },
  "why.global.title": { en: "Global Reach", ar: "وصول عالمي" },
  "why.global.desc": {
    en: "International transfers and purchasing support across markets and currencies.",
    ar: "حوالات خارجية ودعم للشراء من الأسواق العالمية وبعملات متعددة.",
  },
  "why.wellbeing.title": { en: "Fast Support", ar: "دعم سريع" },
  "why.wellbeing.desc": {
    en: "Responsive service for confirming details, rates, and completion steps.",
    ar: "استجابة سريعة لتأكيد التفاصيل والأسعار وخطوات التنفيذ.",
  },

  "curriculum.title": { en: "Our Services", ar: "خدماتنا" },
  "curriculum.description": {
    en: "Pay international invoices, send external transfers, buy SHEIN cards, convert Chinese yuan, exchange dollars, and top up electronic wallets from one trusted place.",
    ar: "دفع الفواتير العالمية، الحوالات الخارجية، بطاقات SHEIN، تحويل اليوان الصيني، بيع وشراء الدولار، وشحن المحافظ الإلكترونية من مكان واحد موثوق.",
  },
  "curriculum.cta": { en: "Explore Services", ar: "استكشف الخدمات" },

  "gallery.title": { en: "Service Gallery", ar: "معرض الخدمات" },
  "gallery.subtitle": {
    en: "Visuals from our payment, transfer, and global purchasing services.",
    ar: "لمحات بصرية من خدمات الدفع والتحويل والشراء العالمي.",
  },
  "gallery.cta": { en: "View Gallery", ar: "عرض المعرض" },

  "contactcta.title": { en: "Ready to complete a payment or transfer?", ar: "جاهز لتنفيذ دفعة أو حوالة؟" },
  "contactcta.description": {
    en: "Contact us to confirm details and complete your transfer, payment, or wallet top-up.",
    ar: "تواصل معنا لتأكيد التفاصيل وتنفيذ حوالتك أو دفعتك أو شحن محفظتك الإلكترونية.",
  },
  "contactcta.contact": { en: "Contact Us", ar: "تواصل معنا" },
  "contactcta.visit": { en: "View Location", ar: "عرض الموقع" },

  "footer.description": {
    en: "Trusted digital payment, transfer, and global purchasing services from Tripoli, Libya.",
    ar: "خدمات موثوقة للدفع الإلكتروني والحوالات والشراء العالمي من طرابلس، ليبيا.",
  },
  "footer.quickLinks": { en: "Quick Links", ar: "روابط سريعة" },
  "footer.information": { en: "Information", ar: "معلومات" },
  "footer.contactInfo": { en: "Contact Info", ar: "معلومات الاتصال" },
  "footer.address": { en: "Zanata, opposite Kayan Mobile - Tripoli, Libya", ar: "زناتة مقابل كيان موبايل - طرابلس، ليبيا" },
  "footer.phone": { en: "093-5095091", ar: "093-5095091" },
  "footer.email": { en: "hosambizniz12@gmail.com", ar: "hosambizniz12@gmail.com" },
  "footer.hoursTitle": { en: "Working Hours", ar: "ساعات العمل" },
  "footer.hours.weekdays": {
    en: "Saturday - Wednesday: 11:00 AM - 7:00 PM",
    ar: "السبت – الأربعاء: 11:00 صباحًا – 7:00 مساءً",
  },
  "footer.hours.thursday": {
    en: "Thursday: 11:00 AM - 5:00 PM",
    ar: "الخميس: 11:00 صباحًا – 5:00 مساءً",
  },
  "footer.hours.friday": { en: "Friday: Closed", ar: "الجمعة: مغلق" },
  "footer.copyright": { en: "Alwaseet Global Money Transfers. All rights reserved.", ar: "الوسيط العالمي للحوالات. جميع الحقوق محفوظة." },

  "page.about": { en: "About Us", ar: "من نحن" },
  "page.vision": { en: "Vision & Mission", ar: "الرؤية والرسالة" },
  "page.values": { en: "Our Values", ar: "قيمنا" },
  "page.goals": { en: "Our Goals", ar: "أهدافنا" },
  "page.curriculum": { en: "Services", ar: "الخدمات" },
  "page.transfers": { en: "Transfers", ar: "التحويلات" },
  "page.admissions": { en: "Request a Service", ar: "طلب خدمة" },
  "page.gallery": { en: "Gallery", ar: "معرض الصور" },
  "page.news": { en: "News & Updates", ar: "الأخبار والتحديثات" },
  "page.contact": { en: "Contact Us", ar: "اتصل بنا" },

  "about.mission.title": { en: "Our Mission", ar: "رسالتنا" },
  "about.mission.text": {
    en: "To provide accessible, reliable, and secure payment and transfer services that help customers complete their local and international transactions with confidence.",
    ar: "تقديم خدمات دفع وتحويل آمنة وسهلة وموثوقة تساعد العملاء على إنجاز معاملاتهم المحلية والدولية بثقة.",
  },
  "about.vision.title": { en: "Our Vision", ar: "رؤيتنا" },
  "about.vision.text": {
    en: "To be a trusted financial service partner for digital payments, international transfers, and global purchasing in Libya.",
    ar: "أن نكون شريكًا ماليًا موثوقًا في ليبيا لخدمات الدفع الإلكتروني والحوالات الخارجية والشراء العالمي.",
  },
  "about.values.title": { en: "Our Values", ar: "قيمنا" },
  "about.values.description": {
    en: "Our values guide every transaction, from the first question to the final confirmation.",
    ar: "قيمنا تقود كل معاملة، من أول استفسار حتى تأكيد التنفيذ.",
  },
  "about.values.integrity.title": { en: "Integrity", ar: "النزاهة" },
  "about.values.integrity.desc": {
    en: "We handle customer requests with transparency and clear communication.",
    ar: "نتعامل مع طلبات العملاء بشفافية وتواصل واضح.",
  },
  "about.values.respect.title": { en: "Care", ar: "العناية" },
  "about.values.respect.desc": {
    en: "We respect every customer request and follow up with practical support.",
    ar: "نحترم كل طلب ونقدّم متابعة عملية تناسب احتياج العميل.",
  },
  "about.values.excellence.title": { en: "Reliability", ar: "الاعتمادية" },
  "about.values.excellence.desc": {
    en: "We focus on accurate details, secure handling, and dependable completion.",
    ar: "نركّز على دقة التفاصيل وأمان التعامل وموثوقية التنفيذ.",
  },
  "about.values.innovation.title": { en: "Agility", ar: "المرونة" },
  "about.values.innovation.desc": {
    en: "We keep pace with digital payment needs and global purchasing channels.",
    ar: "نواكب احتياجات الدفع الإلكتروني وقنوات الشراء العالمية.",
  },

  "goals.title": { en: "Our Strategic Goals", ar: "أهدافنا الاستراتيجية" },
  "goals.subtitle": {
    en: "Focused goals for a stronger, faster, and more reliable financial service experience.",
    ar: "أهداف واضحة لتجربة مالية أقوى وأسرع وأكثر موثوقية.",
  },
  "goals.academic.title": { en: "Service Accuracy", ar: "دقة الخدمة" },
  "goals.academic.desc": {
    en: "Confirm transfer and payment details carefully before execution and keep customers informed at each step.",
    ar: "تأكيد تفاصيل الحوالات والمدفوعات بعناية قبل التنفيذ وإبقاء العميل على اطلاع بكل خطوة.",
  },
  "goals.character.title": { en: "Secure Handling", ar: "تعامل آمن" },
  "goals.character.desc": {
    en: "Protect customer data and transaction details while maintaining clear communication channels.",
    ar: "حماية بيانات العملاء وتفاصيل المعاملات مع الحفاظ على قنوات تواصل واضحة.",
  },
  "goals.innovation.title": { en: "Digital Expansion", ar: "توسع رقمي" },
  "goals.innovation.desc": {
    en: "Expand wallet top-ups, digital cards, online payments, and global purchasing support.",
    ar: "توسيع خدمات شحن المحافظ والبطاقات الرقمية والمدفوعات والشراء العالمي.",
  },
  "goals.community.title": { en: "Customer Trust", ar: "ثقة العملاء" },
  "goals.community.desc": {
    en: "Build long-term relationships through reliable service, quick response, and honest guidance.",
    ar: "بناء علاقات طويلة المدى عبر خدمة موثوقة واستجابة سريعة وإرشاد واضح.",
  },

  "curriculum.page.title": { en: "Integrated Financial Services", ar: "خدمات مالية متكاملة" },
  "curriculum.page.description": {
    en: "Alwaseet Global supports payments, transfers, marketplace purchases, currency exchange, yuan payments, SHEIN cards, and digital wallet top-ups.",
    ar: "يدعم الوسيط العالمي خدمات الدفع والتحويل والشراء من المتاجر العالمية وصرف العملات ومدفوعات اليوان وبطاقات SHEIN وشحن المحافظ الإلكترونية.",
  },
  "curriculum.stages.title": { en: "Main Services", ar: "الخدمات الرئيسية" },
  "curriculum.early.title": { en: "Global Bills", ar: "دفع الفواتير العالمية" },
  "curriculum.early.ages": { en: "Payments", ar: "مدفوعات" },
  "curriculum.early.desc": {
    en: "Pay invoices and orders from different international websites and stores.",
    ar: "دفع فواتير وطلبات من مختلف المواقع والمتاجر العالمية.",
  },
  "curriculum.primary.title": { en: "International Transfers", ar: "الحوالات الخارجية" },
  "curriculum.primary.ages": { en: "Transfers", ar: "حوالات" },
  "curriculum.primary.desc": {
    en: "External money transfer services to multiple countries with clear follow-up.",
    ar: "إجراء حوالات مالية خارجية لمختلف الدول مع متابعة واضحة.",
  },
  "curriculum.lower.title": { en: "SHEIN Cards & Yuan", ar: "بطاقات SHEIN واليوان" },
  "curriculum.lower.ages": { en: "Shopping", ar: "شراء عالمي" },
  "curriculum.lower.desc": {
    en: "SHEIN shopping cards plus Chinese yuan transfer and payment services.",
    ar: "توفير بطاقات وكروت SHEIN وخدمات تحويل ودفع باليوان الصيني.",
  },
  "curriculum.upper.title": { en: "Dollars & Wallets", ar: "الدولار والمحافظ" },
  "curriculum.upper.ages": { en: "Exchange", ar: "صرف وشحن" },
  "curriculum.upper.desc": {
    en: "Buy, sell, and transfer dollars, and top up wallets, virtual cards, and Facebook services.",
    ar: "تحويل وبيع وشراء الدولار وشحن المحافظ والبطاقات الافتراضية وخدمات Facebook.",
  },
  "curriculum.pearson": {
    en: "Payment, transfer, global shopping, yuan, dollars, and wallet top-ups",
    ar: "الدفع والتحويل والشراء العالمي واليوان والدولار وشحن المحافظ",
  },

  "admissions.process.title": { en: "How Requests Work", ar: "آلية طلب الخدمة" },
  "admissions.process.subtitle": {
    en: "A simple process to confirm the service details and complete the transaction.",
    ar: "خطوات بسيطة لتأكيد تفاصيل الخدمة وتنفيذ المعاملة.",
  },
  "admissions.step1.title": { en: "Send Request", ar: "إرسال الطلب" },
  "admissions.step1.desc": {
    en: "Share the service you need with your contact details.",
    ar: "أرسل نوع الخدمة المطلوبة مع بيانات التواصل.",
  },
  "admissions.step2.title": { en: "Confirm Details", ar: "تأكيد التفاصيل" },
  "admissions.step2.desc": {
    en: "We confirm amount, destination, currency, and required steps.",
    ar: "نؤكد المبلغ والوجهة والعملة والخطوات المطلوبة.",
  },
  "admissions.step3.title": { en: "Complete Payment", ar: "تنفيذ الدفع" },
  "admissions.step3.desc": {
    en: "The transaction is processed through the suitable official channel.",
    ar: "تُنفذ المعاملة عبر القناة المناسبة والمعتمدة.",
  },
  "admissions.step4.title": { en: "Final Confirmation", ar: "تأكيد الإنجاز" },
  "admissions.step4.desc": {
    en: "You receive the confirmation details after completion.",
    ar: "تستلم تفاصيل التأكيد بعد إتمام العملية.",
  },
  "admissions.requirements.title": { en: "Useful Request Details", ar: "بيانات مفيدة للطلب" },
  "admissions.requirements.subtitle": {
    en: "Preparing these details helps us respond faster.",
    ar: "تجهيز هذه البيانات يساعدنا على الرد بشكل أسرع.",
  },
  "admissions.doc1": { en: "Requested service type", ar: "نوع الخدمة المطلوبة" },
  "admissions.doc2": { en: "Amount and currency", ar: "المبلغ والعملة" },
  "admissions.doc3": { en: "Destination or website/store link", ar: "الوجهة أو رابط الموقع/المتجر" },
  "admissions.doc4": { en: "Preferred payment method", ar: "طريقة الدفع المفضلة" },
  "admissions.doc5": { en: "Contact phone number", ar: "رقم الهاتف للتواصل" },
  "admissions.doc6": { en: "Any notes needed to complete the service", ar: "أي ملاحظات مطلوبة لإتمام الخدمة" },

  "contact.info.title": { en: "Contact Information", ar: "معلومات الاتصال" },
  "contact.form.title": { en: "Send us a Message", ar: "أرسل لنا رسالة" },
  "contact.form.name": { en: "Your Name", ar: "اسمك" },
  "contact.form.email": { en: "Email Address", ar: "البريد الإلكتروني" },
  "contact.form.phone": { en: "Phone Number", ar: "رقم الهاتف" },
  "contact.form.subject": { en: "Subject", ar: "الموضوع" },
  "contact.form.message": { en: "Your Message", ar: "رسالتك" },
  "contact.form.submit": { en: "Send Message", ar: "إرسال الرسالة" },
  "contact.form.success": {
    en: "Thank you! Your message has been sent successfully. We will get back to you soon.",
    ar: "شكرًا لك! تم إرسال رسالتك بنجاح. سنتواصل معك قريبًا.",
  },

  "gallery.all": { en: "All", ar: "الكل" },
  "gallery.classrooms": { en: "Payments", ar: "المدفوعات" },
  "gallery.activities": { en: "Transfers", ar: "الحوالات" },
  "gallery.campus": { en: "Currencies", ar: "العملات" },
  "gallery.students": { en: "Wallets", ar: "المحافظ" },

  "news.upcoming": { en: "Upcoming Updates", ar: "التحديثات القادمة" },
  "news.readMore": { en: "Read More", ar: "اقرأ المزيد" },
  "news.noEvents": { en: "No upcoming updates at this time.", ar: "لا توجد تحديثات قادمة في الوقت الحالي." },

  "admin.dashboard": { en: "Dashboard", ar: "لوحة التحكم" },
  "admin.contacts": { en: "Contact Submissions", ar: "طلبات التواصل" },
  "admin.gallery": { en: "Gallery", ar: "معرض الصور" },
  "admin.news": { en: "News & Updates", ar: "الأخبار والتحديثات" },
  "admin.logout": { en: "Logout", ar: "تسجيل الخروج" },
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const language = "ar" as const satisfies Language;
  const dir = "rtl" as const;

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
    localStorage.setItem("language", language);
  }, [dir, language]);

  const setLanguage = useCallback(() => {
    localStorage.setItem("language", "ar");
  }, []);

  const toggleLanguage = useCallback(() => {}, []);

  const t = useCallback(
    (key: string): string => {
      return dictionary[key]?.ar || key;
    },
    []
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, dir, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
