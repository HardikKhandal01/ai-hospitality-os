"use client";
import React from "react";
import { MessageSquare, LayoutDashboard, Building2, Utensils, Zap } from "lucide-react";
import Link from "next/link";

export default function FloatingDock() {
  return (
    <div id="floating-dock" className="fixed bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-full px-2 sm:px-0 max-w-fit">
      <div className="bg-white/80 backdrop-blur-md shadow-lg border border-gray-200 rounded-full px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between sm:justify-center gap-1.5 sm:gap-6 overflow-x-auto no-scrollbar">
        
        <Link href="/ai-receptionist" className="flex flex-col items-center group text-navy hover:text-royal transition min-w-fit px-1">
          <MessageSquare size={18} className="mb-1 sm:w-5 sm:h-5" />
          <span className="text-[9px] sm:text-[10px] font-semibold tracking-wide text-center">AI Receptionist</span>
        </Link>
        
        <div className="w-px h-6 sm:h-8 bg-gray-300 shrink-0"></div>

        <Link href="/dashboard" className="flex flex-col items-center group text-gray-500 hover:text-navy transition min-w-fit px-1">
          <LayoutDashboard size={18} className="mb-1 sm:w-5 sm:h-5" />
          <span className="text-[9px] sm:text-[10px] font-semibold">Dashboard</span>
        </Link>

        <Link href="/demo/hotel" className="flex flex-col items-center group text-gray-500 hover:text-navy transition min-w-fit px-1">
          <Building2 size={18} className="mb-1 sm:w-5 sm:h-5" />
          <span className="text-[9px] sm:text-[10px] font-semibold">Hotel Demo</span>
        </Link>

        <Link href="/demo/restaurant" className="flex flex-col items-center group text-gray-500 hover:text-navy transition min-w-fit px-1">
          <Utensils size={18} className="mb-1 sm:w-5 sm:h-5" />
          <span className="text-[9px] sm:text-[10px] font-semibold">Restaurant Demo</span>
        </Link>

        <div className="w-px h-6 sm:h-8 bg-gray-300 shrink-0"></div>

        <Link href="/live-demo" className="flex items-center justify-center gap-1 bg-navy text-champagne px-3 sm:px-4 py-1.5 sm:py-2 rounded-full hover:bg-charcoal transition shadow-sm shrink-0">
          <Zap size={14} className="sm:w-4 sm:h-4" />
          <span className="text-[10px] sm:text-xs font-bold">Live Demo</span>
        </Link>

      </div>
    </div>
  );
}