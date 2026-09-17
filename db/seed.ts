import { drizzle } from "drizzle-orm/mysql2";
import { createConnection } from "mysql2";
import * as schema from "./schema";

const connection = createConnection(process.env.DATABASE_URL!);
const db = drizzle(connection, { schema, mode: "planetscale" });

async function seed() {
  console.log("Seeding database...");

  await db.insert(schema.testimonials).values([
    {
      authorName: "Tripoli Customer",
      authorNameAr: "عميل من طرابلس",
      role: "International transfer",
      roleAr: "حوالات خارجية",
      quote:
        "The transfer process was clear and the follow-up continued until final confirmation.",
      quoteAr:
        "كانت خطوات الحوالة واضحة واستمرت المتابعة حتى تأكيد التنفيذ النهائي.",
      rating: 5,
      sortOrder: 1,
    },
    {
      authorName: "Digital Payment Customer",
      authorNameAr: "عميلة دفع إلكتروني",
      role: "Digital payments",
      roleAr: "دفع إلكتروني",
      quote:
        "A reliable option for paying international orders and topping up digital services.",
      quoteAr:
        "خيار موثوق لدفع الطلبات العالمية وشحن الخدمات الإلكترونية.",
      rating: 5,
      sortOrder: 2,
    },
    {
      authorName: "Global Shopping Customer",
      authorNameAr: "عميل شراء عالمي",
      role: "Global purchasing",
      roleAr: "شراء عالمي",
      quote:
        "Confirming details before payment made the transaction feel safe and organized.",
      quoteAr:
        "تأكيد التفاصيل قبل الدفع جعل المعاملة آمنة ومنظمة.",
      rating: 5,
      sortOrder: 3,
    },
  ]);
  console.log("Seeded testimonials");

  await db.insert(schema.galleryItems).values([
    {
      title: "Digital Payment Workspace",
      titleAr: "خدمات الدفع الإلكتروني",
      description: "Payment support for international stores and platforms",
      descriptionAr: "دعم الدفع للمتاجر والمنصات العالمية",
      imageUrl: "/images/hero-classroom.jpg",
      category: "classrooms",
      sortOrder: 1,
    },
    {
      title: "International Transfers",
      titleAr: "الحوالات الخارجية",
      description: "Money transfer services for multiple destinations",
      descriptionAr: "خدمات حوالات مالية لوجهات متعددة",
      imageUrl: "/images/science-lab.jpg",
      category: "activities",
      sortOrder: 2,
    },
    {
      title: "Global Commerce",
      titleAr: "الشراء العالمي",
      description: "Support for orders from global marketplaces",
      descriptionAr: "دعم الطلبات من الأسواق العالمية",
      imageUrl: "/images/campus-exterior.jpg",
      category: "campus",
      sortOrder: 3,
    },
    {
      title: "SHEIN Cards",
      titleAr: "بطاقات SHEIN",
      description: "SHEIN shopping cards and purchasing support",
      descriptionAr: "بطاقات مشتريات SHEIN ودعم الشراء",
      imageUrl: "/images/art-classroom.jpg",
      category: "activities",
      sortOrder: 4,
    },
    {
      title: "Currency Exchange",
      titleAr: "بيع وشراء الدولار",
      description: "Dollar buying, selling, and transfer services",
      descriptionAr: "خدمات بيع وشراء وتحويل الدولار",
      imageUrl: "/images/sports-facility.jpg",
      category: "campus",
      sortOrder: 5,
    },
    {
      title: "Electronic Wallets",
      titleAr: "المحافظ الإلكترونية",
      description: "Wallet, virtual card, and Facebook service top-ups",
      descriptionAr: "شحن المحافظ والبطاقات الافتراضية وخدمات Facebook",
      imageUrl: "/images/library.jpg",
      category: "campus",
      sortOrder: 6,
    },
    {
      title: "Chinese Yuan Payments",
      titleAr: "تحويل اليوان الصيني",
      description: "Chinese yuan payment support for purchases and transactions",
      descriptionAr: "خدمات دفع وتحويل باليوان الصيني للمشتريات والمعاملات",
      imageUrl: "/images/graduation.jpg",
      category: "students",
      sortOrder: 7,
    },
    {
      title: "Customer Support",
      titleAr: "دعم العملاء",
      description: "Clear follow-up from request to final confirmation",
      descriptionAr: "متابعة واضحة من الطلب حتى التأكيد النهائي",
      imageUrl: "/images/students-group.jpg",
      category: "students",
      sortOrder: 8,
    },
  ]);
  console.log("Seeded gallery items");

  await db.insert(schema.newsEvents).values([
    {
      title: "Global Bill Payments Available",
      titleAr: "دفع الفواتير والطلبات العالمية",
      excerpt:
        "Customers can request payment for invoices and orders from international websites and stores.",
      excerptAr:
        "يمكن للعملاء طلب دفع الفواتير والطلبات من مختلف المواقع والمتاجر العالمية.",
      content:
        "Alwaseet Global provides payment support for global invoices, shopping orders, digital wallets, and electronic services through clear contact channels.",
      contentAr:
        "يوفر الوسيط العالمي خدمات دفع للفواتير العالمية وطلبات التسوق والمحافظ والخدمات الإلكترونية عبر قنوات تواصل واضحة.",
      imageUrl: "/images/about-classroom.jpg",
    },
    {
      title: "Visit Alwaseet Location",
      titleAr: "زيارة موقع الوسيط العالمي",
      excerpt:
        "Find us in Zanata, opposite Kayan Mobile, Tripoli.",
      excerptAr:
        "تجدوننا في زناتة مقابل كيان موبايل، طرابلس.",
      content:
        "Customers can visit Alwaseet Global in Zanata, opposite Kayan Mobile, Tripoli, Libya, or contact us by phone and email for service confirmation.",
      contentAr:
        "يمكن للعملاء زيارة الوسيط العالمي في زناتة مقابل كيان موبايل، طرابلس، ليبيا، أو التواصل عبر الهاتف والبريد لتأكيد الخدمة.",
      imageUrl: "/images/campus-exterior.jpg",
      eventDate: new Date("2026-10-01"),
    },
    {
      title: "SHEIN Cards and Yuan Payments",
      titleAr: "بطاقات SHEIN وخدمات اليوان الصيني",
      excerpt:
        "SHEIN cards and Chinese yuan payment services are available for global purchasing needs.",
      excerptAr:
        "تتوفر بطاقات SHEIN وخدمات الدفع باليوان الصيني لاحتياجات الشراء العالمي.",
      content:
        "Alwaseet Global supports SHEIN cards, Chinese yuan payments, dollar exchange, and wallet top-ups for customers who need reliable global purchasing services.",
      contentAr:
        "يدعم الوسيط العالمي بطاقات SHEIN ومدفوعات اليوان الصيني وصرف الدولار وشحن المحافظ للعملاء الذين يحتاجون خدمات شراء عالمية موثوقة.",
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
