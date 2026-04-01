"use client"

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ChallengeHighlight } from "@/components/dashboard/ChallengeHighlight";
import { CategoryCard } from "@/components/dashboard/CategoryCard";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Dumbbell, CheckSquare, BookOpen, Wallet, Repeat, Trophy, ShieldCheck } from "lucide-react";

const categories = [
  {
    title: "اللياقة البدنية",
    description: "تتبع تمارينك وأهدافك الصحية",
    icon: Dumbbell,
    colorClass: "bg-blue-50",
    iconColor: "text-blue-500",
    stat: "3 تمارين"
  },
  {
    title: "المهام اليومية",
    description: "نظم يومك وأنجز أهدافك بكفاءة",
    icon: CheckSquare,
    colorClass: "bg-purple-50",
    iconColor: "text-purple-500",
    stat: "5 مهام"
  },
  {
    title: "الخطة الدراسية",
    description: "جدولك الدراسي ومسار النجاح",
    icon: BookOpen,
    colorClass: "bg-orange-50",
    iconColor: "text-orange-500",
    stat: "ساعتان"
  },
  {
    title: "الإدارة المالية",
    description: "تحكم ذكي في ميزانيتك ومصاريفك",
    icon: Wallet,
    colorClass: "bg-green-50",
    iconColor: "text-green-500",
    stat: "مستقر"
  },
  {
    title: "بناء العادات",
    description: "اصنع عادات تدوم وتغير حياتك",
    icon: Repeat,
    colorClass: "bg-pink-50",
    iconColor: "text-pink-500",
    stat: "80% التزام"
  },
  {
    title: "مركز التحديات",
    description: "تحديات حماسية لرفع كفاءة أدائك",
    icon: Trophy,
    colorClass: "bg-yellow-50",
    iconColor: "text-yellow-600",
    stat: "2 نشط"
  }
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-background pb-32">
      {/* Header Section */}
      <DashboardHeader />

      {/* Main Challenge Progress */}
      <ChallengeHighlight />

      {/* Section Divider */}
      <div className="mt-10 px-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">الأقسام الرئيسية</h2>
        <button className="text-sm font-bold text-primary hover:underline">المزيد</button>
      </div>

      {/* Categories List (Full Width Cards) */}
      <div className="mt-5 space-y-4 px-6">
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
      <div className="mx-6 mt-10 p-6 rounded-[2.5rem] bg-white premium-shadow border-none flex items-center justify-between border border-primary/5">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h4 className="text-base font-bold text-foreground">قفل التطبيق</h4>
            <p className="text-xs text-muted-foreground font-medium">بياناتك محمية بخصوصية عالية</p>
          </div>
        </div>
        <button className="text-xs font-bold text-primary bg-primary/10 px-4 py-2 rounded-xl">قريباً</button>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </main>
  );
}