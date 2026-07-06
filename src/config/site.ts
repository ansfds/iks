export type LocalizedText = {
  en: string;
  ar: string;
};

export type SeoEntry = {
  title: LocalizedText;
  description: LocalizedText;
  canonicalPath: string;
};

export const siteConfig = {
  name: "International Knowledge School",
  shortName: "IKS",
  alternateNames: ["IKS Libya", "Al-Maarefa International School"],
  // Update this value when the production domain changes.
  siteUrl: "https://iks.sch.ly",
  socialPreviewImage: "/images/social-preview.jpg",
  email: "info@iks.sch.ly",
  phone: "+218922000011",
  address: {
    street: "Ein Zara Street - near Nasser University",
    city: "Tripoli",
    country: "Libya",
    countryCode: "LY",
  },
  socialLinks: [
    "https://www.facebook.com/InternationalKnowledgeSchool",
    "https://www.instagram.com/InternationalKnowledgeSchool",
  ],
};

export const siteImages = {
  socialPreview: "/images/social-preview.jpg",
  heroClassroom: "/images/hero-classroom.jpg",
  studentsGroup: "/images/students-group.jpg",
  scienceLab: "/images/science-lab.jpg",
  library: "/images/library.jpg",
  campus: "/images/campus-exterior.jpg",
  aboutClassroom: "/images/about-classroom.jpg",
  graduation: "/images/graduation.jpg",
  artClassroom: "/images/art-classroom.jpg",
  sportsFacility: "/images/sports-facility.jpg",
};

export const seoKeywords = [
  "International Knowledge School",
  "IKS Libya",
  "International School in Libya",
  "British Curriculum Libya",
  "American Curriculum Libya",
  "Pearson Edexcel Libya",
  "SAT School Libya",
  "International Education Libya",
  "Local Curriculum Libya",
  "Libyan National Curriculum",
  "International School Tripoli",
];

