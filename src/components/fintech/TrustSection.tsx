import { motion } from "framer-motion";
import { BadgeCheck, Globe2, ShieldCheck, TimerReset } from "lucide-react";

type TrustItem = {
  id: number;
  labelAr: string;
  value: string | null;
  unitAr: string | null;
  descriptionAr: string | null;
  icon: string | null;
};

const trustIcons = {
  shield: ShieldCheck,
  time: TimerReset,
  globe: Globe2,
  check: BadgeCheck,
};

export function TrustSection({ items }: { items: TrustItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="bg-slate-950 py-14 text-white sm:py-20" dir="rtl">
      <div className="container-main px-4 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <p className="mb-3 text-sm font-bold text-cyan-300">لماذا الوسيط المعتمد</p>
          <h2 className="text-3xl font-black sm:text-4xl">
            مؤشرات ثقة تُدار من لوحة الإدارة
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, index) => {
            const Icon =
              trustIcons[(item.icon ?? "check") as keyof typeof trustIcons] ??
              BadgeCheck;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: index * 0.05, duration: 0.35 }}
                className="rounded-lg border border-white/10 bg-white/[0.04] p-5"
              >
                <Icon className="mb-5 h-7 w-7 text-cyan-300" />
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-black">{item.value}</span>
                  {item.unitAr && (
                    <span className="pb-1 text-sm font-bold text-cyan-100/80">
                      {item.unitAr}
                    </span>
                  )}
                </div>
                <h3 className="mt-3 font-bold">{item.labelAr}</h3>
                {item.descriptionAr && (
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    {item.descriptionAr}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
