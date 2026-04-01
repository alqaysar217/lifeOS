
"use client"

import { Trophy, Star, Target, Flame, ChevronLeft, Crown } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const otherChallenges = [
  { title: "زيادة الوزن الصحي", type: "تغذية", progress: 65, icon: Target },
  { title: "خسارة الوزن", type: "لياقة", progress: 30, icon: Flame },
  { title: "الالتزام اليومي", type: "عادات", progress: 85, icon: Star },
];

export function ChallengesScreen() {
  return (
    <div className="px-6 pt-10 pb-32 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-extrabold text-foreground font-cairo">التحديات</h2>
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-[10px] premium-shadow border border-border/40">
          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          <span className="text-xs font-bold">1250 نقطة</span>
        </div>
      </div>

      {/* XP / Level Section */}
      <div className="bg-white p-5 rounded-[10px] premium-shadow border border-border/40 flex items-center gap-5">
        <div className="h-16 w-16 rounded-[12px] primary-gradient flex items-center justify-center shadow-lg shadow-primary/20 relative">
          <span className="text-2xl font-black text-white">4</span>
          <div className="absolute -bottom-2 bg-yellow-400 text-[8px] font-black text-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Level</div>
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex justify-between items-end">
            <p className="text-xs font-bold text-foreground">الرتبة: محارب نشط</p>
            <p className="text-[10px] font-bold text-muted-foreground">750 / 1000 XP</p>
          </div>
          <Progress value={75} className="h-2 bg-secondary" />
        </div>
      </div>

      {/* Active Challenge Hero Card */}
      <div className="primary-gradient rounded-[10px] p-6 text-white premium-shadow relative overflow-hidden shadow-[0_20px_40px_-15px_rgba(139,92,246,0.4)]">
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-[10px] bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-white/70 uppercase">التحدي النشط</p>
              <h3 className="text-lg font-bold">تحدي الـ 100 يوم جري</h3>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">12</span>
                <span className="text-xs text-white/70">/ 100 يوم</span>
              </div>
              <span className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded-[6px]">باقي 88 يوم</span>
            </div>
            <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.6)]" style={{ width: '12%' }} />
            </div>
          </div>
        </div>
        {/* Glow effect */}
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-pink-400/30 blur-[60px] rounded-full" />
        <div className="absolute top-0 right-0 p-4">
          <Crown className="h-6 w-6 text-white/20" />
        </div>
      </div>

      {/* Challenges List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-foreground/90">تحديات أخرى</h3>
        <div className="space-y-3">
          {otherChallenges.map((ch, i) => (
            <div key={i} className="bg-white p-4 rounded-[10px] premium-shadow border border-border/40 space-y-3 active:scale-[0.98] transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-[8px] soft-purple-bg flex items-center justify-center">
                    <ch.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{ch.title}</h4>
                    <p className="text-[10px] text-muted-foreground font-medium">{ch.type}</p>
                  </div>
                </div>
                <div className="h-8 w-8 rounded-[8px] bg-slate-50 flex items-center justify-center">
                  <ChevronLeft className="h-4 w-4 text-slate-300" />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[9px] font-bold text-muted-foreground">
                  <span>التقدم</span>
                  <span>{ch.progress}%</span>
                </div>
                <Progress value={ch.progress} className="h-1.5 bg-secondary" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
