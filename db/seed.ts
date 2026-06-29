import { drizzle } from "drizzle-orm/mysql2";
import { createConnection } from "mysql2";
import * as schema from "./schema";

const connection = createConnection(process.env.DATABASE_URL!);
const db = drizzle(connection, { schema, mode: "planetscale" });

async function seed() {
  console.log("Seeding database...");

  // Seed testimonials
  await db.insert(schema.testimonials).values([
    {
      authorName: "Sarah Ahmed",
      authorNameAr: "سارة أحمد",
      role: "Parent of Grade 3 Student",
      roleAr: "ولية أمر طالبة في الصف الثالث",
      quote:
        "The teachers at Al-Maarefa truly care about each student's growth. My daughter has flourished both academically and socially.",
      quoteAr:
        "المعلمون في المعرفة يهتمون حقاً بنمو كل طالب. لقد ازدهرت ابنتي أكاديمياً واجتماعياً.",
      rating: 5,
      sortOrder: 1,
    },
    {
      authorName: "Mohammed Al-Rashid",
      authorNameAr: "محمد الراشد",
      role: "Parent of Grade 7 Student",
      roleAr: "ولي أمر طالب في الصف السابع",
      quote:
        "Moving from abroad, we were worried about the transition. The welcoming community made our son feel at home from day one.",
      quoteAr:
        "بعد الانتقال من الخارج، كنا قلقين بشأن التحول. جعلنا المجتمع المرحب ابننا يشعر بالارتياح من اليوم الأول.",
      rating: 5,
      sortOrder: 2,
    },
    {
      authorName: "Fatima Hassan",
      authorNameAr: "فاطمة حسن",
      role: "Parent of KG Student",
      roleAr: "ولية أمر طالب في الروضة",
      quote:
        "The British curriculum combined with Arabic culture creates the perfect balance. Our children are getting the best of both worlds.",
      quoteAr:
        "المنهج البريطاني جنباً إلى جنب مع الثقافة العربية يخلق التوازن المثالي. أطفالنا يحصلون على أفضل ما في العالمين.",
      rating: 5,
      sortOrder: 3,
    },
  ]);
  console.log("Seeded testimonials");

  // Seed gallery items
  await db.insert(schema.galleryItems).values([
    {
      title: "Modern Classroom",
      titleAr: "فصل دراسي حديث",
      description: "Students engaged in collaborative learning",
      descriptionAr: "طلاب مشاركون في التعلم التعاوني",
      imageUrl: "/images/hero-classroom.jpg",
      category: "classrooms",
      sortOrder: 1,
    },
    {
      title: "Science Laboratory",
      titleAr: "مختبر العلوم",
      description: "Hands-on experiments and discovery",
      descriptionAr: "تجارب عملية واكتشاف",
      imageUrl: "/images/science-lab.jpg",
      category: "activities",
      sortOrder: 2,
    },
    {
      title: "School Campus",
      titleAr: "حرم المدرسة",
      description: "Our beautiful modern campus",
      descriptionAr: "حرمنا الجميل والعصري",
      imageUrl: "/images/campus-exterior.jpg",
      category: "campus",
      sortOrder: 3,
    },
    {
      title: "Art Classroom",
      titleAr: "فصل الفنون",
      description: "Creative expression and imagination",
      descriptionAr: "التعبير الإبداعي والخيال",
      imageUrl: "/images/art-classroom.jpg",
      category: "activities",
      sortOrder: 4,
    },
    {
      title: "Sports Facility",
      titleAr: "المرفق الرياضي",
      description: "State-of-the-art sports facilities",
      descriptionAr: "مرافق رياضية على أحدث مستوى",
      imageUrl: "/images/sports-facility.jpg",
      category: "campus",
      sortOrder: 5,
    },
    {
      title: "School Library",
      titleAr: "مكتبة المدرسة",
      description: "A world of knowledge at their fingertips",
      descriptionAr: "عالم من المعرفة في متناول أيديهم",
      imageUrl: "/images/library.jpg",
      category: "campus",
      sortOrder: 6,
    },
    {
      title: "Graduation Ceremony",
      titleAr: "حفل التخرج",
      description: "Celebrating our graduates' achievements",
      descriptionAr: "الاحتفال بإنجازات خريجينا",
      imageUrl: "/images/graduation.jpg",
      category: "students",
      sortOrder: 7,
    },
    {
      title: "Student Community",
      titleAr: "مجتمع الطلاب",
      description: "Diverse and inclusive student body",
      descriptionAr: "جسم طلابي متنوع وشامل",
      imageUrl: "/images/students-group.jpg",
      category: "students",
      sortOrder: 8,
    },
  ]);
  console.log("Seeded gallery items");

  // Seed news/events
  await db.insert(schema.newsEvents).values([
    {
      title: "Al-Maarefa Hosts International Education Conference",
      titleAr: "المعرفة تستضيف مؤتمر التعليم الدولي",
      excerpt:
        "Join us for a day of learning and networking with educators from around the world.",
      excerptAr:
        "انضم إلينا يوماً من التعلم والتواصل مع المربين من جميع أنحاء العالم.",
      content:
        "Al-Maarefa International School is proud to host the annual International Education Conference. This year's theme focuses on innovation in teaching and learning, bringing together educators, researchers, and policymakers from over 20 countries. The conference will feature keynote speeches, workshops, and panel discussions on topics ranging from STEM education to social-emotional learning.",
      contentAr:
        "تفخر مدرسة المعرفة الدولية باستضافة مؤتمر التعليم الدولي السنوي. يركز موضوع هذا العام على الابتكار في التدريس والتعلم، حيث يجمع المربين والباحثين وصناع السياسات من أكثر من 20 دولة. سيتضمن المؤتمر خطابات رئيسية وورش عمل ومناقشات لوحية حول موضوعات تتراوح من تعليم العلوم والتكنولوجيا والهندسة والرياضيات إلى التعلم الاجتماعي والعاطفي.",
      imageUrl: "/images/about-classroom.jpg",
    },
    {
      title: "Open Day: Discover Our Campus",
      titleAr: "يوم مفتوح: اكتشف حرمنا",
      excerpt:
        "Experience Al-Maarefa firsthand. Tour our facilities, meet our teachers, and learn about our curriculum.",
      excerptAr:
        "جرب المعرفة عن كثب. جول في مرافقنا، قابل معلمينا، وتعرف على منهجنا.",
      content:
        "We invite all prospective families to our Open Day event. This is a wonderful opportunity to explore our campus, meet our dedicated teaching staff, and learn more about the British curriculum we offer. Activities include classroom demonstrations, science experiments, art exhibitions, and sports demonstrations. Admissions counselors will be available to answer all your questions.",
      contentAr:
        "ندعو جميع العائلات المحتملة إلى يومنا المفتوح. هذه فرصة رائعة لاستكشاف حرمنا، والتعرف على كادرنا التعليمي المتفاني، ومعرفة المزيد عن المنهج البريطاني الذي نقدمه. تشمل الأنشطة عروضاً صفية وتجارب علمية ومعارض فنية وعروض رياضية. سيكون مستشارو القبول متاحين للإجابة على جميع أسئلتك.",
      imageUrl: "/images/campus-exterior.jpg",
      eventDate: new Date("2025-03-15"),
    },
    {
      title: "Student Wins Regional Science Competition",
      titleAr: "طالب يفوز بمسابقة العلوم الإقليمية",
      excerpt:
        "Congratulations to Omar Khalid for winning first place in the Regional Science Fair.",
      excerptAr:
        "تهانينا لعمر خالد لحصوله على المركز الأول في معرض العلوم الإقليمي.",
      content:
        "We are thrilled to announce that Omar Khalid, a Grade 10 student at Al-Maarefa International School, has won first place in the Regional Science Fair. Omar's innovative project on renewable energy solutions impressed the judges with its creativity, scientific rigor, and potential real-world impact. This achievement reflects the school's commitment to fostering scientific inquiry and innovation among our students.",
      contentAr:
        "يسعدنا أن نعلن أن عمر خالد، طالب في الصف العاشر في مدرسة المعرفة الدولية، فاز بالمركز الأول في معرض العلوم الإقليمي. أ impressed لقضاة مشروعه المبتكر حول حلول الطاقة المتجددة بإبداعه وصرامته العلمية وتأثيره المحتمل في العالم الحقيقي. يعكس هذا الإنجاز التزام المدرسة بتعزيز البحث العلمي والابتكار بين طلابنا.",
      imageUrl: "/images/science-lab.jpg",
    },
  ]);
  console.log("Seeded news/events");

  console.log("Seeding complete!");
  connection.end();
}

seed().catch((err) => {
  console.error("Seed error:", err);
  connection.end();
  process.exit(1);
});
