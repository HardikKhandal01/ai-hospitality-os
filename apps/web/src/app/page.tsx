import Link from "next/link";
import { Building2, Utensils, ArrowRight, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-10 pb-32 bg-gradient-to-br from-navy via-royal/80 to-navy">
      {/* 1. Page Background Gradient: Soft Ivory se White hote huye halke Champagne ki taraf */}
      
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="flex items-center justify-center gap-2 mb-6">
          <ShieldCheck className="text-success" size={24} />
          <span className="text-success font-semibold tracking-wider text-sm uppercase">Enterprise Grade Security</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6">
          AI Hospitality <span className="text-champagne">OS</span>
        </h1>
        <p className="text-lg md:text-xl text-ivory/80 mb-8 max-w-2xl mx-auto leading-relaxed">
          Your hotel and restaurant, operated by AI. Automate room bookings, smart table orders, and 24/7 customer service seamlessly.
        </p>
      </div>

      {/* Business Selection Cards */}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full">
        
        {/* Hotel Module Card */}
        <Link href="/demo/hotel" className="group bg-white/90 backdrop-blur-md rounded-3xl p-10 shadow-lg hover:shadow-2xl hover:shadow-royal/30 border border-white/60 hover:border-royal/30 transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden hover:-translate-y-2">
          <div className="absolute top-0 left-0 w-full h-1 bg-royal transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          <div className="w-20 h-20 bg-navy/5 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition duration-300">
            <Building2 size={36} className="text-royal" />
          </div>
          <h2 className="text-2xl font-bold text-navy mb-4">AI Hotel Receptionist</h2>
          <p className="text-charcoal/60 mb-8 text-sm leading-relaxed">
            Smart room bookings, banquet management (up to 50 rooms), and 24/7 room service automation.
          </p>
          <div className="mt-auto flex items-center text-royal font-semibold group-hover:text-navy transition-colors">
            Explore Hotel Module <ArrowRight size={18} className="ml-2 group-hover:translate-x-2 transition-transform" />
          </div>
        </Link>

        {/* Restaurant Module Card */}
        <Link href="/demo/restaurant" className="group bg-white/90 backdrop-blur-md rounded-3xl p-10 shadow-lg hover:shadow-2xl hover:shadow-champagne/40 border border-white/60 hover:border-champagne/40 transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden hover:-translate-y-2">
          <div className="absolute top-0 left-0 w-full h-1 bg-champagne transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          <div className="w-20 h-20 bg-champagne/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition duration-300">
            <Utensils size={36} className="text-champagne" />
          </div>
          <h2 className="text-2xl font-bold text-navy mb-4">AI Restaurant Engine</h2>
          <p className="text-charcoal/60 mb-8 text-sm leading-relaxed">
            QR-based table ordering, dynamic half/full plate variants, and seamless kitchen status tracking.
          </p>
          <div className="mt-auto flex items-center text-champagne font-semibold group-hover:text-navy transition-colors">
            Explore Restaurant Module <ArrowRight size={18} className="ml-2 group-hover:translate-x-2 transition-transform" />
          </div>
        </Link>

      </div>
    </div>
  );
}