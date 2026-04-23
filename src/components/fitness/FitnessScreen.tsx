
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
  Mountain,
  RotateCcw
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
import { collection, serverTimestamp, doc, query, orderBy, limit } from "firebase/firestore";
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
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  
  // Persistence state
  const [hasStoredSession, setHasStoredSession] = useState(false);

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

  const fitnessQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'fitnessRecords'), orderBy('date', 'desc'), limit(50));
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

  const exerciseHistory = useMemo(() => {
    if (!records) return [];
    return records.filter(r => r.type === activeExercise);
  }, [records, activeExercise]);

  const watchId = useRef<number | null>(null);
  const lastCoord = useRef<GeolocationCoordinates | null>(null);
  const lastStepTime = useRef<number>(0);
  const wakeLock = useRef<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('active_fitness_session');
    if (stored) setHasStoredSession(true);
  }, []);

  useEffect(() => {
    if (isTracking && activeExercise === 'run') {
      const session = {
        distance, elevationGain, steps, elapsedTime, path,
        lastCoord: lastCoord.current ? {
          latitude: lastCoord.current.latitude,
          longitude: lastCoord.current.longitude,
          altitude: lastCoord.current.altitude
        } : null,
        timestamp: Date.now()
      };
      localStorage.setItem('active_fitness_session', JSON.stringify(session));
    }
  }, [isTracking, distance, elevationGain, steps, elapsedTime, path]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTracking) {
      timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => { if (timer) clearInterval(timer); };
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
      localStorage.removeItem('active_fitness_session');
      setHasStoredSession(false);
    }
  };

  const toggleTracking = async () => {
    if (!isTracking) {
      setDistance(0); setElevationGain(0); setSteps(0); setElapsedTime(0); setPath([]); lastCoord.current = null;
      setHistoryPath(null); setSelectedRecord(null);
      setIsTracking(true);
      window.addEventListener('devicemotion', handleMotion);
      startGpsTracking();
    } else {
      setIsTracking(false);
      window.removeEventListener('devicemotion', handleMotion);
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
      saveRunRecord();
    }
  };

  const startGpsTracking = () => {
    if (!navigator.geolocation) return;
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const current = { lat: pos.coords.latitude, lng: pos.coords.longitude, alt: pos.coords.altitude };
        if (lastCoord.current) {
          const R = 6371;
          const dLat = (pos.coords.latitude - lastCoord.current.latitude) * Math.PI / 180;
          const dLon = (pos.coords.longitude - lastCoord.current.longitude) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lastCoord.current.latitude * Math.PI / 180) * Math.cos(pos.coords.latitude * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const d = R * c;
          if (d > 0.002 && d < 0.05) {
            setDistance(prev => prev + d);
            setPath(prev => [...prev, current]);
            if (pos.coords.altitude !== null && lastCoord.current.altitude !== null) {
              const altDiff = pos.coords.altitude - lastCoord.current.altitude;
              if (altDiff > 1.5) setElevationGain(prev => prev + altDiff);
            }
          }
        } else {
          setPath([current]);
        }
        lastCoord.current = pos.coords;
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
    );
  };

  const handleRecordClick = (record: any) => {
    if (record.path) {
      setSelectedRecord(record);
      setHistoryPath(record.path.map((p: any) => [p.lat, p.lng]));
      setView('running');
      setIsTracking(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const exportShareCard = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Mobile aspect ratio 9:16 (1080x1920)
    canvas.width = 1080;
    canvas.height = 1920;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const dataDistance = (selectedRecord?.distance || lastWorkoutData?.distance || distance).toFixed(2);
    const dataElevation = Math.round(selectedRecord?.elevationGain || lastWorkoutData?.elevationGain || elevationGain);
    const dataTime = formatTime(selectedRecord?.durationSeconds || lastWorkoutData?.durationSeconds || elapsedTime);
    const currentPath = selectedRecord?.path || lastWorkoutData?.path || path;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white"; 

    // Row 1: Distance
    ctx.font = "bold 40px Arial";
    ctx.fillText("DISTANCE", 540, 200);
    ctx.font = "black 220px Arial";
    ctx.fillText(`${dataDistance} KM`, 540, 360);

    // Row 2: Elevation
    ctx.font = "bold 40px Arial";
    ctx.fillText("ELEVATION GAIN", 540, 560);
    ctx.font = "bold 140px Arial";
    ctx.fillText(`${dataElevation} M`, 540, 680);

    // Row 3: Duration
    ctx.font = "bold 40px Arial";
    ctx.fillText("DURATION", 540, 880);
    ctx.font = "bold 140px Arial";
    ctx.fillText(dataTime, 540, 1000);

    // Row 4: Path Visualization
    if (currentPath && currentPath.length > 1) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.lineWidth = 14;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      
      const lats = currentPath.map((p: any) => p.lat);
      const lngs = currentPath.map((p: any) => p.lng);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      
      const drawWidth = 600;
      const drawHeight = 400;
      const centerX = 540;
      const centerY = 1350;

      const latRange = maxLat - minLat || 0.00001;
      const lngRange = maxLng - minLng || 0.00001;
      const scale = Math.min(drawWidth / lngRange, drawHeight / latRange) * 0.9;

      currentPath.forEach((p: any, i: number) => {
        const x = centerX + (p.lng - (minLng + maxLng) / 2) * scale;
        const y = centerY - (p.lat - (minLat + maxLat) / 2) * scale;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // Row 5: Branding
    ctx.font = "bold 60px Arial";
    ctx.fillText("LifeOS - My Personal Assistant", 540, 1750);
    ctx.font = "bold 30px Arial";
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fillText("POWERED BY HAYATI", 540, 1820);

    const link = document.createElement("a");
    link.download = `Hayati-Achievement-${new Date().getTime()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast({ title: "تم تصدير الصورة", description: "تم حفظ الصورة بنجاح على جهازك." });
  };

  const handleDeleteRecord = (recordId: string) => {
    if (!db || !user) return;
    deleteDocumentNonBlocking(doc(db, 'users', user.uid, 'fitnessRecords', recordId));
    if (selectedRecord?.id === recordId) {
      setSelectedRecord(null);
      setHistoryPath(null);
    }
    toast({ title: "تم الحذف", description: "تم مسح السجل بنجاح." });
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h > 0 ? h + ':' : ''}${m < 10 && h > 0 ? '0' : ''}${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const getExerciseName = (type: string) => {
    switch (type) {
      case 'run': return 'الجري والمشي';
      case 'pushups': return 'تمارين الضغط';
      case 'jumprope': return 'نط الحبل';
      case 'squats': return 'تمارين القرفصاء';
      case 'abs': return 'تمارين البطن';
      case 'pullups': return 'تمارين العقلة';
      case 'gym': return 'تمارين الحديد';
      default: return 'تمرين رياضي';
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/5 px-6 pt-10 pb-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={view === 'hub' ? onBack : () => { setView('hub'); setHistoryPath(null); setSelectedRecord(null); }} className="h-10 w-10 rounded-[10px] bg-white border border-border/40 premium-shadow">
              <ChevronRight className="h-5 w-5 text-foreground" />
            </Button>
            <h2 className="text-2xl font-extrabold text-foreground font-cairo">
              {view === 'hub' ? 'اللياقة البدنية' : getExerciseName(activeExercise)}
            </h2>
          </div>
          {view === 'hub' && (
             <Button variant="ghost" size="icon" onClick={() => setView('stats')} className="h-10 w-10 rounded-[10px] bg-white border border-border/40 premium-shadow text-primary">
              <BarChart3 className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        {view === 'hub' && (
          <div className="px-6 py-6 space-y-8 animate-in fade-in duration-500">
            <div className="primary-gradient rounded-[10px] p-6 text-white premium-shadow relative overflow-hidden">
              <div className="relative z-10 flex items-center justify-between mb-6">
                <div className="space-y-1">
                  <p className="text-white/70 text-[10px] font-bold uppercase">إحصائيات اليوم</p>
                  <h3 className="text-xl font-black">أداء رائع يا بطل!</h3>
                </div>
                <Trophy className="h-8 w-8 text-white/50" />
              </div>
              <div className="grid grid-cols-3 gap-3 relative z-10 text-center">
                <div className="bg-white/10 p-2.5 rounded-[12px] backdrop-blur-md border border-white/10">
                  <p className="text-[8px] font-bold text-white/60">خطوات</p>
                  <p className="text-sm font-black">{dailyStats.steps}</p>
                </div>
                <div className="bg-white/10 p-2.5 rounded-[12px] backdrop-blur-md border border-white/10">
                  <p className="text-[8px] font-bold text-white/60">ضغط</p>
                  <p className="text-sm font-black">{dailyStats.pushups}</p>
                </div>
                <div className="bg-white/10 p-2.5 rounded-[12px] backdrop-blur-md border border-white/10">
                  <p className="text-[8px] font-bold text-white/60">مسافة</p>
                  <p className="text-sm font-black">{dailyStats.distance.toFixed(1)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground/90 font-cairo">ابدأ نشاطك</h3>
              <div className="space-y-4">
                {[
                  { id: 'run', view: 'running', hint: 'running person', desc: 'تتبع مسارك عبر GPS واحسب خطواتك بدقة' },
                  { id: 'pushups', view: 'rep_counter', hint: 'pushups exercise', desc: 'سجل عدات الضغط وراقب تقدمك' },
                  { id: 'gym', view: 'gym', hint: 'gym workout', desc: 'نظام مرن لجدولة تمارين الحديد' }
                ].map((ex) => (
                  <div key={ex.id} onClick={() => { setActiveExercise(ex.id as ExerciseType); setView(ex.view as FitnessView); }} className="bg-white p-4 rounded-[10px] premium-shadow border border-border/40 flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer group">
                    <div className="h-16 w-16 rounded-[10px] overflow-hidden relative shrink-0 shadow-md">
                      <Image src={`https://picsum.photos/seed/${ex.id}/200/200`} alt={ex.id} fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-foreground">{getExerciseName(ex.id)}</h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{ex.desc}</p>
                    </div>
                    <ChevronLeft className="h-4 w-4 text-slate-300" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === 'running' && (
          <div className={`animate-in slide-in-from-bottom-4 duration-500 ${isMapExpanded ? 'fixed inset-0 z-[60] bg-background' : 'px-6 py-6 space-y-8'}`}>
            {isMapExpanded ? (
              <div className="h-full w-full flex flex-col relative">
                 <div className="absolute top-6 right-6 z-[70]">
                   <Button onClick={() => setIsMapExpanded(false)} size="icon" className="rounded-full h-10 w-10 bg-white/90 backdrop-blur-sm shadow-xl text-foreground"><X className="h-5 w-5" /></Button>
                 </div>

                 <div className="absolute top-10 left-0 right-0 z-[70] flex justify-center gap-8 text-white pointer-events-none drop-shadow-[0_2px_10px_rgba(0,0,0,8)]">
                    <div className="text-center"><p className="text-[10px] font-bold">KM</p><p className="text-2xl font-black">{(selectedRecord?.distance || distance).toFixed(2)}</p></div>
                    <div className="text-center"><p className="text-[10px] font-bold">M</p><p className="text-2xl font-black">{Math.round(selectedRecord?.elevationGain || elevationGain)}</p></div>
                    <div className="text-center"><p className="text-[10px] font-bold">TIME</p><p className="text-2xl font-black">{formatTime(selectedRecord?.durationSeconds || elapsedTime)}</p></div>
                 </div>

                 <div className="flex-1 w-full"><MapComponent path={historyPath || path.map(p => [p.lat, p.lng])} isStatic={!!historyPath} /></div>
              </div>
            ) : (
              <>
                <div className={`rounded-[10px] py-6 px-6 text-white premium-shadow relative overflow-hidden transition-all duration-700 ${isTracking ? 'bg-orange-600' : 'primary-gradient'}`}>
                  <div className="relative z-10 text-center space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1"><p className="text-[9px] font-bold opacity-60">DISTANCE</p><p className="text-3xl font-black">{(selectedRecord?.distance || distance).toFixed(2)}</p></div>
                      <div className="space-y-1"><p className="text-[9px] font-bold opacity-60">ELEVATION</p><p className="text-3xl font-black">{Math.round(selectedRecord?.elevationGain || elevationGain)}</p></div>
                      <div className="space-y-1"><p className="text-[9px] font-bold opacity-60">TIME</p><p className="text-3xl font-black">{formatTime(selectedRecord?.durationSeconds || elapsedTime)}</p></div>
                    </div>

                    <div className="flex gap-2">
                      {!selectedRecord && (
                        <Button onClick={toggleTracking} className="flex-1 h-12 bg-white text-primary rounded-[10px] font-black shadow-xl active:scale-95">
                          {isTracking ? 'إيقاف وحفظ' : 'بدء الركض'}
                        </Button>
                      )}
                      {selectedRecord && (
                        <>
                          <Button onClick={() => { setHistoryPath(null); setSelectedRecord(null); }} className="flex-1 h-12 bg-white/20 text-white rounded-[10px]">نشاط جديد</Button>
                          <Button onClick={() => { setLastWorkoutData(selectedRecord); setShowShareModal(true); }} className="h-12 w-12 bg-white text-primary rounded-[10px] flex items-center justify-center"><Share2 className="h-5 w-5" /></Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {hasStoredSession && !isTracking && !selectedRecord && (
                  <div className="bg-orange-50 border border-orange-200 p-4 rounded-[12px] flex items-center justify-between animate-in slide-in-from-right-2">
                    <div className="flex items-center gap-3">
                      <RotateCcw className="h-5 w-5 text-orange-600" />
                      <p className="text-xs font-bold text-orange-900">لديك جلسة غير مكتملة</p>
                    </div>
                    <Button onClick={() => {
                      const s = JSON.parse(localStorage.getItem('active_fitness_session') || '{}');
                      setDistance(s.distance); setElevationGain(s.elevationGain); setSteps(s.steps); setElapsedTime(s.elapsedTime); setPath(s.path);
                      setView('running'); setIsTracking(true); startGpsTracking();
                    }} size="sm" className="bg-orange-600 text-white rounded-[10px] h-8 font-bold">استئناف</Button>
                  </div>
                )}

                <div className="h-64 w-full rounded-[10px] overflow-hidden bg-slate-50 border relative premium-shadow">
                  <Button variant="ghost" size="icon" onClick={() => setIsMapExpanded(true)} className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-md"><Maximize2 className="h-4 w-4" /></Button>
                  <MapComponent path={historyPath || path.map(p => [p.lat, p.lng])} isStatic={!!historyPath} />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-foreground/90 font-cairo">سجل الأنشطة</h3>
                  {exerciseHistory.length > 0 ? (
                    <div className="space-y-3">
                      {exerciseHistory.map((rec) => (
                        <div key={rec.id} onClick={() => handleRecordClick(rec)} className={`bg-white p-4 rounded-[10px] premium-shadow border flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer group ${selectedRecord?.id === rec.id ? 'border-primary' : 'border-border/40'}`}>
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-[10px] bg-primary/5 flex items-center justify-center text-primary"><Mountain className="h-5 w-5" /></div>
                            <div>
                              <p className="text-sm font-black">{rec.distance} كم</p>
                              <p className="text-[10px] text-muted-foreground font-bold">{rec.date?.seconds ? new Date(rec.date.seconds * 1000).toLocaleDateString('ar-EG') : 'اليوم'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                             <div className="text-left"><p className="text-[10px] font-black">{formatTime(rec.durationSeconds || 0)}</p></div>
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/30 hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteRecord(rec.id); }}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-xs text-muted-foreground border-2 border-dashed rounded-[10px] font-bold">
                      لا توجد سجلات بعد. ابدأ أول رحلة لك الآن!
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {view === 'rep_counter' && (
          <div className="px-6 py-6 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
             <div className={`rounded-[10px] p-5 text-white premium-shadow relative overflow-hidden transition-all duration-700 ${isTracking ? 'bg-green-600' : 'primary-gradient'}`}>
                <div className="text-center space-y-4">
                  <h3 className="text-sm font-black uppercase">{getExerciseName(activeExercise)}</h3>
                  <p className="text-5xl font-black">{reps}</p>
                  <Button onClick={() => { if(!isTracking) { setIsTracking(true); setReps(0); } else { setIsTracking(false); setShowRepDialog(true); } }} className="w-full h-12 bg-white text-primary rounded-[10px] font-black">
                    {isTracking ? 'إكمال الجلسة' : 'ابدأ التكرار'}
                  </Button>
                </div>
             </div>

             <div className="space-y-4">
                <h3 className="text-lg font-bold text-foreground/90 font-cairo">سجل التمرين</h3>
                {exerciseHistory.length > 0 ? (
                  <div className="space-y-3">
                    {exerciseHistory.map((rec) => (
                      <div key={rec.id} className="bg-white p-4 rounded-[10px] premium-shadow border border-border/40 flex items-center justify-between group active:scale-[0.98] transition-all">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-[10px] bg-primary/5 flex items-center justify-center text-primary"><Zap className="h-5 w-5" /></div>
                          <div>
                            <p className="text-sm font-black">{rec.reps} تكرار</p>
                            <p className="text-[10px] text-muted-foreground font-bold">{rec.date?.seconds ? new Date(rec.date.seconds * 1000).toLocaleDateString('ar-EG') : 'اليوم'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="text-left"><p className="text-[10px] font-black">{formatTime(rec.durationSeconds || 0)}</p></div>
                           <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/30 hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteRecord(rec.id); }}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-muted-foreground border-2 border-dashed rounded-[10px]">لا توجد سجلات بعد</div>
                )}
             </div>
          </div>
        )}

        {view === 'gym' && <GymWorkoutScreen onBack={() => setView('hub')} />}
      </div>

      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-[340px] mx-auto overflow-hidden">
          <DialogHeader className="sr-only"><DialogTitle>Achievement Card</DialogTitle></DialogHeader>
          <div className="bg-slate-900 p-8 rounded-[24px] text-white space-y-8 relative overflow-hidden flex flex-col items-center">
            <div className="relative z-10 w-full space-y-10 flex flex-col items-center">
              <div className="text-center space-y-1">
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">DISTANCE</p>
                <p className="text-4xl font-black">{(selectedRecord?.distance || lastWorkoutData?.distance || distance).toFixed(2)} KM</p>
              </div>
              <div className="text-center space-y-1">
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">ELEVATION GAIN</p>
                <p className="text-2xl font-black">{Math.round(selectedRecord?.elevationGain || lastWorkoutData?.elevationGain || elevationGain)} M</p>
              </div>
              <div className="text-center space-y-1">
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">DURATION</p>
                <p className="text-2xl font-black">{formatTime(selectedRecord?.durationSeconds || lastWorkoutData?.durationSeconds || elapsedTime)}</p>
              </div>
              <div className="w-full h-32 bg-white/5 rounded-[16px] relative overflow-hidden flex items-center justify-center border border-white/5">
                <svg viewBox="0 0 100 100" className="w-full h-full opacity-70 stroke-primary fill-none" strokeWidth="3">
                  <path d={(selectedRecord?.path || path).length > 1 ? `M ${(selectedRecord?.path || path).map((p: any, i: number) => {
                    const currentPath = selectedRecord?.path || path;
                    const lats = currentPath.map((pt: any) => pt.lat);
                    const lngs = currentPath.map((pt: any) => pt.lng);
                    const minLat = Math.min(...lats); const maxLat = Math.max(...lats);
                    const minLng = Math.min(...lngs); const maxLng = Math.max(...lngs);
                    const x = 50 + ((p.lng - (minLng + maxLng) / 2) / (maxLng - minLng || 0.0001)) * 80;
                    const y = 50 - ((p.lat - (minLat + maxLat) / 2) / (maxLat - minLat || 0.0001)) * 80;
                    return `${x},${y}`;
                  }).join(' L ')}` : ''} />
                </svg>
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-black">LifeOS - My Personal Assistant</p>
                <p className="text-[8px] font-bold text-white/30 uppercase tracking-[0.2em]">POWERED BY HAYATI</p>
              </div>
              <Button onClick={exportShareCard} className="w-full h-12 bg-white text-slate-900 rounded-[12px] font-black flex items-center justify-center gap-2">
                <Download className="h-4 w-4" /> Download PNG (Transparent)
              </Button>
            </div>
            <div className="absolute -left-16 -top-16 w-60 h-60 bg-primary/10 rounded-full blur-3xl" />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRepDialog} onOpenChange={setShowRepDialog}>
         <DialogContent className="font-cairo rounded-[10px]">
           <DialogHeader><DialogTitle>تمت الجلسة!</DialogTitle></DialogHeader>
           <Input type="number" placeholder="كم عدّة حققت؟" value={inputReps} onChange={(e) => setInputReps(e.target.value)} className="h-14 text-center text-2xl font-black" />
           <Button onClick={() => {
             if(db && user) addDocumentNonBlocking(collection(db, 'users', user.uid, 'fitnessRecords'), { type: activeExercise, date: serverTimestamp(), reps: parseInt(inputReps), durationSeconds: elapsedTime, userId: user.uid });
             setShowRepDialog(false); setInputReps(""); setView('hub');
           }} className="w-full h-12 primary-gradient text-white font-black rounded-[10px]">حفظ النتيجة</Button>
         </DialogContent>
      </Dialog>
    </div>
  );
}
