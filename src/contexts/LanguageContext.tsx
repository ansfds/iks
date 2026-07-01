import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export type Language = "en" | "ar";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  dir: "ltr" | "rtl";
  t: (key: string) => string;
}

const dictionary: Record<string, Record<Language, string>> = {
  // Navigation
  "nav.home": { en: "Home", ar: "الرئيسية" },
  "nav.about": { en: "About Us", ar: "من نحن" },
  "nav.vision": { en: "Vision & Mission", ar: "الرؤية والرسالة" },
  "nav.values": { en: "Values", ar: "القيم" },
  "nav.goals": { en: "Goals", ar: "الأهداف" },
  "nav.curriculum": { en: "British Curriculum", ar: "المناهج البريطانية" },
  "nav.admissions": { en: "Admissions", ar: "القبول" },
  "nav.gallery": { en: "Gallery", ar: "معرض الصور" },
  "nav.news": { en: "News & Events", ar: "الأخبار والفعاليات" },
  "nav.contact": { en: "Contact Us", ar: "اتصل بنا" },

  // Hero
  "hero.welcome": { en: "Welcome to", ar: "مرحبا بكم في" },
  "hero.subtitle": { en: "International School", ar: "المدرسة الدولية" },
  "hero.description": {
    en: "Unlock Your Child's Potential with World-Class Education & Global Readiness",
    ar: "اكتشف إمكانيات طفلك مع تعليم عالمي واستعداد للعالمية",
  },
  "hero.cta.primary": { en: "Book a Tour", ar: "احجز جولة" },
  "hero.cta.secondary": { en: "About Us", ar: "من نحن" },

  // Stats
  "stats.students": { en: "Students", ar: "طالب" },
  "stats.classrooms": { en: "Classrooms", ar: "فصل دراسي" },
  "stats.nationalities": { en: "Nationalities", ar: "جنسية" },
  "stats.satisfaction": { en: "Satisfaction Rate", ar: "نسبة الرضا" },

  // About Preview
  "about.label": { en: "About Our School", ar: "عن مدرستنا" },
  "about.title": {
    en: "Knowledge International School is a modern educational institution providing world-class education for students from Kindergarten to High School.",
    ar: "مدرسة المعرفة الدولية هي مؤسسة تعليمية حديثة تقدم تعليماً عالمياً للطلاب من رياض الأطفال حتى الثانوية.",
  },
  "about.body": {
    en: "We believe every child has unique potential waiting to be unlocked. Through our innovative curriculum, experienced educators, and state-of-the-art facilities, we create an environment where students thrive academically, socially, and emotionally. Our holistic approach ensures each student develops critical thinking skills, creativity, and a love for lifelong learning.",
    ar: "نؤمن بأن لكل طفل إمكانيات فريدة في انتظار أن يتم اكتشافها. من خلال مناهجنا المبتكرة ومربينا ذوي الخبرة ومرافقنا الحديثة، نخلق بيئة يزدهر فيها الطلاب أكاديمياً واجتماعياً وعاطفياً. يضمن نهجنا الشامل تطوير كل طالب لمهارات التفكير النقدي والإبداع وحب التعلم مدى الحياة.",
  },
  "about.learnMore": { en: "Learn More", ar: "المزيد" },

  // Why Choose Us
  "why.title": { en: "Why Choose Knowledge?", ar: "لماذا تختار المعرفة؟" },
  "why.subtitle": {
    en: "We combine academic excellence with character building to prepare students for a global future.",
    ar: "نجمع بين التميز الأكاديمي وبناء الشخصية لإعداد الطلاب لمستقبل عالمي.",
  },
  "why.character.title": { en: "Character Education", ar: "تعليم الشخصية" },
  "why.character.desc": {
    en: "We nurture responsibility, empathy, integrity, and leadership in every student.",
    ar: "نرعى المسؤولية والتعاطف والنزاهة والقيادة في كل طالب.",
  },
  "why.facilities.title": { en: "Modern Facilities", ar: "مرافق حديثة" },
  "why.facilities.desc": {
    en: "State-of-the-art classrooms, science labs, sports facilities, and technology centers.",
    ar: "فصول دراسية ومعامل علوم ومرافق رياضية ومراكز تكنولوجيا على أحدث مستوى.",
  },
  "why.global.title": { en: "Global Perspective", ar: "منظور عالمي" },
  "why.global.desc": {
    en: "Our diverse community and international curriculum prepare students for the world.",
    ar: "مجتمعنا المتنوع ومناهجنا الدولي يعدان الطلاب للعالم.",
  },
  "why.wellbeing.title": { en: "Student Wellbeing", ar: "رفاهية الطلاب" },
  "why.wellbeing.desc": {
    en: "Comprehensive support systems ensuring every child thrives emotionally and socially.",
    ar: "أنظمة دعم شاملة تضمن ازدهار كل طفل عاطفياً واجتماعياً.",
  },

  // Curriculum Preview
  "curriculum.title": { en: "British Curriculum", ar: "المناهج البريطانية" },
  "curriculum.description": {
    en: "Our UK-based curriculum, developed in partnership with Pearson, provides a comprehensive educational framework recognized worldwide. From Early Years through Upper Secondary, students follow a structured learning path that builds critical thinking, creativity, and academic excellence.",
    ar: "يوفر منهجنا المستند إلى المملكة المتحدة، والمطور بالشراكة مع بيرسون، إطاراً تعليمياً شاملاً معترفاً به عالمياً. من السنوات الأولى حتى الثانوية العليا، يتبع الطلاب مساراً تعليمياً منظماً يبني التفكير النقدي والإبداع والتميز الأكاديمي.",
  },
  "curriculum.cta": { en: "Explore Curriculum", ar: "استكشف المناهج" },

  // Leadership translations removed

  // Gallery Preview
  "gallery.title": { en: "School Life Gallery", ar: "معرض الحياة المدرسية" },
  "gallery.subtitle": {
    en: "Moments from our vibrant school community.",
    ar: "لحظات من مجتمعنا المدرسي النابض بالحياة.",
  },
  "gallery.cta": { en: "View Full Gallery", ar: "عرض المعرض الكامل" },

  // Contact CTA
  "contactcta.title": { en: "Get in Touch", ar: "تواصل معنا" },
  "contactcta.description": {
    en: "We'd love to hear from you. Reach out for admissions, inquiries, or to book a school tour.",
    ar: "نود أن نسمع منك. تواصل معنا للقبول أو الاستفسارات أو لحجز جولة في المدرسة.",
  },
  "contactcta.contact": { en: "Contact Us", ar: "اتصل بنا" },
  "contactcta.visit": { en: "Book a Visit", ar: "احجز زيارة" },

  // Footer
  "footer.description": {
    en: "Empowering students with world-class education, fostering critical thinking, creativity, and global citizenship since our founding.",
    ar: "تمكين الطلاب بتعليم عالمي المستوى، وتعزيز التفكير النقدي والإبداع والمواطنة العالمية منذ تأسيسنا.",
  },
  "footer.quickLinks": { en: "Quick Links", ar: "روابط سريعة" },
  "footer.information": { en: "Information", ar: "معلومات" },
  "footer.contactInfo": { en: "Contact Info", ar: "معلومات الاتصال" },
  "footer.address": { en: "Ein Zara Street - near Nasser University, Tripoli, Libya", ar: "عيـن زارة - بالقرب من جامعة نـاصر " },
  "footer.phone": { en: "092-2000011", ar: "092-2000011" },
  "footer.email": { en: "info@iks.sch.ly", ar: "info@iks.sch.ly" },
  "footer.copyright": { en: "International Knowledge School. All rights reserved.", ar: "مدرسة المعرفة الدولية. جميع الحقوق محفوظة." },

  // Page Titles
  "page.about": { en: "About Us", ar: "من نحن" },
  "page.vision": { en: "Vision & Mission", ar: "الرؤية والرسالة" },
  "page.values": { en: "Our Values", ar: "قيمنا" },
  "page.goals": { en: "Our Goals", ar: "أهدافنا" },
  "page.curriculum": { en: "British Curriculum", ar: "المناهج البريطانية" },
  // page.leadership removed
  "page.admissions": { en: "Admissions", ar: "القبول" },
  "page.gallery": { en: "School Gallery", ar: "معرض المدرسة" },
  "page.news": { en: "News & Events", ar: "الأخبار والفعاليات" },
  "page.contact": { en: "Contact Us", ar: "اتصل بنا" },

  // About Page
  "about.mission.title": { en: "Our Mission", ar: "رسالتنا" },
  "about.mission.text": {
    en: "To provide a nurturing, inclusive, and stimulating learning environment that empowers students to achieve academic excellence, develop strong character, and become responsible global citizens who contribute positively to society.",
    ar: "توفير بيئة تعليمية داعمة وشاملة ومحفزة تمكن الطلاب من تحقيق التميز الأكاديمي وتطوير شخصية قوية والصيرورة مواطنين عالميين مسؤولين يساهمون إيجابياً في المجتمع.",
  },
  "about.vision.title": { en: "Our Vision", ar: "رؤيتنا" },
  "about.vision.text": {
    en: "To be a leading international school recognized for excellence in education, innovation in teaching, and the holistic development of students who are prepared to thrive in a rapidly changing global landscape.",
    ar: "أن نكون مدرسة دولية رائدة معترفاً بها في التميز التعليمي والابتكار في التدريس والتنمية الشاملة للطلاب المستعدين للازدهار في مشهد عالمي يتغير بسرعة.",
  },
  "about.values.title": { en: "Our Values", ar: "قيمنا" },
  "about.values.description": {
    en: "Our core values guide everything we do at Knowledge . They shape our culture, inform our decisions, and inspire our community to strive for excellence.",
    ar: "قيمنا الأساسية ترشد كل ما نقوم به في المعرفة. إنها تشكل ثقافتنا وتوجه قراراتنا وتح inspire مجتمعنا للسعي نحو التميز.",
  },
  "about.values.integrity.title": { en: "Integrity", ar: "النزاهة" },
  "about.values.integrity.desc": {
    en: "We uphold the highest ethical standards in all our actions and decisions.",
    ar: "نحافظ على أعلى المعايير الأخلاقية في جميع أفعالنا وقراراتنا.",
  },
  "about.values.respect.title": { en: "Respect", ar: "الاحترام" },
  "about.values.respect.desc": {
    en: "We value diversity and treat every individual with dignity and kindness.",
    ar: "نقدر التنوع ونعامل كل فرد بكرامة ولطف.",
  },
  "about.values.excellence.title": { en: "Excellence", ar: "التميز" },
  "about.values.excellence.desc": {
    en: "We pursue the highest standards in education and continuous improvement.",
    ar: "نسعى لأعلى المعايير في التعليم والتحسين المستمر.",
  },
  "about.values.innovation.title": { en: "Innovation", ar: "الابتكار" },
  "about.values.innovation.desc": {
    en: "We embrace creativity and forward-thinking approaches to teaching and learning.",
    ar: "ن adopting الإبداع والنهج التقدمي في التدريس والتعلم.",
  },

  // Goals Page
  "goals.title": { en: "Our Strategic Goals", ar: "أهدافنا الاستراتيجية" },
  "goals.subtitle": {
    en: "We are committed to achieving excellence through clear, measurable goals that drive our school's continuous development.",
    ar: "نلتزم بتحقيق التميز من خلال أهداف واضحة وقابلة للقياس تدفع التطوير المستمر لمدرستنا.",
  },
  "goals.academic.title": { en: "Academic Excellence", ar: "التميز الأكاديمي" },
  "goals.academic.desc": {
    en: "Achieve top-tier academic results through rigorous curriculum delivery, personalized learning plans, and continuous assessment. Maintain above-average standardized test scores and ensure 100% of graduates gain admission to reputable universities worldwide.",
    ar: "تحقيق نتائج أكاديمية من الدرجة الأولى من خلال تسليم منهج صارم وخطط تعلم مخصصة وتقييم مستمر. الحفاظ على درجات اختبارات موحدة فوق المتوسط وضمان قبول 100% من الخريجين في جامعات مرموقة حول العالم.",
  },
  "goals.character.title": { en: "Character Development", ar: "تنمية الشخصية" },
  "goals.character.desc": {
    en: "Foster a school culture that promotes integrity, respect, responsibility, and empathy. Implement comprehensive character education programs that develop well-rounded individuals prepared for life's challenges.",
    ar: "تعزيز ثقافة مدرسية تعزز النزاهة والاحترام والمسؤولية والتعاطف. تطبيق برامج تعليم الشخصية الشاملة التي تنمي أفراداً متكاملين مستعدين لتحديات الحياة.",
  },
  "goals.innovation.title": { en: "Innovation & Technology", ar: "الابتكار والتكنولوجيا" },
  "goals.innovation.desc": {
    en: "Integrate cutting-edge technology across all subjects and grade levels. Develop digital literacy skills and promote innovative thinking through STEM programs, coding clubs, and technology-driven projects.",
    ar: "دمج التكنولوجيا المتطورة في جميع المواد والمراحل الدراسية. تطوير مهارات المحو الأمية الرقمية وتعزيز التفكير المبتكر من خلال برامج العلوم والتكنولوجيا والهندسة والرياضيات ونوادي البرمجة والمشاريع المعتمدة على التكنولوجيا.",
  },
  "goals.community.title": { en: "Community Engagement", ar: "التواصل المجتمعي" },
  "goals.community.desc": {
    en: "Build strong partnerships with parents, local organizations, and the global educational community. Create opportunities for students to engage in meaningful service projects and develop a sense of social responsibility.",
    ar: "بناء شراكات قوية مع أولياء الأمور والمنظمات المحلية ومجتمع التعليم العالمي. خلق فرص للطلاب للمشاركة في مشاريع خدمة هادفة وتطوير إحساس بالمسؤولية الاجتماعية.",
  },

  // Curriculum Page
  "curriculum.page.title": { en: "World-Class British Education", ar: "تعليم بريطاني عالمي المستوى" },
  "curriculum.page.description": {
    en: "Knowledge International School delivers a comprehensive British curriculum in partnership with Pearson, the world's leading education company. Our program follows the UK National Curriculum, ensuring students receive a globally recognized education that prepares them for universities and careers worldwide.",
    ar: "تقدم مدرسة المعرفة الدولية منهجاً بريطانياً شاملاً بالشراكة مع بيرسون، الشركة الرائدة في مجال التعليم في العالم. يتبع برنامجنا المنهج الوطني البريطاني، مما يضمن حصول الطلاب على تعليم معترف به عالمياً يعدهم للجامعات والمهن في جميع أنحاء العالم.",
  },
  "curriculum.stages.title": { en: "Educational Stages", ar: "المراحل التعليمية" },
  "curriculum.early.title": { en: "Early Years", ar: "السنوات الأولى" },
  "curriculum.early.ages": { en: "Ages 3-5", ar: "الأعمار 3-5" },
  "curriculum.early.desc": {
    en: "Foundation Stage focusing on play-based learning, social development, and early literacy and numeracy skills.",
    ar: "المرحلة التأسيسية تركز على التعلم القائم على اللعب والتنمية الاجتماعية ومهارات محو الأمية والحساب المبكرة.",
  },
  "curriculum.primary.title": { en: "Primary", ar: "الابتدائية" },
  "curriculum.primary.ages": { en: "Ages 5-11", ar: "الأعمار 5-11" },
  "curriculum.primary.desc": {
    en: "Key Stages 1-2 covering core subjects including English, Mathematics, Science, and introducing specialist subjects.",
    ar: "المراحل الرئيسية 1-2 تغطي المواد الأساسية بما في ذلك اللغة الإنجليزية والرياضيات والعلوم وتقديم مواد متخصصة.",
  },
  "curriculum.lower.title": { en: "Lower Secondary", ar: "الثانوية الدنيا" },
  "curriculum.lower.ages": { en: "Ages 11-14", ar: "الأعمار 11-14" },
  "curriculum.lower.desc": {
    en: "Key Stage 3 with a broad and balanced curriculum, developing independent learning skills and subject knowledge.",
    ar: "المرحلة الرئيسية 3 مع منهج واسع ومتوازن، يطور مهارات التعلم المستقل والمعرفة الموضوعية.",
  },
  "curriculum.upper.title": { en: "Upper Secondary", ar: "الثانوية العليا" },
  "curriculum.upper.ages": { en: "Ages 14-19", ar: "الأعمار 14-19" },
  "curriculum.upper.desc": {
    en: "Key Stages 4-5 preparing students for IGCSEs and A-Levels, with university and career counseling.",
    ar: "المراحل الرئيسية 4-5 تعد الطلاب لشهادات IGCSE وA-Levels، مع إرشاد الجامعة والمهن.",
  },
  "curriculum.pearson": {
    en: "In partnership with Pearson, a global leader in education",
    ar: "بالشراكة مع بيرسون، الرائدة عالمياً في مجال التعليم",
  },

  // Admissions Page
  "admissions.process.title": { en: "Admission Process", ar: "عملية القبول" },
  "admissions.process.subtitle": {
    en: "Joining Knowledge is a simple, straightforward process designed to ensure the best fit for your child.",
    ar: "الانضمام إلى المعرفة هو عملية بسيطة ومباشرة مصممة لضمان أفضل توافق لطفلك.",
  },
  "admissions.step1.title": { en: "Submit Application", ar: "تقديم الطلب" },
  "admissions.step1.desc": {
    en: "Complete our online application form and submit required documents including previous school records.",
    ar: "أكمل استمارة الطلب عبر الإنترنت وأرسل المستندات المطلوبة بما في ذلك سجلات المدرسة السابقة.",
  },
  "admissions.step2.title": { en: "Assessment", ar: "التقييم" },
  "admissions.step2.desc": {
    en: "Students complete age-appropriate assessments in English and Mathematics to determine academic readiness.",
    ar: "يكمل الطلاب تقييمات مناسبة للعمر في اللغة الإنجليزية والرياضيات لتحديد الجاهزية الأكاديمية.",
  },
  "admissions.step3.title": { en: "Interview", ar: "المقابلة" },
  "admissions.step3.desc": {
    en: "A friendly meeting with the student and parents to discuss goals, expectations, and school fit.",
    ar: "اجتماع ودي مع الطالب وأولياء الأمور لمناقشة الأهداف والتوقعات ومدى ملاءمة المدرسة.",
  },
  "admissions.step4.title": { en: "Enrollment", ar: "التسجيل" },
  "admissions.step4.desc": {
    en: "Upon acceptance, complete enrollment forms and secure your child's place for the upcoming academic year.",
    ar: "عند القبول، أكمل استمارات التسجيل وتأكد من مكان طفلك للعام الدراسي القادم.",
  },
  "admissions.requirements.title": { en: "Required Documents", ar: "المستندات المطلوبة" },
  "admissions.requirements.subtitle": {
    en: "Please prepare the following documents for your application:",
    ar: "يرجى إعداد المستندات التالية للتطبيق:",
  },
  "admissions.doc1": { en: "Completed application form", ar: "استمارة الطلب مكتملة" },
  "admissions.doc2": { en: "Copy of student's passport or birth certificate", ar: "نسخة من جواز سفر الطلب أو شهادة الميلاد" },
  "admissions.doc3": { en: "Recent passport-sized photographs (4)", ar: "صور حديثة بحجم جواز السفر (4)" },
  "admissions.doc4": { en: "Previous school records/transcripts (last 2 years)", ar: "سجلات/كشوفات المدرسة السابقة (آخر سنتين)" },
  "admissions.doc5": { en: "Immunization records", ar: "سجلات التطعيم" },
  "admissions.doc6": { en: "Copy of parent's ID and residence permit", ar: "نسخة من هوية الوالد وتصريح الإقامة" },

  // Contact Page
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
    ar: "شكراً لك! تم إرسال رسالتك بنجاح. سنتواصل معك قريباً.",
  },

  // Gallery Page
  "gallery.all": { en: "All", ar: "الكل" },
  "gallery.classrooms": { en: "Classrooms", ar: "الفصول" },
  "gallery.activities": { en: "Activities", ar: "الأنشطة" },
  "gallery.campus": { en: "Campus", ar: "الحرم" },
  "gallery.students": { en: "Students", ar: "الطلاب" },

  // News Page
  "news.upcoming": { en: "Upcoming Events", ar: "الفعاليات القادمة" },
  "news.readMore": { en: "Read More", ar: "اقرأ المزيد" },
  "news.noEvents": { en: "No upcoming events at this time.", ar: "لا توجد فعاليات قادمة في الوقت الحالي." },

  // Admin
  "admin.dashboard": { en: "Dashboard", ar: "لوحة التحكم" },
  "admin.contacts": { en: "Contact Submissions", ar: "طلبات التواصل" },
  "admin.gallery": { en: "Gallery", ar: "معرض الصور" },
  "admin.news": { en: "News & Events", ar: "الأخبار والفعاليات" },
  "admin.logout": { en: "Logout", ar: "تسجيل الخروج" },
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("language") as Language) || "en";
    }
    return "en";
  });

  const dir = language === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
    localStorage.setItem("language", language);
  }, [language, dir]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => (prev === "en" ? "ar" : "en"));
  }, []);

  const t = useCallback(
    (key: string): string => {
      return dictionary[key]?.[language] || key;
    },
    [language]
  );

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, toggleLanguage, dir, t }}
    >
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
