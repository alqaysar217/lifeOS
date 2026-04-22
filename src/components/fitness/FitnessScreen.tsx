
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
  LayoutGrid,
  Share2,
  Download,
  Mountain
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
import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, serverTimestamp, doc, query, orderBy } from "firebase/firestore";
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
  const [elevationGain, setElevationGain] = useState(0);
  const [steps, setSteps] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [path, setPath] = useState<{lat: number, lng: number, alt?: number | null}[]>([]);
  const [historyPath, setHistoryPath] = useState<[number, number][] | null>(null);
  
  // Share Card State
  const [showShareModal, setShowShareModal] = useState(false);
  const [lastWorkoutData, setLastWorkoutData] = useState<any>(null);

  // Rep counter states
  const [reps, setReps] = useState(0);
  const [showRepDialog, setShowRepDialog] = useState(false);
  const [inputReps, setInputReps] = useState("");

  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => (db && user) ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile } = useDoc(userDocRef);
  
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

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isTracking) {
        if (activeExercise === 'run' && distance > 0.01) {
          saveRunRecord();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isTracking, activeExercise, distance, steps, elapsedTime, path, elevationGain]);

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

  const saveRunRecord = () => {
    if (db && user && distance > 0) {
      const runData = {
        type: 'run',
        date: serverTimestamp(),
        steps: steps,
        distance: Number(distance.toFixed(3)),
        elevationGain: Math.round(elevationGain),
        reps: 0,
        durationSeconds: elapsedTime,
        userId: user.uid,
        path: path,
      };
      addDocumentNonBlocking(collection(db, 'users', user.uid, 'fitnessRecords'), runData);
      setLastWorkoutData(runData);
      setShowShareModal(true);
    }
  };

  const toggleTracking = async () => {
    if (!isTracking) {
      if (activeExercise === 'run') {
        if (!navigator.geolocation) return toast({ variant: "destructive", title: "Error", description: "GPS not supported." });
        setDistance(0); setElevationGain(0); setSteps(0); setElapsedTime(0); setPath([]); lastCoord.current = null;
        setHistoryPath(null);
        setIsTracking(true);
        await requestWakeLock();
        window.addEventListener('devicemotion', handleMotion);
        watchId.current = navigator.geolocation.watchPosition(
          (pos) => {
            const current = { lat: pos.coords.latitude, lng: pos.coords.longitude, alt: pos.coords.altitude };
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

              if (pos.coords.altitude !== null && lastCoord.current.altitude !== null) {
                const altDiff = pos.coords.altitude - lastCoord.current.altitude;
                if (altDiff > 1) {
                  setElevationGain(prev => prev + altDiff);
                }
              }
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
        saveRunRecord();
        toast({ title: "Saved", description: "Activity recorded successfully." });
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
    toast({ title: "Saved", description: "Workout recorded successfully." });
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
    toast({ title: "Deleted", description: "Record removed successfully." });
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

  const exportShareCard = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 1080;
    canvas.height = 1440;

    // IMPORTANT: No background fill. Canvas remains transparent (muffaragha)

    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Typography Setup
    const dataDistance = (lastWorkoutData?.distance || distance).toFixed(2);
    const dataElevation = Math.round(lastWorkoutData?.elevationGain || elevationGain);
    const dataTime = formatTime(lastWorkoutData?.durationSeconds || elapsedTime);

    // Row 1: Distance
    ctx.font = "bold 44px Arial";
    ctx.fillText("DISTANCE", 540, 150);
    ctx.font = "black 160px Arial";
    ctx.fillText(`${dataDistance} KM`, 540, 260);

    // Row 2: Elevation
    ctx.font = "bold 44px Arial";
    ctx.fillText("ELEVATION GAIN", 540, 420);
    ctx.font = "bold 130px Arial";
    ctx.fillText(`${dataElevation} M`, 540, 520);

    // Row 3: Time
    ctx.font = "bold 44px Arial";
    ctx.fillText("DURATION", 540, 680);
    ctx.font = "bold 130px Arial";
    ctx.fillText(dataTime, 540, 780);

    // Row 4: Path Visualization (Professional constrained scale)
    if (path.length > 1) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.lineWidth = 14;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      
      const lats = path.map(p => p.lat);
      const lngs = path.map(p => p.lng);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      
      const drawWidth = 500;
      const drawHeight = 250;
      const centerX = 540;
      const centerY = 1040;

      const latRange = maxLat - minLat || 0.00001;
      const lngRange = maxLng - minLng || 0.00001;
      const scale = Math.min(drawWidth / lngRange, drawHeight / latRange) * 0.9;

      path.forEach((p, i) => {
        const x = centerX + (p.lng - (minLng + maxLng) / 2) * scale;
        const y = centerY - (p.lat - (minLat + maxLat) / 2) * scale;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // Row 5: Branding
    ctx.font = "bold 56px Arial";
    ctx.fillText("LifeOS - My Personal Assistant", 540, 1280);
    ctx.font = "bold 28px Arial";
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.fillText("POWERED BY HAYATI", 540, 1340);

    // Download PNG
    const link = document.createElement("a");
    link.download = `Hayati-Transparent-${new Date().getTime()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast({ title: "Success", description: "Transparent achievement card saved!" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/5 px-6 pt-10 pb-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={view === 'hub' ? onBack : () => setView('hub')} className="h-10 w-10 rounded-[10px] bg-white border border-border/40 premium-shadow transition-none">
              <ChevronRight className="h-5 w-5 text-foreground" />
            </Button>
            <h2 className="text-2xl font-extrabold text-foreground font-cairo">
              {view === 'hub' ? 'اللياقة البدنية' : view === 'stats' ? 'الإحصائيات' : getExerciseName(activeExercise)}
            </h2>
          </div>
          {view === 'hub' && (
             <Button variant="ghost" size="icon" onClick={() => setView('stats')} className="h-10 w-10 rounded-[10px] bg-white border border-border/40 premium-shadow text-primary transition-none">
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
                  { id: 'pushups', view: 'rep_counter' as const, hint: 'pushups exercise', desc: 'سجل عدد عدات تمارين الضغط وراقب تقدمك' },
                  { id: 'jumprope', view: 'rep_counter' as const, hint: 'skipping rope', desc: 'تمرين ممتاز لحرق الدهون وتحسين اللياقة' },
                  { id: 'squats', view: 'rep_counter' as const, hint: 'squats exercise', desc: 'قوي عضلات الساقين والارداف بسهولة' },
                  { id: 'abs', view: 'rep_counter' as const, hint: 'abs workout', desc: 'ركز على عضلات البطن للحصول على قوام متناسق' },
                  { id: 'pullups', view: 'rep_counter' as const, hint: 'pull-up exercise', desc: 'تقوية عضلات الظهر والذراعين' },
                  { id: 'gym', view: 'gym' as const, hint: 'gym weightlifting', desc: 'نظام مرن لجدولة تمارين الحديد والعضلات' }
                ].map((ex) => (
                  <div key={ex.id} onClick={() => { setActiveExercise(ex.id as ExerciseType); setView(ex.view); }} className={`bg-white p-4 rounded-[10px] premium-shadow border border-border/40 flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer group ${ex.id === 'gym' ? 'order-last' : ''}`}>
                    <div className="h-16 w-16 rounded-[10px] overflow-hidden relative shrink-0 shadow-md">
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
              <div className="h-full w-full flex flex-col bg-background">
                 {/* Close Button */}
                 <div className="absolute top-6 right-6 z-[70]">
                   <Button onClick={() => setIsMapExpanded(false)} size="icon" className="rounded-full h-10 w-10 bg-white/90 backdrop-blur-sm shadow-xl text-foreground hover:bg-white transition-none"><X className="h-5 w-5" /></Button>
                 </div>

                 {/* Top Stats Overlay (No Background) */}
                 {!historyPath && (
                   <div className="absolute top-8 left-0 right-0 z-[70] flex justify-center pointer-events-none">
                     <div className="flex gap-8 items-center text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                       <div className="text-center">
                         <p className="text-[9px] font-bold opacity-70 uppercase tracking-widest">KM</p>
                         <p className="text-2xl font-black tabular-nums">{distance.toFixed(2)}</p>
                       </div>
                       <div className="text-center">
                         <p className="text-[9px] font-bold opacity-70 uppercase tracking-widest">M</p>
                         <p className="text-2xl font-black tabular-nums">{Math.round(elevationGain)}</p>
                       </div>
                       <div className="text-center">
                         <p className="text-[9px] font-bold opacity-70 uppercase tracking-widest">TIME</p>
                         <p className="text-2xl font-black tabular-nums">{formatTime(elapsedTime)}</p>
                       </div>
                     </div>
                   </div>
                 )}

                 <div className="h-full w-full">
                    <MapComponent path={historyPath || path.map(p => [p.lat, p.lng])} isStatic={!!historyPath} />
                 </div>
              </div>
            ) : (
              <div className="px-6 py-6 space-y-8">
                <div className={`rounded-[10px] py-6 px-6 text-white premium-shadow relative overflow-hidden transition-all duration-700 ${isTracking ? 'bg-orange-600' : 'primary-gradient'}`}>
                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-black">{isTracking ? 'Tracking Session' : 'New Run'}</h3>
                      {isTracking && <div className="h-2 w-2 rounded-full bg-white animate-ping" />}
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-8">
                      <div className="text-center space-y-1">
                        <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Distance</p>
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-3xl font-black tabular-nums">{distance.toFixed(2)}</span>
                          <span className="text-[10px] font-bold">km</span>
                        </div>
                      </div>
                      <div className="text-center space-y-1 border-x border-white/10">
                        <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Elevation</p>
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-3xl font-black tabular-nums">{Math.round(elevationGain)}</span>
                          <span className="text-[10px] font-bold">m</span>
                        </div>
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Time</p>
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-3xl font-black tabular-nums">{formatTime(elapsedTime)}</span>
                        </div>
                      </div>
                    </div>

                    {!historyPath && (
                      <Button onClick={toggleTracking} className="w-full h-14 bg-white text-primary rounded-[10px] font-black shadow-xl transition-none active:scale-95">
                        {isTracking ? 'Stop & Save' : 'Start Running'}
                      </Button>
                    )}
                    {historyPath && (
                      <div className="flex gap-2">
                        <Button onClick={() => setHistoryPath(null)} className="flex-1 h-12 bg-white/20 text-white rounded-[10px] transition-none">Resume Tracking</Button>
                        <Button onClick={() => setShowShareModal(true)} className="h-12 w-12 bg-white text-primary rounded-[10px] flex items-center justify-center transition-none"><Share2 className="h-5 w-5" /></Button>
                      </div>
                    )}
                  </div>
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                </div>

                <div className="h-80 w-full rounded-[10px] overflow-hidden bg-slate-50 border border-border/40 premium-shadow relative">
                  <Button variant="ghost" size="icon" onClick={() => setIsMapExpanded(true)} className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-md shadow-md transition-none"><Maximize2 className="h-4 w-4" /></Button>
                  <MapComponent path={historyPath || path.map(p => [p.lat, p.lng])} isStatic={!!historyPath} />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-foreground/90 font-cairo">سجل الأنشطة الأخيرة</h3>
                  {exerciseHistory.length > 0 ? (
                    <div className="space-y-3">
                      {exerciseHistory.map((rec) => (
                        <div key={rec.id} onClick={() => handleRecordClick(rec)} className="bg-white p-5 rounded-[10px] premium-shadow border border-border/40 flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer group">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-[10px] bg-primary/5 flex items-center justify-center text-primary shadow-sm">
                              <Mountain className="h-6 w-6" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-black">{rec.distance} كم</p>
                                <span className="text-[10px] font-bold text-muted-foreground/60">+{rec.elevationGain || 0} م</span>
                              </div>
                              <p className="text-[10px] text-muted-foreground font-bold">{rec.date?.seconds ? new Date(rec.date.seconds * 1000).toLocaleDateString('ar-EG') : 'تاريخ غير معروف'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                             <div className="text-left">
                               <span className="block text-[10px] font-black text-foreground">{formatTime(rec.durationSeconds || 0)}</span>
                               <span className="block text-[8px] font-bold text-muted-foreground uppercase">الوقت</span>
                             </div>
                             <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10"
                              onClick={(e) => { e.stopPropagation(); handleDeleteRecord(rec.id); }}
                            >
                               <Trash2 className="h-4 w-4" />
                             </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center bg-white rounded-[10px] border border-dashed border-border/60">
                      <Activity className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
                      <p className="text-xs font-bold text-muted-foreground">لا توجد سجلات بعد. ابدأ رحلتك!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'rep_counter' && (
          <div className="px-6 py-6 space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-32">
             <div className={`rounded-[10px] p-5 text-white premium-shadow relative overflow-hidden transition-all duration-700 ${isTracking ? 'bg-green-600' : 'primary-gradient'}`}>
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-[10px] bg-white/20 flex items-center justify-center">{getExerciseIcon(activeExercise)}</div>
                    <div><h3 className="text-sm font-black">{getExerciseName(activeExercise)}</h3><p className="text-white/70 text-[8px] font-bold uppercase">{isTracking ? "حافظ على وتيرتك" : "اضغط للبدء"}</p></div>
                  </div>
                  <div className="text-left"><p className="text-[8px] font-bold opacity-60">Session Time</p><p className="text-2xl font-black tabular-nums">{formatTime(elapsedTime)}</p></div>
                </div>
                <Button onClick={toggleTracking} className="w-full h-11 bg-white text-primary rounded-[10px] font-black mt-4 transition-none">
                  {isTracking ? 'Finish' : 'Start Now'}
                </Button>
             </div>

             <div className="space-y-4">
               <h3 className="text-lg font-bold text-foreground/90 font-cairo">سجل الأداء التاريخي</h3>
               {exerciseHistory.length > 0 ? (
                 <div className="space-y-3">
                   {exerciseHistory.map((rec) => (
                     <div key={rec.id} className="bg-white p-4 rounded-[10px] premium-shadow border border-border/40 flex items-center justify-between group">
                       <div className="flex items-center gap-4">
                         <div className="h-10 w-10 rounded-[10px] bg-primary/5 flex items-center justify-center text-primary">
                           {getExerciseIcon(activeExercise)}
                         </div>
                         <div>
                           <p className="text-sm font-bold">{rec.reps} عدّة</p>
                           <p className="text-[10px] text-muted-foreground">{rec.date?.seconds ? new Date(rec.date.seconds * 1000).toLocaleDateString('ar-EG') : 'تاريخ غير معروف'}</p>
                         </div>
                       </div>
                       <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-muted-foreground">{formatTime(rec.durationSeconds || 0)}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10"
                            onClick={() => handleDeleteRecord(rec.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                       </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="py-10 text-center text-xs text-muted-foreground">ابدأ تمرينك الأول اليوم لبناء سجلك الخاص!</div>
               )}
             </div>

             <Dialog open={showRepDialog} onOpenChange={setShowRepDialog}>
                <DialogContent className="font-cairo rounded-[10px] sm:max-w-md">
                  <DialogHeader className="text-center">
                    <DialogTitle className="text-xl font-black">Well done!</DialogTitle>
                    <DialogDescription className="text-xs">How many reps did you achieve in this session?</DialogDescription>
                  </DialogHeader>
                  <Input type="number" placeholder="e.g. 25" value={inputReps} onChange={(e) => setInputReps(e.target.value)} className="h-14 text-center text-2xl font-black rounded-[10px]" />
                  <DialogFooter className="flex-row gap-3"><Button onClick={handleFinalRepSave} className="flex-1 h-12 primary-gradient text-white font-black rounded-[10px] transition-none">Save Reps</Button></DialogFooter>
                </DialogContent>
             </Dialog>
          </div>
        )}

        {view === 'stats' && (
           <div className="px-6 py-6 space-y-8 animate-in slide-in-from-bottom-4 pb-32">
              <h3 className="text-lg font-bold">تحليل التقدم في المسافة (كم)</h3>
              <div className="h-60 w-full bg-white p-4 rounded-[10px] premium-shadow border"><ResponsiveContainer width="100%" height="100%"><AreaChart data={statsData}><XAxis dataKey="name" /><YAxis hide /><Tooltip /><Area type="monotone" dataKey="distance" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} /></AreaChart></ResponsiveContainer></div>
              
              <h3 className="text-lg font-bold">تحليل التكرارات (آخر 7 جلسات)</h3>
              <div className="h-60 w-full bg-white p-4 rounded-[10px] premium-shadow border"><ResponsiveContainer width="100%" height="100%"><LineChart data={statsData}><XAxis dataKey="name" /><YAxis hide /><Tooltip /><Line type="monotone" dataKey="reps" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 6, fill: '#8b5cf6' }} /></LineChart></ResponsiveContainer></div>
           </div>
        )}
      </div>

      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-[340px] mx-auto overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Workout Achievement</DialogTitle>
          </DialogHeader>
          <div className="bg-slate-900 p-8 rounded-[24px] text-white space-y-8 relative overflow-hidden flex flex-col items-center shadow-2xl">
            <div className="relative z-10 w-full space-y-6">
              
              {/* Distance Section */}
              <div className="text-center space-y-0.5">
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">DISTANCE</p>
                <div className="flex items-baseline justify-center gap-1.5">
                  <p className="text-4xl font-black tabular-nums">{(lastWorkoutData?.distance || distance).toFixed(2)}</p>
                  <p className="text-sm font-bold opacity-60">KM</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center space-y-0.5 border-r border-white/10">
                  <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">ELEVATION</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <p className="text-2xl font-black tabular-nums">{Math.round(lastWorkoutData?.elevationGain || elevationGain)}</p>
                    <p className="text-[10px] font-bold opacity-50">M</p>
                  </div>
                </div>
                <div className="text-center space-y-0.5">
                  <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">DURATION</p>
                  <p className="text-2xl font-black tabular-nums">{formatTime(lastWorkoutData?.durationSeconds || elapsedTime)}</p>
                </div>
              </div>

              {/* Path Visualization Area */}
              <div className="w-full h-36 bg-white/5 rounded-[16px] relative overflow-hidden flex items-center justify-center border border-white/5">
                <svg viewBox="0 0 100 100" className="w-full h-full opacity-70 stroke-primary fill-none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d={path.length > 1 ? `M ${path.map((p, i) => {
                    const lats = path.map(pt => pt.lat);
                    const lngs = path.map(pt => pt.lng);
                    const minLat = Math.min(...lats);
                    const maxLat = Math.max(...lats);
                    const minLng = Math.min(...lngs);
                    const maxLng = Math.max(...lngs);
                    const latR = maxLat - minLat || 0.00001;
                    const lngR = maxLng - minLng || 0.00001;
                    const x = 50 + ((p.lng - (minLng + maxLng) / 2) / lngR) * 80;
                    const y = 50 - ((p.lat - (minLat + maxLat) / 2) / latR) * 80;
                    return `${x},${y}`;
                  }).join(' L ')}` : ''} />
                </svg>
              </div>

              {/* App Branding */}
              <div className="text-center space-y-1">
                <p className="text-sm font-black tracking-tight text-white/90">LifeOS - Personal Assistant</p>
                <p className="text-[8px] font-bold text-white/30 uppercase tracking-[0.2em]">POWERED BY HAYATI</p>
              </div>

              <div className="flex gap-3 w-full pt-4">
                <Button onClick={exportShareCard} className="flex-1 h-12 bg-white text-slate-900 rounded-[12px] font-black shadow-lg transition-none flex items-center justify-center gap-2 text-sm">
                  <Download className="h-4 w-4" />
                  Transparent PNG
                </Button>
                <Button variant="ghost" onClick={() => setShowShareModal(false)} className="h-12 w-12 rounded-[12px] bg-white/10 text-white transition-none border-none">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <div className="absolute -left-16 -top-16 w-60 h-60 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -right-16 -bottom-16 w-60 h-60 bg-primary/10 rounded-full blur-3xl" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
