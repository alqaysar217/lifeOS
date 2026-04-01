"use client"

import { GraduationCap, BookOpen, Clock, Calendar, AlertCircle, ChevronLeft, PlayCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const subjects = [
  { title: "قواعد البيانات", progress: 85, color: "bg-blue-500", lessons: "12/15" },
  { title: "نظم التشغيل", progress: 45, color: "bg-purple-500", lessons: "5/12" },
];

export function StudyScreen() {
  return (
    <div className="px-6 pt-10 pb-32 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-extrabold text-foreground font-cairo">الدراسة</h2>
        <div className="h-10 w-10 rounded-[10px] bg-white border border-border/40 premium-shadow flex items-center justify-center text-primary">
          <GraduationCap className="h-5 w-5" />
        </div>
      </div>

      {/* جلسة اليوم الرئيسية */}
      <div className="primary-gradient rounded-[10px] p-6 text-white premium-shadow relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-4">
            <div>
              <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider">جلسة اليوم المقترحة</p>
              <h3 className="text-xl font-bold">مراجعة خوارزميات البحث</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-white/70" />
                <span className="text-xs font-bold">ساعتان</span>
              </div>
              <button className="bg-white text-primary px-4 py-1.5 rounded-[8px] font-bold text-xs flex items-center gap-2 shadow-xl active:scale-95 transition-transform">
                <PlayCircle className="h-3.5 w-3.5" />
                ابدأ الآن
              </button>
            </div>
          </div>
          <div className="h-20 w-20 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
            <BookOpen className="h-10 w-10 text-white/80" />
          </div>
        </div>
      </div>

      {/* تنبيه الاختبارات */}
      <div className="bg-orange-50 p-5 rounded-[10px] border border-orange-100 flex items-center gap-4">
        <div className="h-12 w-12 rounded-[10px] bg-orange-100 flex items-center justify-center shrink-0">
          <AlertCircle className="h-6 w-6 text-orange-600" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-orange-900">اختبار قادم!</h4>
          <p className="text-[11px] text-orange-700 font-medium">لديك اختبار "قواعد بيانات" بعد <span className="font-black">3 أيام</span></p>
        </div>
        <Calendar className="h-5 w-5 text-orange-300" />
      </div>

      {/* قائمة المواد */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground/90">المواد الدراسية</h3>
          <button className="text-xs text-primary font-bold">إضافة مادة</button>
        </div>
        <div className="space-y-4">
          {subjects.map((sub, i) => (
            <div key={i} className="bg-white p-5 rounded-[10px] premium-shadow border border-border/40 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-[10px] ${sub.color}/10 flex items-center justify-center`}>
                    <BookOpen className={`h-5 w-5 ${sub.color.replace('bg-', 'text-')}`} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{sub.title}</h4>
                    <p className="text-[10px] text-muted-foreground font-bold">{sub.lessons} درس</p>
                  </div>
                </div>
                <ChevronLeft className="h-4 w-4 text-slate-300" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-bold text-muted-foreground">
                  <span>التقدم في المادة</span>
                  <span>{sub.progress}%</span>
                </div>
                <Progress value={sub.progress} className={`h-1.5 ${sub.color.replace('bg-', 'bg-opacity-20 ')}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
