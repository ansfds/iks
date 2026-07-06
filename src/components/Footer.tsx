import { Link } from "react-router";
import { useLanguage } from "@/contexts/LanguageContext";
import { MapPin, Phone, Mail, Facebook, Instagram, Twitter, Youtube } from "lucide-react";

const quickLinks = [
  { key: "nav.home", href: "/" },
  { key: "nav.about", href: "/about" },
  { key: "nav.curriculum", href: "/curriculum" },
  { key: "nav.gallery", href: "/gallery" },
  { key: "nav.admissions", href: "/admissions" },
  { key: "nav.contact", href: "/contact" },
];

const infoLinks = [
  { key: "nav.curriculum", href: "/curriculum" },
  // Leadership link removed
  { key: "nav.news", href: "/news" },
];

export default function Footer() {
  const { t, dir } = useLanguage();

  return (
    <footer className="bg-[#171923] text-white" dir={dir}>
      <div className="container-main px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Column 1: About */}
          <div>
            <h3 className="text-xl font-bold mb-4">
              {t("nav.home") === "Home" ? "IKS" : "المعرفة"}
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              {t("footer.description")}
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="text-base font-semibold mb-4">{t("footer.quickLinks")}</h4>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Information */}
          <div>
            <h4 className="text-base font-semibold mb-4">{t("footer.information")}</h4>
            <ul className="space-y-2.5">
              {infoLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div>
            <h4 className="text-base font-semibold mb-4">{t("footer.contactInfo")}</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <MapPin size={16} className="text-[#F0B736] mt-0.5 shrink-0" />
                <span className="text-sm text-gray-400">{t("footer.address")}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={16} className="text-[#F0B736] shrink-0" />
                <span className="text-sm text-gray-400">{t("footer.phone")}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={16} className="text-[#F0B736] shrink-0" />
                <span className="text-sm text-gray-400">{t("footer.email")}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container-main px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} {t("footer.copyright")}
          </p>
          <div className="flex items-center gap-4">
            <a href="https://www.facebook.com/InternationalKnowledgeSchool" className="text-gray-400 hover:text-white transition-colors">
              <Facebook size={18} />
            </a>
            <a href="https://www.instagram.com/InternationalKnowledgeSchool" className="text-gray-400 hover:text-white transition-colors">
              <Instagram size={18} />
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <Twitter size={18} />
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <Youtube size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
