
"use client"

import { Zap, Flame, CheckCircle2, MoreVertical, Sparkles, TrendingUp, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const habits = [
  { id: 1, title: "شرب 2 لتر ماء", streak: 12, completed: true },
  { id: 2, title: "قراءة 10 صفحات", streak: 5, completed: false },
  { id: 3, title: "ممارسة الرياضة", streak: 8, completed: true },
];

interface HabitsScreenProps {
  onBack: () => void;
}

export function HabitsScreen({ onBack }: HabitsScreenProps) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/5 px-6 pt-10 pb-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10 rounded-[10px] bg-white border border-border/40 premium-shadow">
              <ChevronRight className="h-5 w-5 text-foreground" />
            </Button>
            <h2 className="text-2xl font-extrabold text-foreground font-cairo">العادات</h2>
          </div>
          <div className="h-10 w-10 rounded-[10px] bg-white border border-border/40 premium-shadow flex items-center justify-center text-primary">
            <Zap className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-8">
        {/* ملخص الإنجاز */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-[10px] premium-shadow border border-border/40 flex flex-col items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <p className="text-2xl font-black text-foreground">12</p>
            <p className="text-[10px] font-bold text-muted-foreground">أطول سلسلة</p>
          </div>
          <div className="bg-white p-5 rounded-[10px] premium-shadow border border-border/40 flex flex-col items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-black text-foreground">85%</p>
            <p className="text-[10px] font-bold text-muted-foreground">معدل الالتزام</p>
          </div>
        </div>

        {/* ذكاء اصطناعي (Smart Insight) */}
        <div className="primary-gradient p-5 rounded-[10px] text-white premium-shadow relative overflow-hidden">
          <div className="relative z-10 flex gap-4 items-start">
            <Sparkles className="h-5 w-5 text-yellow-300 shrink-0" />
            <p className="text-xs font-bold leading-relaxed">
              ملاحظة ذكية: لقد لاحظنا أنك غالباً ما تترك عادة <span className="underline decoration-yellow-300">قراءة الكتب</span> يوم الجمعة، حاول البدء بها مبكراً في ذلك اليوم.
            </p>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-12 translate-x-12 blur-xl" />
        </div>

        {/* قائمة العادات */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-foreground/90 font-cairo">عاداتي اليومية</h3>
          <div className="space-y-3">
            {habits.map((habit) => (
              <div key={habit.id} className="bg-white p-5 rounded-[10px] premium-shadow border border-border/40 flex items-center justify-between group active:scale-[0.99] transition-all">
                <div className="flex items-center gap-4">
                  <button className={`h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all ${
                    habit.completed ? 'bg-primary border-primary text-white' : 'border-slate-200 text-transparent hover:border-primary/50'
                  }`}>
                    <CheckCircle2 className="h-5 w-5" />
                  </button>
                  <div>
                    <h4 className={`text-sm font-bold ${habit.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                      {habit.title}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Flame className="h-3 w-3 text-orange-500" />
                      <span className="text-[10px] text-muted-foreground font-bold">{habit.streak} أيام متواصلة</span>
                    </div>
                  </div>
                </div>
                <MoreVertical className="h-4 w-4 text-slate-300" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
