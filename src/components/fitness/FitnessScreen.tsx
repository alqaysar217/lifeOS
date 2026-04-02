
"use client"

import { Play, MapPin, Clock, Zap, Target, Dumbbell, ChevronRight, ChevronLeft, Navigation, Activity } from "lucide-react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Button } from "@/components/ui/button";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection, serverTimestamp } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";

const exercises = [
  { title: "نط الحبل", duration: "10 دقائق", kcal: "120", icon: Dumbbell },
  { title: "تمارين الضغط", duration: "3 مجموعات", kcal: "85", icon: Zap },
  { title: "سكوات", duration: "15 دقيقة", kcal: "100", icon: Target },
  { title: "تمارين البطن", duration: "10 دقائق", kcal: "60", icon: Dumbbell },
];

interface FitnessScreenProps {
  onBack: () => void;
}

export function FitnessScreen({ onBack }: FitnessScreenProps) {
  const db = useFirestore();
  const { user } = useUser();
  const mapImage = PlaceHolderImages.find(img => img.id === "running-map");

  const fitnessQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'fitnessRecords');
  }, [db, user]);

  const { data: records } = useCollection(fitnessQuery);

  const handleStartSession = () => {
    if (!db || !user) return;
    const recordsRef = collection(db, 'users', user.uid, 'fitnessRecords');
    addDocumentNonBlocking(recordsRef, {
      date: serverTimestamp(),
      steps: 5000,
      distance: 5.0,
      time: 30,
      userId: user.uid
    });
  };

  const lastRecord = records && records.length > 0 ? records[records.length - 1] : null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/5 px-6 pt-10 pb-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10 rounded-[10px] bg-white border border-border/40 premium-shadow">
              <ChevronRight className="h-5 w-5 text-foreground" />
            </Button>
            <h2 className="text-2xl font-extrabold text-foreground font-cairo">اللياقة</h2>
          </div>
          <div className="h-10 w-10 rounded-[10px] bg-white border border-border/40 premium-shadow flex items-center justify-center text-primary">
            <Activity className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-8">
        <div className="primary-gradient rounded-[15px] p-6 text-white premium-shadow relative overflow-hidden shadow-[0_20px_40px_-15px_rgba(139,92,246,0.4)]">
          <div className="relative z-10 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/70 text-xs font-bold mb-1">جلسة اليوم المقترحة</p>
                <h3 className="text-2xl font-black">جري صباحي مكثف</h3>
              </div>
              <div className="h-12 w-12 rounded-[12px] bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                <Navigation className="h-6 w-6 text-white animate-pulse" />
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-white/70 uppercase">المسافة المستهدفة</span>
                <span className="text-xl font-black">{lastRecord?.distance || 5.0} <span className="text-xs">كم</span></span>
              </div>
              <div className="h-8 w-px bg-white/20" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-white/70 uppercase">الوقت المتوقع</span>
                <span className="text-xl font-black">{lastRecord?.time || 30} <span className="text-xs">دقيقة</span></span>
              </div>
            </div>

            <button onClick={handleStartSession} className="w-full bg-white text-primary h-12 rounded-[12px] font-black text-sm flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-transform group">
              <Play className="h-4 w-4 fill-primary group-hover:scale-110 transition-transform" />
              ابدأ الجلسة الآن
            </button>
          </div>
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-16 -translate-y-16 blur-2xl" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground/90 font-cairo">مسار الجري الذكي</h3>
            <div className="flex items-center gap-2 bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
              <Activity className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-bold text-primary">مباشر الآن</span>
            </div>
          </div>
          <div className="relative h-64 w-full rounded-[15px] overflow-hidden bg-white premium-shadow border border-border/40">
            {mapImage && (
              <Image 
                src={mapImage.imageUrl} 
                alt={mapImage.description} 
                fill 
                className="object-cover opacity-60 grayscale-[0.2]"
                data-ai-hint={mapImage.imageHint}
              />
            )}
            
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-xl p-3 rounded-[12px] premium-shadow border border-white/50 animate-in zoom-in-95">
              <p className="text-[8px] font-bold text-muted-foreground uppercase mb-0.5">السرعة الحالية</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-primary">12.5</span>
                <span className="text-[9px] font-bold text-slate-400">كم/س</span>
              </div>
            </div>

            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
              <path d="M 50 200 Q 150 50 250 150 T 400 100" fill="none" stroke="#8b5cf6" strokeWidth="6" strokeLinecap="round" className="animate-in fade-in duration-1000" />
              <circle cx="50" cy="200" r="5" fill="#8b5cf6" />
              <circle cx="400" cy="100" r="5" fill="#8b5cf6" className="animate-ping" />
            </svg>

            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-[10px] flex items-center gap-2 shadow-lg border border-white/50">
              <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-bold text-foreground">حديقة الملك فهد</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground/90 font-cairo">تمارين مخصصة لك</h3>
            <button className="text-xs text-primary font-bold hover:underline">عرض الكل</button>
          </div>
          <div className="space-y-3">
            {exercises.map((ex, i) => (
              <div key={i} className="bg-white p-4 rounded-[12px] premium-shadow border border-border/40 flex items-center justify-between group active:scale-[0.98] transition-all">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-[10px] soft-purple-bg flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <ex.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{ex.title}</h4>
                    <p className="text-[10px] text-muted-foreground font-medium">{ex.duration} • {ex.kcal} سعرة</p>
                  </div>
                </div>
                <div className="h-8 w-8 rounded-[8px] bg-slate-50 flex items-center justify-center">
                  <ChevronLeft className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
