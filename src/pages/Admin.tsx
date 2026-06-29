import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import {
  Mail,
  MailOpen,
  Image,
  Newspaper,
  MessageSquare,
  TrendingUp,
  Loader2,
} from "lucide-react";

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number | undefined;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">
            {value ?? "-"}
          </p>
        </div>
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center"
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

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
    if (!authLoading && isAuthenticated && user?.role !== "admin") {
      navigate("/");
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  const { data: stats } = trpc.admin.stats.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  const { data: contactsData } = trpc.contact.list.useQuery(
    { page: 1, limit: 10 },
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#213B6F]" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  const statItems = [
    {
      title: "Total Contacts",
      value: stats?.totalContacts,
      icon: Mail,
      color: "#213B6F",
    },
    {
      title: "Unread Messages",
      value: stats?.unreadContacts,
      icon: MailOpen,
      color: "#7B2F63",
    },
    {
      title: "This Month",
      value: stats?.contactsThisMonth,
      icon: TrendingUp,
      color: "#2C4F8E",
    },
    {
      title: "Gallery Items",
      value: stats?.totalGallery,
      icon: Image,
      color: "#0B1E35",
    },
    {
      title: "News Items",
      value: stats?.totalNews,
      icon: Newspaper,
      color: "#213B6F",
    },
    {
      title: "Testimonials",
      value: stats?.totalTestimonials,
      icon: MessageSquare,
      color: "#7B2F63",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Welcome back, {user?.name || "Admin"}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {statItems.map((stat, i) => (
            <StatCard key={i} {...stat} />
          ))}
        </div>

        {/* Recent Contacts Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Contact Submissions
            </h2>
            <span className="text-sm text-gray-500">
              {contactsData?.total ?? 0} total
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Parent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
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
                      No contact submissions yet.
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
                        {new Date(contact.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            contact.isRead
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {contact.isRead ? "Read" : "New"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
