# ربط Git CMS بمشروع Vercel الحالي

هذه تعليمات للفرع `experiment/git-backed-cms`. لا تستخدم تعليمات MySQL القديمة مع هذا الفرع. لا توجد قاعدة بيانات مطلوبة لتشغيله. لا تُرسل أي Token أو كلمة مرور أو Session Secret في المحادثة.

## المشروع الموجود الذي تم التحقق منه

تم التحقق مباشرة من Vercel بتاريخ 2026-10-21 وربط هذا المجلد بواسطة `vercel link` بالمشروع الموجود؛ لا حاجة إلى مشروع جديد:

- المشروع `iks`، ومعرّفه `prj_x7OyV8frk1Nlr7ccRPEnczAzvKnd`.
- الفريق `bk201s-projects-ecc0efd4`، ومعرّفه `team_VRkAxWqlSsvV8pEFVqodVKxC`.
- المستودع `ansfds/iks`، وفرع الإنتاج المؤكد `main`.
- الرابط الرسمي `https://iks-pearl.vercel.app`، وكان commit الإنتاج عند الفحص `80807e55a22f91cbe7a8be79c86a7aca50cd4b1f`.

لإعادة التحقق بالقراءة فقط شغّل من هذا المجلد (إذا انتهت الجلسة سجّل الدخول محليًا باستخدام `npx vercel login`):

```powershell
node tools/verify-vercel-target.mjs
```

الأداة تقرأ فقط: تحلّ الرابط الرسمي إلى project ID الحقيقي، ثم تتحقق من ربط `ansfds/iks` ومن فرع الإنتاج. لا تستدعي link أو create أو deploy. تحفظ نتائج غير سرية في `.cache/vercel-target.json`. إذا تعذر التحقق تتوقف. لا تشغّل إنشاء مشروع جديد عند ظهور سؤال من CLI.

اختار صاحب المشروع **Preview مقفلة مؤقتًا**: يبقى `CMS_WRITES_ENABLED=NO` و`CMS_PRODUCTION_WRITES_APPROVED=NO`. لا يُعد وجود رابط Preview إثباتًا لاختبار الحفظ. يلزم أولًا إنشاء الفرع في GitHub لأن Vercel يرفض متغيرات بيئة خاصة بفرع غير موجود.

## متغيرات البيئة

ضع الأسرار محليًا في `.env` المهمل من Git، أو مباشرة في Environment Variables للمشروع الموجود على Vercel. افصل Preview عن Production، واستخدم أسرارًا ورموزًا مختلفة. يجب أن تكون متغيرات Preview الحساسة محصورة في **الفرع التجريبي الموثوق**، لا في كل الفروع أو نسخ forks.

| الاسم | الاستخدام والإعداد |
|---|---|
| `ADMIN_USERNAME` | اسم مدير واحد |
| `ADMIN_PASSWORD_HASH` | scrypt hash ينشئه `npm run auth:setup` محليًا؛ لا كلمة المرور نفسها |
| `ADMIN_SESSION_SECRET` | سر عشوائي لا يقل عن 32 بايت؛ أداة الإعداد تولده |
| `ADMIN_SESSION_HOURS` | `0.25` لمدة 15 دقيقة؛ المسموح 5–15 دقيقة دون تمديد تلقائي |
| `CMS_GITHUB_REPOSITORY` | `ansfds/iks` فقط |
| `CMS_GITHUB_TOKEN` | Fine-grained PAT أو اعتماد تطبيق مناسب للمستودع نفسه؛ **Contents: Read and write** وMetadata الافتراضية فقط. لا Workflow ولا Administration |
| `CMS_BRANCH` | Preview: `experiment/git-backed-cms`. Production: فرع الإنتاج الذي تثبته أداة التحقق |
| `CMS_PRODUCTION_BRANCH` | `main`، مؤكد من Vercel في هذا المشروع |
| `CMS_WRITES_ENABLED` | يبدأ `NO`؛ `YES` في Preview بعد توثيق الهدف وإعداد الأسرار |
| `CMS_PRODUCTION_WRITES_APPROVED` | يبقى `NO` إلى أن تنجح Preview وتصدر الموافقة الصريحة على الإنتاج |
| `CMS_VERCEL_PROJECT_ID` | `prj_x7OyV8frk1Nlr7ccRPEnczAzvKnd` |
| `CMS_VERCEL_TEAM_ID` | `team_VRkAxWqlSsvV8pEFVqodVKxC` |
| `CMS_VERCEL_TOKEN` | أقل صلاحية متاحة لقراءة ذلك المشروع ونشراته؛ التطبيق يستدعي GET فقط، لكن ذلك لا يحوّل Token واسع الصلاحيات إلى Token للقراءة فقط |
| `TURNSTILE_SITE_KEY` | مفتاح widget العام؛ يرجعه الخادم للواجهة |
| `TURNSTILE_SECRET_KEY` | سر التحقق من challenge؛ الخادم فقط |
| `VITE_SITE_URL` | `https://iks-pearl.vercel.app`؛ قيمة عامة للروابط وcanonical |
| `PORT` | محلي فقط؛ القيمة الافتراضية 3000 للبناء أو 4173 للتطوير |

