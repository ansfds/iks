import { motion } from "framer-motion";
import {
  Banknote,
  Globe2,
  Landmark,
  Plane,
  ReceiptText,
  ShoppingBag,
  WalletCards,
} from "lucide-react";

type ServiceItem = {
  id: number;
  nameAr: string;
  descriptionAr: string | null;
  icon: string | null;
  href: string | null;
};

const iconMap = {
  usdt: WalletCards,
  transfer: Globe2,
  bills: ReceiptText,
  china: ShoppingBag,
  ecommerce: ShoppingBag,
  travel: Plane,
  bank: Landmark,
  money: Banknote,
};

function getIcon(name: string | null) {
  return iconMap[(name ?? "money") as keyof typeof iconMap] ?? Banknote;
}

export function ServicesSection({ services }: { services: ServiceItem[] }) {
  return (
    <section id="services" className="bg-white py-14 sm:py-20" dir="rtl">
      <div className="container-main px-4 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <p className="mb-3 text-sm font-bold text-blue-700">الخدمات</p>
          <h2 className="text-3xl font-black text-slate-950 sm:text-4xl">
            خدمات مالية قابلة للإدارة من لوحة التحكم
          </h2>
        </div>

        {services.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="font-bold text-slate-900">لم تُضف الخدمات بعد</p>
            <p className="mt-2 text-sm text-slate-500">
              أنشئ الخدمات ورتب ظهورها من لوحة الإدارة.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, index) => {
              const Icon = getIcon(service.icon);
              const content = (
                <motion.article
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ delay: index * 0.04, duration: 0.35 }}
                  className="group h-full rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_20px_55px_rgba(37,99,235,0.10)]"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-blue-50 text-blue-700 transition group-hover:bg-blue-700 group-hover:text-white">
                    <Icon size={24} />
                  </div>
                  <h3 className="text-xl font-black text-slate-950">
                    {service.nameAr}
                  </h3>
                  {service.descriptionAr && (
                    <p className="mt-3 text-sm leading-7 text-slate-500">
                      {service.descriptionAr}
                    </p>
                  )}
                </motion.article>
              );

              return service.href ? (
                <a key={service.id} href={service.href} className="block h-full">
                  {content}
                </a>
              ) : (
                <div key={service.id}>{content}</div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
