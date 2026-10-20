import { MessageCircle } from "lucide-react";
import { useSiteContent } from "@/hooks/useSiteContent";
export default function WhatsAppFloat() {
  const { value } = useSiteContent();
  return <a href={`https://wa.me/${value("site_whatsapp").replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer"
    className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition hover:scale-110 hover:bg-green-600" aria-label="WhatsApp"><MessageCircle size={28}/></a>;
}