لا تستخدم بادئة `VITE_` لأي سر. `DATABASE_URL` و`DATABASE_ENV` و`GIFT_CARDS_STORAGE` و`ADMIN_USER_ID` غير مستخدمة في التشغيل الجديد. MySQL وDrizzle الباقيان في devDependencies/ملفات المخطط أدوات مرجعية وتصدير محلي فقط؛ فحص البناء يمنع تضمين driver قاعدة بيانات في ناتج الخادم.

Fine-grained PAT يقيّد المستودع، ولا يوفّر هنا قيد مسار أو فرع مستقلًا؛ فصل الفروع تحققه ضوابط الخادم ومتغيرات Vercel الخاصة بالفرع. لا تمنح هذا Token لكود Preview غير موثوق، وفعّل قواعد حماية فرع الإنتاج الملائمة لحسابك دون تعطيلها من التطبيق.

الفحص الحالي وجد `main` غير محمي ولا توجد Rulesets. لذلك لا ندّعي عزل صلاحية المفتاح عن `main` على مستوى GitHub؛ التطبيق نفسه يرفض ذلك، لكن حامل المفتاح يستطيع استخدامه خارج التطبيق بحسب صلاحيات حسابه. قبل فتح الحفظ، أنشئ Ruleset نشطًا يستهدف `main`، يتطلب Pull Request، ويمنع تجاوز القاعدة بواسطة هوية مفتاح Preview، مع منع الحذف وforce push. لا تضف صلاحية Administration للمفتاح. عند الانتقال إلى الإنتاج يجب مراجعة هوية الكتابة وقواعد الحماية مجددًا؛ لا تمنح مفتاح Preview استثناء إنتاجيًا.

## إدخال القيم بأمان

