"use client";
import React from "react";
import { MessageSquare, LayoutDashboard, Building2, Utensils, Zap } from "lucide-react";
import Link from "next/link";

export default function FloatingDock() {
  return (
    <div id="floating-dock" className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white/80 backdrop-blur-md shadow-lg border border-gray-200 rounded-full px-4 py-3 flex items-center gap-6">
        
        <Link href="/ai-receptionist" className="flex flex-col items-center group text-navy hover:text-royal transition">
          <MessageSquare size={20} className="mb-1" />
          <span className="text-[10px] font-semibold tracking-wide">AI Receptionist</span>
        </Link>
        
        <div className="w-px h-8 bg-gray-300"></div>

        <Link href="/dashboard" className="flex flex-col items-center group text-gray-500 hover:text-navy transition">
          <LayoutDashboard size={20} className="mb-1" />
          <span className="text-[10px] font-semibold">Dashboard</span>
        </Link>

        <Link href="/demo/hotel" className="flex flex-col items-center group text-gray-500 hover:text-navy transition">
          <Building2 size={20} className="mb-1" />
          <span className="text-[10px] font-semibold">Hotel Demo</span>
        </Link>

        <Link href="/demo/restaurant" className="flex flex-col items-center group text-gray-500 hover:text-navy transition">
          <Utensils size={20} className="mb-1" />
          <span className="text-[10px] font-semibold">Restaurant Demo</span>
        </Link>

        <div className="w-px h-8 bg-gray-300"></div>

        <Link href="/live-demo" className="flex items-center justify-center gap-1 bg-navy text-champagne px-4 py-2 rounded-full hover:bg-charcoal transition shadow-sm">
          <Zap size={16} />
          <span className="text-xs font-bold">Live Demo</span>
        </Link>

      </div>
    </div>
  );
}