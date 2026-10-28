import { useEffect, useState } from 'react';
import { trpc } from '@/providers/trpc';
import { lastCmsSave, setCmsRevision, type CmsSave } from '@/lib/cms-state';

export function CmsDeploymentBanner() {
  const snapshot = trpc.cms.snapshot.useQuery(undefined,{retry:false,refetchOnWindowFocus:false});
  const [saved,setSaved] = useState<CmsSave|null>(lastCmsSave);
  useEffect(()=>{ if(snapshot.data) setCmsRevision(snapshot.data.revision); },[snapshot.data]);
  useEffect(()=>{
    const listener = (event:Event)=>setSaved((event as CustomEvent<CmsSave>).detail);
    window.addEventListener('cms-saved',listener);
    return ()=>window.removeEventListener('cms-saved',listener);
  },[]);
  return <div role="status" className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-7 text-blue-950">
    <p className="font-bold">{snapshot.error ? 'تعذر تحميل حالة التحرير' : !snapshot.data ? 'جارٍ التحقق من البيانات…' : !snapshot.data.writesEnabled ? 'التحقق من نقل المحتوى لم يكتمل' : saved ? 'تم الحفظ في Supabase' : 'جاهز للتحرير'}</p>
    {snapshot.data?.writesEnabled && <p>الموقع ولوحة الإدارة يستخدمان نفس البيانات. يظهر التعديل بعد حفظه وتحديث الصفحة.</p>}
    {snapshot.error && <p role="alert">{snapshot.error.message} <button className="underline" onClick={()=>snapshot.refetch()}>إعادة المحاولة</button></p>}
  </div>;
}
