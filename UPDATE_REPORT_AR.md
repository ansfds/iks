تم تنفيذ التحديث محليًا مع الحفاظ على الألوان والتدرجات وتوزيع الأقسام والخطوط وحركات الموقع. لم يتم Git Push أو Deploy أو تعديل قاعدة البيانات الفعلية.

1. **أماكن تغيير الاسم:** إعدادات الشركة وعناوين الصفحات، Navbar، Hero، قسم «عن الوسيط المعتمد»، Footer، التواصل، نصوص الأخبار والمعرض، النصوص الإنجليزية، وصف الصور، نص رسالة حاسبة الحوالة، SEO وبيانات التهيئة المستقبلية. الاسم الرسمي أصبح «الوسيط المعتمد» و`ELWASEET EL-MOATAMAD`. أضيف رقما العرض `0935095091` و`0945095091` إلى التواصل والتذييل، مع بقاء رقم واتساب التشغيلي كما هو.

2. **بقايا الاسم القديم:** لا توجد نصوص ثابتة تعرض الاسم السابق في الواجهة. بقيت الصيغ السابقة عمدًا في `src/lib/company-brand.ts` للتعرف على النصوص القديمة القادمة من Database/Admin وتحويلها عند عرض الأخبار وشهادات العملاء. لم تُغيّر معرفات SQL أو مفاتيح الإعدادات أو المسارات. النطاق الحالي في `public/robots.txt` و`public/sitemap.xml` ومعرّفات الحسابات الاجتماعية داخل الصور بقيت كما هي؛ لم يُقدّم نطاق بديل. لم يمكن تدقيق محتويات MySQL الفعلية لأنها غير متاحة محليًا، ولا يمكن تحديث كتابة اسم قديم داخل صورة يرفعها Admin تلقائيًا.

3. **موضع الشعار:** داخل الهيدر الثابت في `src/components/Navbar.tsx`، وفي التذييل. أزيلت الإزاحة الأفقية القديمة التي كانت تحرك الشعار خارج موضعه على الشاشات الصغيرة. جرى اختبار ظهوره فوق الهيدر الداكن وعند تحوله إلى الخلفية البيضاء، وعلى صفحة البطاقات ذات الهيدر الأبيض.

4. **ملف الشعار:** `public/images/elwaseet-el-moatamad-logo.png`، بحجم 720×360 وخلفية شفافة. النسخة مشتقة من المرجع المرفق بواسطة أداة imagegen المدمجة. لم يُستخدم البنر كاملًا داخل Navbar. حُدّثت أيضًا ملفات الشعار القديمة الموجودة تحت أسمائها السابقة للحفاظ على توافق الروابط. لم يُقدّم ملف SVG أصلي مستقل؛ يمكن استبدال النسخة المشتقة بملف الشعار الأصلي عند توفره.

5. **SEO:** تم تحديث `<title>` وdescription وOpen Graph وTwitter واسم التطبيق وبيانات FinancialService/WebPage. الصورة الاجتماعية الجديدة `public/images/elwaseet-social-preview.png` بحجم 1200×630. يضيف `tools/site-metadata.ts` البيانات الأساسية إلى HTML أثناء التطوير والبناء، ويحدّث `SEOManager.tsx` بيانات كل صفحة عند التنقل. أُصلح رابط الشعار في JSON-LD. يجب ضبط `VITE_SITE_URL` على عنوان الموقع الفعلي قبل البناء عند النشر لإنتاج روابط مشاركة مطلقة؛ لم يُخترع نطاق جديد.

6. **favicon/manifest:** تم تحديث `public/favicon.svg` وإضافة `public/apple-touch-icon.png` و`public/icon-192.png` و`public/icon-512.png`. يتم توليد `dist/public/site.webmanifest` من ملف الصور المركزي، باسم الشركة الجديد. لعدم وجود شعار مربع مستقل، استُخدم الشعار الكامل داخل مساحة مربعة مع الحفاظ على نسبته؛ لم يُبتكر رمز بديل. هذا لا يضيف نظام عمل دون اتصال.

