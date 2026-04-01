
"use client"

import React from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ChallengeHighlight } from "@/components/dashboard/ChallengeHighlight";
import { CategoryCard } from "@/components/dashboard/CategoryCard";
import { BottomNav, type TabId } from "@/components/navigation/BottomNav";
import { FitnessScreen } from "@/components/fitness/FitnessScreen";
import { ChallengesScreen } from "@/components/challenges/ChallengesScreen";
import { TasksScreen } from "@/components/tasks/TasksScreen";
import { Activity, CheckCircle2, GraduationCap, Wallet2, Zap, Trophy, Lock } from "lucide-react";

const categories = [
  {
    title: "اللياقة البدنية",
    description: "تتبع نشاطك البدني وصحتك اليومية",
    icon: Activity,
    stat: "3 تمارين"
  },
  {
    title: "المهام اليومية",
    description: "قائمة المهام والأهداف المراد إنجازها",
    icon: CheckCircle2,
    stat: "5 مهام"
  },
  {
    title: "الخطة الدراسية",
    description: "جدولة المواد الدراسية وساعات المراجعة",
    icon: GraduationCap,
    stat: "ساعتان"
  },
  {
    title: "الإدارة المالية",
    description: "مراقبة المصاريف والمدخرات المالية",
    icon: Wallet2,
    stat: "مستقر"
  },
  {
    title: "بناء العادات",
    description: "الالتزام بالعادات الصحية واليومية",
    icon: Zap,
    stat: "80% التزام"
  },
  {
    title: "مركز التحديات",
    description: "تحديات اجتماعية وفردية محفزة",
    icon: Trophy,
    stat: "2 نشط"
  }
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = React.useState<TabId>('home');

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="animate-in fade-in duration-500">
            <DashboardHeader />
            <ChallengeHighlight />

            <div className="px-6 mt-8 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground/90">الأقسام الرئيسية</h2>
              <button className="text-xs font-semibold text-primary/70 hover:text-primary transition-colors">تعديل الترتيب</button>
            </div>

            <div className="mt-4 px-6 space-y-4">
              {categories.map((category, index) => (
                <CategoryCard
                  key={index}
                  {...category}
                />
              ))}
            </div>

            {/* Security Section */}
            <div className="mx-6 mt-8 p-5 rounded-[10px] bg-white premium-shadow border border-border/40 flex items-center justify-between transition-all active:scale-[0.98]">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-[10px] soft-purple-bg flex items-center justify-center">
                  <Lock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">قفل التطبيق</h4>
                  <p className="text-[10px] text-muted-foreground font-medium">حماية بياناتك بكلمة سر</p>
                </div>
              </div>
              <div className="px-3 py-1 rounded-[6px] bg-slate-50 border border-slate-100">
                <p className="text-[9px] font-bold text-slate-400">قريباً</p>
              </div>
            </div>
          </div>
        );
      case 'fitness':
        return <FitnessScreen />;
      case 'challenges':
        return <ChallengesScreen />;
      case 'tasks':
        return <TasksScreen />;
      case 'profile':
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-muted-foreground animate-in fade-in duration-500">
            <div className="h-20 w-20 rounded-full primary-gradient flex items-center justify-center mb-4 shadow-xl">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <p className="font-bold">حسابي قيد التطوير</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-background pb-32">
      {renderContent()}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </main>
  );
}