export const pageSeo: Record<string, SeoEntry> = {
  "/": {
    canonicalPath: "/",
    title: {
      en: "International Knowledge School | IKS Libya",
      ar: "مدرسة المعرفة الدولية | IKS ليبيا",
    },
    description: {
      en: "International Knowledge School in Tripoli, Libya offers British, American, and local curriculum pathways with internationally minded education.",
      ar: "مدرسة المعرفة الدولية في طرابلس، ليبيا تقدم مسارات تعليمية بريطانية وأمريكية ومحلية ضمن بيئة تعليمية دولية.",
    },
  },
  "/about": {
    canonicalPath: "/about",
    title: {
      en: "About International Knowledge School | IKS Libya",
      ar: "عن مدرسة المعرفة الدولية | IKS ليبيا",
    },
    description: {
      en: "Learn about International Knowledge School, established in 2010 to bridge Libyan educational values with international academic standards.",
      ar: "تعرف على مدرسة المعرفة الدولية التي تأسست عام 2010 لربط القيم التعليمية المحلية بالمعايير الأكاديمية الدولية.",
    },
  },
  "/vision-mission": {
    canonicalPath: "/vision-mission",
    title: {
      en: "Vision and Mission | International Knowledge School",
      ar: "الرؤية والرسالة | مدرسة المعرفة الدولية",
    },
    description: {
      en: "Explore the vision and mission guiding IKS toward academic excellence, innovation, and student-centered learning in Libya.",
      ar: "استكشف الرؤية والرسالة التي توجه مدرسة المعرفة الدولية نحو التميز الأكاديمي والابتكار والتعليم المتمحور حول الطالب.",
    },
  },
  "/values": {
    canonicalPath: "/values",
    title: {
      en: "Core Values | International Knowledge School",
      ar: "القيم الأساسية | مدرسة المعرفة الدولية",
    },
    description: {
      en: "Discover the values that shape the culture of International Knowledge School: quality, innovation, service, transparency, and teamwork.",
      ar: "اكتشف القيم التي تشكل ثقافة مدرسة المعرفة الدولية: الجودة، الابتكار، خدمة المجتمع، الشفافية، والعمل الجماعي.",
    },
  },
  "/goals": {
    canonicalPath: "/goals",
    title: {
      en: "Strategic Goals | International Knowledge School",
      ar: "الأهداف الاستراتيجية | مدرسة المعرفة الدولية",
    },
    description: {
      en: "Review the strategic goals that support academic growth, character development, technology, and community engagement at IKS.",
      ar: "تعرف على الأهداف الاستراتيجية التي تدعم النمو الأكاديمي وبناء الشخصية والتقنية والتواصل المجتمعي في مدرسة المعرفة الدولية.",
    },
  },
  "/curriculum": {
    canonicalPath: "/curriculum",
    title: {
      en: "Curricula | International and Local Curriculum | IKS Libya",
      ar: "المناهج | المناهج الدولية والمحلية | IKS ليبيا",
    },
    description: {
      en: "Choose between International Curricula and Local Curriculum pathways at International Knowledge School in Libya.",
      ar: "اختر بين مسار المناهج الدولية ومسار المنهج المحلي في مدرسة المعرفة الدولية في ليبيا.",
    },
  },
  "/curricula": {
    canonicalPath: "/curriculum",
    title: {
      en: "Curricula | International and Local Curriculum | IKS Libya",
      ar: "المناهج | المناهج الدولية والمحلية | IKS ليبيا",
    },
    description: {
      en: "Choose between International Curricula and Local Curriculum pathways at International Knowledge School in Libya.",
      ar: "اختر بين مسار المناهج الدولية ومسار المنهج المحلي في مدرسة المعرفة الدولية في ليبيا.",
    },
  },
  "/curriculum/international": {
    canonicalPath: "/curriculum/international",
    title: {
      en: "International Curricula | British and American Curriculum Libya",
      ar: "المناهج الدولية | المنهج البريطاني والأمريكي في ليبيا",
    },
    description: {
      en: "Explore the British and American educational pathways at IKS, including Pearson Edexcel, Savvas Learning, SAT preparation, and university readiness.",
      ar: "استكشف المسارات البريطانية والأمريكية في مدرسة المعرفة الدولية، بما يشمل Pearson Edexcel وSavvas والتحضير لاختبار SAT والاستعداد الجامعي.",
    },
  },
  "/curriculum/local": {
    canonicalPath: "/curriculum/local",
    title: {
      en: "Local Curriculum | Libyan National Curriculum | IKS Libya",
      ar: "المنهج المحلي | المنهج الوطني الليبي | IKS ليبيا",
    },
    description: {
      en: "Learn about the Local Department at IKS, aligned with the Libyan National Curriculum and strengthened with English learning from Macmillan.",
      ar: "تعرف على القسم المحلي في مدرسة المعرفة الدولية، المتوافق مع المنهج الوطني الليبي والمعزز بتعلم اللغة الإنجليزية من Macmillan.",
    },
  },
  "/admissions": {
    canonicalPath: "/admissions",
    title: {
      en: "Admissions | International Knowledge School",
      ar: "القبول والتسجيل | مدرسة المعرفة الدولية",
    },
    description: {
      en: "Start your admissions journey at International Knowledge School and learn about applications, assessments, documents, and enrollment.",
      ar: "ابدأ رحلة القبول في مدرسة المعرفة الدولية وتعرف على خطوات التقديم والتقييم والمستندات والتسجيل.",
    },
  },
  "/gallery": {
    canonicalPath: "/gallery",
    title: {
      en: "School Gallery | International Knowledge School",
      ar: "معرض المدرسة | مدرسة المعرفة الدولية",
    },
    description: {
      en: "View moments from classrooms, campus life, activities, and student experiences at International Knowledge School.",
      ar: "شاهد لقطات من الفصول والحياة المدرسية والأنشطة وتجارب الطلاب في مدرسة المعرفة الدولية.",
    },
  },
  "/news": {
    canonicalPath: "/news",
    title: {
      en: "News and Events | International Knowledge School",
      ar: "الأخبار والفعاليات | مدرسة المعرفة الدولية",
    },
    description: {
      en: "Stay updated with the latest school news, announcements, and events from International Knowledge School.",
      ar: "تابع آخر أخبار المدرسة والإعلانات والفعاليات من مدرسة المعرفة الدولية.",
    },
  },
  "/contact": {
    canonicalPath: "/contact",
    title: {
      en: "Contact International Knowledge School | Tripoli Libya",
      ar: "اتصل بمدرسة المعرفة الدولية | طرابلس ليبيا",
    },
    description: {
      en: "Contact International Knowledge School in Tripoli for admissions, inquiries, visits, and school information.",
      ar: "تواصل مع مدرسة المعرفة الدولية في طرابلس للاستفسارات والقبول والزيارات ومعلومات المدرسة.",
    },
  },
};

export function getAbsoluteUrl(path: string) {
  const root = siteConfig.siteUrl.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${root}${normalizedPath}`;
}
