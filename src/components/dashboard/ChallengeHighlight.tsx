"use client"

import { Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function ChallengeHighlight() {
  return (
    <div className="mx-4 mt-6">
      <div className="gamified-gradient relative overflow-hidden rounded-[2rem] p-6 shadow-2xl">
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-6 -bottom-6 h-32 w-32 rounded-full bg-accent/20 blur-2xl" />
        
        <div className="relative flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white/80">تحدي مستمر</p>
            <h3 className="text-2xl font-bold text-white">تحدي 100 يوم</h3>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
            <Trophy className="h-6 w-6 text-white" />
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <div className="flex justify-between text-sm font-bold text-white">
            <span>التقدم</span>
            <span>اليوم 12 من 100</span>
          </div>
          <Progress value={12} className="h-3 bg-white/20" />
        </div>
        
        <div className="mt-4 flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          <p className="text-xs font-medium text-white/90">أنت في المسار الصحيح! استمر.</p>
        </div>
      </div>
    </div>
  );
}