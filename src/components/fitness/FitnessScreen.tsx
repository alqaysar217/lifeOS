
"use client"

import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Play, MapPin, Clock, Zap, Target, Dumbbell, ChevronRight, 
  Navigation, Activity, Square, Loader2, Footprints, 
  History, BarChart3, Trophy, Timer,
  CheckCircle2, Trash2, Calendar as CalendarIcon,
  PlusCircle, Flag, TimerReset, AlertCircle, Maximize2, Minimize2, X,
  ChevronDown,
  Calendar,
  Save,
  CircleCheck,
  Flame,
  ChevronLeft,
  LayoutGrid
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection, serverTimestamp, query, orderBy, doc } from "firebase/firestore";
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { 
  XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area, LineChart, Line 
} from 'recharts';
import { GymWorkoutScreen } from "./GymWorkoutScreen";

const MapComponent = dynamic(() => import("./MapComponent"), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
});

type FitnessView = 'hub' | 'running' | 'rep_counter' | 'stats' | 'gym';
type ExerciseType = 'run' | 'pushups' | 'squats' | 'abs' | 'jumprope' | 'pullups' | 'challenge' | 'gym';

interface FitnessScreenProps {
  onBack: () => void;
}

export function FitnessScreen({ onBack }: FitnessScreenProps) {
  const [view, setView] = useState<FitnessView>('hub');
  const [activeExercise, setActiveExercise] = useState<ExerciseType>('run');
  const [isTracking, setIsTracking] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  
  // Running states
  const [distance, setDistance] = useState(0); 
  const [steps, setSteps] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [path, setPath] = useState<{lat: number, lng: number}[]>([]);
  const [historyPath, setHistoryPath] = useState<[number, number][] | null>(null);
  
  // Rep counter states
  const [reps, setReps] = useState(0);
  const [showRepDialog, setShowRepDialog] = useState(false);
  const [inputReps, setInputReps] = useState("");

  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const watchId = useRef<number | null>(null);
  const lastCoord = useRef<GeolocationCoordinates | null>(null);
  const lastStepTime = useRef<number>(0);
  const wakeLock = useRef<any>(null);

  const fitnessQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'fitnessRecords'), orderBy('date', 'desc'));
  }, [db, user]);

  const { data: records, isLoading: isHistoryLoading } = useCollection(fitnessQuery);

  const dailyStats = useMemo(() => {
    if (!records) return { steps: 0, distance: 0, pushups: 0, squats: 0, abs: 0, jumprope: 0, pullups: 0 };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySeconds = today.getTime() / 1000;

    return records.reduce((acc, r) => {
      const recordDate = r.date?.seconds || 0;
      if (recordDate >= todaySeconds) {
        acc.steps += (r.steps || 0);
        acc.distance += (r.distance || 0);
        if (r.type === 'pushups') acc.pushups += (r.reps || 0);
        if (r.type === 'squats') acc.squats += (r.reps || 0);
        if (r.type === 'abs') acc.abs += (r.reps || 0);
        if (r.type === 'jumprope') acc.jumprope += (r.reps || 0);
        if (r.type === 'pullups') acc.pullups += (r.reps || 0);
      }
      return acc;
    }, { steps: 0, distance: 0, pushups: 0, squats: 0, abs: 0, jumprope: 0, pullups: 0 });
  }, [records]);

  const statsData = useMemo(() => {
    if (!records) return [];
    return [...records].reverse().slice(-7).map(r => ({
      name: r.date?.seconds ? new Date(r.date.seconds * 1000).toLocaleDateString('ar-EG', { weekday: 'short' }) : '؟',
      distance: r.distance || 0,
      steps: r.steps || 0,
      reps: r.reps || 0
    }));
  }, [records]);

  const exerciseHistory = useMemo(() => {
    if (!records) return [];
    return records.filter(r => r.type === activeExercise);
  }, [records, activeExercise]);

  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
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

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTracking) {
      timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isTracking]);

  const handleMotion = (event: DeviceMotionEvent) => {
    const acc = event.accelerationIncludingGravity;
    if (!acc || !acc.x || !acc.y || !acc.z) return;
    const magnitude = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);
    const now = Date.now();
    if (magnitude > 12 && now - lastStepTime.current > 250) {
      setSteps(prev => prev + 1);
      lastStepTime.current = now;
    }
  };

  const toggleTracking = async () => {
    if (!isTracking) {
      if (activeExercise === 'run') {
        if (!navigator.geolocation) return toast({ variant: "destructive", title: "خطأ", description: "GPS غير مدعوم." });
        setDistance(0); setSteps(0); setElapsedTime(0); setPath([]); lastCoord.current = null;
        setHistoryPath(null);
        setIsTracking(true);
        await requestWakeLock();
        window.addEventListener('devicemotion', handleMotion);
        watchId.current = navigator.geolocation.watchPosition(
          (pos) => {
            const current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setPath(prev => [...prev, current]);
            if (lastCoord.current) {
              const R = 6371;
              const lat1 = lastCoord.current.latitude;
              const lon1 = lastCoord.current.longitude;
              const lat2 = pos.coords.latitude;
              const lon2 = pos.coords.longitude;
              const dLat = (lat2 - lat1) * Math.PI / 180;
              const dLon = (lon2 - lon1) * Math.PI / 180;
              const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
              const d = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
              if (d > 0.001) setDistance(prev => prev + d);
            }
            lastCoord.current = pos.coords;
          },
          (err) => console.error(err),
          { enableHighAccuracy: true }
        );
      } else {
        setIsTracking(true);
        await requestWakeLock();
        setElapsedTime(0);
        setReps(0);
      }
    } else {
      setIsTracking(false);
      releaseWakeLock();
      if (activeExercise === 'run') {
        window.removeEventListener('devicemotion', handleMotion);
        if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
        if (db && user) {
          addDocumentNonBlocking(collection(db, 'users', user.uid, 'fitnessRecords'), {
            type: 'run',
            date: serverTimestamp(),
            steps: steps,
            distance: Number(distance.toFixed(3)),
            reps: 0,
            durationSeconds: elapsedTime,
            userId: user.uid,
            path: path,
          });
        }
        toast({ title: "تم الحفظ", description: "تم تسجيل النشاط بنجاح." });
      } else {
        setShowRepDialog(true);
      }
    }
  };

  const handleFinalRepSave = () => {
    const finalReps = parseInt(inputReps) || 0;
    if (db && user) {
      addDocumentNonBlocking(collection(db, 'users', user.uid, 'fitnessRecords'), {
        type: activeExercise,
        date: serverTimestamp(),
        reps: finalReps,
        durationSeconds: elapsedTime,
        userId: user.uid
      });
    }
    setShowRepDialog(false);
    setInputReps("");
    toast({ title: "تم الحفظ", description: "تم تسجيل التمرين بنجاح." });
  };

  const handleRecordClick = (record: any) => {
    if ((record.type === 'run' || record.type === 'challenge') && record.path) {
      setHistoryPath(record.path.map((p: any) => [p.lat, p.lng]));
      setActiveExercise('run');
      setView('running');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDeleteRecord = (recordId: string) => {
    if (!db || !user) return;
    deleteDocumentNonBlocking(doc(db, 'users', user.uid, 'fitnessRecords', recordId));
    toast({ title: "تم الحذف", description: "تمت إزالة السجل بنجاح." });
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const getExerciseName = (type: string): string => {
    switch (type) {
      case 'run': return 'الجري والمشي';
      case 'pushups': return 'تمارين الضغط';
      case 'squats': return 'تمارين القرفصاء';
      case 'abs': return 'تمارين البطن';
      case 'jumprope': return 'نط الحبل';
      case 'pullups': return 'تمارين العقلة';
      case 'gym': return 'تمارين الحديد';
      default: return 'تمرين رياضي';
    }
  };

  const getExerciseIcon = (type: string) => {
    switch (type) {
      case 'run': return <Footprints className="h-6 w-6" />;
      case 'pushups': return <Dumbbell className="h-6 w-6" />;
      case 'squats': return <Zap className="h-6 w-6" />;
      case 'abs': return <Flame className="h-6 w-6" />;
      case 'jumprope': return <TimerReset className="h-6 w-6" />;
      case 'pullups': return <Activity className="h-6 w-6" />;
      case 'gym': return <LayoutGrid className="h-6 w-6" />;
      default: return <Activity className="h-6 w-6" />;
    }
  };

  const getExerciseImage = (type: string) => {
    switch (type) {
      case 'run': return PlaceHolderImages.find(img => img.id === 'exercise-run')?.imageUrl;
      case 'pushups': return PlaceHolderImages.find(img => img.id === 'exercise-pushups')?.imageUrl;
      case 'squats': return PlaceHolderImages.find(img => img.id === 'exercise-squats')?.imageUrl;
      case 'abs': return PlaceHolderImages.find(img => img.id === 'exercise-abs')?.imageUrl;
      case 'jumprope': return PlaceHolderImages.find(img => img.id === 'exercise-jumprope')?.imageUrl;
      case 'pullups': return PlaceHolderImages.find(img => img.id === 'exercise-pullups')?.imageUrl;
      case 'gym': return "https://picsum.photos/seed/gym-workout/200/200";
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/5 px-6 pt-10 pb-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={view === 'hub' ? onBack : () => setView('hub')} className="h-10 w-10 rounded-[12px] bg-white border border-border/40 premium-shadow">
              <ChevronRight className="h-5 w-5 text-foreground" />
            </Button>
            <h2 className="text-2xl font-extrabold text-foreground font-cairo">
              {view === 'hub' ? 'اللياقة البدنية' : view === 'stats' ? 'الإحصائيات' : getExerciseName(activeExercise)}
            </h2>
          </div>
          {view === 'hub' && (
             <Button variant="ghost" size="icon" onClick={() => setView('stats')} className="h-10 w-10 rounded-[12px] bg-white border border-border/40 premium-shadow text-primary">
              <BarChart3 className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {view === 'hub' && (
          <div className="px-6 py-6 space-y-8 animate-in fade-in duration-500 pb-32">
            <div className="primary-gradient rounded-[10px] p-6 text-white premium-shadow relative overflow-hidden">
              <div className="relative z-10 flex items-center justify-between mb-6">
                <div className="space-y-1">
                  <p className="text-white/70 text-[10px] font-bold uppercase">إحصائيات اليوم</p>
                  <h3 className="text-xl font-black">أداء رائع يا بطل!</h3>
                </div>
                <Trophy className="h-8 w-8 text-white/50" />
              </div>
              <div className="grid grid-cols-3 gap-3 relative z-10">
                {[
                  { icon: Footprints, label: 'خطوات', val: dailyStats.steps },
                  { icon: Dumbbell, label: 'ضغط', val: dailyStats.pushups },
                  { icon: TimerReset, label: 'حبل', val: dailyStats.jumprope },
                  { icon: Zap, label: 'سكوات', val: dailyStats.squats },
                  { icon: Flame, label: 'بطن', val: dailyStats.abs },
                  { icon: Activity, label: 'عقلة', val: dailyStats.pullups }
                ].map((stat, i) => (
                  <div key={i} className="bg-white/10 p-2.5 rounded-[12px] backdrop-blur-md border border-white/10 flex flex-col items-center justify-center text-center">
                    <stat.icon className="h-4 w-4 text-white/50 mb-1" />
                    <p className="text-[8px] font-bold text-white/60">{stat.label}</p>
                    <p className="text-sm font-black">{stat.val}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground/90 font-cairo">ابدأ نشاطك</h3>
              <div className="space-y-4">
                {[
                  { id: 'run', view: 'running' as const, hint: 'running person', desc: 'تتبع مسارك عبر GPS واحسب خطواتك بدقة' },
                  { id: 'gym', view: 'gym' as const, hint: 'gym weightlifting', desc: 'نظام مرن لجدولة تمارين الحديد والعضلات' },
                  { id: 'pushups', view: 'rep_counter' as const, hint: 'pushups exercise', desc: 'سجل عدد عدات تمارين الضغط وراقب تقدمك' },
                  { id: 'jumprope', view: 'rep_counter' as const, hint: 'skipping rope', desc: 'تمرين ممتاز لحرق الدهون وتحسين اللياقة' },
                  { id: 'squats', view: 'rep_counter' as const, hint: 'squats exercise', desc: 'قوي عضلات الساقين والارداف بسهولة' },
                  { id: 'abs', view: 'rep_counter' as const, hint: 'abs workout', desc: 'ركز على عضلات البطن للحصول على قوام متناسق' },
                  { id: 'pullups', view: 'rep_counter' as const, hint: 'pull-up exercise', desc: 'تقوية عضلات الظهر والذراعين' }
                ].map((ex) => (
                  <div key={ex.id} onClick={() => { setActiveExercise(ex.id as ExerciseType); setView(ex.view); }} className="bg-white p-4 rounded-[12px] premium-shadow border border-border/40 flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer group">
                    <div className="h-16 w-16 rounded-[12px] overflow-hidden relative shrink-0 shadow-md">
                      <Image src={getExerciseImage(ex.id) || "https://picsum.photos/seed/exercise/200/200"} alt={ex.id} fill className="object-cover" data-ai-hint={ex.hint} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-foreground mb-0.5">{getExerciseName(ex.id)}</h4>
                      <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">{ex.desc}</p>
                    </div>
                    <ChevronLeft className="h-4 w-4 text-slate-300" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === 'gym' && <GymWorkoutScreen onBack={() => setView('hub')} />}

        {view === 'running' && (
          <div className={`animate-in slide-in-from-bottom-4 duration-500 pb-32 ${isMapExpanded ? 'fixed inset-0 z-[60] bg-background' : ''}`}>
            {isMapExpanded ? (
              <div className="h-full w-full flex flex-col">
                 <div className="absolute top-10 right-6 z-[70]">
                   <Button onClick={() => setIsMapExpanded(false)} size="icon" className="rounded-full h-12 w-12 bg-white shadow-xl text-foreground"><Minimize2 className="h-6 w-6" /></Button>
                 </div>
                 <MapComponent path={historyPath || path.map(p => [p.lat, p.lng])} isStatic={!!historyPath} />
              </div>
            ) : (
              <div className="px-6 py-6 space-y-6">
                <div className={`rounded-[15px] py-4 px-5 text-white premium-shadow relative overflow-hidden transition-all duration-700 ${isTracking ? 'bg-red-600' : 'primary-gradient'}`}>
                  <div className="relative z-10">
                    <h3 className="text-lg font-black mb-4">{isTracking ? 'جاري التتبع...' : 'جلسة جديدة'}</h3>
                    <div className="grid grid-cols-3 gap-2 mb-5">
                      <div className="text-center bg-white/10 py-2 rounded-lg">
                        <Clock className="h-3.5 w-3.5 mx-auto mb-0.5 opacity-50"/><p className="text-[8px] font-bold opacity-70">الوقت</p><p className="text-xs font-black tabular-nums">{formatTime(elapsedTime)}</p>
                      </div>
                      <div className="text-center bg-white/10 py-2 rounded-lg">
                        <Footprints className="h-3.5 w-3.5 mx-auto mb-0.5 opacity-50"/><p className="text-[8px] font-bold opacity-70">الخطوات</p><p className="text-xs font-black tabular-nums">{steps}</p>
                      </div>
                      <div className="text-center bg-white/10 py-2 rounded-lg">
                        <Navigation className="h-3.5 w-3.5 mx-auto mb-0.5 opacity-50"/><p className="text-[8px] font-bold opacity-70">المسافة</p><p className="text-xs font-black tabular-nums">{distance.toFixed(2)} كم</p>
                      </div>
                    </div>
                    {!historyPath && (
                      <Button onClick={toggleTracking} className="w-full h-11 bg-white text-primary rounded-[12px] font-black">{isTracking ? 'إنهاء الجلسة' : 'ابدأ الآن'}</Button>
                    )}
                    {historyPath && <Button onClick={() => setHistoryPath(null)} className="w-full h-11 bg-white/20 text-white rounded-[12px]">العودة</Button>}
                  </div>
                </div>
                <div className="h-80 w-full rounded-[15px] overflow-hidden bg-slate-50 border relative">
                  <Button variant="ghost" size="icon" onClick={() => setIsMapExpanded(true)} className="absolute top-2 right-2 z-10 bg-white shadow-md"><Maximize2 className="h-4 w-4" /></Button>
                  <MapComponent path={historyPath || path.map(p => [p.lat, p.lng])} isStatic={!!historyPath} />
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'rep_counter' && (
          <div className="px-6 py-6 space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-32">
             <div className={`rounded-[20px] p-5 text-white premium-shadow relative overflow-hidden transition-all duration-700 ${isTracking ? 'bg-green-600' : 'primary-gradient'}`}>
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-[12px] bg-white/20 flex items-center justify-center">{getExerciseIcon(activeExercise)}</div>
                    <div><h3 className="text-sm font-black">{getExerciseName(activeExercise)}</h3><p className="text-white/70 text-[8px] font-bold uppercase">{isTracking ? "حافظ على وتيرتك" : "اضغط للبدء"}</p></div>
                  </div>
                  <div className="text-left"><p className="text-[8px] font-bold opacity-60">وقت الجلسة</p><p className="text-2xl font-black tabular-nums">{formatTime(elapsedTime)}</p></div>
                </div>
                <Button onClick={toggleTracking} className="w-full h-11 bg-white text-primary rounded-[12px] font-black mt-4">{isTracking ? 'إنهاء التمرين' : 'ابدأ الآن'}</Button>
             </div>
             <Dialog open={showRepDialog} onOpenChange={setShowRepDialog}>
                <DialogContent className="font-cairo sm:max-w-md">
                  <DialogHeader className="text-center"><DialogTitle className="text-2xl font-black">أحسنت!</DialogTitle><DialogDescription>كم عدد العدّات التي قمت بها؟</DialogDescription></DialogHeader>
                  <Input type="number" placeholder="مثلاً: 25" value={inputReps} onChange={(e) => setInputReps(e.target.value)} className="h-14 text-center text-2xl font-black" />
                  <DialogFooter className="flex-row gap-3"><Button onClick={handleFinalRepSave} className="flex-1 h-12 primary-gradient text-white font-black">حفظ</Button></DialogFooter>
                </DialogContent>
             </Dialog>
          </div>
        )}

        {view === 'stats' && (
           <div className="px-6 py-6 space-y-8 animate-in slide-in-from-bottom-4 pb-32">
              <h3 className="text-lg font-bold">تقدمك في الجري (كم)</h3>
              <div className="h-60 w-full bg-white p-4 rounded-[15px] premium-shadow border"><ResponsiveContainer width="100%" height="100%"><AreaChart data={statsData}><XAxis dataKey="name" /><YAxis hide /><Tooltip /><Area type="monotone" dataKey="distance" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} /></AreaChart></ResponsiveContainer></div>
           </div>
        )}
      </div>
    </div>
  );
}
