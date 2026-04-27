
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
  RotateCcw,
  ZapOff,
  Share,
  TrendingUp,
  LineChart as LineChartIcon
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toPng } from 'html-to-image';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, serverTimestamp, doc, query, orderBy, limit, where } from "firebase/firestore";
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { GymWorkoutScreen } from "./GymWorkoutScreen";

const MapComponent = dynamic(() => import("./MapComponent"), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
});

type FitnessView = 'hub' | 'running' | 'rep_counter' | 'stats' | 'gym';
type ExerciseType = 'run' | 'pushups' | 'squats' | 'abs' | 'jumprope' | 'pullups' | 'gym';

interface FitnessScreenProps {
  onBack: () => void;
}

export function FitnessScreen({ onBack }: FitnessScreenProps) {
  const [view, setView] = useState<FitnessView>('hub');
  const [activeExercise, setActiveExercise] = useState<ExerciseType>('run');
  const [isTracking, setIsTracking] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
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
  const [shareData, setShareData] = useState<any>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);

  // Rep counter states
  const [reps, setReps] = useState(0);
  const [showRepDialog, setShowRepDialog] = useState(false);
  const [inputReps, setInputReps] = useState("");

  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const fitnessQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'users', user.uid, 'fitnessRecords'), 
      orderBy('date', 'desc'), 
      limit(100)
    );
  }, [db, user]);

  const { data: records, isLoading: isHistoryLoading } = useCollection(fitnessQuery);

  const dailyStats = useMemo(() => {
    const stats = {
      run: 0,
      pushups: 0,
      abs: 0,
      pullups: 0,
      squats: 0,
      jumprope: 0,
    };
    if (!records) return stats;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySeconds = today.getTime() / 1000;

    return records.reduce((acc, r) => {
      const recordDate = r.date?.seconds || 0;
      if (recordDate >= todaySeconds) {
        if (r.type === 'run') acc.run += (r.distance || 0);
        else if (r.type === 'pushups') acc.pushups += (r.reps || 0);
        else if (r.type === 'abs') acc.abs += (r.reps || 0);
        else if (r.type === 'pullups') acc.pullups += (r.reps || 0);
        else if (r.type === 'squats') acc.squats += (r.reps || 0);
        else if (r.type === 'jumprope') acc.jumprope += (r.reps || 0);
      }
      return acc;
    }, stats);
  }, [records]);

  // Process chart data for each activity
  const chartData = useMemo(() => {
    if (!records) return {};
    
    const types: ExerciseType[] = ['run', 'pushups', 'squats', 'abs', 'jumprope', 'pullups'];
    const results: any = {};

    types.forEach(type => {
      const filtered = records
        .filter(r => r.type === type)
        .sort((a, b) => (a.date?.seconds || 0) - (b.date?.seconds || 0))
        .map(r => ({
          date: r.date?.seconds ? new Date(r.date.seconds * 1000).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }) : 'N/A',
          value: type === 'run' ? r.distance : r.reps,
          fullDate: r.date?.seconds ? new Date(r.date.seconds * 1000).toLocaleString() : 'N/A'
        }));
      results[type] = filtered;
    });

    return results;
  }, [records]);

  const exerciseHistory = useMemo(() => {
    if (!records) return [];
    return records.filter(r => r.type === activeExercise);
  }, [records, activeExercise]);

  const watchId = useRef<number | null>(null);
  const lastCoord = useRef<GeolocationCoordinates | null>(null);
  const lastStepTime = useRef<number>(0);

  useEffect(() => {
    const stored = localStorage.getItem('active_fitness_session');
    if (stored) {
      try {
        const session = JSON.parse(stored);
        if (Date.now() - session.timestamp < 86400000) {
          setHasStoredSession(true);
        } else {
          localStorage.removeItem('active_fitness_session');
        }
      } catch(e) {
        localStorage.removeItem('active_fitness_session');
      }
    }
  }, []);

  useEffect(() => {
    if (isTracking && activeExercise === 'run') {
      const session = {
        distance, elevationGain, steps, elapsedTime, path,
        timestamp: Date.now()
      };
      localStorage.setItem('active_fitness_session', JSON.stringify(session));
    }
  }, [isTracking, distance, elevationGain, steps, elapsedTime, path, activeExercise]);

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
    if (db && user) {
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
      
      localStorage.removeItem('active_fitness_session');
      setHasStoredSession(false);
      
      toast({ title: "تم الحفظ", description: "تم تسجيل الجلسة بنجاح." });
    }
  };

  const toggleTracking = async () => {
    if (!isTracking) {
      if (selectedRecord) {
        setDistance(selectedRecord.distance || 0);
        setElevationGain(selectedRecord.elevationGain || 0);
        setSteps(selectedRecord.steps || 0);
        setElapsedTime(selectedRecord.durationSeconds || 0);
        setPath(selectedRecord.path || []);
        setHistoryPath(null);
        setSelectedRecord(null);
        toast({ title: "استئناف التمرين", description: "جاري إكمال التمرين المختار..." });
      } else {
        setDistance(0); 
        setElevationGain(0); 
        setSteps(0); 
        setElapsedTime(0); 
        setPath([]); 
        setHistoryPath(null); 
        setSelectedRecord(null);
      }
      
      lastCoord.current = null;
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
              if (altDiff > 1.0) setElevationGain(prev => prev + altDiff);
            }
          }
        } else {
          setPath(prev => prev.length === 0 ? [current] : prev);
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
    }
  };

  const handleDeleteRecord = (recordId: string) => {
    if (!db || !user) return;
    deleteDocumentNonBlocking(doc(db, 'users', user.uid, 'fitnessRecords', recordId));
    if (selectedRecord?.id === recordId) {
      setSelectedRecord(null);
      setHistoryPath(null);
    }
    toast({ title: "تم الحفظ", description: "تم إزالة السجل بنجاح." });
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h > 0 ? h + ':' : ''}${m < 10 && h > 0 ? '0' : ''}${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const calculateSpeed = (dist: number, seconds: number) => {
    if (seconds <= 0 || dist <= 0) return "0";
    const hours = seconds / 3600;
    return (dist / hours).toFixed(1);
  };

  const getExerciseName = (type: string) => {
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

  const handleClearStuckSession = () => {
    localStorage.removeItem('active_fitness_session');
    setHasStoredSession(false);
    toast({ title: "تم المسح", description: "تم تنظيف الجلسة المعلقة." });
  };

  const handleResumeSession = () => {
    try {
      const s = JSON.parse(localStorage.getItem('active_fitness_session') || '{}');
      if (s.distance !== undefined) {
        setDistance(s.distance);
        setElevationGain(s.elevationGain);
        setSteps(s.steps || 0);
        setElapsedTime(s.elapsedTime);
        setPath(s.path || []);
        setIsTracking(true);
        startGpsTracking();
        setHasStoredSession(false);
        toast({ title: "تم الاستئناف", description: "عدنا للعمل يا بطل!" });
      }
    } catch (e) {
      handleClearStuckSession();
    }
  };

  const handleExportImage = async () => {
    if (shareCardRef.current === null) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(shareCardRef.current, { 
        cacheBust: true, 
        backgroundColor: 'transparent',
        skipFonts: true,
        pixelRatio: 3, 
      });
      const link = document.createElement('a');
      link.download = `LifeOS-Achievement-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast({ title: "تم التنزيل", description: "تم حفظ بطاقة الإنجاز بدقة عالية بنجاح." });
    } catch (err) {
      console.error('Export error:', err);
      toast({ 
        variant: "destructive", 
        title: "خطأ في التصدير", 
        description: "تعذر تصدير الصورة حالياً." 
      });
    } finally {
      setIsExporting(false);
    }
  };

  const generateSvgPath = (coords: {lat: number, lng: number}[]) => {
    if (!coords || coords.length < 2) return "";
    const lats = coords.map(c => c.lat);
    const lngs = coords.map(c => c.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const width = 280;
    const height = 280;
    const padding = 40;

    const scaleX = (width - 2 * padding) / (maxLng - minLng || 0.000001);
    const scaleY = (height - 2 * padding) / (maxLat - minLat || 0.000001);

    const points = coords.map(c => {
      const x = padding + (c.lng - minLng) * scaleX;
      const y = height - (padding + (c.lat - minLat) * scaleY);
      return `${x},${y}`;
    });

    return `M ${points.join(" L ")}`;
  };

  const activities = [
    { id: 'run', view: 'running', desc: 'تتبع مسارك عبر GPS واحسب خطواتك بدقة', iconId: 'exercise-run' },
    { id: 'abs', view: 'rep_counter', desc: 'تمارين البطن لتقوية العضلات الأساسية', iconId: 'exercise-abs' },
    { id: 'pushups', view: 'rep_counter', desc: 'سجل عدات الضغط وراقب تقدمك القوي', iconId: 'exercise-pushups' },
    { id: 'pullups', view: 'rep_counter', desc: 'تحدي القوة العلوية بتمارين العقلة', iconId: 'exercise-pullups' },
    { id: 'jumprope', view: 'rep_counter', desc: 'تمارين الكارديو السريعة والممتعة', iconId: 'exercise-jumprope' },
    { id: 'squats', view: 'rep_counter', desc: 'بناء قوة الأرجل والتحمل', iconId: 'exercise-squats' },
    { id: 'gym', view: 'gym', desc: 'نظام مرن لجدولة تمارين الحديد والكمال الجسماني', iconId: 'exercise-gym' }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/5 px-6 pt-10 pb-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={view === 'hub' ? onBack : () => { setView('hub'); setHistoryPath(null); setSelectedRecord(null); }} className="h-10 w-10 rounded-[10px] bg-white border border-border/40 premium-shadow hover:bg-white transition-none">
              <ChevronRight className="h-5 w-5 text-foreground" />
            </Button>
            <h2 className="text-2xl font-extrabold text-foreground font-cairo">
              {view === 'hub' ? 'اللياقة البدنية' : view === 'stats' ? 'إحصائيات التقدم' : getExerciseName(activeExercise)}
            </h2>
          </div>
          {view === 'hub' && (
             <Button variant="ghost" size="icon" onClick={() => setView('stats')} className="h-10 w-10 rounded-[10px] bg-white border border-border/40 premium-shadow text-primary transition-none">
              <BarChart3 className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        {view === 'hub' && (
          <div className="px-6 py-6 space-y-8 animate-in fade-in duration-500">
            <div className="primary-gradient rounded-[15px] p-6 text-white premium-shadow relative overflow-hidden">
              <div className="relative z-10 flex items-center justify-between mb-6">
                <div className="space-y-1">
                  <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider">بطاقة أداء اليوم</p>
                  <h3 className="text-xl font-black">أداء رائع يا بطل!</h3>
                </div>
                <Trophy className="h-10 w-10 text-white/30" />
              </div>
              <div className="grid grid-cols-3 gap-3 relative z-10">
                <div className="bg-white/10 p-3 rounded-[12px] backdrop-blur-md border border-white/10 text-center">
                  <Navigation className="h-4 w-4 mx-auto mb-1 text-white/60" />
                  <p className="text-[8px] font-bold text-white/60">جري</p>
                  <p className="text-sm font-black">{dailyStats.run.toFixed(1)}</p>
                </div>
                <div className="bg-white/10 p-3 rounded-[12px] backdrop-blur-md border border-white/10 text-center">
                  <Zap className="h-4 w-4 mx-auto mb-1 text-white/60" />
                  <p className="text-[8px] font-bold text-white/60">ضغط</p>
                  <p className="text-sm font-black">{dailyStats.pushups}</p>
                </div>
                <div className="bg-white/10 p-3 rounded-[12px] backdrop-blur-md border border-white/10 text-center">
                  <Activity className="h-4 w-4 mx-auto mb-1 text-white/60" />
                  <p className="text-[8px] font-bold text-white/60">بطن</p>
                  <p className="text-sm font-black">{dailyStats.abs}</p>
                </div>
                <div className="bg-white/10 p-3 rounded-[12px] backdrop-blur-md border border-white/10 text-center">
                  <Trophy className="h-4 w-4 mx-auto mb-1 text-white/60" />
                  <p className="text-[8px] font-bold text-white/60">عقلة</p>
                  <p className="text-sm font-black">{dailyStats.pullups}</p>
                </div>
                <div className="bg-white/10 p-3 rounded-[12px] backdrop-blur-md border border-white/10 text-center">
                  <Flame className="h-4 w-4 mx-auto mb-1 text-white/60" />
                  <p className="text-[8px] font-bold text-white/60">قرفصاء</p>
                  <p className="text-sm font-black">{dailyStats.squats}</p>
                </div>
                <div className="bg-white/10 p-3 rounded-[12px] backdrop-blur-md border border-white/10 text-center">
                  <Timer className="h-4 w-4 mx-auto mb-1 text-white/60" />
                  <p className="text-[8px] font-bold text-white/60">نط حبل</p>
                  <p className="text-sm font-black">{dailyStats.jumprope}</p>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 h-40 w-40 bg-white/5 rounded-full blur-3xl" />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground/90 font-cairo">الأنشطة الرياضية</h3>
              <div className="space-y-4">
                {activities.map((ex) => (
                  <div 
                    key={ex.id} 
                    onClick={() => { setActiveExercise(ex.id as ExerciseType); setView(ex.view as FitnessView); }} 
                    className="bg-white p-4 rounded-[12px] premium-shadow border border-border/40 flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer group"
                  >
                    <div className="h-14 w-14 rounded-[12px] overflow-hidden relative shrink-0 shadow-md">
                      <Image 
                        src={PlaceHolderImages.find(img => img.id === ex.iconId)?.imageUrl || `https://picsum.photos/seed/${ex.id}/200/200`} 
                        alt={ex.id} 
                        fill 
                        className="object-cover" 
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-foreground">{getExerciseName(ex.id)}</h4>
                      <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">{ex.desc}</p>
                    </div>
                    <ChevronLeft className="h-5 w-5 text-slate-300 group-hover:text-primary transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === 'stats' && (
          <div className="px-6 py-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {['run', 'pushups', 'squats', 'abs', 'jumprope', 'pullups'].map((type) => {
              const data = chartData[type] || [];
              const hasData = data.length > 0;
              const unit = type === 'run' ? 'كم' : 'عدة';
              
              return (
                <div key={type} className="bg-white p-6 rounded-[20px] premium-shadow border border-border/40 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-[12px] primary-gradient flex items-center justify-center text-white shadow-lg">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-foreground">{getExerciseName(type)}</h4>
                        <p className="text-[10px] text-muted-foreground font-bold">تتبع التقدم عبر الزمن</p>
                      </div>
                    </div>
                    {hasData && (
                      <div className="text-left">
                        <p className="text-xs font-black text-primary">
                          {data[data.length - 1].value} {unit}
                        </p>
                        <p className="text-[8px] font-bold text-muted-foreground">آخر تمرين</p>
                      </div>
                    )}
                  </div>

                  {hasData ? (
                    <div className="h-48 w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                          <defs>
                            <linearGradient id={`color-${type}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }}
                            dy={10}
                          />
                          <YAxis hide />
                          <Tooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-white p-3 rounded-[12px] shadow-xl border border-border/50 text-right">
                                    <p className="text-[10px] font-bold text-muted-foreground">{payload[0].payload.fullDate}</p>
                                    <p className="text-xs font-black text-primary">{payload[0].value} {unit}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#8b5cf6" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill={`url(#color-${type})`}
                            animationDuration={1500}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-border/40 rounded-[15px] bg-slate-50/50 space-y-2">
                      <LineChartIcon className="h-8 w-8 text-slate-200" />
                      <p className="text-[10px] font-bold text-muted-foreground">لا توجد بيانات كافية للرسم البياني</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {view === 'running' && (
          <div className={`animate-in slide-in-from-bottom-4 duration-500 ${isMapExpanded ? 'fixed inset-0 z-[60] bg-background' : 'px-6 py-6 space-y-8'}`}>
            {isMapExpanded ? (
              <div className="h-full w-full flex flex-col relative overflow-hidden">
                 <div className="absolute top-6 right-6 z-[70]">
                   <Button onClick={() => setIsMapExpanded(false)} size="icon" className="rounded-full h-10 w-10 bg-white/90 backdrop-blur-sm shadow-xl text-foreground transition-none"><X className="h-5 w-5" /></Button>
                 </div>
                 <div className="flex-1 w-full"><MapComponent path={historyPath || path.map(p => [p.lat, p.lng])} isStatic={!!historyPath} /></div>
              </div>
            ) : (
              <>
                <div className={`rounded-[10px] py-6 px-6 text-white premium-shadow relative overflow-hidden transition-all duration-700 ${isTracking ? 'bg-orange-600' : 'primary-gradient'}`}>
                  <div className="relative z-10 text-center space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1"><p className="text-[9px] font-bold opacity-60 uppercase">DISTANCE</p><p className="text-3xl font-black">{(selectedRecord?.distance || distance).toFixed(2)}</p></div>
                      <div className="space-y-1"><p className="text-[9px] font-bold opacity-60 uppercase">ELEVATION</p><p className="text-3xl font-black">{Math.round(selectedRecord?.elevationGain || elevationGain)}</p></div>
                      <div className="space-y-1"><p className="text-[9px] font-bold opacity-60 uppercase">TIME</p><p className="text-3xl font-black">{formatTime(selectedRecord?.durationSeconds || elapsedTime)}</p></div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={toggleTracking} 
                        className="flex-1 h-12 bg-white text-primary rounded-[10px] font-black shadow-xl active:scale-95 transition-none hover:bg-white hover:opacity-100"
                      >
                        {isTracking ? 'إيقاف وحفظ' : (selectedRecord ? 'استئناف التمرين' : 'بدء الركض')}
                      </Button>
                      {selectedRecord && !isTracking && (
                        <Button 
                          onClick={() => { setHistoryPath(null); setSelectedRecord(null); }} 
                          className="h-12 w-12 bg-white/20 text-white rounded-[10px] flex items-center justify-center p-0 transition-none"
                        >
                          <RotateCcw className="h-5 w-5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {hasStoredSession && !isTracking && !selectedRecord && (
                  <div className="bg-orange-50 border border-orange-200 p-4 rounded-[12px] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <RotateCcw className="h-5 w-5 text-orange-600" />
                      <p className="text-xs font-bold text-orange-900">لديك جلسة غير مكتملة</p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleResumeSession} size="sm" className="bg-orange-600 text-white rounded-[10px] h-8 font-bold transition-none">استئناف</Button>
                      <Button onClick={handleClearStuckSession} variant="ghost" size="sm" className="h-8 w-8 text-orange-400 p-0 hover:bg-transparent transition-none"><X className="h-4 w-4" /></Button>
                    </div>
                  </div>
                )}

                <div className="h-64 w-full rounded-[10px] overflow-hidden bg-slate-50 border relative premium-shadow">
                  <Button variant="ghost" size="icon" onClick={() => setIsMapExpanded(true)} className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-md shadow-md transition-none"><Maximize2 className="h-4 w-4" /></Button>
                  <MapComponent path={historyPath || path.map(p => [p.lat, p.lng])} isStatic={!!historyPath} />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-foreground/90 font-cairo">سجل الأنشطة</h3>
                  {exerciseHistory.length > 0 ? (
                    <div className="space-y-3">
                      {exerciseHistory.map((rec) => (
                        <div key={rec.id} onClick={() => handleRecordClick(rec)} className={`bg-white p-4 rounded-[10px] premium-shadow border flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer ${selectedRecord?.id === rec.id ? 'border-primary ring-2 ring-primary/10' : 'border-border/40'}`}>
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-[10px] bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors"><Mountain className="h-5 w-5" /></div>
                            <div>
                              <p className="text-sm font-black">{rec.distance.toFixed(2)} كم</p>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-muted-foreground font-bold">{rec.date?.seconds ? new Date(rec.date.seconds * 1000).toLocaleDateString('en-US') : 'Now'}</span>
                                <span className="text-[10px] text-primary font-bold">{calculateSpeed(rec.distance, rec.durationSeconds)} km/h</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                             <div className="text-left ml-2"><p className="text-[10px] font-black">{formatTime(rec.durationSeconds || 0)}</p></div>
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-primary/40 hover:text-primary transition-none"
                                onClick={(e) => { e.stopPropagation(); setShareData(rec); setShowShareModal(true); }}
                             >
                                <Share className="h-4 w-4" />
                             </Button>
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-destructive/20 hover:text-destructive transition-none"
                                onClick={(e) => { e.stopPropagation(); handleDeleteRecord(rec.id); }}
                             >
                                <Trash2 className="h-4 w-4" />
                             </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-xs text-muted-foreground border-2 border-dashed rounded-[10px] font-bold">اريد السجل ينحفظ هنا</div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {view === 'rep_counter' && (
          <div className="px-6 py-6 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
             <div className={`rounded-[15px] p-8 text-white premium-shadow relative overflow-hidden transition-all duration-700 ${isTracking ? 'bg-green-600' : 'primary-gradient'}`}>
                <div className="text-center space-y-6 relative z-10">
                  <h3 className="text-sm font-black uppercase tracking-widest">{getExerciseName(activeExercise)}</h3>
                  {isTracking ? (
                    <div className="space-y-2">
                      <p className="text-7xl font-black tabular-nums">{formatTime(elapsedTime)}</p>
                      <p className="text-[10px] font-bold opacity-60">الوقت المنقضي</p>
                    </div>
                  ) : (
                    <p className="text-7xl font-black">{reps}</p>
                  )}
                  <Button 
                    onClick={() => { if(!isTracking) { setIsTracking(true); setReps(0); setElapsedTime(0); } else { setIsTracking(false); setShowRepDialog(true); } }} 
                    className="w-full h-14 bg-white text-primary rounded-[12px] font-black shadow-lg active:scale-95 transition-none hover:bg-white hover:opacity-100"
                  >
                    {isTracking ? 'إكمال الجلسة' : 'ابدأ التكرار'}
                  </Button>
                </div>
                <div className="absolute -top-10 -left-10 h-32 w-32 bg-white/10 rounded-full blur-2xl" />
             </div>

             <div className="space-y-4">
                <h3 className="text-lg font-bold text-foreground/90 font-cairo">سجل التمرين</h3>
                {exerciseHistory.length > 0 ? (
                  <div className="space-y-3">
                    {exerciseHistory.map((rec) => (
                      <div key={rec.id} className="bg-white p-4 rounded-[12px] premium-shadow border border-border/40 flex items-center justify-between group active:scale-[0.98] transition-all">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-[10px] bg-primary/5 flex items-center justify-center text-primary"><Zap className="h-5 w-5" /></div>
                          <div>
                            <p className="text-sm font-black">{rec.reps} تكرار</p>
                            <p className="text-[10px] text-muted-foreground font-bold">{rec.date?.seconds ? new Date(rec.date.seconds * 1000).toLocaleDateString('en-US') : 'Today'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="text-left"><p className="text-[10px] font-black">{formatTime(rec.durationSeconds || 0)}</p></div>
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             className="h-8 w-8 text-destructive/20 hover:text-destructive transition-none" 
                             onClick={(e) => { e.stopPropagation(); handleDeleteRecord(rec.id); }}
                           >
                             <Trash2 className="h-4 w-4" />
                           </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-muted-foreground border-2 border-dashed rounded-[10px] font-bold">اريد السجل ينحفظ هنا</div>
                )}
             </div>
          </div>
        )}

        {view === 'gym' && <GymWorkoutScreen onBack={() => setView('hub')} />}
      </div>

      {/* Share Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="font-cairo rounded-[20px] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-black">مشاركة الإنجاز</DialogTitle>
            <DialogDescription className="text-center font-bold">بطاقة الإنجاز الشفافة لمشاركتها مع أصدقائك</DialogDescription>
          </DialogHeader>
          <div ref={shareCardRef} className="bg-transparent aspect-[9:16] w-full rounded-[25px] p-8 text-white flex flex-col items-center relative overflow-hidden">
             <div className="w-full text-center text-white drop-shadow-md font-bold text-xs mb-8 uppercase tracking-widest">
               {shareData?.date?.seconds ? new Date(shareData.date.seconds * 1000).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Today'}
             </div>

             <div className="flex flex-col items-center gap-2 mb-10 relative z-10 text-white drop-shadow-lg text-center">
               <Navigation className="h-8 w-8 text-white mb-1" />
               <p className="text-[10px] font-black opacity-80 uppercase tracking-widest">DISTANCE</p>
               <h3 className="text-5xl font-black tabular-nums">{shareData?.distance?.toFixed(2)}</h3>
               <p className="text-[10px] font-bold opacity-60">KILOMETERS</p>
             </div>

             <div className="flex flex-col items-center gap-1 mb-8 relative z-10 text-white drop-shadow-lg text-center">
               <div className="flex items-center gap-2">
                 <Mountain className="h-5 w-5" />
                 <span className="text-[10px] font-black uppercase tracking-widest">ELEVATION</span>
               </div>
               <h4 className="text-3xl font-black tabular-nums">{Math.round(shareData?.elevationGain || 0)}</h4>
               <p className="text-[10px] font-bold opacity-60">METERS</p>
             </div>

             <div className="flex flex-col items-center gap-1 mb-10 relative z-10 text-white drop-shadow-lg text-center">
               <div className="flex items-center gap-2">
                 <Clock className="h-5 w-5" />
                 <span className="text-[10px] font-black uppercase tracking-widest">DURATION</span>
               </div>
               <h4 className="text-3xl font-black tabular-nums">{formatTime(shareData?.durationSeconds || 0)}</h4>
             </div>

             <div className="flex-1 w-full flex items-center justify-center relative z-10 mb-8 drop-shadow-xl">
                {shareData?.path && shareData.path.length > 1 ? (
                  <svg width="240" height="240" viewBox="0 0 280 280">
                    <path 
                      d={generateSvgPath(shareData.path)} 
                      fill="none" 
                      stroke="white" 
                      strokeWidth="8" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                  </svg>
                ) : (
                  <div className="text-[10px] text-white/40 font-bold">ROUTE DATA UNAVAILABLE</div>
                )}
             </div>

             <div className="w-full flex items-center justify-between pt-6 relative z-10 text-white drop-shadow-md">
                <span className="text-xs font-black tracking-tighter">LifeOS</span>
                <span className="text-xs font-black font-cairo">حياتي</span>
             </div>
          </div>
          <Button 
            onClick={handleExportImage} 
            disabled={isExporting} 
            className="w-full h-12 primary-gradient text-white font-black rounded-[12px] shadow-lg transition-none hover:opacity-100"
          >
            {isExporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Download className="h-5 w-5 ml-2" /> تنزيل البطاقة (PNG مفرغ)</>}
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={showRepDialog} onOpenChange={setShowRepDialog}>
         <DialogContent className="font-cairo rounded-[15px]">
           <DialogHeader><DialogTitle>تمت الجلسة بنجاح!</DialogTitle></DialogHeader>
           <div className="space-y-4 py-4">
             <Label className="text-center block">كم عدد التكرارات التي قمت بها؟</Label>
             <Input type="number" placeholder="أدخل الرقم هنا..." value={inputReps} onChange={(e) => setInputReps(e.target.value)} className="h-16 text-center text-3xl font-black rounded-[12px]" />
           </div>
           <Button onClick={() => {
             if(db && user) addDocumentNonBlocking(collection(db, 'users', user.uid, 'fitnessRecords'), { type: activeExercise, date: serverTimestamp(), reps: parseInt(inputReps), durationSeconds: elapsedTime, userId: user.uid });
             setShowRepDialog(false); setInputReps(""); setReps(0);
             toast({ title: "تم الحفظ", description: "تم تسجيل مجهودك بنجاح يا بطل!" });
           }} className="w-full h-12 primary-gradient text-white font-black rounded-[12px] shadow-lg transition-none hover:opacity-100">حفظ النتيجة</Button>
         </DialogContent>
      </Dialog>
    </div>
  );
}