7. **مشكلات Gift Cards التي وُجدت:** كان الخادم يرجع إلى ملف JSON محلي عند بعض أخطاء MySQL حتى في الإنتاج، مما قد يعرض أسعارًا قديمة أو يحاول حفظ بيانات Admin على قرص serverless مؤقت. كما كانت قراءة المخزن المحلي تعيد كتابة الملف. مسار fallback للصفحات داخل bundle كان يشير إلى `dist/dist/public`، وأمر `start` السابق لم يكن يعمل مباشرة على Windows. أخطاء صفحة تفاصيل البطاقة كانت تُعرض باعتبار البطاقة غير موجودة دون Retry. وكان هناك إعداد SPA شامل يستحق استثناء مسارات API منه. إضافةً إلى ذلك، كان إنشاء إعداد OAuth/JWKS أثناء الاستيراد قد يمنع الصفحات العامة من العمل عند غياب إعدادات المصادقة.

8. **الإصلاح:** أصبح المخزن محددًا بوضوح في `server/gift-card-storage.ts`: الإنتاج يستخدم MySQL افتراضيًا ولا يستبدلها بصمت عند الفشل. يمكن اختيار `local` صراحة على خادم Node، بينما يُرفض هذا الوضع على Vercel. بقي fallback التلقائي مقتصرًا على التطوير. أزيلت الكتابة عند القراءة الناجحة من JSON. أُصلح مسار ملفات الإنتاج، وأصبحت أوامر التشغيل تعمل على Windows. أضيف Retry حقيقي لتفاصيل البطاقة، وتُحجب إمكانية الشراء أثناء إعادة جلب السعر أو عند الخطأ. عزلت متطلبات OAuth حتى تُتحقق عند استخدام المصادقة، مع بقاء التحقق من أسرار تسجيل الدخول كما هو عند الحاجة. إعداد Vercel يستثني `/api/` من fallback الخاص بالواجهة، وفق [توثيق إعدادات Vercel](https://vercel.com/docs/project-configuration/vercel-json).

9. **اختبار Production:** نجحت النسخة المبنية محليًا عبر خادم Node الفعلي، بما يشمل API ومسارات الصفحات العميقة والصور والـmanifest. استُخدم `GIFT_CARDS_STORAGE=local` صراحة لعدم توفر MySQL؛ هذا اختبار لنسخة الإنتاج مع بيانات المشروع المحلية، وليس إثباتًا لاتصال قاعدة الإنتاج أو إعداد استضافة Vercel. نجحت أيضًا الصفحات العامة مع تفريغ متغيرات OAuth في عملية الاختبار. لا يزال النشر الفعلي يحتاج MySQL متاحة وإعداد البيئة وتشغيل migrations الموجودة عند الحاجة.

10. **نتائج الفحوص:** نجح `npm.cmd run build` (مكافئ `npm run build` على Windows)، و`npm.cmd run check`، و26 اختبارًا في 5 ملفات. ظهر تنبيه حجم JavaScript أكبر من 500KB؛ لا يمنع البناء. نجح اختبار Chrome المخفي على 375 و768 و1440 بكسل، وتفاصيل البطاقات على الهاتف والتابلت. تم التحقق من PlayStation وXbox وSHEIN والفئات والأسعار وMost Popular وFlame وCOMING_SOON، ومن تطابق الأسعار بين التطوير والإنتاج. تم فحص روابط واتساب الجاهزة ورقمها وتهيئتها للفتح في نافذة جديدة عبر `target="_blank"`؛ لم يُفتح تطبيق واتساب أو تُرسل رسائل أو طلبات شراء فعلية. نجحت إعادة المحاولة بعد محاكاة انقطاع الشبكة، وعرض الخطأ بدل الكتالوج القديم عند فشل MySQL. الدليل الآلي في `.preview/verification.json` ولقطات الشاشة في `.preview/`.

11. **ملف الصور المركزي:** `app/src/config/site-images.ts` بالنسبة إلى مجلد العمل الرئيسي. يحتوي تعليقات عربية واضحة وروابط HTTPS للصور العامة وبدائل محلية.

12. **المسار الكامل:** `C:\Users\pc ans\Downloads\IKS\app\src\config\site-images.ts`.

13. **تغيير صورة «عن الوسيط المعتمد»:** غيّر `SITE_IMAGES.homepage.aboutImage`. أما صور صفحة `/about` الداخلية فتستخدم `SITE_IMAGES.finance.transferHero` و`SITE_IMAGES.finance.libyaCairo`.

14. **تغيير Hero:** غيّر `SITE_IMAGES.homepage.heroBackground`.

15. **تغيير Logo URL:** غيّر `officialLogo` أعلى `src/config/site-images.ts` لتحديث شعار الهيدر والتذييل معًا. يمكن أيضًا تخصيص `branding.navbarLogo` و`branding.logo` كلٌّ على حدة. الرابط المحلي الحالي لا يحتاج استضافة خارجية أو رفعًا تلقائيًا.

16. **صور Gift Cards:** بقيت مستقلة في `src/config/gift-card-images.ts` وتستخدم بدائل `public/images/gift-cards/`. لا تزال صورة Admin/Database أولًا، ثم الرابط المركزي الخاص بالبطاقة، ثم البديل المحلي. لم يتغير ملف تسعير البطاقات أو بيانات الأسعار أو رقم واتساب `218935095091` أو صيغة رسالة شراء البطاقات.

17. **الصور الديناميكية:** صور البطاقات وخلفياتها وخلفيات مفاتيح الأقسام القابلة للتعديل من Admin، وصور الأخبار والمعرض، تبقى مرتبطة بـDatabase/Admin. لم تُنقل صور المنتجات الديناميكية أو QR إلى إعداد الصور الثابتة. بيانات `db/seed.ts` تظل بيانات تهيئة للقاعدة، وليست المصدر الذي يستبدل صور Admin الحالية.

18. **Image Fallback:** تنتقل الصورة عند فشل التحميل من مصدرها المفضل إلى المصادر المركزية ثم الملف المحلي، دون حلقة إعادة تحميل. إذا فشلت جميع المصادر يظهر بديل مرئي مناسب بدل أيقونة المتصفح المكسورة. يجري تسجيل اسم الصورة ورابطها بـ`console.warn` في Development فقط. شمل ذلك الخلفيات عبر `SiteBackground`. تم حجب مواقع الصور الخارجية في اختبار المتصفح لإثبات عمل البدائل المحلية.

19. **Aspect Ratio:** الصور العادية تستخدم `height:auto` و`object-fit:contain`؛ أزيل فرض نسب ثابتة غير لازمة من صور المعرض والخدمات والرؤية. الشعار يستخدم عرضًا تلقائيًا وحدًا أقصى للارتفاع دون تمديد. الخلفيات وحدها تستخدم `cover`. بقيت حاويات بطاقات الهدايا المتناسقة مع عرض الصورة كاملة باستخدام `contain`. حُفظت مؤثرات الدخول والـhover والتدرجات الموجودة، وانتقال شفافية خفيف للصور وتحميل lazy للصور العادية تحت الصفحة.

20. **الملفات الجديدة:**

- `UPDATE_REPORT_AR.md`
- `public/apple-touch-icon.png`
- `public/icon-192.png`
- `public/icon-512.png`
- `public/images/elwaseet-el-moatamad-logo.png`
- `public/images/elwaseet-social-preview.png`
- `server/gift-card-router.test.ts`
- `server/gift-card-storage.test.ts`
- `server/gift-card-storage.ts`
- `src/components/SiteBackground.tsx`
- `src/lib/company-brand.ts`
- `tools/site-metadata.ts`
- `tools/start-production.mjs`
- `tools/verify-site.mjs`

21. **الملفات المعدلة:**

- `.env.example`
- `.gitignore`
- `db/manual-migrations/2026-09-07_fintech_seed_optional.sql`
- `db/seed.ts`
- `index.html`
- `package.json`
- `public/favicon.svg`
- `public/images/alwaseet-libya-cairo.jpg`
- `public/images/alwaseet-logo.svg`
- `public/images/alwaseet-navbar-logo.png`
- `public/images/alwaseet-transfer-hero.jpg`
- `public/images/social-preview-fintech.png`
- `server/gift-card-local-store.ts`
- `server/gift-card-router.ts`
- `server/kimi/auth.ts`
- `server/lib/env.ts`
- `server/lib/vite.ts`
- `src/components/Footer.tsx`
- `src/components/Navbar.tsx`
- `src/components/SEOManager.tsx`
- `src/components/SiteImage.tsx`
- `src/components/fintech/ContactBand.tsx`
- `src/components/fintech/FinanceCalculator.tsx`
- `src/components/fintech/TrustSection.tsx`
- `src/components/gift-cards/GiftCardImage.tsx`
- `src/components/gift-cards/HomeGiftCardSwitch.tsx`
- `src/config/site-images.ts`
- `src/config/site.ts`
- `src/contexts/LanguageContext.tsx`
- `src/lib/image-utils.ts`
- `src/pages/About.tsx`
- `src/pages/Contact.tsx`
- `src/pages/Curriculum.tsx`
- `src/pages/GalleryPage.tsx`
- `src/pages/GiftCardDetail.tsx`
- `src/pages/GiftCards.tsx`
- `src/pages/Home.tsx`
- `src/pages/NewsPage.tsx`
- `src/pages/VisionMission.tsx`
- `vercel.json`
- `vite.config.ts`

22. **الصفحة الرئيسية المحلية:** نسخة الإنتاج التي اختُبرت: http://localhost:4173/ . نسخة التطوير: http://127.0.0.1:3000/ . أوقفت خوادم الاختبار بعد التحقق. لإعادة تشغيل معاينة الإنتاج من مجلد `app` في PowerShell:

```powershell
$env:GIFT_CARDS_STORAGE = 'local'
$env:PORT = '4173'
npm.cmd run preview
```

23. **Gift Cards المحلية:** http://localhost:4173/gift-cards . التفاصيل: `/gift-cards/playstation` و`/gift-cards/xbox` و`/gift-cards/shein`. لبيئة MySQL اضبط `GIFT_CARDS_STORAGE=mysql` و`DATABASE_URL` في البيئة. المتغيرات موثقة في `.env.example`؛ أسرار OAuth لازمة لعمليات الدخول والإدارة فقط. وضع `local` يحتاج قرصًا دائمًا عند استخدام تعديلات Admin، ويمكن تخصيص ملفه عبر `GIFT_CARDS_DATA_FILE`. الاستضافة الثابتة وحدها لا تشغّل API؛ استخدم خادم Node أو Vercel Functions مع MySQL. لم تُنفذ migrations على قاعدة بيانات، ولم يحدث نشر أو Push.

تفاصيل أصول الهوية: استُخدمت أداة imagegen المدمجة لاستخراج الشعار وتحديث الشعار المطبوع داخل بديلَي صور التحويلات؛ لم تُستخدم CLI أو API key. بقية الصور العامة وروابطها والتصميم بقيت كما هي. نُسخ الناتج النهائي إلى ملفات المشروع الموضحة أعلاه، مع إبقاء الأصول الناتجة الأصلية في مجلد generated_images.

<details>
<summary>تعليمات معالجة صور الهوية المستخدمة</summary>

نص استخراج الشعار النهائي:

```text
Use case: background-extraction. Extract the EXISTING OFFICIAL NEW LOGO from the USER ATTACHED full blue financial banner (the first image), for a website navbar. The second image, an old transparent logo saying ELWASEET ELALAMY, is ONLY context about the existing asset; DO NOT use that old text. Target is the original USER banner saying exactly 'ELWASEET EL-MOATAMAD'. Remove all surrounding banner photos, phone numbers, address, blue background, corner decorations. Retain the central original blue outlined fast money symbol above its white rounded English wordmark plate and blue Arabic subtitle bar. Preserve exact shape, proportions, colors and lettering from the new banner. The exact English text is ELWASEET EL-MOATAMAD. The Arabic subtitle is للدفع الإلكتروني والتحويلات. No redesign, no newly invented symbol or added text. Transparent background, crop canvas closely around the extracted mark with minimal transparent margins. This is an official brand extraction, not a redesign.
```

نص تحديث كلٍّ من صورتي التحويلات، مع الصورة القديمة كهدف والشعار الجديد كمرجع:

```text
Use case: precise-object-edit. Image 1 is an existing Arabic marketing poster that must remain visually unchanged except for outdated company logos. Image 2 is the NEW official logo. Replace every old ELWASEET ELALAMY logo visible in image 1 with the exact new logo from image 2 saying ELWASEET EL-MOATAMAD, scaled to match the original placement. Preserve all other Arabic text, photos, currency, people, blue colors, layout, phone numbers and address EXACTLY. Preserve original aspect ratio and composition. Do not redesign. Where a tiny old logo is on a phone screen replace that too if visible. The old name ELWASEET ELALAMY must not remain anywhere. Keep all unrelated text and scene intact.
```

</details>
