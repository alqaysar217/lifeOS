"use client"

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ChallengeHighlight } from "@/components/dashboard/ChallengeHighlight";
import { CategoryCard } from "@/components/dashboard/CategoryCard";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Dumbbell, CheckSquare, BookOpen, Wallet, Repeat, Trophy, ShieldCheck } from "lucide-react";

const categories = [
  {
    title: "اللياقة البدنية",
    description: "تتبع تمارينك وأهدافك الصحية بدقة",
    icon: Dumbbell,
    colorClass: "bg-blue-100/50",
    iconColor: "text-blue-500",
    stat: "3 تمارين"
  },
  {
    title: "المهام اليومية",
    description: "نظم يومك وأنجز أهدافك بكفاءة عالية",
    icon: CheckSquare,
    colorClass: "bg-purple-100/50",
    iconColor: "text-purple-500",
    stat: "5 مهام"
  },
  {
    title: "الخطة الدراسية",
    description: "جدولك الدراسي ومسار النجاح الأكاديمي",
    icon: BookOpen,
    colorClass: "bg-orange-100/50",
    iconColor: "text-orange-500",
    stat: "ساعتان"
  },
  {
    title: "الإدارة المالية",
    description: "تحكم ذكي في ميزانيتك ومصاريفك المالية",
    icon: Wallet,
    colorClass: "bg-emerald-100/50",
    iconColor: "text-emerald-500",
    stat: "مستقر"
  },
  {
    title: "بناء العادات",
    description: "اصنع عادات تدوم وتغير مسار حياتك",
    icon: Repeat,
    colorClass: "bg-rose-100/50",
    iconColor: "text-rose-500",
    stat: "80% التزام"
  },
  {
    title: "مركز التحديات",
    description: "تحديات حماسية لرفع كفاءة أدائك اليومي",
    icon: Trophy,
    colorClass: "bg-amber-100/50",
    iconColor: "text-amber-600",
    stat: "2 نشط"
  }
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-background pb-40">
      {/* Header Section */}
      <DashboardHeader />

      {/* Main Challenge Progress */}
      <ChallengeHighlight />

      {/* Section Divider */}
      <div className="mt-12 px-8 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-black text-foreground">الأقسام الرئيسية</h2>
          <div className="h-1 w-10 bg-primary/20 rounded-full mt-1" />
        </div>
        <button className="text-sm font-black text-primary hover:opacity-70 transition-opacity">تخصيص</button>
      </div>

      {/* Categories List */}
      <div className="mt-8 space-y-6 px-6">
        {categories.map((category, index) => (
          <CategoryCard
            key={index}
            title={category.title}
            description={category.description}
            icon={category.icon}
            colorClass={category.colorClass}
            iconColor={category.iconColor}
            stat={category.stat}
          />
        ))}
      </div>

      {/* App Lock Section */}
      <div className="mx-6 mt-12 p-8 rounded-[3rem] soft-neumorphic flex items-center justify-between border-t border-white/50">
        <div className="flex items-center gap-5">
          <div className="h-14 w-14 rounded-[1.5rem] soft-neumorphic-inset flex items-center justify-center">
            <ShieldCheck className="h-7 w-7 text-primary/80" />
          </div>
          <div>
            <h4 className="text-lg font-black text-foreground/90">قفل التطبيق</h4>
            <p className="text-xs text-muted-foreground font-bold">خصوصيتك تحت حماية ذكية</p>
          </div>
        </div>
        <div className="h-10 px-5 flex items-center justify-center rounded-2xl bg-secondary/50 border border-primary/5">
          <p className="text-[11px] font-black text-primary/60">قريباً</p>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </main>
  );
}