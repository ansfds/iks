# إعداد Supabase

المشروع المستخدم: `cqunbjasbbmmtaiawxhe`. لم يُنشأ مشروع جديد.

| متغير الخادم | القيمة المطلوبة |
|---|---|
| `SUPABASE_URL` | `https://cqunbjasbbmmtaiawxhe.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | Publishable Key الخاص بالمشروع |
| `SUPABASE_ADMIN_USER_IDS` | `49a9fa20-2bdf-45f2-a7a2-325f6df5bc5e` |

المتغيرات موجودة في Vercel Production وفي `.env.local` المستبعد من Git محليًا. لا تستخدم بادئة `VITE_` لهذه القيم. الواجهة تتصل بخادم tRPC، والخادم يستخدم Publishable Key وجلسة المستخدم. لا يلزم متغير جديد بعد ترحيل المحتوى، ولا يُستخدم Secret Key أو `service_role` حتى في خادم التطبيق.

الدخول بالبريد وكلمة المرور عبر Supabase Auth. يتحقق الخادم من `getUser` ومن قائمة UUID؛ لا يستخدم `user_metadata` لمنح الدور. Cookies من نوع HttpOnly وSecure على HTTPS وSameSite=Lax، مع حماية Origin للطلبات المعدلة. الموقع العام يقرأ بصفة anon حتى لو كان المتصفح يحمل جلسة مدير.

صلاحية قاعدة البيانات تعتمد على عضوية المدير الفعالة في `private.content_admins` المرتبطة بـ`auth.users`. هذه العضوية ليست قابلة للتعديل بواسطة API العام أو المستخدمين المسجلين. عند تغيير المدير، يلزم تحديث العضوية عبر وصول SQL المصرح ومتغير الخادم؛ إضافة UUID في الواجهة وحدها لا تمنح الكتابة.

يستخدم `getDb()` في `server/queries/connection.ts` Supabase Data API للوصول إلى PostgreSQL. تستخدم Routers المحتوى `server/cms/store.ts` و`server/supabase/content.ts`؛ تقرأ من قاعدة البيانات وتكتب فروق السجلات في معاملة RPC واحدة، مع RLS ومنع تعارض الإصدارات. فشل الاتصال يعيد خطأ واضحًا؛ لا يرجع تلقائيًا إلى محتوى قديم.

الصور الجديدة تُرفع إلى bucket `site-media` بحد 2 MB وبأنواع PNG/JPEG/WebP؛ القراءة عامة، والتعديل للمدير فقط. الصور الأصلية وروابطها بقيت محفوظة.

المخطط المرجعي PostgreSQL في `db/schema.ts`، والترحيلات المطبقة في `supabase/migrations/`. لا تشغّل ترحيلات MySQL التاريخية على Supabase. تفاصيل الجداول والاختبارات في [تقرير الترحيل](SUPABASE_MIGRATION_AR.md).
