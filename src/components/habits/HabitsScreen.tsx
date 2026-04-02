
"use client"

import { Zap, Flame, CheckCircle2, MoreVertical, Sparkles, TrendingUp, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, serverTimestamp } from "firebase/firestore";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";

interface HabitsScreenProps {
  onBack: () => void;
}

export function HabitsScreen({ onBack }: HabitsScreenProps) {
  const db = useFirestore();
  const { user } = useUser();

  const habitsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'habits');
  }, [db, user]);

  const { data: habits } = useCollection(habitsQuery);

  const toggleHabit = (habitId: string, currentStatus: string, currentStreak: number) => {
    if (!db || !user) return;
    const habitRef = doc(db, 'users', user.uid, 'habits', habitId);
    const isCompleted = currentStatus === 'completed';
    
    updateDocumentNonBlocking(habitRef, {
      status: isCompleted ? 'active' : 'completed',
      streak: isCompleted ? currentStreak - 1 : currentStreak + 1,
      lastCompleted: serverTimestamp()
    });
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/5 px-6 pt-10 pb-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10 rounded-[10px] bg-white border border-border/40 premium-shadow">
              <ChevronRight className="h-5 w-5 text-foreground" />
            </Button>
            <h2 className="text-2xl font-extrabold text-foreground font-cairo">العادات</h2>
          </div>
          <div className="h-10 w-10 rounded-[10px] bg-white border border-border/40 premium-shadow flex items-center justify-center text-primary">
            <Zap className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-8">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-[10px] premium-shadow border border-border/40 flex flex-col items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <p className="text-2xl font-black text-foreground">12</p>
            <p className="text-[10px] font-bold text-muted-foreground">أطول سلسلة</p>
          </div>
          <div className="bg-white p-5 rounded-[10px] premium-shadow border border-border/40 flex flex-col items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-black text-foreground">85%</p>
            <p className="text-[10px] font-bold text-muted-foreground">معدل الالتزام</p>
          </div>
        </div>

        <div className="primary-gradient p-5 rounded-[10px] text-white premium-shadow relative overflow-hidden">
          <div className="relative z-10 flex gap-4 items-start">
            <Sparkles className="h-5 w-5 text-yellow-300 shrink-0" />
            <p className="text-xs font-bold leading-relaxed">
              ملاحظة ذكية: استمر في الالتزام بعاداتك اليومية لتحقيق أفضل نسخة من نفسك.
            </p>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-12 translate-x-12 blur-xl" />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-foreground/90 font-cairo">عاداتي اليومية</h3>
          <div className="space-y-3">
            {habits?.map((habit) => (
              <div key={habit.id} className="bg-white p-5 rounded-[10px] premium-shadow border border-border/40 flex items-center justify-between group active:scale-[0.99] transition-all">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => toggleHabit(habit.id, habit.status, habit.streak)}
                    className={`h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all ${
                      habit.status === 'completed' ? 'bg-primary border-primary text-white' : 'border-slate-200 text-transparent hover:border-primary/50'
                    }`}
                  >
                    <CheckCircle2 className="h-5 w-5" />
                  </button>
                  <div>
                    <h4 className={`text-sm font-bold ${habit.status === 'completed' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                      {habit.title}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Flame className="h-3 w-3 text-orange-500" />
                      <span className="text-[10px] text-muted-foreground font-bold">{habit.streak} أيام متواصلة</span>
                    </div>
                  </div>
                </div>
                <MoreVertical className="h-4 w-4 text-slate-300" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
