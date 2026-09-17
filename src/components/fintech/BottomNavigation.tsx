import { Calculator, CircleDollarSign, Home, Landmark, MessageCircle } from "lucide-react";
import { Link, useLocation } from "react-router";

const items = [
  { label: "الرئيسية", href: "/", icon: Home },
  { label: "الأسعار", href: "/#rates", icon: CircleDollarSign },
  { label: "احسب", href: "/#calculator", icon: Calculator, featured: true },
  { label: "التحويلات", href: "/transfers", icon: Landmark },
  { label: "تواصل", href: "/contact", icon: MessageCircle },
];

export function BottomNavigation() {
  const location = useLocation();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/80 bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0_-18px_45px_rgba(15,23,42,0.12)] backdrop-blur-md lg:hidden"
      aria-label="التنقل السريع"
      dir="rtl"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 items-end gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.href.split("#")[0]);

          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-md text-[11px] font-semibold transition ${
                item.featured
                  ? "-mt-8 h-16 bg-blue-600 text-white shadow-[0_14px_32px_rgba(37,99,235,0.34)]"
                  : isActive
                    ? "text-blue-700"
                    : "text-slate-500"
              }`}
            >
              <Icon size={item.featured ? 24 : 20} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
