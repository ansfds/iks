import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck, ArrowLeft } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const configuration = trpc.auth.configuration.useQuery(undefined, { retry: false });
  const login = trpc.auth.login.useMutation({
    onSuccess: (result) => {
      setPassword("");
      utils.auth.me.setData(undefined, { ...result.user, supabaseUserId: result.user.supabaseUserId, expiresAt: result.expiresAt });
      navigate("/admin", { replace: true });
    },
  });
  useEffect(() => { if (isAuthenticated) navigate("/admin", { replace: true }); }, [isAuthenticated, navigate]);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!login.isPending) login.mutate({ email: email.trim(), password });
  }
  const input = "mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60";
  return <div className="grid min-h-screen place-items-center bg-[#F5F7FB] px-4 py-10 text-slate-900" dir="rtl">
    <main className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
      <div className="bg-[#0B1E35] px-7 py-8 text-center text-white sm:px-10">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-white/10"><ShieldCheck size={29} aria-hidden="true" /></div>
        <p className="text-sm text-blue-200">الوسيط المعتمد</p>
        <h1 className="mt-2 text-2xl font-black">تسجيل الدخول إلى الإدارة</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">مرحبًا بك، أدخل بيانات المدير للمتابعة.</p>
      </div>
      <form onSubmit={submit} className="space-y-5 p-7 sm:p-10" aria-busy={login.isPending}>
        {params.has("expired") && !login.error && <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-900">انتهت الجلسة. سجّل الدخول مجددًا للمتابعة.</p>}
        {login.error && <p id="login-error" role="alert" className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm leading-6 text-red-800">{login.error.data?.code === "BAD_REQUEST" ? "تحقق من اسم المستخدم وكلمة المرور." : login.error.message}</p>}
        <label className="block text-sm font-bold" htmlFor="admin-username">البريد الإلكتروني للمدير
          <input id="admin-username" type="email" name="email" autoComplete="username" autoCapitalize="none" spellCheck={false} required maxLength={320} value={email} onChange={e => { setEmail(e.target.value); login.reset(); }} disabled={login.isPending} className={input} aria-describedby={login.error ? "login-error" : undefined} />
        </label>
        <div>
          <label className="block text-sm font-bold" htmlFor="admin-password">كلمة المرور</label>
          <div className="relative">
            <input id="admin-password" name="password" type={visible ? "text" : "password"} autoComplete="current-password" required maxLength={1024} value={password} onChange={e => { setPassword(e.target.value); login.reset(); }} disabled={login.isPending} className={`${input} pl-14`} aria-describedby={login.error ? "login-error" : undefined} />
            <button type="button" onClick={() => setVisible(v => !v)} aria-label={visible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"} aria-pressed={visible} className="absolute inset-y-0 left-1 mt-2 rounded-lg px-3 text-slate-500 hover:text-blue-700 focus-visible:outline-blue-600">{visible ? <EyeOff size={20} /> : <Eye size={20} />}</button>
          </div>
        </div>
        {(configuration.isError || (configuration.data && !configuration.data.configured)) && <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">تسجيل الدخول غير متاح حاليًا. يرجى التواصل مع مسؤول الموقع.</p>}
        <button type="submit" disabled={login.isPending || configuration.isPending || configuration.isError || !configuration.data?.configured} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#213B6F] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#2C4F8E] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 disabled:cursor-wait disabled:opacity-70">
          {login.isPending ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <LockKeyhole size={18} aria-hidden="true" />}{login.isPending ? "جارٍ تسجيل الدخول…" : "تسجيل الدخول"}
        </button>
        <Link to="/" className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-blue-800">العودة إلى الموقع <ArrowLeft size={16} /></Link>
      </form>
    </main>
  </div>;
}
