"use client"

import { Trophy, ChevronLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function ChallengeHighlight() {
  return (
    <div className="mx-6 mt-4">
      <div className="premium-gradient glow-effect relative overflow-hidden rounded-[3rem] p-8 shadow-2xl shadow-primary/25 transition-transform duration-500 hover:scale-[1.02]">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/20 blur-3xl animate-pulse" />
        <div className="absolute -left-12 -bottom-12 h-48 w-48 rounded-full bg-blue-400/20 blur-3xl" />
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/25 backdrop-blur-xl border border-white/40 shadow-inner">
              <Trophy className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-white/80 uppercase tracking-[0.2em]">تحدي جاري</p>
              <h3 className="text-2xl font-black text-white">تحدي الـ 100 يوم</h3>
            </div>
          </div>
          <div className="h-10 w-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
            <ChevronLeft className="h-5 w-5 text-white" />
          </div>
        </div>

        <div className="mt-10 space-y-4">
          <div className="flex justify-between text-sm font-black text-white">
            <span className="opacity-90">الإنجاز الحالي</span>
            <span>12%</span>
          </div>
          <div className="relative h-3 w-full bg-white/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
            <div 
              className="absolute top-0 right-0 h-full bg-white rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(255,255,255,0.6)]" 
              style={{ width: '12%' }}
            />
          </div>
          <div className="flex justify-between items-center pt-2">
             <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-white">12</span>
                <span className="text-xs font-bold text-white/70">/ 100 يوم</span>
             </div>
             <div className="px-4 py-1.5 bg-white/25 backdrop-blur-md rounded-2xl border border-white/30 shadow-sm">
                <p className="text-[11px] font-black text-white tracking-wide">أداء متميز!</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}