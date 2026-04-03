
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
  Flame
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

const MapComponent = dynamic(() => import("./MapComponent"), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
});

type FitnessView = 'hub' | 'running' | 'rep_counter' | 'stats';
type ExerciseType = 'run' | 'pushups' | 'squats' | 'abs' | 'jumprope' | 'challenge';

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

  // Grouping records by day for the running view
  const groupedRecords = useMemo(() => {
    if (!records) return {};
    const groups: Record<string, any[]> = {};
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    records.forEach(r => {
      if (r.type !== 'run' && r.type !== 'challenge') return;

      const date = r.date?.seconds ? new Date(r.date.seconds * 1000) : new Date();
      let key = date.toLocaleDateString('ar-EG', { month: 'long', day: 'numeric', year: 'numeric' });
      
      if (date.toDateString() === today.toDateString()) key = "اليوم";
      else if (date.toDateString() === yesterday.toDateString()) key = "أمس";

      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });
    return groups;
  }, [records]);

  // Filtering records for specific rep exercise history
  const exerciseHistory = useMemo(() => {
    if (!records) return [];
    return records.filter(r => r.type === activeExercise);
  }, [records, activeExercise]);

  const statsData = useMemo(() => {
    if (!records) return [];
    return [...records].reverse().slice(-7).map(r => ({
      name: r.date?.seconds ? new Date(r.date.seconds * 1000).toLocaleDateString('ar-EG', { weekday: 'short' }) : '؟',
      distance: r.distance || 0,
      steps: r.steps || 0,
      reps: r.reps || 0
    }));
  }, [records]);

  // Daily Stats Calculation
  const dailyStats = useMemo(() => {
    if (!records) return { steps: 0, distance: 0, pushups: 0, squats: 0, abs: 0, jumprope: 0 };
    
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
      }
      return acc;
    }, { steps: 0, distance: 0, pushups: 0, squats: 0, abs: 0, jumprope: 0 });
  }, [records]);

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

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
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
              const d = calculateDistance(lastCoord.current.latitude, lastCoord.current.longitude, pos.coords.latitude, pos.coords.longitude);
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
      if (activeExercise === 'run') {
        stopAndSave();
      } else {
        setIsTracking(false);
        releaseWakeLock();
        setShowRepDialog(true);
      }
    }
  };

  const stopAndSave = () => {
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
    if (record.type === 'run' || record.type === 'challenge') {
      if (record.path && Array.isArray(record.path)) {
        setHistoryPath(record.path.map((p: any) => [p.lat, p.lng]));
        setActiveExercise('run');
        setView('running');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        toast({ variant: "destructive", title: "بيانات ناقصة", description: "لم يتم العثور على مسار لهذه الجلسة." });
      }
    }
  };

  const handleDeleteRecord = (recordId: string) => {
    if (!db || !user) return;
    const docRef = doc(db, 'users', user.uid, 'fitnessRecords', recordId);
    deleteDocumentNonBlocking(docRef);
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
      case 'challenge': return 'تحدي الخطوات';
      default: return 'تمرين رياضي';
    }
  };

  const getExerciseIcon = (type: string) => {
    switch (type) {
      case 'run': return <Footprints className="h-6 w-6" />;
      case 'pushups': return <Dumbbell className="h-6 w-6" />;
      case 'squats': return <Zap className="h-6 w-6" />;
      case 'abs': return <Activity className="h-6 w-6" />;
      case 'jumprope': return <TimerReset className="h-6 w-6" />;
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
      default: return null;
    }
  };

  const getExerciseColor = (type: string) => {
    switch (type) {
      case 'run': return 'bg-blue-500';
      case 'pushups': return 'bg-orange-500';
      case 'squats': return 'bg-green-600';
      case 'abs': return 'bg-red-500';
      case 'jumprope': return 'bg-purple-600';
      default: return 'bg-primary';
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* الترويسة */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/5 px-6 pt-10 pb-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={view === 'hub' ? onBack : () => { setView('hub'); setHistoryPath(null); }} className="h-10 w-10 rounded-[12px] bg-white border border-border/40 premium-shadow">
              <ChevronRight className="h-5 w-5 text-foreground" />
            </Button>
            <h2 className="text-2xl font-extrabold text-foreground font-cairo">
              {view === 'hub' ? 'اللياقة البدنية' : view === 'stats' ? 'إحصائيات الأداء' : getExerciseName(activeExercise)}
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
        {/* شاشة المركز */}
        {view === 'hub' && (
          <div className="px-6 py-6 space-y-8 animate-in fade-in duration-500 pb-32">
            <div className="primary-gradient rounded-[10px] p-6 text-white premium-shadow relative overflow-hidden">
              <div className="relative z-10 flex items-center justify-between mb-6">
                <div className="space-y-1">
                  <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">إحصائيات اليوم</p>
                  <h3 className="text-xl font-black">أداء رائع يا بطل!</h3>
                </div>
                <Trophy className="h-8 w-8 text-white/50" />
              </div>
              <div className="grid grid-cols-3 gap-3 relative z-10">
                <div className="bg-white/10 p-2.5 rounded-[12px] backdrop-blur-md border border-white/10 flex flex-col items-center justify-center text-center transition-transform hover:scale-105">
                  <Footprints className="h-4 w-4 text-white/50 mb-1" />
                  <p className="text-[8px] font-bold text-white/60">خطوات</p>
                  <p className="text-sm font-black">{dailyStats.steps}</p>
                </div>
                <div className="bg-white/10 p-2.5 rounded-[12px] backdrop-blur-md border border-white/10 flex flex-col items-center justify-center text-center transition-transform hover:scale-105">
                  <Navigation className="h-4 w-4 text-white/50 mb-1" />
                  <p className="text-[8px] font-bold text-white/60">مسافة</p>
                  <p className="text-sm font-black">{dailyStats.distance.toFixed(1)} <span className="text-[8px]">كم</span></p>
                </div>
                <div className="bg-white/10 p-2.5 rounded-[12px] backdrop-blur-md border border-white/10 flex flex-col items-center justify-center text-center transition-transform hover:scale-105">
                  <Dumbbell className="h-4 w-4 text-white/50 mb-1" />
                  <p className="text-[8px] font-bold text-white/60">ضغط</p>
                  <p className="text-sm font-black">{dailyStats.pushups}</p>
                </div>
                <div className="bg-white/10 p-2.5 rounded-[12px] backdrop-blur-md border border-white/10 flex flex-col items-center justify-center text-center transition-transform hover:scale-105">
                  <TimerReset className="h-4 w-4 text-white/50 mb-1" />
                  <p className="text-[8px] font-bold text-white/60">نط حبل</p>
                  <p className="text-sm font-black">{dailyStats.jumprope}</p>
                </div>
                <div className="bg-white/10 p-2.5 rounded-[12px] backdrop-blur-md border border-white/10 flex flex-col items-center justify-center text-center transition-transform hover:scale-105">
                  <Zap className="h-4 w-4 text-white/50 mb-1" />
                  <p className="text-[8px] font-bold text-white/60">سكوات</p>
                  <p className="text-sm font-black">{dailyStats.squats}</p>
                </div>
                <div className="bg-white/10 p-2.5 rounded-[12px] backdrop-blur-md border border-white/10 flex flex-col items-center justify-center text-center transition-transform hover:scale-105">
                  <Activity className="h-4 w-4 text-white/50 mb-1" />
                  <p className="text-[8px] font-bold text-white/60">بطن</p>
                  <p className="text-sm font-black">{dailyStats.abs}</p>
                </div>
              </div>
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground/90 font-cairo">ابدأ نشاطك</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'run', view: 'running' as const, hint: 'running person' },
                  { id: 'pushups', view: 'rep_counter' as const, hint: 'pushups exercise' },
                  { id: 'jumprope', view: 'rep_counter' as const, hint: 'skipping rope' },
                  { id: 'squats', view: 'rep_counter' as const, hint: 'squats exercise' },
                  { id: 'abs', view: 'rep_counter' as const, hint: 'abs workout' },
                ].map((ex) => (
                  <div 
                    key={ex.id}
                    onClick={() => { setActiveExercise(ex.id as ExerciseType); setView(ex.view); }} 
                    className="bg-white p-5 rounded-[12px] premium-shadow border border-border/40 space-y-4 active:scale-95 transition-all cursor-pointer group"
                  >
                    <div className={`h-16 w-full rounded-[10px] relative overflow-hidden transition-transform group-hover:scale-105`}>
                      <Image 
                        src={getExerciseImage(ex.id) || "https://picsum.photos/seed/exercise/200/200"} 
                        alt={ex.id} 
                        fill 
                        className="object-cover"
                        data-ai-hint={ex.hint}
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">{getExerciseName(ex.id)}</h4>
                      <p className="text-[9px] text-muted-foreground font-bold uppercase">
                        {ex.id === 'run' ? 'تتبع GPS' : 'سجل عدّاتك'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground/90 font-cairo">سجل النشاطات</h3>
              <div className="space-y-3">
                {records?.slice(0, 5).map((r) => (
                  <div key={r.id} onClick={() => handleRecordClick(r)} className="bg-white p-4 rounded-[10px] premium-shadow border border-border/40 flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-[8px] flex items-center justify-center bg-slate-50 text-muted-foreground transition-colors group-hover:bg-primary/5 group-hover:text-primary`}>
                        {getExerciseIcon(r.type)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground">{getExerciseName(r.type)}</h4>
                        <p className="text-[10px] text-muted-foreground font-medium">
                          {r.date?.seconds ? new Date(r.date.seconds * 1000).toLocaleString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'قيد المعالجة'}
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-black text-primary">
                        {r.type === 'run' || r.type === 'challenge' ? `${r.distance || 0} كم` : `${r.reps || 0} عدة`}
                      </p>
                      <p className="text-[8px] font-bold text-muted-foreground">{r.steps ? `${r.steps} خطوة` : formatTime(r.durationSeconds || 0)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* شاشة الجري والمشي */}
        {view === 'running' && (
          <div className={`animate-in slide-in-from-bottom-4 duration-500 pb-32 ${isMapExpanded ? 'fixed inset-0 z-[60] bg-background' : ''}`}>
            {isMapExpanded ? (
              <div className="h-full w-full flex flex-col">
                 <div className="absolute top-10 right-6 z-[70] flex gap-2">
                   <Button onClick={() => setIsMapExpanded(false)} size="icon" className="rounded-full h-12 w-12 bg-white shadow-xl text-foreground">
                      <Minimize2 className="h-6 w-6" />
                   </Button>
                 </div>
                 <div className="flex-1">
                    <MapComponent path={historyPath || path.map(p => [p.lat, p.lng])} isStatic={!!historyPath} />
                 </div>
              </div>
            ) : (
              <div className="px-6 py-6 space-y-6">
                <div className={`rounded-[15px] py-4 px-5 text-white premium-shadow relative overflow-hidden transition-all duration-700 ${isTracking ? 'bg-red-600' : historyPath ? 'bg-slate-800' : 'primary-gradient'}`}>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-black">{isTracking ? 'جاري التتبع...' : historyPath ? 'استعراض المسار' : 'جلسة جديدة'}</h3>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mb-5">
                      <div className="text-center bg-white/10 py-2 px-1 rounded-lg">
                        <Clock className="h-3.5 w-3.5 mx-auto mb-0.5 opacity-50"/>
                        <p className="text-[8px] font-bold opacity-70">الوقت</p>
                        <p className="text-xs font-black tabular-nums">{formatTime(elapsedTime)}</p>
                      </div>
                      <div className="text-center bg-white/10 py-2 px-1 rounded-lg">
                        <Footprints className="h-3.5 w-3.5 mx-auto mb-0.5 opacity-50"/>
                        <p className="text-[8px] font-bold opacity-70">الخطوات</p>
                        <p className="text-xs font-black tabular-nums">{steps}</p>
                      </div>
                      <div className="text-center bg-white/10 py-2 px-1 rounded-lg">
                        <Navigation className="h-3.5 w-3.5 mx-auto mb-0.5 opacity-50"/>
                        <p className="text-[8px] font-bold opacity-70">المسافة</p>
                        <p className="text-xs font-black tabular-nums whitespace-nowrap">
                          {distance.toFixed(2)} <span className="text-[9px]">كم</span>
                        </p>
                      </div>
                    </div>

                    {!historyPath && (
                      <Button onClick={toggleTracking} variant="secondary" className={`w-full h-12 rounded-[12px] font-black text-sm shadow-2xl active:scale-95 transition-all ${isTracking ? 'bg-white text-red-500' : 'bg-white text-primary'}`}>
                        {isTracking ? <><Square className="h-4 w-4 ml-2 fill-current" /> إنهاء الجلسة</> : <><Play className="h-4 w-4 ml-2 fill-current" /> ابدأ الآن</>}
                      </Button>
                    )}
                    {historyPath && <Button onClick={() => setHistoryPath(null)} className="w-full h-11 rounded-[12px] bg-white/20 hover:bg-white/30 text-white font-bold border border-white/20 text-xs">العودة للجلسات النشطة</Button>}
                  </div>
                  <div className="absolute -right-20 -bottom-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-foreground/90 font-cairo">الخريطة</h3>
                    <Button variant="ghost" size="icon" onClick={() => setIsMapExpanded(true)} className="h-10 w-10 rounded-[10px] bg-white border border-border/40 premium-shadow">
                      <Maximize2 className="h-5 w-5 text-primary" />
                    </Button>
                  </div>
                  <div className="h-80 w-full rounded-[15px] overflow-hidden bg-slate-50 border border-border/40 shadow-inner relative">
                    <MapComponent path={historyPath || path.map(p => [p.lat, p.lng])} isStatic={!!historyPath} />
                  </div>
                </div>

                <div className="space-y-6 pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-foreground/90 font-cairo">سجل الركض</h3>
                    <div className="h-8 w-8 rounded-[8px] bg-primary/5 text-primary flex items-center justify-center">
                      <History className="h-4 w-4" />
                    </div>
                  </div>

                  {Object.keys(groupedRecords).length > 0 ? (
                    Object.entries(groupedRecords).map(([day, items]) => (
                      <div key={day} className="space-y-3">
                        <div className="flex items-center gap-2 px-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-bold text-muted-foreground">{day}</span>
                        </div>
                        <div className="space-y-2">
                          {items.map((r) => (
                            <div 
                              key={r.id} 
                              onClick={() => handleRecordClick(r)}
                              className="bg-white p-4 rounded-[12px] premium-shadow border border-border/40 flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-[8px] bg-primary/5 text-primary flex items-center justify-center">
                                  <Footprints className="h-4.5 w-4.5" />
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-foreground">ركض/مشي</h4>
                                  <p className="text-[10px] text-muted-foreground">
                                    {r.date?.seconds ? new Date(r.date.seconds * 1000).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '؟'}
                                  </p>
                                </div>
                              </div>
                              <div className="text-left flex items-center gap-3">
                                <div className="text-left">
                                  <p className="text-sm font-black text-foreground whitespace-nowrap">{r.distance?.toFixed(2)} كم</p>
                                  <p className="text-[9px] font-bold text-muted-foreground">{formatTime(r.durationSeconds || 0)}</p>
                                </div>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/30 hover:text-destructive" onClick={(e) => e.stopPropagation()}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent dir="rtl" className="font-cairo">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>حذف السجل؟</AlertDialogTitle>
                                      <AlertDialogDescription>سيتم إزالة هذا النشاط نهائياً من سجلاتك.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="flex-row gap-2">
                                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteRecord(r.id)} className="bg-destructive">حذف</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center space-y-4">
                      <div className="h-16 w-16 rounded-full soft-purple-bg flex items-center justify-center mx-auto opacity-30">
                        <Navigation className="h-8 w-8 text-primary" />
                      </div>
                      <p className="text-xs font-bold text-muted-foreground">لا توجد سجلات ركض بعد</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* شاشة العد اليدوي */}
        {view === 'rep_counter' && (
          <div className="px-6 py-6 space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-32">
             <div className={`rounded-[20px] p-5 text-white premium-shadow relative overflow-hidden transition-all duration-700 ${isTracking ? 'bg-green-600' : 'primary-gradient'}`}>
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-[12px] bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                        {getExerciseIcon(activeExercise)}
                      </div>
                      <div>
                        <h3 className="text-sm font-black">{getExerciseName(activeExercise)}</h3>
                        <p className="text-white/70 text-[8px] font-bold uppercase tracking-widest leading-none">
                          {isTracking ? "حافظ على وتيرتك" : "اضغط للبدء"}
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-[8px] font-bold opacity-60 uppercase mb-0">وقت الجلسة</p>
                      <p className="text-2xl font-black tabular-nums tracking-tight">{formatTime(elapsedTime)}</p>
                    </div>
                  </div>

                  <Button onClick={toggleTracking} className={`w-full h-11 rounded-[12px] font-black text-sm shadow-xl active:scale-95 transition-all ${isTracking ? 'bg-white text-red-600' : 'bg-white text-primary'}`}>
                    {isTracking ? <><Square className="h-4 w-4 ml-2 fill-current" /> إنهاء التمرين</> : <><Play className="h-4 w-4 ml-2 fill-current" /> ابدأ الآن</>}
                  </Button>
                </div>
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
             </div>

             <Dialog open={showRepDialog} onOpenChange={setShowRepDialog}>
                <DialogContent className="font-cairo sm:max-w-md rounded-[20px]">
                  <DialogHeader className="text-center space-y-4">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="h-8 w-8 text-primary" />
                    </div>
                    <DialogTitle className="text-2xl font-black">أحسنت يا بطل!</DialogTitle>
                    <DialogDescription className="text-sm font-bold text-muted-foreground leading-relaxed">
                      لقد تمرنت لمدة <span className="text-primary">{formatTime(elapsedTime)}</span>. 
                      كم عدد العدّات التي قمت بها؟
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-6">
                    <Label htmlFor="reps" className="text-xs font-black text-muted-foreground uppercase mb-2 block">عدد العدّات</Label>
                    <Input 
                      id="reps"
                      type="number" 
                      placeholder="مثلاً: 25" 
                      value={inputReps}
                      onChange={(e) => setInputReps(e.target.value)}
                      className="h-14 text-center text-2xl font-black rounded-[15px] border-primary/20 premium-shadow focus:border-primary"
                      autoFocus
                    />
                  </div>
                  <DialogFooter className="flex-row gap-3">
                    <Button variant="outline" onClick={() => setShowRepDialog(false)} className="flex-1 h-12 rounded-[12px] font-bold">إلغاء</Button>
                    <Button onClick={handleFinalRepSave} disabled={!inputReps} className="flex-1 h-12 rounded-[12px] primary-gradient text-white font-black">حفظ النتيجة</Button>
                  </DialogFooter>
                </DialogContent>
             </Dialog>

             <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-foreground/90 font-cairo">سجل التمارين</h3>
                  <div className="h-8 w-8 rounded-[8px] bg-primary/5 text-primary flex items-center justify-center">
                    <History className="h-4 w-4" />
                  </div>
                </div>

                {exerciseHistory.length > 0 ? (
                  <div className="space-y-3">
                    {exerciseHistory.map((r) => (
                      <div key={r.id} className="bg-white p-4 rounded-[15px] premium-shadow border border-border/40 flex items-center justify-between animate-in fade-in slide-in-from-right-4">
                        <div className="flex items-center gap-4">
                          <div className={`h-11 w-11 rounded-[12px] flex items-center justify-center bg-slate-50`}>
                            {getExerciseIcon(r.type)}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-foreground">{r.reps} عدة</h4>
                            <p className="text-[10px] text-muted-foreground font-bold">
                              {r.date?.seconds ? new Date(r.date.seconds * 1000).toLocaleString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '؟'}
                            </p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-black text-primary">{formatTime(r.durationSeconds || 0)}</p>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/20 hover:text-destructive transition-colors mt-1">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent dir="rtl" className="font-cairo rounded-[20px]">
                              <AlertDialogHeader>
                                <AlertDialogTitle>حذف التمرين؟</AlertDialogTitle>
                                <AlertDialogDescription>سيتم إزالة هذا السجل نهائياً من إحصائياتك.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex-row gap-2">
                                <AlertDialogCancel className="rounded-[10px]">إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteRecord(r.id)} className="bg-destructive rounded-[10px]">حذف</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center space-y-4">
                    <div className="h-16 w-16 rounded-full soft-purple-bg flex items-center justify-center mx-auto opacity-30">
                      <History className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-xs font-bold text-muted-foreground">لا يوجد تاريخ تمارين مسبق لهذا النشاط</p>
                  </div>
                )}
             </div>
          </div>
        )}

        {/* شاشة الإحصائيات */}
        {view === 'stats' && (
           <div className="px-6 py-6 space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-32">
              <h3 className="text-lg font-bold">تقدمك في الجري (كم)</h3>
              <div className="h-60 w-full bg-white p-4 rounded-[15px] premium-shadow border border-border/40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={statsData}><defs><linearGradient id="colorDist" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient></defs><XAxis dataKey="name" /><YAxis hide /><Tooltip /><Area type="monotone" dataKey="distance" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorDist)" /></AreaChart>
                </ResponsiveContainer>
              </div>
           </div>
        )}
      </div>
    </div>
  );
}
