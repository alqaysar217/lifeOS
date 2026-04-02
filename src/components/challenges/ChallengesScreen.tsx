
"use client"

import { Zap, Star, Target, Flame, ChevronLeft, ChevronRight, Crown, Plus } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection, serverTimestamp } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";

interface ChallengesScreenProps {
  onBack: () => void;
}

export function ChallengesScreen({ onBack }: ChallengesScreenProps) {
  const db = useFirestore();
  const { user } = useUser();

  const challengesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'challenges');
  }, [db, user]);

  const { data: challenges, isLoading } = useCollection(challengesQuery);

  const activeChallenge = challenges?.find(c => c.totalDays > 0);

  const handleAddChallenge = () => {
    if (!db || !user) return;
    const challengesRef = collection(db, 'users', user.uid, 'challenges');
    addDocumentNonBlocking(challengesRef, {
      title: "تحدي الـ 100 يوم",
      currentDay: 1,
      totalDays: 100,
      userId: user.uid,
      createdAt: serverTimestamp()
    });
  };

  const points = challenges?.length ? challenges.length * 100 + 1250 : 0;
  const level = Math.floor(points / 300) || 1;
  const progress = ((points % 1000) / 1000) * 100;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/5 px-6 pt-10 pb-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10 rounded-[10px] bg-white border border-border/40 premium-shadow">
              <ChevronRight className="h-5 w-5 text-foreground" />
            </Button>
            <h2 className="text-2xl font-extrabold text-foreground font-cairo">التحديات</h2>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-[10px] premium-shadow border border-border/40">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span className="text-xs font-bold">{points} نقطة</span>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-8">
        <div className="bg-white p-5 rounded-[10px] premium-shadow border border-border/40 flex items-center gap-5">
          <div className="h-16 w-16 rounded-[12px] primary-gradient flex items-center justify-center shadow-lg shadow-primary/20 relative">
            <span className="text-2xl font-black text-white">{level}</span>
            <div className="absolute -bottom-2 bg-yellow-400 text-[8px] font-black text-black px-2 py-0.5 rounded-full uppercase tracking-tighter">المستوى</div>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex justify-between items-end">
              <p className="text-xs font-bold text-foreground">الرتبة: محارب نشط</p>
              <p className="text-[10px] font-bold text-muted-foreground">{points % 1000} / 1000 نقطة</p>
            </div>
            <Progress value={progress} className="h-2 bg-secondary" />
          </div>
        </div>

        {activeChallenge ? (
          <div className="primary-gradient rounded-[10px] p-6 text-white premium-shadow relative overflow-hidden shadow-[0_20px_40px_-15px_rgba(139,92,246,0.4)]">
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-[10px] bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-white/70 uppercase">التحدي النشط</p>
                  <h3 className="text-lg font-bold">{activeChallenge.title}</h3>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold">{activeChallenge.currentDay}</span>
                    <span className="text-xs text-white/70">/ {activeChallenge.totalDays} يوم</span>
                  </div>
                  <span className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded-[6px]">باقي {activeChallenge.totalDays - activeChallenge.currentDay} يوم</span>
                </div>
                <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.6)]" style={{ width: `${(activeChallenge.currentDay / activeChallenge.totalDays) * 100}%` }} />
                </div>
              </div>
            </div>
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-pink-400/30 blur-[60px] rounded-full" />
            <div className="absolute top-0 right-0 p-4">
              <Crown className="h-6 w-6 text-white/20" />
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-[15px] premium-shadow border border-border/40 text-center space-y-4">
            <Trophy className="h-12 w-12 text-muted-foreground/20 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">ابدأ تحديك الأول اليوم!</h3>
              <p className="text-[10px] text-muted-foreground">التحديات تساعدك على الالتزام وتحقيق أهدافك</p>
            </div>
            <Button onClick={handleAddChallenge} className="primary-gradient text-white font-bold w-full rounded-[10px]">بدء تحدي جديد</Button>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground/90">سجل التحديات</h3>
            <button onClick={handleAddChallenge} className="h-8 w-8 rounded-[8px] bg-primary/5 text-primary flex items-center justify-center">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          
          {isLoading ? (
            <div className="py-10 text-center text-xs text-muted-foreground">جاري التحميل...</div>
          ) : challenges && challenges.length > 0 ? (
            <div className="space-y-3">
              {challenges.map((ch) => (
                <div key={ch.id} className="bg-white p-4 rounded-[10px] premium-shadow border border-border/40 space-y-3 active:scale-[0.98] transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-[8px] soft-purple-bg flex items-center justify-center">
                        <Target className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground">{ch.title}</h4>
                        <p className="text-[10px] text-muted-foreground font-medium">تحدي</p>
                      </div>
                    </div>
                    <div className="h-8 w-8 rounded-[8px] bg-slate-50 flex items-center justify-center">
                      <ChevronLeft className="h-4 w-4 text-slate-300" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-bold text-muted-foreground">
                      <span>التقدم</span>
                      <span>{Math.floor((ch.currentDay / ch.totalDays) * 100)}%</span>
                    </div>
                    <Progress value={(ch.currentDay / ch.totalDays) * 100} className="h-1.5 bg-secondary" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-xs text-muted-foreground">لا يوجد تاريخ تحديات مسبق</div>
          )}
        </div>
      </div>
    </div>
  );
}
import { Trophy } from "lucide-react";
