
"use client"

import React, { useState, useEffect, useMemo } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ChallengeHighlight } from "@/components/dashboard/ChallengeHighlight";
import { CategoryCard } from "@/components/dashboard/CategoryCard";
import { BottomNav, type TabId } from "@/components/navigation/BottomNav";
import { FitnessScreen } from "@/components/fitness/FitnessScreen";
import { ChallengesScreen } from "@/components/challenges/ChallengesScreen";
import { TasksScreen } from "@/components/tasks/TasksScreen";
import { FinanceScreen } from "@/components/finance/FinanceScreen";
import { StudyScreen } from "@/components/study/StudyScreen";
import { HabitsScreen } from "@/components/habits/HabitsScreen";
import { AIScreen } from "@/components/ai/AIScreen";
import { AnalyticsScreen } from "@/components/analytics/AnalyticsScreen";
import { NotificationsScreen } from "@/components/notifications/NotificationsScreen";
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { initiateAnonymousSignIn } from "@/firebase/non-blocking-login";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { 
  Activity, 
  CheckCircle2, 
  GraduationCap, 
  Wallet2, 
  Zap, 
  Trophy, 
  Lock, 
  Search, 
  BarChart3, 
  Bot,
  ChevronRight,
  User,
  Settings,
  Wallet
} from "lucide-react";

