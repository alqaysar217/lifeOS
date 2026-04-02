
"use client"

import React from "react";
import { TrendingUp, TrendingDown, Target, Zap, Activity, Calendar, ChevronRight, BarChart3, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface AnalyticsScreenProps {
  onBack: () => void;
}

export function AnalyticsScreen({ onBack }: AnalyticsScreenProps) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/5 px-6 pt-10 pb-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10 rounded-[10px] bg-white border border-border/40 premium-shadow">
              <ChevronRight className="h-5 w-5 text-foreground" />
            </Button>
            <h2 className="text-2xl font-extrabold text-foreground font-cairo">الإحصائيات</h2>
          </div>
          <div className="h-10 w-10 rounded-[10px] bg-white border border-border/40 premium-shadow flex items-center justify-center text-primary">
            <BarChart3 className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-8">
        {/* Performance Insight Header */}
        <div className="bg-white p-6 rounded-[15px] premium-shadow border border-border/40 space-y-4 relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground">أداء الأسبوع</p>
              <h3 className="text-lg font-black text-foreground">تحسن بنسبة 15%</h3>
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-medium leading-relaxed">
            لقد كنت أكثر نشاطاً في <span className="text-primary font-bold">اللياقة البدنية</span> هذا الأسبوع مقارنة بالأسبوع الماضي.
          </p>
          <div className="absolute top-0 left-0 w-24 h-24 bg-green-400/5 rounded-full blur-2xl" />
        </div>

        {/* Smart Charts Visualization (Mockup) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground/90 font-cairo">معدل الإنجاز اليومي</h3>
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground bg-slate-50 px-3 py-1 rounded-full">
              <Calendar className="h-3 w-3" />
              أخر 7 أيام
            </div>
          </div>
          
          <div className="h-40 bg-white p-4 rounded-[15px] premium-shadow border border-border/40 flex items-end justify-between gap-2">
            {[45, 70, 30, 85, 95, 60, 75].map((val, i) => (
              <div key={i} className="flex-1 space-y-2 group">
                <div className="relative w-full bg-secondary rounded-full overflow-hidden" style={{ height: `${val}%` }}>
                  <div className={`absolute inset-0 primary-gradient opacity-80 group-hover:opacity-100 transition-opacity`} />
                </div>
                <p className="text-[8px] font-bold text-center text-slate-400">
                  {['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'][i]}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Goal Tracking Indicators */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-[15px] premium-shadow border border-border/40 space-y-3">
            <div className="h-10 w-10 rounded-[10px] bg-blue-50 flex items-center justify-center">
              <Activity className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">اللياقة</h4>
              <p className="text-lg font-black text-foreground">8.5 <span className="text-[10px] text-muted-foreground">كم</span></p>
            </div>
            <div className="flex items-center gap-1 text-[9px] font-bold text-green-500">
              <TrendingUp className="h-3 w-3" />
              <span>+12%</span>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-[15px] premium-shadow border border-border/40 space-y-3">
            <div className="h-10 w-10 rounded-[10px] bg-purple-50 flex items-center justify-center">
              <Target className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">المهام</h4>
              <p className="text-lg font-black text-foreground">24 <span className="text-[10px] text-muted-foreground">مهمة</span></p>
            </div>
            <div className="flex items-center gap-1 text-[9px] font-bold text-red-400">
              <TrendingDown className="h-3 w-3" />
              <span>-5%</span>
            </div>
          </div>
        </div>

        {/* Detailed Stats List */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-foreground/90 font-cairo">تحليل العادات</h3>
          <div className="space-y-3">
            {[
              { label: "شرب الماء", val: 80, color: "bg-blue-500" },
              { label: "القراءة", val: 65, color: "bg-orange-500" },
              { label: "الرياضة", val: 90, color: "bg-green-500" }
            ].map((habit, i) => (
              <div key={i} className="bg-white p-4 rounded-[12px] premium-shadow border border-border/40 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-foreground">{habit.label}</span>
                  <span className="text-[10px] font-bold text-primary">{habit.val}% الالتزام</span>
                </div>
                <Progress value={habit.val} className="h-1.5" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
