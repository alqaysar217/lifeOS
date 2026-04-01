"use client"

import { Trophy, ChevronLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function ChallengeHighlight() {
  return (
    <div className="mx-6 mt-6">
      <div className="soft-gradient relative overflow-hidden rounded-[2.5rem] p-7 shadow-xl shadow-primary/10">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-white/80 uppercase tracking-wider">تحدي نشط</p>
              <h3 className="text-xl font-bold text-white">تحدي الـ 100 يوم</h3>
            </div>
          </div>
          <ChevronLeft className="h-5 w-5 text-white/70" />
        </div>

        <div className="mt-8 space-y-3">
          <div className="flex justify-between text-sm font-bold text-white">
            <span className="opacity-90 font-medium">مستوى التقدم</span>
            <span>12% مكتمل</span>
          </div>
          <div className="relative">
            <Progress value={12} className="h-2.5 bg-white/20" />
          </div>
          <div className="flex justify-between items-center pt-1">
             <p className="text-xs font-medium text-white/90">اليوم 12 من 100</p>
             <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                <p className="text-[10px] font-bold text-white">ممتاز!</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}