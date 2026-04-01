"use client"

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ChallengeHighlight } from "@/components/dashboard/ChallengeHighlight";
import { CategoryCard } from "@/components/dashboard/CategoryCard";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Dumbbell, CheckSquare, BookOpen, Wallet, Repeat, Trophy } from "lucide-react";

const categories = [
  {
    title: "اللياقة",
    description: "تتبع تمارينك الرياضية وأهدافك البدنية",
    icon: Dumbbell,
    colorClass: "bg-blue-500/10",
    iconColor: "text-blue-400"
  },
  {
    title: "المهام",
    description: "نظم يومك وأنجز مهامك بكفاءة",
    icon: CheckSquare,
    colorClass: "bg-purple-500/10",
    iconColor: "text-purple-400"
  },
  {
    title: "الدراسة",
    description: "جدول دراسي وخطط للنجاح المستمر",
    icon: BookOpen,
    colorClass: "bg-orange-500/10",
    iconColor: "text-orange-400"
  },
  {
    title: "المصاريف",
    description: "إدارة ذكية لميزانيتك ومصاريفك",
    icon: Wallet,
    colorClass: "bg-green-500/10",
    iconColor: "text-green-400"
  },
  {
    title: "العادات",
    description: "ابنِ عادات جديدة وغير حياتك",
    icon: Repeat,
    colorClass: "bg-pink-500/10",
    iconColor: "text-pink-400"
  },
  {
    title: "التحديات",
    description: "تحديات حماسية لرفع مستوى أدائك",
    icon: Trophy,
    colorClass: "bg-yellow-500/10",
    iconColor: "text-yellow-400"
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
      <div className="mt-8 px-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">الأقسام الرئيسية</h2>
        <button className="text-sm font-semibold text-primary hover:underline">عرض الكل</button>
      </div>

      {/* Categories Grid */}
      <div className="mt-4 grid grid-cols-2 gap-4 px-4">
        {categories.map((category, index) => (
          <CategoryCard
            key={index}
            title={category.title}
            description={category.description}
            icon={category.icon}
            colorClass={category.colorClass}
            iconColor={category.iconColor}
          />
        ))}
      </div>

      {/* Passcode Lock Placeholder Hint (as requested for setting later) */}
      <div className="mx-4 mt-8 glass-card rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">قفل التطبيق</h4>
            <p className="text-xs text-muted-foreground">قم بتأمين بياناتك برمز سري</p>
          </div>
        </div>
        <button className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg">قريباً</button>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </main>
  );
}