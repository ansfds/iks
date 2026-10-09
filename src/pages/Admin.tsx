import { useEffect, useState, type ElementType } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { AdminGiftCards } from "@/components/gift-cards/AdminGiftCards";
import {
  Mail,
  MailOpen,
  Image,
  Newspaper,
  MessageSquare,
  TrendingUp,
  Loader2,
  Gift,
} from "lucide-react";

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number | undefined;
  icon: ElementType;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="mb-1 text-sm text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value ?? "-"}</p>
        </div>
        <div
          className="flex h-12 w-12 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon size={24} style={{ color }} />
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [activeSection, setActiveSection] = useState<"dashboard" | "giftCards">(
    "dashboard",
  );

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
    if (!authLoading && isAuthenticated && user?.role !== "admin") {
      navigate("/");
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  const { data: stats } = trpc.admin.stats.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const { data: contactsData } = trpc.contact.list.useQuery(
    { page: 1, limit: 10 },
    { enabled: isAuthenticated && user?.role === "admin" },
  );

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#213B6F]" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  const statItems = [
    {
      title: "إجمالي طلبات التواصل",
      value: stats?.totalContacts,
      icon: Mail,
      color: "#213B6F",
    },
    {
      title: "رسائل غير مقروءة",
      value: stats?.unreadContacts,
      icon: MailOpen,
      color: "#1D7FEA",
    },
    {
      title: "هذا الشهر",
      value: stats?.contactsThisMonth,
      icon: TrendingUp,
      color: "#2C4F8E",
    },
    {
      title: "عناصر المعرض",
      value: stats?.totalGallery,
      icon: Image,
      color: "#0B1E35",
    },
    {
      title: "عناصر الأخبار",
      value: stats?.totalNews,
      icon: Newspaper,
      color: "#213B6F",
    },
    {
      title: "آراء العملاء",
      value: stats?.totalTestimonials,
      icon: MessageSquare,
      color: "#1D7FEA",
    },
    {
      title: "Gift Cards",
      value: stats?.totalGiftCards,
      icon: Gift,
      color: "#0F3B82",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-10 pt-20" dir="rtl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم</h1>
          <p className="mt-1 text-gray-500">
            مرحبًا بعودتك، {user?.name || "المشرف"}
          </p>
        </div>

        <div className="mb-8 flex flex-wrap gap-2 rounded-lg border border-gray-200 bg-white p-2">
          <button
            type="button"
            onClick={() => setActiveSection("dashboard")}
            className={`rounded-md px-4 py-2 text-sm font-bold transition ${
              activeSection === "dashboard"
                ? "bg-[#213B6F] text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            نظرة عامة
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("giftCards")}
            className={`rounded-md px-4 py-2 text-sm font-bold transition ${
              activeSection === "giftCards"
                ? "bg-[#213B6F] text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Gift Card
          </button>
        </div>

        {activeSection === "dashboard" ? (
          <>
            <div className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {statItems.map((stat) => (
                <StatCard key={stat.title} {...stat} />
              ))}
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  أحدث طلبات التواصل
                </h2>
                <span className="text-sm text-gray-500">
                  الإجمالي: {contactsData?.total ?? 0}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                        العميل
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                        الخدمة
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                        البريد الإلكتروني
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                        المبلغ
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                        التاريخ
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                        الحالة
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(contactsData?.items ?? []).length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-10 text-center text-gray-500"
                        >
                          لا توجد طلبات تواصل حتى الآن.
                        </td>
                      </tr>
                    ) : (
                      (contactsData?.items ?? []).map((contact) => (
                        <tr key={contact.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {contact.studentName}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {contact.parentName}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {contact.email}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {contact.grade || "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(contact.createdAt).toLocaleDateString(
                              "ar-LY",
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                contact.isRead
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {contact.isRead ? "مقروء" : "جديد"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <AdminGiftCards />
        )}
      </div>
    </div>
  );
}
