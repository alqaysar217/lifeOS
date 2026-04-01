"use client"

import { Trophy, ArrowLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function ChallengeHighlight() {
  return (
    <div className="px-5 my-2">
      <div className="primary-gradient rounded-[10px] p-6 text-white premium-shadow relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-16 -translate-y-16 blur-2xl" />
        
        <div className="relative flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-[10px] bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">التحدي النشط</p>
              <h3 className="text-lg font-bold">تحدي الـ 100 يوم</h3>
            </div>
          </div>
          <button className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
            <ArrowLeft className="h-4 w-4 text-white" />
          </button>
        </div>

        <div className="space-y-3 relative">
          <div className="flex justify-between items-end">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">12</span>
              <span className="text-xs text-white/70">/ 100 يوم</span>
            </div>
            <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-[6px]">12% تم الإنجاز</span>
          </div>
          <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(255,255,255,0.4)]" 
              style={{ width: '12%' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
