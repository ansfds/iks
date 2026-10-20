import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteContent } from "@/hooks/useSiteContent";
import { SiteImage } from "@/components/SiteImage";
import { SITE_IMAGES } from "@/config/site-images";
import { Menu, X } from "lucide-react";

const navLinks = [
  { key: "nav.home", href: "/" },
  { key: "nav.about", href: "/about" },
  { key: "nav.curriculum", href: "/curriculum" },
  { key: "nav.giftCards", href: "/gift-cards" },
  { key: "nav.transfers", href: "/transfers" },
  { key: "nav.admissions", href: "/admissions" },
  { key: "nav.gallery", href: "/gallery" },
  { key: "nav.contact", href: "/contact" },
];

export default function Navbar() {
  const { t, dir } = useLanguage();
  const cms = useSiteContent();
  const navKey: Record<string,string> = { "/":"nav_home", "/about":"nav_about", "/curriculum":"nav_services", "/gift-cards":"nav_gift_cards", "/transfers":"nav_transfers", "/contact":"nav_contact" };
  const visibleNavLinks = navLinks.filter(link => !navKey[link.href] || cms.isVisible(navKey[link.href]));
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const hasSolidBackground = isScrolled || location.pathname.startsWith("/gift-cards");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        hasSolidBackground
          ? "bg-white/95 backdrop-blur-md shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
          : "bg-transparent"
      }`}
    >
      <nav className="container-main flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex h-14 w-[112px] shrink-0 items-center justify-start sm:w-[124px] lg:w-[132px]"
          aria-label="الوسيط المعتمد"
        >
          <SiteImage
            src={cms.value("site_logo", SITE_IMAGES.branding.navbarLogo)}
            fallbackSrc={SITE_IMAGES.branding.navbarLogoFallback}
            alt="شعار الوسيط المعتمد"
            loading="eager"
            className="h-auto w-auto max-h-[52px] max-w-full lg:max-h-[56px]"
          />
        </Link>

        {/* Desktop Navigation */}
        <div
          className={`hidden lg:flex items-center gap-1 ${
            dir === "rtl" ? "flex-row-reverse" : ""
          }`}
        >
          {visibleNavLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                isActive(link.href)
                  ? hasSolidBackground
                    ? "text-[#213B6F] bg-[#213B6F]/10"
                    : "text-white bg-white/20"
                  : hasSolidBackground
                  ? "text-gray-700 hover:text-[#213B6F] hover:bg-gray-100"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              {t(link.key)}
            </Link>
          ))}
        </div>

        {/* Right side: CTA */}
        <div className="flex items-center gap-3">
          <Link
            to="/admissions"
            className={`hidden sm:inline-flex items-center px-5 py-2 text-sm font-medium rounded-md transition-all duration-300 ${
              hasSolidBackground
                ? "bg-[#213B6F] text-white hover:bg-[#2C4F8E]"
                : "bg-white/15 text-white border border-white/30 hover:bg-white/25"
            }`}
          >
            {t("hero.cta.primary")}
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
            aria-expanded={isMobileMenuOpen}
            className={`lg:hidden p-2 rounded-md transition-colors ${
              hasSolidBackground
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
            {visibleNavLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  isActive(link.href)
                    ? "text-[#213B6F] bg-[#213B6F]/10"
                    : "text-gray-700 hover:text-[#213B6F] hover:bg-gray-50"
                }`}
              >
                {t(link.key)}
              </Link>
            ))}
            <Link
              to="/admissions"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block w-full text-center mt-2 px-5 py-2.5 text-sm font-medium bg-[#213B6F] text-white rounded-md"
            >
              {t("hero.cta.primary")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