const baseCategories = [
  {
    id: 'ai',
    title: "المساعد الذكي",
    description: "تواصل مع مساعدك الشخصي المدعوم بالذكاء الاصطناعي",
    icon: Bot,
    stat: "نشط"
  },
  {
    id: 'fitness',
    title: "اللياقة البدنية",
    description: "تتبع نشاطك البدني وصحتك اليومية",
    icon: Activity,
    stat: "نشط"
  },
  {
    id: 'tasks',
    title: "المهام اليومية",
    description: "قائمة المهام والأهداف المراد إنجازها",
    icon: CheckCircle2,
    stat: "جاري"
  },
  {
    id: 'study',
    title: "الخطة الدراسية",
    description: "جدولة المواد الدراسية وساعات المراجعة",
    icon: GraduationCap,
    stat: "مستمر"
  },
  {
    id: 'finance',
    title: "الإدارة المالية",
    description: "مراقبة المصاريف والمدخرات المالية",
    icon: Wallet2,
    stat: "مستقر"
  },
  {
    id: 'habits',
    title: "بناء العادات",
    description: "الالتزام بالعادات الصحية واليومية",
    icon: Zap,
    stat: "نشط"
  },
  {
    id: 'challenges',
    title: "مركز التحديات",
    description: "تحديات اجتماعية وفردية محفزة",
    icon: Trophy,
    stat: "نشط"
  }
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = React.useState<TabId>('home');
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTime, setCurrentTime] = useState<number>(5);
  
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && !user) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth]);

  useEffect(() => {
    if (user && db) {
      const userRef = doc(db, 'users', user.uid);
      setDoc(userRef, {
        id: user.uid,
        createdAt: serverTimestamp(),
        passcodeEnabled: false
      }, { merge: true });
    }
  }, [user, db]);

  useEffect(() => {
    setCurrentTime(new Date().getHours());
    const timer = setInterval(() => {
      setCurrentTime(new Date().getHours());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const sortedCategories = useMemo(() => {
    let sorted = [...baseCategories];
    
    if (currentTime >= 5 && currentTime < 12) {
      const itemsToMove = ['ai', 'fitness'];
      itemsToMove.reverse().forEach(id => {
        const idx = sorted.findIndex(c => c.id === id);
        if (idx > -1) {
          const item = sorted.splice(idx, 1)[0];
          sorted.unshift(item);
        }
      });
    } 
    else if (currentTime >= 12 && currentTime < 18) {
      const tasksIdx = sorted.findIndex(c => c.id === 'tasks');
      if (tasksIdx > -1) {
        const item = sorted.splice(tasksIdx, 1)[0];
        sorted.unshift(item);
      }
    }
    else {
      const itemsToMove = ['habits', 'study'];
      itemsToMove.reverse().forEach(id => {
        const idx = sorted.findIndex(c => c.id === id);
        if (idx > -1) {
          const item = sorted.splice(idx, 1)[0];
          sorted.unshift(item);
        }
      });
    }

    if (searchTerm) {
      return sorted.filter(c => 
        c.title.includes(searchTerm) || 
        c.description.includes(searchTerm)
      );
    }

    return sorted;
  }, [searchTerm, currentTime]);

  const handleBack = () => setActiveTab('home');

  const renderContent = () => {
    if (isUserLoading) return <div className="min-h-screen flex items-center justify-center">جاري التحميل...</div>;

    switch (activeTab) {
      case 'home':
        return (
          <div className="animate-in fade-in duration-500">
            <DashboardHeader 
              onSearch={setSearchTerm} 
              onNotifications={() => setActiveTab('notifications')} 
            />
            {!searchTerm && <ChallengeHighlight />}

            <div className="px-6 mt-8 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground/90 font-cairo">
                {searchTerm ? 'نتائج البحث' : 'الأقسام الرئيسية'}
              </h2>
              {!searchTerm && (
                <button className="text-[10px] font-bold text-primary/70 hover:text-primary transition-colors flex items-center gap-1">
                  تعديل الترتيب
                </button>
              )}
            </div>

            <div className="mt-4 px-6 space-y-4">
              {sortedCategories.length > 0 ? (
                sortedCategories.map((category, index) => (
                  <div key={category.id} onClick={() => setActiveTab(category.id as TabId)} className="animate-in fade-in slide-in-from-bottom-2 cursor-pointer" style={{ animationDelay: `${index * 50}ms` }}>
                    <CategoryCard
                      title={category.title}
                      description={category.description}
                      icon={category.icon}
                      stat={category.stat}
                    />
                  </div>
                ))
              ) : (
                <div className="py-20 text-center space-y-4">
                  <div className="h-20 w-20 rounded-full soft-purple-bg flex items-center justify-center mx-auto">
                    <Search className="h-10 w-10 text-primary/30" />
                  </div>
                  <p className="text-sm font-bold text-muted-foreground">عذراً، لم نجد ما تبحث عنه</p>
                </div>
              )}
            </div>

            {!searchTerm && (
              <div 
                onClick={() => setActiveTab('analytics')}
                className="mx-6 mt-8 p-5 rounded-[15px] primary-gradient text-white premium-shadow flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-[12px] bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">ملخص الأسبوع</h4>
                    <p className="text-[10px] text-white/70 font-medium">أداؤك تحسن بنسبة 15%</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-white/50" />
              </div>
            )}
          </div>
        );
      case 'fitness':
        return <FitnessScreen onBack={handleBack} />;
      case 'challenges':
        return <ChallengesScreen onBack={handleBack} />;
      case 'tasks':
        return <TasksScreen onBack={handleBack} />;
      case 'finance':
        return <FinanceScreen onBack={handleBack} />;
      case 'study':
        return <StudyScreen onBack={handleBack} />;
      case 'habits':
        return <HabitsScreen onBack={handleBack} />;
      case 'ai':
        return <AIScreen onBack={handleBack} />;
      case 'analytics':
        return <AnalyticsScreen onBack={handleBack} />;
      case 'notifications':
        return <NotificationsScreen onBack={handleBack} />;
      case 'profile':
        return (
          <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 animate-in fade-in duration-500">
            <div className="h-24 w-24 rounded-full primary-gradient flex items-center justify-center mb-6 shadow-2xl relative">
              <User className="h-12 w-12 text-white" />
              <div className="absolute -bottom-1 -right-1 h-8 w-8 bg-green-500 border-4 border-background rounded-full" />
            </div>
            <h3 className="text-2xl font-black text-foreground mb-2">حسابي</h3>
            <p className="text-muted-foreground font-bold mb-8">أهلاً بك يا بطل!</p>
            
            <div className="w-full space-y-4">
              <div 
                onClick={() => setActiveTab('finance')}
                className="bg-white p-5 rounded-[15px] premium-shadow border border-border/40 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-[10px] bg-primary/5 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-bold">المصاريف والمالية</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
              </div>

              <div 
                onClick={() => setActiveTab('notifications')}
                className="bg-white p-5 rounded-[15px] premium-shadow border border-border/40 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-[10px] bg-primary/5 flex items-center justify-center">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-bold">الإشعارات</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
              </div>

              <div className="bg-white p-5 rounded-[15px] premium-shadow border border-border/40 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-[10px] bg-primary/5 flex items-center justify-center">
                    <Lock className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-bold">إعدادات الحساب</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
              </div>
              
              <div className="bg-white p-5 rounded-[15px] premium-shadow border border-border/40 flex flex-col items-center justify-center gap-2 border-dashed">
                <p className="text-xs font-bold text-muted-foreground">هذا القسم قيد التطوير</p>
                <button onClick={handleBack} className="text-primary font-bold text-sm">العودة للرئيسية</button>
              </div>
            </div>
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
