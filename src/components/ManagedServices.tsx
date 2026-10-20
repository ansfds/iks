import { Link } from 'react-router';
import { trpc } from '@/providers/trpc';
import { SiteImage } from '@/components/SiteImage';

export function ManagedServices() {
  const query = trpc.finance.overview.useQuery(undefined, { staleTime: 0, refetchInterval: 30_000 });
  if (query.isLoading) return <p className="text-center" role="status">جاري تحميل الخدمات...</p>;
  if (query.isError) return <p className="text-center" role="status">تعذر تحميل الخدمات. يرجى إعادة المحاولة.</p>;
  const services = query.data?.services ?? [];
  return <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {services.map(service => <article key={service.id} className="rounded-lg border border-slate-200 bg-white p-6 text-slate-900 shadow-sm">
      {service.imageUrl && <SiteImage src={service.imageUrl} alt={service.nameAr} className="mb-4 h-40 w-full object-contain" />}
      <h3 className="text-xl font-bold">{service.nameAr}</h3>
      {service.descriptionAr && <p className="mt-3 leading-7 text-slate-600">{service.descriptionAr}</p>}
      {service.href && (service.href.startsWith('/') ? <Link to={service.href} className="mt-4 inline-block font-bold text-blue-800">عرض الخدمة</Link> : <a href={service.href} rel="noopener noreferrer" className="mt-4 inline-block font-bold text-blue-800">عرض الخدمة</a>)}
    </article>)}
    {services.length === 0 && <p className="col-span-full text-center">لا توجد خدمات متاحة حاليًا.</p>}
  </div>;
}
