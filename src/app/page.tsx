
"use client"

import React, { useState, useEffect, useMemo, use } from "react";
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
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { initiateAnonymousSignIn } from "@/firebase/non-blocking-login";
import { doc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
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
  Wallet,
  Bell,
  Copy,
  Check,
  Sparkles,
  LogOut,
  RefreshCcw,
  Smartphone,
  Loader2
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

interface DashboardPageProps {
  params: Promise<any>;
  searchParams: Promise<any>;
}

export default function DashboardPage(props: DashboardPageProps) {
  // فك المعاملات باستخدام use() من React لتجنب خطأ التعداد في Next.js 15
  const _params = use(props.params);
  const _searchParams = use(props.searchParams);

  const [activeTab, setActiveTab] = React.useState<TabId>('home');
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTime, setCurrentTime] = useState<number>(new Date().getHours());
  const [copied, setCopied] = useState(false);
  const [onboardingName, setOnboardingName] = useState("");
  const [onboardingPhone, setOnboardingPhone] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => (db && user) ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile, isLoading: isProfileLoading } = useDoc(userDocRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth]);

  useEffect(() => {
    if (user && db && !isProfileLoading && !profile) {
      const userRef = doc(db, 'users', user.uid);
      setDocumentNonBlocking(userRef, {
        id: user.uid,
        createdAt: serverTimestamp(),
        passcodeEnabled: false
      }, { merge: true });
    }
  }, [user, db, isProfileLoading, profile]);

  useEffect(() => {
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

  const copyUID = () => {
    if (user) {
      navigator.clipboard.writeText(user.uid);
      setCopied(true);
      toast({ title: "تم النسخ", description: "تم نسخ معرف المستخدم بنجاح." });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartOnboarding = async () => {
    if (onboardingName.trim() && onboardingPhone.trim() && user && db) {
      setIsLinking(true);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phoneNumber', '==', onboardingPhone.trim()));
      
      getDocs(q)
        .then(async (querySnapshot) => {
          if (!querySnapshot.empty) {
            const existingData = querySnapshot.docs[0].data();
            const userRef = doc(db, 'users', user.uid);
            setDocumentNonBlocking(userRef, { 
              name: existingData.name, 
              phoneNumber: onboardingPhone.trim() 
            }, { merge: true });
            toast({ title: "مرحباً بعودتك!", description: `سعيد برؤيتك مجدداً يا ${existingData.name}` });
          } else {
            const userRef = doc(db, 'users', user.uid);
            setDocumentNonBlocking(userRef, { 
              name: onboardingName, 
              phoneNumber: onboardingPhone.trim() 
            }, { merge: true });
            toast({ title: "بداية موفقة", description: "تم حفظ بياناتك بنجاح." });
          }
          setIsLinking(false)
        })
        .catch(async (error) => {
          const permissionError = new FirestorePermissionError({
            path: usersRef.path,
            operation: 'list',
          });
          errorEmitter.emit('permission-error', permissionError);
          setIsLinking(false);
          toast({ variant: "destructive", title: "خطأ", description: "حدث خطأ أثناء البحث عن البيانات." });
        });
    }
  };

  const handleSignOut = () => {
    signOut(auth).then(() => {
      window.location.reload(); 
    });
  };

  const renderContent = () => {
    if (isUserLoading) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-muted-foreground">جاري تحضير عالمك الخاص...</p>
        </div>
      );
    }

    if (user && !isProfileLoading && (!profile?.name || !profile?.phoneNumber)) {
      return (
        <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-8 animate-in fade-in duration-700">
          <div className="w-full max-w-sm space-y-8 text-center">
            <div className="relative h-20 w-20 mx-auto transition-transform hover:scale-110">
              <Image 
                src="/logo.png" 
                alt="Logo" 
                fill 
                className="object-contain drop-shadow-2xl" 
                priority
              />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-foreground font-cairo">أهلاً بك في حياتي</h1>
              <p className="text-xs text-muted-foreground font-bold px-4">أدخل بياناتك لربط حسابك وضمان استمرارية إنجازاتك</p>
            </div>

            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                </div>
                <Input 
                  placeholder="الاسم الكريم..."
                  value={onboardingName}
                  onChange={(e) => setOnboardingName(e.target.value)}
                  className="h-12 pr-10 text-right text-sm font-bold rounded-[12px] border-primary/10 premium-shadow bg-white/50 focus:bg-white transition-all"
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <Smartphone className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                </div>
                <Input 
                  type="tel"
                  placeholder="رقم الهاتف"
                  value={onboardingPhone}
                  onChange={(e) => setOnboardingPhone(e.target.value)}
                  className="h-12 pr-10 text-right text-sm font-bold rounded-[12px] border-primary/10 premium-shadow bg-white/50 focus:bg-white transition-all"
                />
              </div>

              <Button 
                onClick={handleStartOnboarding}
                disabled={!onboardingName.trim() || !onboardingPhone.trim() || isLinking}
                className="w-full h-12 primary-gradient text-white text-base font-black rounded-[12px] shadow-xl active:scale-95 transition-all disabled:opacity-50"
              >
                {isLinking ? <Loader2 className="h-5 w-5 animate-spin" /> : "ابدأ رحلتي الآن"}
              </Button>
            </div>
            
            <p className="text-[9px] text-muted-foreground font-medium">بياناتك مشفرة ومحفوظة بأمان تام وفق معايير الخصوصية العالمية.</p>
          </div>
        </div>
      );
    }

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
          <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 animate-in fade-in duration-500 pb-32 pt-10">
            <div className="h-24 w-24 rounded-full primary-gradient flex items-center justify-center mb-6 shadow-2xl relative">
              <User className="h-12 w-12 text-white" />
              <div className="absolute -bottom-1 -right-1 h-8 w-8 bg-green-500 border-4 border-background rounded-full" />
            </div>
            <h3 className="text-2xl font-black text-foreground mb-1">{profile?.name || "حسابي"}</h3>
            <p className="text-[10px] font-bold text-primary bg-primary/5 px-3 py-1 rounded-full mb-8">{profile?.phoneNumber || "لم يتم ربط هاتف"}</p>
            
            <div className="w-full space-y-4">
              <div className="bg-white p-5 rounded-[15px] premium-shadow border border-border/40 space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">معرف المستخدم (UID)</p>
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-[10px] border border-border/20">
                  <code className="text-xs font-mono text-primary break-all">{user?.uid}</code>
                  <button 
                    onClick={copyUID}
                    className="h-8 w-8 flex items-center justify-center bg-white rounded-full shadow-sm text-primary active:scale-90 transition-transform"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div 
                onClick={handleSignOut}
                className="bg-red-50 p-5 rounded-[15px] border border-red-100 flex items-center justify-between cursor-pointer group active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-[10px] bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                    <RefreshCcw className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-red-700">بدء رحلة جديدة</span>
                    <p className="text-[9px] text-red-500 font-bold">سيتم تسجيل الخروج ومسح الجلسة</p>
                  </div>
                </div>
                <LogOut className="h-4 w-4 text-red-400" />
              </div>

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
              
              <div className="bg-white p-5 rounded-[15px] premium-shadow border border-border/40 flex flex-col items-center justify-center gap-2 border-dashed">
                <p className="text-xs font-bold text-muted-foreground">نظام تشغيل حياتك المتكامل</p>
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
    <main className="min-h-screen bg-background">
      {renderContent()}
      {profile?.name && <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />}
    </main>
  );
}
