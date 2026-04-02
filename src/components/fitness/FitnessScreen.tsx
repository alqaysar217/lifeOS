
"use client"

import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Play, MapPin, Clock, Zap, Target, Dumbbell, ChevronRight, 
  Navigation, Activity, Square, Loader2, Footprints, 
  ChevronLeft, History, BarChart3, Plus, Trophy, Timer,
  Tally5, CheckCircle2
} from "lucide-react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection, serverTimestamp, query, orderBy, limit } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';

const MapComponent = dynamic(() => import("./MapComponent"), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
});

type FitnessView = 'hub' | 'running' | 'rep_counter' | 'stats';
type ExerciseType = 'run' | 'pushups' | 'squats' | 'abs' | 'jumprope';

interface FitnessScreenProps {
  onBack: () => void;
}

export function FitnessScreen({ onBack }: FitnessScreenProps) {
  const [view, setView] = useState<FitnessView>('hub');
  const [activeExercise, setActiveExercise] = useState<ExerciseType>('run');
  const [isTracking, setIsTracking] = useState(false);
  
  // Running stats
  const [distance, setDistance] = useState(0); 
  const [steps, setSteps] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [path, setPath] = useState<{lat: number, lng: number}[]>([]);
  
  // Rep counter stats
  const [reps, setReps] = useState(0);

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

  const statsData = useMemo(() => {
    if (!records) return [];
    return [...records].reverse().slice(-7).map(r => ({
      name: new Date(r.date?.seconds * 1000).toLocaleDateString('ar-EG', { weekday: 'short' }),
      distance: r.distance || 0,
      steps: r.steps || 0,
      reps: r.reps || 0
    }));
  }, [records]);

  // Wake lock logic
  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLock.current = await (navigator as any).wakeLock.request('screen');
      } catch (err) {}
    }
  };

  const releaseWakeLock = async () => {
    try {
      if (wakeLock.current) {
        await wakeLock.current.release();
        wakeLock.current = null;
      }
    } catch (err) {}
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTracking) {
      timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
    return () => {
      clearInterval(timer);
      releaseWakeLock();
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
      if (!lastCoord.current) setDistance(prev => prev + (0.75 / 1000));
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
        setIsTracking(true);
        setDistance(0); setSteps(0); setElapsedTime(0); setPath([]); lastCoord.current = null;
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
          null, { enableHighAccuracy: true }
        );
      } else {
        setIsTracking(true);
        setElapsedTime(0);
        setReps(0);
      }
    } else {
      stopAndSave();
    }
  };

  const stopAndSave = () => {
    setIsTracking(false);
    if (activeExercise === 'run') {
      window.removeEventListener('devicemotion', handleMotion);
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
    }
    
    if (db && user) {
      addDocumentNonBlocking(collection(db, 'users', user.uid, 'fitnessRecords'), {
        type: activeExercise,
        date: serverTimestamp(),
        steps: activeExercise === 'run' ? steps : 0,
        distance: activeExercise === 'run' ? Number(distance.toFixed(3)) : 0,
        reps: activeExercise !== 'run' ? reps : 0,
        durationSeconds: elapsedTime,
        userId: user.uid,
        path: activeExercise === 'run' ? path : []
      });
      toast({ title: "تم الحفظ", description: "تم تسجيل النشاط في السجل بنجاح." });
    }
    if (activeExercise !== 'run') setView('hub');
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const renderHub = () => (
    <div className="px-6 py-6 space-y-8 animate-in fade-in duration-500">
      {/* Today's Summary */}
      <div className="primary-gradient rounded-[10px] p-6 text-white premium-shadow relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">نشاط اليوم</p>
            <h3 className="text-xl font-black">أداء رائع يا بطل!</h3>
          </div>
          <div className="h-12 w-12 rounded-[10px] bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
            <Trophy className="h-6 w-6 text-white" />
          </div>
        </div>
        <div className="mt-6 flex gap-4">
          <div className="flex-1 bg-white/10 p-3 rounded-[10px] backdrop-blur-sm border border-white/10">
            <Footprints className="h-4 w-4 text-white/50 mb-1" />
            <p className="text-[9px] font-bold text-white/60">الخطوات</p>
            <p className="text-lg font-black">{records?.filter(r => r.date?.seconds > (Date.now() / 1000 - 86400)).reduce((acc, r) => acc + (r.steps || 0), 0) || 0}</p>
          </div>
          <div className="flex-1 bg-white/10 p-3 rounded-[10px] backdrop-blur-sm border border-white/10">
            <Activity className="h-4 w-4 text-white/50 mb-1" />
            <p className="text-[9px] font-bold text-white/60">المسافة</p>
            <p className="text-lg font-black">{(records?.filter(r => r.date?.seconds > (Date.now() / 1000 - 86400)).reduce((acc, r) => acc + (r.distance || 0), 0) || 0).toFixed(1)} <span className="text-[8px]">كم</span></p>
          </div>
        </div>
      </div>

      {/* Exercises Categories */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-foreground/90 font-cairo">اختر تمرينك</h3>
        <div className="grid grid-cols-2 gap-4">
          <ExerciseCard icon={Navigation} label="الجري / المشي" sub="تتبع GPS" color="bg-blue-500" onClick={() => { setActiveExercise('run'); setView('running'); }} />
          <ExerciseCard icon={Dumbbell} label="تمارين الضغط" sub="عدّ يدوي" color="bg-orange-500" onClick={() => { setActiveExercise('pushups'); setView('rep_counter'); }} />
          <ExerciseCard icon={Zap} label="نط الحبل" sub="عدّ يدوي" color="bg-yellow-500" onClick={() => { setActiveExercise('jumprope'); setView('rep_counter'); }} />
          <ExerciseCard icon={Activity} label="تمارين البطن" sub="عدّ يدوي" color="bg-purple-500" onClick={() => { setActiveExercise('abs'); setView('rep_counter'); }} />
          <ExerciseCard icon={Tally5} label="سكوات" sub="عدّ يدوي" color="bg-green-500" onClick={() => { setActiveExercise('squats'); setView('rep_counter'); }} />
          <ExerciseCard icon={BarChart3} label="الإحصائيات" sub="عرض التقدم" color="bg-slate-800" onClick={() => setView('stats')} />
        </div>
      </div>

      {/* History Log */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground/90 font-cairo">سجل النشاطات</h3>
          <History className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="space-y-3">
          {isHistoryLoading ? (
            <div className="py-10 text-center text-xs text-muted-foreground">جاري تحميل السجل...</div>
          ) : records && records.length > 0 ? (
            records.slice(0, 5).map((r, i) => (
              <div key={i} className="bg-white p-4 rounded-[10px] premium-shadow border border-border/40 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-[8px] flex items-center justify-center ${r.type === 'run' ? 'bg-blue-50' : 'bg-orange-50'}`}>
                    {r.type === 'run' ? <Navigation className="h-5 w-5 text-blue-500" /> : <Dumbbell className="h-5 w-5 text-orange-500" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{r.type === 'run' ? 'جري ومشي' : getExerciseName(r.type)}</h4>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      {r.date?.seconds ? new Date(r.date.seconds * 1000).toLocaleString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'قيد الحفظ'}
                    </p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-primary">
                    {r.type === 'run' ? `${r.distance} كم` : `${r.reps} عدة`}
                  </p>
                  <p className="text-[8px] font-bold text-muted-foreground uppercase">{formatTime(r.durationSeconds || 0)}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center space-y-3">
              <History className="h-10 w-10 text-muted-foreground/20 mx-auto" />
              <p className="text-xs font-bold text-muted-foreground">لا توجد تمارين مسجلة حتى الآن</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderRunning = () => (
    <div className="animate-in slide-in-from-bottom-4 duration-500 pb-32">
      <div className="px-6 py-6 space-y-8">
        <div className={`rounded-[10px] p-6 text-white premium-shadow relative overflow-hidden transition-all duration-700 ${isTracking ? 'bg-red-500' : 'primary-gradient'}`}>
          <div className="relative z-10">
            <h3 className="text-lg font-black mb-1">{isTracking ? 'جاري التتبع...' : 'جاهز للبدء؟'}</h3>
            <p className="text-white/70 text-[10px] font-bold uppercase mb-6">كارديو صباحي</p>
            
            <div className="grid grid-cols-3 gap-2 mb-6">
              <StatItem icon={Clock} label="الوقت" value={formatTime(elapsedTime)} />
              <StatItem icon={Footprints} label="الخطوات" value={steps} />
              <StatItem icon={Navigation} label="المسافة" value={`${distance.toFixed(2)} كم`} />
            </div>

            <Button onClick={toggleTracking} className="w-full h-12 rounded-[10px] bg-white text-primary font-black text-base shadow-2xl active:scale-95 transition-all">
              {isTracking ? <><Square className="h-5 w-5 ml-2 fill-current text-red-500" /> إنهاء الجلسة</> : <><Play className="h-5 w-5 ml-2 fill-current" /> ابدأ الجري</>}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-foreground/90 font-cairo">خارطة المسار</h3>
          <div className="h-80 w-full rounded-[10px] overflow-hidden bg-slate-50 border border-border/40 shadow-inner premium-shadow relative">
            <MapComponent path={path.map(p => [p.lat, p.lng])} />
            {!isTracking && path.length === 0 && (
              <div className="absolute inset-0 z-10 bg-black/5 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3">
                <MapPin className="h-12 w-12 text-primary/30" />
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">انتظار إشارة الموقع</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderRepCounter = () => (
    <div className="px-6 py-6 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className={`rounded-[10px] p-8 text-white premium-shadow text-center relative overflow-hidden transition-all duration-700 ${isTracking ? 'bg-green-600' : 'primary-gradient'}`}>
        <div className="relative z-10 space-y-6">
          <div className="h-16 w-16 rounded-[10px] bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 mx-auto shadow-xl">
            <Dumbbell className="h-8 w-8 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-black">{getExerciseName(activeExercise)}</h3>
            <p className="text-white/70 text-[10px] font-bold uppercase">ركز على الجودة قبل السرعة</p>
          </div>
          
          <div className="flex justify-center gap-8 py-2">
            <div className="text-center">
              <p className="text-[10px] font-bold text-white/60 mb-1">الوقت</p>
              <p className="text-2xl font-black tabular-nums">{formatTime(elapsedTime)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold text-white/60 mb-1">العدّات</p>
              <p className="text-2xl font-black tabular-nums">{reps}</p>
            </div>
          </div>

          {!isTracking ? (
            <Button onClick={toggleTracking} className="w-full h-12 rounded-[10px] bg-white text-primary font-black text-base shadow-2xl active:scale-95 transition-all">
              <Play className="h-5 w-5 ml-2 fill-current" /> ابدأ التمرين
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-4">
                <Button onClick={() => setReps(prev => Math.max(0, prev - 1))} variant="ghost" className="h-12 w-12 rounded-[10px] bg-white/20 text-white font-black text-xl border border-white/30">-</Button>
                <Button onClick={() => setReps(prev => prev + 1)} className="flex-1 h-12 rounded-[10px] bg-white text-green-600 font-black text-base shadow-xl">+</Button>
              </div>
              <Button onClick={stopAndSave} className="w-full h-12 rounded-[10px] bg-red-500 text-white font-black text-base shadow-xl">إنهاء وحفظ</Button>
            </div>
          )}
        </div>
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
      </div>

      {/* Instructions */}
      <div className="bg-white p-6 rounded-[10px] premium-shadow border border-border/40 flex items-start gap-4">
        <div className="h-10 w-10 rounded-[10px] bg-primary/5 flex items-center justify-center shrink-0">
          <Timer className="h-5 w-5 text-primary" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-foreground">تعليمات المساعد الذكي</h4>
          <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
            قم بتفعيل المؤقت أولاً، ثم ابدأ التمرين. يمكنك زيادة العداد يدوياً بعد كل عدة أو في نهاية التمرين.
          </p>
        </div>
      </div>
    </div>
  );

  const renderStats = () => (
    <div className="px-6 py-6 space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-32">
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-foreground/90 font-cairo">تقدمك في الجري (كم)</h3>
        <div className="h-60 w-full bg-white p-4 rounded-[10px] premium-shadow border border-border/40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={statsData}>
              <defs>
                <linearGradient id="colorDist" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
              <YAxis hide />
              <Tooltip />
              <Area type="monotone" dataKey="distance" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorDist)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-foreground/90 font-cairo">الخطوات الأسبوعية</h3>
        <div className="h-60 w-full bg-white p-4 rounded-[10px] premium-shadow border border-border/40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={statsData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
              <Tooltip />
              <Line type="monotone" dataKey="steps" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill: "#3b82f6"}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-[10px] premium-shadow border border-border/40 text-center">
          <Trophy className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
          <p className="text-[10px] font-bold text-muted-foreground uppercase">أفضل مسافة</p>
          <h4 className="text-xl font-black">{Math.max(...(records?.map(r => r.distance || 0) || [0])).toFixed(1)} <span className="text-xs">كم</span></h4>
        </div>
        <div className="bg-white p-6 rounded-[10px] premium-shadow border border-border/40 text-center">
          <Activity className="h-6 w-6 text-primary mx-auto mb-2" />
          <p className="text-[10px] font-bold text-muted-foreground uppercase">إجمالي التمارين</p>
          <h4 className="text-xl font-black">{records?.length || 0}</h4>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/5 px-6 pt-10 pb-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={view === 'hub' ? onBack : () => setView('hub')} className="h-10 w-10 rounded-[12px] bg-white border border-border/40 premium-shadow">
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
        {view === 'hub' && renderHub()}
        {view === 'running' && renderRunning()}
        {view === 'rep_counter' && renderRepCounter()}
        {view === 'stats' && renderStats()}
      </div>
    </div>
  );
}

// Helper Components
function ExerciseCard({ icon: Icon, label, sub, color, onClick }: any) {
  return (
    <div onClick={onClick} className="bg-white p-5 rounded-[10px] premium-shadow border border-border/40 space-y-4 active:scale-95 transition-all cursor-pointer group">
      <div className={`h-12 w-12 rounded-[10px] ${color} flex items-center justify-center text-white shadow-lg shadow-black/5 group-hover:scale-110 transition-transform`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <h4 className="text-xs font-bold text-foreground">{label}</h4>
        <p className="text-[9px] text-muted-foreground font-bold uppercase">{sub}</p>
      </div>
    </div>
  );
}

function StatItem({ icon: Icon, label, value }: any) {
  return (
    <div className="text-center p-3 bg-white/5 rounded-[10px] backdrop-blur-sm border border-white/5 shadow-inner">
      <Icon className="h-4 w-4 mx-auto mb-2 text-white/50" />
      <p className="text-[9px] font-bold text-white/60 uppercase mb-1">{label}</p>
      <p className="text-base font-black tabular-nums">{value}</p>
    </div>
  );
}

function getExerciseName(type: ExerciseType): string {
  switch (type) {
    case 'run': return 'الجري والمشي';
    case 'pushups': return 'تمارين الضغط';
    case 'squats': return 'تمارين القرفصاء';
    case 'abs': return 'تمارين البطن';
    case 'jumprope': return 'نط الحبل';
    default: return 'تمرين رياضي';
  }
}
