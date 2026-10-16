# إصلاح تشغيل الخادم على Vercel

عند فحص `https://iks-pearl.vercel.app` بعد النشر، أعاد `/api/trpc/ping` وطلب البطاقات `404` من Vercel، وأعادت الصفحات الداخلية وملف sitemap الخطأ `FUNCTION_INVOCATION_FAILED`. نجاح عملية البناء وحده لم يكن كافيًا للتحقق من تشغيل الخادم.

- استُبدل مدخل catch-all بمدخل واحد `api/index.mjs` مع rewrites صريحة لمسارات API المتداخلة والصفحات.
- يُبنى `server/vercel.ts` بواسطة esbuild إلى `dist/vercel.mjs` قبل تجهيز الدالة. يحل ذلك استيرادات TypeScript داخل ملف ESM جاهز للتشغيل، مع تضمين HTML الذي تستخدمه وسوم SEO.
- يستخدم المدخل توقيع `fetch(Request)` المدعوم من Vercel، ويحافظ على معاملات tRPC وطلبات POST والمصادقة.
- بقي MySQL مخزن الإنتاج. ملف JSON المحلي ليس بديلًا تلقائيًا لأسعار الإنتاج عند تعطل قاعدة البيانات.

التحقق: `npm run check`، واختبارات المشروع ومنها 4 اختبارات توجيه جديدة، و`npm run build`، ثم `node tools/verify-vercel.mjs`. يفحص الأمر الأخير ملف الإنتاج بواسطة Node مباشرة، ويضمن أن غياب إعداد قاعدة البيانات يعيد خطأ JSON معالجًا بدل إسقاط الدالة.

إذا عمل `/api/trpc/ping` وبقيت البطاقات تعيد خطأ قاعدة بيانات بعد النشر، يجب ضبط `DATABASE_URL` لاتصال MySQL يمكن الوصول إليه من Vercel وتطبيق migrations الموجودة. لا تنسخ عنوان localhost إلى بيئة الإنتاج، ولا تضع كلمة المرور في ملفات Git أو رسائل الدعم.

المراجع: [مدخل Vercel المشترك وتوقيع fetch](https://vercel.com/docs/functions/runtimes/node-js)، [تضمين نواتج البناء في الدالة](https://vercel.com/docs/functions/runtimes/node-js/advanced-node-configuration).
