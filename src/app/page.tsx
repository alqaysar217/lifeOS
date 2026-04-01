"use client"

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ChallengeHighlight } from "@/components/dashboard/ChallengeHighlight";
import { CategoryCard } from "@/components/dashboard/CategoryCard";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Activity, CheckCircle2, GraduationCap, Wallet2, Zap, Trophy, Lock } from "lucide-react";

const categories = [
  {
    title: "اللياقة البدنية",
    description: "تتبع نشاطك البدني وصحتك اليومية",
    icon: Activity,
    colorClass: "bg-blue-50",
    iconColor: "text-blue-500",
    stat: "3 تمارين"
  },
  {
    title: "المهام اليومية",
    description: "قائمة المهام والأهداف المراد إنجازها",
    icon: CheckCircle2,
    colorClass: "bg-purple-50",
    iconColor: "text-purple-500",
    stat: "5 مهام"
  },
  {
    title: "الخطة الدراسية",
    description: "جدولة المواد الدراسية وساعات المراجعة",
    icon: GraduationCap,
    colorClass: "bg-orange-50",
    iconColor: "text-orange-500",
    stat: "ساعتان"
  },
  {
    title: "الإدارة المالية",
    description: "مراقبة المصاريف والمدخرات المالية",
    icon: Wallet2,
    colorClass: "bg-emerald-50",
    iconColor: "text-emerald-500",
    stat: "مستقر"
  },
  {
    title: "بناء العادات",
    description: "الالتزام بالعادات الصحية واليومية",
    icon: Zap,
    colorClass: "bg-rose-50",
    iconColor: "text-rose-500",
    stat: "80% التزام"
  },
  {
    title: "مركز التحديات",
    description: "تحديات اجتماعية وفردية محفزة",
    icon: Trophy,
    colorClass: "bg-amber-50",
    iconColor: "text-amber-600",
    stat: "2 نشط"
  }
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-background pb-32">
      <DashboardHeader />
      <ChallengeHighlight />

      <div className="px-5 mt-8 flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">الأقسام الرئيسية</h2>
        <button className="text-xs font-semibold text-primary">تعديل الترتيب</button>
      </div>

      <div className="mt-4 px-5 space-y-3">
        {categories.map((category, index) => (
          <CategoryCard
            key={index}
            {...category}
          />
        ))}
      </div>

      {/* Security Section */}
      <div className="mx-5 mt-8 p-5 rounded-[10px] bg-white premium-shadow border border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-[8px] bg-slate-50 flex items-center justify-center">
            <Lock className="h-5 w-5 text-slate-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">قفل التطبيق</h4>
            <p className="text-[10px] text-muted-foreground font-medium">حماية بياناتك بكلمة سر</p>
          </div>
        </div>
        <div className="px-2 py-1 rounded-[6px] bg-slate-100 border border-slate-200">
          <p className="text-[9px] font-bold text-slate-400">قريباً</p>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
