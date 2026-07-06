import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { useLanguage } from "@/contexts/LanguageContext";
import { Menu, X } from "lucide-react";

const navLinks = [
  { key: "nav.home", href: "/" },
  { key: "nav.about", href: "/about" },
  { key: "nav.curriculum", href: "/curriculum" },
  { key: "nav.admissions", href: "/admissions" },
  { key: "nav.gallery", href: "/gallery" },
  { key: "nav.contact", href: "/contact" },
];

export default function Navbar() {
  const { language, toggleLanguage, t, dir } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
          : "bg-transparent"
      }`}
    >
      <nav className="container-main flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          to="/"
          className={`text-xl font-bold transition-colors duration-300 ${
            isScrolled ? "text-[#7A1E2A]" : "text-white"
          }`}
        >
          {language === "ar" ? "المعرفة" : "IKS"}
        </Link>

        {/* Desktop Navigation */}
        <div
          className={`hidden lg:flex items-center gap-1 ${
            dir === "rtl" ? "flex-row-reverse" : ""
          }`}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                isActive(link.href)
                  ? isScrolled
                    ? "text-[#7A1E2A] bg-[#7A1E2A]/10"
                    : "text-white bg-white/20"
                  : isScrolled
                  ? "text-gray-700 hover:text-[#7A1E2A] hover:bg-gray-100"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              {t(link.key)}
            </Link>
          ))}
        </div>

        {/* Right side: Language switcher + CTA */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={() => language !== "en" && toggleLanguage()}
              className={`px-2 py-1 text-sm font-medium transition-colors ${
                language === "en"
                  ? isScrolled
                    ? "text-[#7A1E2A] border-b-2 border-[#7A1E2A]"
                    : "text-white border-b-2 border-white"
                  : isScrolled
                  ? "text-gray-400 hover:text-gray-600"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              EN
            </button>
            <span
              className={`text-sm ${
                isScrolled ? "text-gray-300" : "text-white/30"
              }`}
            >
              |
            </span>
            <button
              onClick={() => language !== "ar" && toggleLanguage()}
              className={`px-2 py-1 text-sm font-medium transition-colors ${
                language === "ar"
                  ? isScrolled
                    ? "text-[#7A1E2A] border-b-2 border-[#7A1E2A]"
                    : "text-white border-b-2 border-white"
                  : isScrolled
                  ? "text-gray-400 hover:text-gray-600"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              AR
            </button>
          </div>

          <Link
            to="/admissions"
            className={`hidden sm:inline-flex items-center px-5 py-2 text-sm font-medium rounded-md transition-all duration-300 ${
              isScrolled
                ? "bg-[#7A1E2A] text-white hover:bg-[#9A2D3A]"
                : "bg-white/[0.15] text-white border border-white/30 hover:bg-white/25"
            }`}
          >
            {t("hero.cta.primary")}
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`lg:hidden p-2 rounded-md transition-colors ${
              isScrolled
                ? "text-gray-700 hover:bg-gray-100"
                : "text-white hover:bg-white/10"
            }`}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t shadow-lg">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`block px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  isActive(link.href)
                    ? "text-[#7A1E2A] bg-[#7A1E2A]/10"
                    : "text-gray-700 hover:text-[#7A1E2A] hover:bg-gray-50"
                }`}
              >
                {t(link.key)}
              </Link>
            ))}
            <div className="flex items-center gap-2 pt-3 border-t">
              <button
                onClick={() => language !== "en" && toggleLanguage()}
                className={`px-3 py-1.5 text-sm font-medium rounded ${
                  language === "en"
                    ? "text-[#7A1E2A] bg-[#7A1E2A]/10"
                    : "text-gray-500"
                }`}
              >
                English
              </button>
              <button
                onClick={() => language !== "ar" && toggleLanguage()}
                className={`px-3 py-1.5 text-sm font-medium rounded ${
                  language === "ar"
                    ? "text-[#7A1E2A] bg-[#7A1E2A]/10"
                    : "text-gray-500"
                }`}
              >
                العربية
              </button>
            </div>
            <Link
              to="/admissions"
              className="block w-full text-center mt-2 px-5 py-2.5 text-sm font-medium bg-[#7A1E2A] text-white rounded-md"
            >
              {t("hero.cta.primary")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