افتح [إعدادات المشروع الموجود](https://vercel.com/bk201s-projects-ecc0efd4/iks/settings/environment-variables)، واختر **Preview فقط** ثم Git Branch = `experiment/git-backed-cms` لكل متغير في الجدول. لا تختَر All Environments أو جميع فروع Preview. استخدم Sensitive للأسرار متى أتاحتها الواجهة. القيم تصل إلى النشر التالي، ولا تعدّل نشرًا قائمًا تلقائيًا.

لإنشاء بيانات المدير من جهازك افتح PowerShell داخل `git-cms-experiment` وشغّل `npm run auth:setup`. الإدخال مخفي، وتُحفظ `ADMIN_USERNAME` و`ADMIN_PASSWORD_HASH` و`ADMIN_SESSION_SECRET` و`ADMIN_SESSION_HOURS` في `.env` المهمل من Git. انسخ قيمها بنفسك إلى Vercel؛ لا تنسخ علامات الاقتباس المحيطة بالقيمة. لا تنقل كلمة المرور نفسها إلى متغير بيئة، ولا إلى المحادثة أو أوامر CLI أو Logs. احفظها في مدير كلمات مرور. أداة `auth:hash` تطبع Hash؛ فضّل `auth:setup` عند مشاركة شاشة أو سجل طرفية.

أنشئ GitHub Fine-grained Token من حساب يملك المستودع: Repository access = Only select repositories → `ansfds/iks`، Contents = Read and write، Metadata الافتراضية فقط، مع تاريخ انتهاء مناسب. الصقه مباشرة كقيمة `CMS_GITHUB_TOKEN` في Vercel. أنشئ رمز Vercel مستقلًا للفريق المذكور لتضعه في `CMS_VERCEL_TOKEN`؛ لا تنسخ جلسة CLI المؤقتة أو `VERCEL_OIDC_TOKEN` إلى هذا المتغير. Turnstile يحتاج حساب Cloudflare ومفتاح widget فعليًا، وليس مفاتيح الاختبار أو أسرارًا مخترعة.

بعد وجود الفرع يمكن تجهيز الإعدادات غير السرية المقفلة وفحص **أسماء** المتغيرات فقط دون كشف القيم:

```powershell
node tools/prepare-vercel-preview.mjs configure
node tools/prepare-vercel-preview.mjs status
```

الأداة لا تُنشئ مشروعًا ولا تنشر ولا تكتب Production، ولا تستبدل متغيرًا قائمًا. وجود أسماء المتغيرات ليس إثباتًا لصحة قيمها. اترك الحفظ مقفلًا حتى تكتمل الأسرار وحماية `main` وتُطلب إعادة الاختبار.

## وضع رسائل العملاء القديمة

واجهات `contact.submit/list/getById/markRead/delete/stats` باقية بأسمائها. تعيد `SERVICE_UNAVAILABLE` / HTTP 503 عند الحاجة إلى صندوق خاص؛ لا ترجع نجاحًا ولا تحذف أو تعدّل المصدر القديم. عدادات الرسائل غير المتاحة ترجع `null` مع `contactsStorageAvailable=false` بدل الإيحاء بأن الصندوق فارغ. تعرض لوحة الإدارة تنبيهًا واضحًا بذلك. الصفحات العامة الحالية تستخدم الهاتف وواتساب؛ صفحة Admissions القديمة موجودة في المصدر لكنها غير مربوطة بمسارات التطبيق الحالية. أي عميل قديم يستدعي API الرسائل سيحصل على الخطأ الصريح.

لم تُنقل رسائل أو عناوين بريد العملاء إلى JSON أو GitHub. تبقى قاعدة MySQL الأصلية ونسخها الكاملة محفوظة. لإعادة تشغيل استقبال الرسائل لاحقًا، اربط خدمة صندوق خاص مع مصادقة وسياسة حفظ، أو استخدم Neon مستقلًا لهذه البيانات فقط؛ يلزم اختبار ومراجعة ترحيل منفصلان قبل الادعاء باكتمال تلك الوظيفة.

أنشئ Turnstile widget مجانيًا وسجّل `iks-pearl.vercel.app` وhostname الخاص **برابط Preview الثابت للفرع** بعد معرفته من Vercel. استخدم الرابط الثابت لدخول الإدارة؛ روابط deployments المتغيرة قد لا تكون ضمن hostnames المسموحة. تحقق الخادم لا يقبل hostname أو action مختلفًا. راجع كذلك Firewall rate limit لمسار تسجيل الدخول قبل الإنتاج.

فعّل System Environment Variables في Vercel كي يتوفر `VERCEL_ENV` و`VERCEL_GIT_COMMIT_REF` و`VERCEL_GIT_REPO_OWNER` و`VERCEL_GIT_REPO_SLUG` ومعرف المشروع إن توفر. غيابها أو عدم تطابقها يمنع الكتابة. التطوير المحلي وPreview ممنوعان من الكتابة إلى فرع الإنتاج.

## مراجعة البيانات والنسخ الاحتياطي

ملف التشغيل العام هو `content/site.json`: 16 مجموعة محتوى، عدادات IDs لا يعاد استخدامها بعد الحذف، وقيم مالية نصية للحفاظ على الدقة، وISO timestamps. المخطط والتحقق في `server/cms/models.ts` و`server/cms/document.ts`. لا جداول مستخدمين أو جلسات أو رسائل عملاء ضمن هذا التنسيق.

قُرئت MySQL المحلية ضمن snapshot للقراءة مع UTC؛ لم تُطبّق migration عليها ولم تُحذف. توجد نسخ MySQL كاملة مع SHA256 داخل `local-app/backups` ونسخة إضافية داخل `git-cms-experiment/backups`، وهي مهملة من Git وVercel. حُفظ تاريخ Git والتعديلات السابقة أيضًا في bundle وpatch داخل `local-app/backups`.

لإعادة التصدير عند الحاجة، اضبط `SOURCE_MYSQL_DATABASE_URL` محليًا فقط من بيانات التطوير الموجودة لديك، ثم:

```powershell
npm run db:backup-legacy
npm run content:export-mysql
npm run content:validate -- .cache/content-review.json
```

التصدير يرفض قاعدة مستضافة، ولا يقرأ جداول المصادقة أو الرسائل. يكتب مرشح مراجعة داخل `.cache` فقط. قبل تطبيقه محليًا راجع الملف وملخص الاستبعاد؛ أداة التطبيق تتطلب `REVIEWED_CONTENT_SHA256` المطابق و`CONFIRM_LOCAL_CONTENT_REPLACEMENT=YES`، وتأخذ نسخة من JSON الحالي أولًا:

```powershell
npm run content:apply-reviewed
```

هذا لا يعمل commit أو push أو deploy. لا تعتمد مرشحًا إذا استُبعدت منه سجلات حقيقية دون مراجعة. تغييرات تنسيق JSON المستقبلية تحتاج مراجعة وتحديث version/أداة التحويل واختبارها على نسخة، وليست إعادة تصدير عمياء فوق محتوى محرّر أونلاين.

## الاختبار ثم Preview

```powershell
npm ci
npm run check
npm run lint
npm test
npm run build
npm run verify:vercel-artifact
npm run test:browser
```

اختبار المتصفح يستخدم Chrome المثبت، ويمكن تحديد `CHROMIUM_PATH`. ينشئ Git محليًا معزولًا بلا remote، ويحاكي استجابات GitHub وVercel، ويحفظ تعديلًا وصورة كـGit objects فعلية، ثم يبني الخادم من snapshot المحفوظ ويتحقق من ظهوره للعامة. **هذا لا يثبت نجاح Vercel Preview**. لفتح نسخة التطوير: `npm run auth:setup` ثم `npm run local`؛ الإعداد يحفظ الأسرار في `.env` فقط. لن يعمل الحفظ إلى GitHub قبل إكمال إعداد CMS والتحقق من Vercel.

بعد توثيق الهدف، يمكن دفع **الفرع التجريبي فقط** إلى المستودع الحالي للحصول على Preview من المشروع نفسه. راجع أن تكامل GitHub مفعّل وأن Ignored Build Step لا يتجاهل `content/site.json` أو `public/images/cms/`، وأن مؤلف commits له صلاحية نشر المشروع. لا حاجة إلى Deploy Hook أو GitHub Actions أو مشروع Vercel جديد.

على Preview اختبر الحسابات إضافة/تعديل/إخفاء/حذف، البطاقات والفئات والأسعار والإتاحة، الهواتف والنصوص والأقسام والصور والخدمات وSEO. سجّل الدخول من جهاز آخر، وجدّد `/admin`، وجرّب تبويبين متعارضين. يجب أن يظهر commit في الفرع التجريبي وأن يظل فرع الإنتاج ثابتًا. انتظر deployment للـcommit نفسه وافتحه للتحقق من النص والصورة فعليًا. جرّب فشل بناء وتأكد من بقاء النسخة العامة السابقة. أعد تصدير نسخة احتياطية من آخر Git state قبل طلب موافقة الإنتاج.

## النشر والرجوع

لا نشر إنتاجي قبل نجاح Preview وموافقة صاحب المشروع الصريحة. بعد الموافقة فقط تُنقل الشيفرة والـJSON المراجعان إلى فرع الإنتاج الموثق في **المشروع الموجود** وتُضبط متغيراته؛ لا يُغيَّر الرابط الحالي. تفعيل حفظ الإنتاج يعني أن حفظ المحتوى لاحقًا يشغّل نشرًا تلقائيًا كما طُلب.

لإيقاف التحرير الطارئ عطّل `CMS_WRITES_ENABLED` وفق دورة اعتماد متغيرات Vercel أو ألغِ Token من GitHub. للرجوع السريع أعد deployment الإنتاجي السابق من Vercel، ثم راجع وأعد محتوى Git إلى snapshot الموافق له باستخدام commit رجوع عادي؛ رجوع Vercel وحده لا يعيد رأس فرع Git، وقد يعيد حفظ لاحق نشر التعديل الخاطئ. لا تستخدم force push أو حذف تاريخ. لا تحذف MySQL المحلية ونسخها الاحتياطية قبل قبول التحقق النهائي.
