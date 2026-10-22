"use client";
import React from "react";
import { MessageSquare, LayoutDashboard, Building2, Utensils, Zap } from "lucide-react";
import Link from "next/link";

export default function FloatingDock() {
  return (
    <div id="floating-dock" className="fixed bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-[96%] sm:w-max max-w-4xl">
      <div className="bg-white/90 backdrop-blur-md shadow-lg border border-gray-200 rounded-full px-3 sm:px-6 py-2.5 flex items-center justify-between sm:justify-center gap-1 sm:gap-6">
        
        <Link href="/ai-receptionist" className="flex flex-col items-center group text-navy hover:text-royal transition shrink-0 px-1">
          <MessageSquare size={18} className="mb-1 sm:w-5 sm:h-5" />
          <span className="text-[9px] sm:text-xs font-bold tracking-wide">AI Desk</span>
        </Link>
        
        <div className="w-px h-6 sm:h-8 bg-gray-300 shrink-0"></div>

        <Link href="/dashboard" className="flex flex-col items-center group text-gray-500 hover:text-navy transition shrink-0 px-1">
          <LayoutDashboard size={18} className="mb-1 sm:w-5 sm:h-5" />
          <span className="text-[9px] sm:text-xs font-bold">Dashboard</span>
        </Link>

        <Link href="/demo/hotel" className="flex flex-col items-center group text-gray-500 hover:text-navy transition shrink-0 px-1">
          <Building2 size={18} className="mb-1 sm:w-5 sm:h-5" />
          <span className="text-[9px] sm:text-xs font-bold">Hotel</span>
        </Link>

        <Link href="/demo/restaurant" className="flex flex-col items-center group text-gray-500 hover:text-navy transition shrink-0 px-1">
          <Utensils size={18} className="mb-1 sm:w-5 sm:h-5" />
          <span className="text-[9px] sm:text-xs font-bold">Dining</span>
        </Link>

        <div className="w-px h-6 sm:h-8 bg-gray-300 shrink-0"></div>

        <Link href="/live-demo" className="flex items-center justify-center gap-1 bg-navy text-champagne px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full hover:bg-charcoal transition shadow-sm shrink-0">
          <Zap size={14} className="sm:w-4 sm:h-4" />
          <span className="text-[10px] sm:text-xs font-bold">Live Demo</span>
        </Link>

      </div>
    </div>
  );
}