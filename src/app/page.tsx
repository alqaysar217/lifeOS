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
import { setDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { initiateAnonymousSignIn } from "@/firebase/non-blocking-login";
import { doc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { 
  Activity, 
  CheckCircle2, 
  GraduationCap, 
  Wallet2, 
  Zap, 
  Trophy, 
  Search, 
  BarChart3, 
  Bot,
  ChevronRight,
  User,
  Wallet,
  Bell,
  Save,
  Pencil,
  Loader2,
  Smartphone
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
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const [onboardingName, setOnboardingName] = useState("");
  const [onboardingPhone, setOnboardingPhone] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => (db && user) ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile, isLoading: isProfileLoading } = useDoc(userDocRef);

  // تهيئة الوقت مرة واحدة فقط عند التركيب
  useEffect(() => {
    setCurrentTime(new Date().getHours());
  }, []);

  // تسجيل الدخول المجهول إذا لزم الأمر
  useEffect(() => {
    if (!isUserLoading && !user) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth]);

  // تحديث حالة الحقول عند تحميل البيانات
  useEffect(() => {
    if (profile) {
      setEditName(profile.name || "");
      setEditPhone(profile.phoneNumber || "");
    }
  }, [profile]);

  const sortedCategories = useMemo(() => {
    let sorted = [...baseCategories];
    const hour = currentTime ?? 12;
    
    if (hour >= 5 && hour < 12) {
      const itemsToMove = ['ai', 'fitness'];
      itemsToMove.reverse().forEach(id => {
        const idx = sorted.findIndex(c => c.id === id);
        if (idx > -1) {
          const item = sorted.splice(idx, 1)[0];
          sorted.unshift(item);
        }
      });
    } 
    else if (hour >= 12 && hour < 18) {
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

  const handleUpdateProfile = () => {
    if (user && db && editName.trim() && editPhone.trim()) {
      const userRef = doc(db, 'users', user.uid);
      updateDocumentNonBlocking(userRef, {
        name: editName.trim(),
        phoneNumber: editPhone.trim()
      });
      toast({ title: "تم التحديث", description: "تم حفظ بياناتك الشخصية بنجاح." });
    }
  };

  const handleStartOnboarding = async () => {
    if (onboardingName.trim() && onboardingPhone.trim() && user && db) {
      setIsLinking(true);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phoneNumber', '==', onboardingPhone.trim()));
      
      try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const existingData = querySnapshot.docs[0].data();
          const userRef = doc(db, 'users', user.uid);
          setDocumentNonBlocking(userRef, { 
            name: existingData.name, 
            phoneNumber: onboardingPhone.trim(),
            createdAt: serverTimestamp(),
            passcodeEnabled: false
          }, { merge: true });
        } else {
          const userRef = doc(db, 'users', user.uid);
          setDocumentNonBlocking(userRef, { 
            name: onboardingName, 
            phoneNumber: onboardingPhone.trim(),
            createdAt: serverTimestamp(),
            passcodeEnabled: false
          }, { merge: true });
        }
      } catch (error) {
        toast({ variant: "destructive", title: "خطأ", description: "حدث خطأ أثناء التسجيل." });
      } finally {
        setIsLinking(false);
      }
    }
  };

  // حالة التحميل الأولي المستقرة
  const effectivelyLoading = isUserLoading || (user && isProfileLoading && !profile);

  if (effectivelyLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 bg-background">
        <div className="relative h-16 w-16 mb-4">
           <Image src="/logo.png" alt="Logo" fill className="object-contain animate-pulse" priority />
        </div>
        <div className="h-1 w-32 bg-slate-100 rounded-full overflow-hidden">
           <div className="h-full bg-primary animate-progress-fast" />
        </div>
        <p className="text-[10px] font-bold text-muted-foreground">جاري تجهيز عالمك الخاص...</p>
      </div>
    );
  }

  // شاشة Onboarding
  if (user && !profile?.name) {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8 text-center">
          <div className="relative h-20 w-20 mx-auto">
            <Image src="/logo.png" alt="Logo" fill className="object-contain" priority />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-foreground font-cairo">أهلاً بك في حياتي</h1>
            <p className="text-xs text-muted-foreground font-bold">أدخل بياناتك لربط حسابك وضمان استمرارية إنجازاتك</p>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <Input 
                placeholder="الاسم الكريم..."
                value={onboardingName}
                onChange={(e) => setOnboardingName(e.target.value)}
                className="h-12 pr-10 text-right text-sm font-bold rounded-[12px] border-primary/10"
              />
              <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <div className="relative">
              <Input 
                type="tel"
                placeholder="رقم الهاتف"
                value={onboardingPhone}
                onChange={(e) => setOnboardingPhone(e.target.value)}
                className="h-12 pr-10 text-right text-sm font-bold rounded-[12px] border-primary/10"
              />
              <Smartphone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <Button 
              onClick={handleStartOnboarding}
              disabled={!onboardingName.trim() || !onboardingPhone.trim() || isLinking}
              className="w-full h-12 primary-gradient text-white text-base font-black rounded-[12px] shadow-xl"
            >
              {isLinking ? <Loader2 className="h-5 w-5 animate-spin" /> : "ابدأ رحلتي الآن"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="animate-in fade-in duration-500">
            <DashboardHeader 
              onSearch={setSearchTerm} 
              onNotifications={() => setActiveTab('notifications')} 
              userName={profile?.name}
            />
            {!searchTerm && <ChallengeHighlight />}
            <div className="px-6 mt-8">
              <h2 className="text-lg font-bold text-foreground/90 font-cairo">الأقسام الرئيسية</h2>
            </div>
            <div className="mt-4 px-6 space-y-4">
              {sortedCategories.map((category, index) => (
                <div key={category.id} onClick={() => setActiveTab(category.id as TabId)} className="animate-in fade-in slide-in-from-bottom-2 cursor-pointer" style={{ animationDelay: `${index * 50}ms` }}>
                  <CategoryCard
                    title={category.title}
                    description={category.description}
                    icon={category.icon}
                    stat={category.stat}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      case 'fitness': return <FitnessScreen onBack={handleBack} />;
      case 'challenges': return <ChallengesScreen onBack={handleBack} />;
      case 'tasks': return <TasksScreen onBack={handleBack} />;
      case 'finance': return <FinanceScreen onBack={handleBack} />;
      case 'study': return <StudyScreen onBack={handleBack} />;
      case 'habits': return <HabitsScreen onBack={handleBack} />;
      case 'ai': return <AIScreen onBack={handleBack} />;
      case 'analytics': return <AnalyticsScreen onBack={handleBack} />;
      case 'notifications': return <NotificationsScreen onBack={handleBack} />;
      case 'profile':
        return (
          <div className="flex flex-col items-center px-6 animate-in fade-in duration-500 pb-32 pt-16">
            <div className="h-24 w-24 rounded-full primary-gradient flex items-center justify-center mb-6 shadow-2xl relative overflow-hidden">
              <Image src={PlaceHolderImages.find(img => img.id === 'user-profile')?.imageUrl || ""} alt="Profile" fill className="object-cover" />
            </div>
            <div className="w-full space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground">الاسم الكريم</label>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-12 text-right font-bold rounded-[12px]" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground">رقم الهاتف</label>
                  <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="h-12 text-right font-bold rounded-[12px]" />
                </div>
                <Button onClick={handleUpdateProfile} className="w-full h-12 primary-gradient text-white font-black rounded-[12px] shadow-xl">حفظ التغييرات</Button>
              </div>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <main className="min-h-screen bg-background">
      {renderTabContent()}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </main>
  );
}
