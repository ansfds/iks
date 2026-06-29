import { Routes, Route } from "react-router";
import { LanguageProvider } from "./contexts/LanguageContext";
import { Toaster } from "sonner";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import WhatsAppFloat from "./components/WhatsAppFloat";
import ScrollToTop from "./components/ScrollToTop";
import Home from "./pages/Home";
import About from "./pages/About";
import VisionMission from "./pages/VisionMission";
import Values from "./pages/Values";
import Goals from "./pages/Goals";
import Curriculum from "./pages/Curriculum";
import Admissions from "./pages/Admissions";
import GalleryPage from "./pages/GalleryPage";
import NewsPage from "./pages/NewsPage";
import Contact from "./pages/Contact";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
      <WhatsAppFloat />
      <ScrollToTop />
    </>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <Toaster position="top-center" richColors />
      <Routes>
        {/* Public pages with layout */}
        <Route
          path="/"
          element={
            <AppLayout>
              <Home />
            </AppLayout>
          }
        />
        <Route
          path="/about"
          element={
            <AppLayout>
              <About />
            </AppLayout>
          }
        />
        <Route
          path="/vision-mission"
          element={
            <AppLayout>
              <VisionMission />
            </AppLayout>
          }
        />
        <Route
          path="/values"
          element={
            <AppLayout>
              <Values />
            </AppLayout>
          }
        />
        <Route
          path="/goals"
          element={
            <AppLayout>
              <Goals />
            </AppLayout>
          }
        />
        <Route
          path="/curriculum"
          element={
            <AppLayout>
              <Curriculum />
            </AppLayout>
          }
        />
        {/* Leadership page removed */}
        <Route
          path="/admissions"
          element={
            <AppLayout>
              <Admissions />
            </AppLayout>
          }
        />
        <Route
          path="/gallery"
          element={
            <AppLayout>
              <GalleryPage />
            </AppLayout>
          }
        />
        <Route
          path="/news"
          element={
            <AppLayout>
              <NewsPage />
            </AppLayout>
          }
        />
        <Route
          path="/contact"
          element={
            <AppLayout>
              <Contact />
            </AppLayout>
          }
        />
        {/* Admin (no layout - separate) */}
        <Route path="/admin" element={<Admin />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </LanguageProvider>
  );
}
