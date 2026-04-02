
"use client"

import { GraduationCap, BookOpen, Clock, Calendar, AlertCircle, ChevronLeft, ChevronRight, PlayCircle, Plus } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection, serverTimestamp } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";

interface StudyScreenProps {
  onBack: () => void;
}

export function StudyScreen({ onBack }: StudyScreenProps) {
  const db = useFirestore();
  const { user } = useUser();

  const studyQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'studyProgress');
  }, [db, user]);

  const { data: subjects, isLoading } = useCollection(studyQuery);

  const handleAddSubject = () => {
    if (!db || !user) return;
    const studyRef = collection(db, 'users', user.uid, 'studyProgress');
    addDocumentNonBlocking(studyRef, {
      subject: "مادة جديدة",
      progress: 0,
      userId: user.uid,
      createdAt: serverTimestamp()
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
            <h2 className="text-2xl font-extrabold text-foreground font-cairo">الدراسة</h2>
          </div>
          <div className="h-10 w-10 rounded-[10px] bg-white border border-border/40 premium-shadow flex items-center justify-center text-primary">
            <GraduationCap className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-8">
        <div className="primary-gradient rounded-[10px] p-6 text-white premium-shadow relative overflow-hidden">
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-4">
              <div>
                <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider">نصيحة اليوم</p>
                <h3 className="text-xl font-bold">الاستمرارية سر النجاح</h3>
              </div>
              <div className="flex items-center gap-4">
                <button className="bg-white text-primary px-4 py-1.5 rounded-[8px] font-bold text-xs flex items-center gap-2 shadow-xl active:scale-95 transition-transform">
                  <PlayCircle className="h-3.5 w-3.5" />
                  ابدأ المراجعة
                </button>
              </div>
            </div>
            <div className="h-20 w-20 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
              <BookOpen className="h-10 w-10 text-white/80" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground/90">المواد الدراسية</h3>
            <button onClick={handleAddSubject} className="text-xs text-primary font-bold flex items-center gap-1">
              <Plus className="h-3 w-3" />
              إضافة مادة
            </button>
          </div>
          
          {isLoading ? (
            <div className="py-10 text-center text-xs text-muted-foreground">جاري التحميل...</div>
          ) : subjects && subjects.length > 0 ? (
            <div className="space-y-4">
              {subjects.map((sub) => (
                <div key={sub.id} className="bg-white p-5 rounded-[10px] premium-shadow border border-border/40 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-[10px] bg-blue-500/10 flex items-center justify-center`}>
                        <BookOpen className={`h-5 w-5 text-blue-500`} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground">{sub.subject}</h4>
                        <p className="text-[10px] text-muted-foreground font-bold">{sub.progress}% مكتمل</p>
                      </div>
                    </div>
                    <ChevronLeft className="h-4 w-4 text-slate-300" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[9px] font-bold text-muted-foreground">
                      <span>التقدم في المادة</span>
                      <span>{sub.progress}%</span>
                    </div>
                    <Progress value={sub.progress} className={`h-1.5`} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center space-y-3">
              <GraduationCap className="h-10 w-10 text-muted-foreground/20 mx-auto" />
              <p className="text-xs font-bold text-muted-foreground">ابدأ بإضافة موادك الدراسية هنا</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
