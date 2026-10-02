import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LeadPopup from "../components/LeadPopup";
import { CONTACT } from "../config/contact";
import { FaWhatsapp } from "react-icons/fa";

function SiteLayout() {
  return (
    <div className="site-shell">
      <Navbar />
      <LeadPopup />
      <Outlet />

      {/* Floating WhatsApp Button with Pulse */}
      <a
        href={`https://wa.me/${CONTACT.whatsapp}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat with Delta Industries on WhatsApp"
        className="group fixed bottom-6 right-6 z-50"
      >
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full bg-[#25D366]/40 animate-ping" />
        {/* Button */}
        <span className="relative flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-[0_4px_20px_rgba(37,211,102,0.4)] hover:shadow-[0_4px_30px_rgba(37,211,102,0.6)] hover:scale-110 transition-all duration-300">
          <FaWhatsapp className="w-7 h-7" />
        </span>
        {/* Tooltip */}
        <span className="absolute right-[calc(100%+12px)] top-1/2 -translate-y-1/2 whitespace-nowrap px-3 py-2 rounded-lg bg-[#121318] border border-white/10 text-white text-xs font-medium shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300">
          Chat with us
        </span>
      </a>

      <Footer />
    </div>
  );
}

export default SiteLayout;
