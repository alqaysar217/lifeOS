
"use client"

import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  Zap, 
  Star, 
  Target, 
  Flame, 
  ChevronRight, 
  Crown, 
  Plus, 
  Trophy, 
  Timer, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Play, 
  ArrowLeft,
  Loader2,
  Lock
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, serverTimestamp, doc, query, orderBy, limit } from "firebase/firestore";
import { addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";

interface ChallengesScreenProps {
  onBack: () => void;
}

type ChallengeType = 'fitness' | 'custom' | 'daily';
type ChallengeStatus = 'active' | 'completed' | 'failed';

const PREDEFINED_TEMPLATES = [
  { id: 'run_steps', title: 'تحدي الخطوات اليومي', type: 'fitness', goal: 'خطوة', points: 100, icon: Activity },
  { id: 'pushups_goal', title: 'تحدي الضغط', type: 'fitness', goal: 'عدة', points: 50, icon: Zap },
  { id: 'water_daily', title: 'شرب الماء', type: 'daily', goal: 'لتر', points: 30, icon: Flame },
  { id: 'quran_daily', title: 'حفظ القرآن', type: 'custom', goal: 'صفحة', points: 200, icon: Crown },
  { id: 'study_focus', title: 'ساعات الدراسة', type: 'custom', goal: 'ساعة', points: 150, icon: Target },
];

export function ChallengesScreen({ onBack }: ChallengesScreenProps) {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [view, setView] = useState<'list' | 'create' | 'execute'>('list');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [activeExecChallenge, setActiveExecChallenge] = useState<any>(null);
  
  // Create state
  const [targetVal, setTargetVal] = useState("");
  const [durationVal, setDurationVal] = useState("30"); // Default 30 days
  
  // Execution state
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const [achievedVal, setAchievedVal] = useState("");

  const wakeLock = useRef<any>(null);

  const challengesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'challenges'), orderBy('startDate', 'desc'));
  }, [db, user]);

  const { data: challenges, isLoading } = useCollection(challengesQuery);
  const userDocRef = useMemoFirebase(() => (db && user) ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile } = useDoc(userDocRef);

  const totalPoints = profile?.totalPoints || 0;
  const userLevel = useMemo(() => {
    if (totalPoints < 1000) return "مبتدئ";
    if (totalPoints < 5000) return "متقدم";
    if (totalPoints < 10000) return "محترف";
    return "أسطورة";
  }, [totalPoints]);

  const levelProgress = ((totalPoints % 1000) / 1000) * 100;

  const requestWakeLock = async () => {
    if (typeof window !== 'undefined' && 'wakeLock' in navigator) {
      try {
        wakeLock.current = await (navigator as any).wakeLock.request('screen');
      } catch (err) {
        console.warn("WakeLock Error", err);
      }
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLock.current) {
      await wakeLock.current.release();
      wakeLock.current = null;
    }
  };

  // حماية البيانات عند الخروج المفاجئ أو إغلاق الهاتف أثناء التحدي
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isExecuting) {
        // إذا خرج المستخدم، يمكننا حفظ التقدم الحالي كفشل أو محاولة حفظ النتيجة
        // بناءً على رغبة المستخدم سنترك وضع السكون يمنع الإغلاق أولاً
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isExecuting, activeExecChallenge]);

  useEffect(() => {
    let interval: any;
    if (isExecuting) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
    return () => {
      if (interval) clearInterval(interval);
      releaseWakeLock();
    };
  }, [isExecuting]);

  const handleCreateChallenge = () => {
    if (!db || !user || !selectedTemplate || !targetVal) return;

    const challengeData = {
      userId: user.uid,
      title: selectedTemplate.title,
      type: selectedTemplate.type,
      templateId: selectedTemplate.id,
      targetValue: Number(targetVal),
      durationValue: Number(durationVal),
      durationType: selectedTemplate.type === 'fitness' && Number(durationVal) < 60 ? 'minutes' : 'days',
      status: 'active',
      points: selectedTemplate.points,
      startDate: serverTimestamp(),
      currentDay: 1,
      totalDays: Number(durationVal)
    };

    addDocumentNonBlocking(collection(db, 'users', user.uid, 'challenges'), challengeData);
    toast({ title: "تم بدء التحدي", description: "بالتوفيق في رحلتك الجديدة!" });
    setView('list');
    setSelectedTemplate(null);
    setTargetVal("");
  };

  const startExecution = (challenge: any) => {
    setActiveExecChallenge(challenge);
    setView('execute');
    setIsExecuting(true);
    setTimerSeconds(0);
  };

  const finishExecution = () => {
    if (!db || !user || !activeExecChallenge) return;
    
    setIsExecuting(false);
    const target = activeExecChallenge.targetValue;
    const actual = Number(achievedVal);
    const isSuccess = actual >= target;

    // Save result
    addDocumentNonBlocking(collection(db, 'users', user.uid, 'challengeResults'), {
      challengeId: activeExecChallenge.id,
      userId: user.uid,
      result: isSuccess ? 'success' : 'fail',
      value: actual,
      date: serverTimestamp()
    });

    if (isSuccess) {
      const newPoints = (profile?.totalPoints || 0) + activeExecChallenge.points;
      updateDocumentNonBlocking(doc(db, 'users', user.uid), { totalPoints: newPoints });
      toast({ title: "نجاح!", description: `لقد حققت الهدف وحصلت على ${activeExecChallenge.points} نقطة!` });
    } else {
      toast({ variant: "destructive", title: "لم تنجح", description: "لا بأس، حاول مرة أخرى غداً!" });
    }

    // Update challenge status if it's a one-time thing or daily
    if (activeExecChallenge.durationType === 'minutes') {
      updateDocumentNonBlocking(doc(db, 'users', user.uid, 'challenges', activeExecChallenge.id), {
        status: isSuccess ? 'completed' : 'failed'
      });
    }

    setView('list');
    setActiveExecChallenge(null);
    setAchievedVal("");
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  if (view === 'create') {
    return (
      <div className="min-h-screen bg-background p-6 animate-in slide-in-from-left duration-300">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => setView('list')} className="rounded-[10px] bg-white premium-shadow hover:bg-white">
            <ChevronRight className="h-5 w-5" />
          </Button>
          <h2 className="text-xl font-black">بدء تحدي جديد</h2>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            {PREDEFINED_TEMPLATES.map((t) => (
              <div 
                key={t.id} 
                onClick={() => setSelectedTemplate(t)}
                className={`p-4 rounded-[10px] border-2 transition-all cursor-pointer flex flex-col items-center gap-2 text-center ${selectedTemplate?.id === t.id ? 'border-primary bg-primary/5' : 'border-border/40 bg-white'}`}
              >
                <t.icon className={`h-6 w-6 ${selectedTemplate?.id === t.id ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-xs font-bold">{t.title}</span>
              </div>
            ))}
          </div>

          {selectedTemplate && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">الهدف ({selectedTemplate.goal})</label>
                <Input 
                  type="number" 
                  placeholder={`أدخل عدد الـ ${selectedTemplate.goal}...`}
                  value={targetVal}
                  onChange={(e) => setTargetVal(e.target.value)}
                  className="h-12 rounded-[10px] font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">المدة (بالأيام)</label>
                <Input 
                  type="number" 
                  placeholder="30 يوم"
                  value={durationVal}
                  onChange={(e) => setDurationVal(e.target.value)}
                  className="h-12 rounded-[10px] font-bold"
                />
              </div>
              <Button 
                onClick={handleCreateChallenge}
                disabled={!targetVal}
                className="w-full h-12 primary-gradient text-white font-black rounded-[10px] shadow-xl hover:opacity-90"
              >
                تأكيد وبدء التحدي
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === 'execute') {
    return (
      <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center space-y-8 animate-in zoom-in duration-300">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-primary">{activeExecChallenge?.title}</h2>
          <p className="text-muted-foreground font-bold">الهدف: {activeExecChallenge?.targetValue}</p>
        </div>

        <div className="h-48 w-48 rounded-full border-8 border-primary/10 flex flex-col items-center justify-center relative">
          <div className="absolute inset-0 rounded-full border-8 border-primary border-t-transparent animate-spin" style={{ animationDuration: '3s' }} />
          <Timer className="h-8 w-8 text-primary/40 mb-2" />
          <span className="text-4xl font-black tabular-nums">{formatTime(timerSeconds)}</span>
        </div>

        <div className="w-full max-w-xs space-y-4">
          <div className="space-y-2">
            <label className="text-center block text-xs font-bold text-muted-foreground">كم حققت حتى الآن؟</label>
            <Input 
              type="number" 
              placeholder="أدخل الرقم المحقق..."
              value={achievedVal}
              onChange={(e) => setAchievedVal(e.target.value)}
              className="h-14 text-center text-2xl font-black rounded-[10px] border-primary/20"
            />
          </div>
          <Button onClick={finishExecution} className="w-full h-14 primary-gradient text-white font-black rounded-[10px] shadow-2xl active:scale-95 transition-all hover:opacity-90">
            إنهاء وحفظ النتيجة
          </Button>
          <Button variant="ghost" onClick={() => setView('list')} className="w-full text-muted-foreground font-bold hover:bg-transparent">إلغاء التحدي</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/5 px-6 pt-10 pb-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10 rounded-[10px] bg-white border border-border/40 premium-shadow hover:bg-white">
              <ChevronRight className="h-5 w-5 text-foreground" />
            </Button>
            <h2 className="text-2xl font-extrabold text-foreground font-cairo">التحديات</h2>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-[10px] premium-shadow border border-border/40">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span className="text-xs font-bold">{totalPoints} نقطة</span>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-8">
        <div className="bg-white p-5 rounded-[10px] premium-shadow border border-border/40 flex items-center gap-5 relative overflow-hidden">
          <div className="h-16 w-16 rounded-[10px] primary-gradient flex items-center justify-center shadow-lg shadow-primary/20 relative z-10">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1 space-y-2 relative z-10">
            <div className="flex justify-between items-end">
              <p className="text-sm font-black text-foreground">{userLevel}</p>
              <p className="text-[10px] font-bold text-muted-foreground">{totalPoints % 1000} / 1000 نقطة</p>
            </div>
            <Progress value={levelProgress} className="h-2 bg-secondary" />
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground/90">التحديات النشطة</h3>
            <Button onClick={() => setView('create')} size="sm" className="rounded-[10px] bg-primary/5 text-primary hover:bg-primary/10 border-none">
              <Plus className="h-4 w-4 ml-1" />
              تحدي جديد
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary/20" /></div>
          ) : challenges && challenges.filter(c => c.status === 'active').length > 0 ? (
            <div className="space-y-4">
              {challenges.filter(c => c.status === 'active').map((ch) => (
                <div 
                  key={ch.id} 
                  className="bg-white p-5 rounded-[10px] premium-shadow border border-border/40 space-y-4 relative group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-[10px] soft-purple-bg flex items-center justify-center">
                        <Zap className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black">{ch.title}</h4>
                        <p className="text-[10px] text-muted-foreground font-bold">الهدف: {ch.targetValue}</p>
                      </div>
                    </div>
                    <Button onClick={() => startExecution(ch)} className="h-10 px-6 rounded-[10px] primary-gradient text-white text-xs font-bold shadow-lg shadow-primary/20 hover:opacity-90">
                      ابدأ الآن
                    </Button>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-bold text-muted-foreground">
                      <span>التقدم الإجمالي</span>
                      <span>{Math.floor((ch.currentDay / ch.totalDays) * 100)}%</span>
                    </div>
                    <Progress value={(ch.currentDay / ch.totalDays) * 100} className="h-1.5" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center bg-white rounded-[10px] border border-dashed border-border/60 space-y-4">
              <Trophy className="h-12 w-12 text-muted-foreground/10 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-muted-foreground">لا توجد تحديات نشطة حالياً</p>
                <p className="text-[10px] text-muted-foreground">ابدأ تحديك الأول لجمع النقاط ورفع مستواك</p>
              </div>
              <Button onClick={() => setView('create')} variant="outline" className="rounded-[10px] font-bold text-xs hover:bg-transparent">استعراض التحديات</Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-foreground/90">سجل الإنجازات</h3>
          {challenges && challenges.filter(c => c.status !== 'active').length > 0 ? (
            <div className="space-y-3">
              {challenges.filter(c => c.status !== 'active').map((ch) => (
                <div key={ch.id} className="bg-white/50 p-4 rounded-[10px] border border-border/20 flex items-center justify-between opacity-70">
                  <div className="flex items-center gap-3">
                    {ch.status === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <h4 className="text-xs font-bold">{ch.title}</h4>
                      <p className="text-[9px] font-medium text-muted-foreground">النقاط: {ch.status === 'completed' ? `+${ch.points}` : '0'}</p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-black px-2 py-1 rounded-full ${ch.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {ch.status === 'completed' ? 'نجاح' : 'فشل'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-muted-foreground">سجلك نظيف، بانتظار بطولاتك القادمة!</div>
          )}
        </div>
      </div>
    </div>
  );
}
