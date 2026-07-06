import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/providers/trpc";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GSAP: any = gsap;

const categories = ["all", "classrooms", "activities", "campus", "students"];

export default function GalleryPage() {
  const { t, dir } = useLanguage();
  const [activeCategory, setActiveCategory] = useState("all");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  const { data: galleryItems } = trpc.gallery.list.useQuery(
    activeCategory !== "all" ? { category: activeCategory } : {}
  );

  const images =
    galleryItems && galleryItems.length > 0
      ? galleryItems
      : [
          { id: 1, imageUrl: "/images/hero-classroom.jpg", title: "Classroom", category: "classrooms" },
          { id: 2, imageUrl: "/images/science-lab.jpg", title: "Science Lab", category: "activities" },
          { id: 3, imageUrl: "/images/campus-exterior.jpg", title: "Campus", category: "campus" },
          { id: 4, imageUrl: "/images/art-classroom.jpg", title: "Art Class", category: "activities" },
          { id: 5, imageUrl: "/images/sports-facility.jpg", title: "Sports", category: "campus" },
          { id: 6, imageUrl: "/images/library.jpg", title: "Library", category: "campus" },
          { id: 7, imageUrl: "/images/graduation.jpg", title: "Graduation", category: "students" },
          { id: 8, imageUrl: "/images/students-group.jpg", title: "Students", category: "students" },
          { id: 9, imageUrl: "/images/about-classroom.jpg", title: "Learning", category: "classrooms" },
          { id: 10, imageUrl: "/images/hero-classroom.jpg", title: "Collaboration", category: "classrooms" },
        ];

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = "";
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (sectionRef.current) {
        GSAP.fromTo(
          sectionRef.current.querySelectorAll(".gallery-animate"),
          { opacity: 0, scale: 0.95 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.5,
            stagger: 0.06,
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 80%",
            },
          }
        );
      }
    });
    return () => ctx.revert();
  }, [activeCategory]);

  return (
    <div dir={dir}>
      <section className="relative min-h-[40vh] max-h-[400px] flex items-center justify-center bg-gradient-hero">
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-[56px] font-bold text-white mb-3">
            {t("page.gallery")}
          </h1>
          <div className="flex items-center justify-center gap-2 text-sm text-white/60">
            <Link to="/" className="hover:text-white transition-colors">
              {t("nav.home")}
            </Link>
            <span>/</span>
            <span className="text-white/80">{t("page.gallery")}</span>
          </div>
        </div>
      </section>

      <section className="bg-white section-padding">
        <div className="container-main">
          {/* Category Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 text-sm font-medium rounded-full transition-all ${
                  activeCategory === cat
                    ? "bg-[#7A1E2A] text-white"
                    : "bg-[#F8F9FA] text-[#7C7C7C] hover:bg-[#F2D7DC]"
                }`}
              >
                {t(`gallery.${cat}`)}
              </button>
            ))}
          </div>

          {/* Image Grid */}
          <div
            ref={sectionRef}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            {images.map((img, i) => (
              <div
                key={img.id}
                className="gallery-animate relative group cursor-pointer overflow-hidden rounded-lg aspect-square"
                onClick={() => openLightbox(i)}
              >
                <img
                  src={img.imageUrl}
                  alt={img.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                  <ZoomIn
                    size={32}
                    className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-10"
          >
            <X size={32} />
          </button>

          {/* Navigation */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors z-10"
          >
            <ChevronLeft size={48} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors z-10"
          >
            <ChevronRight size={48} />
          </button>

          {/* Image */}
          <img
            src={images[currentImageIndex]?.imageUrl}
            alt={images[currentImageIndex]?.title}
            className="max-w-[90vw] max-h-[85vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {currentImageIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}
