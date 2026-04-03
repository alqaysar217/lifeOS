
"use client"

import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Play, MapPin, Clock, Zap, Target, Dumbbell, ChevronRight, 
  Navigation, Activity, Square, Loader2, Footprints, 
  ChevronLeft, History, BarChart3, Plus, Trophy, Timer,
  Tally5, CheckCircle2, Trash2, AlertTriangle, Calendar as CalendarIcon,
  PlusCircle, Flag, TimerReset, AlertCircle, Settings2
} from "lucide-react";
import dynamic from "next/dynamic";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection, serverTimestamp, query, orderBy, doc, Timestamp } from "firebase/firestore";
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
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
  
  // Running & Challenge combined states
  const [distance, setDistance] = useState(0); 
  const [steps, setSteps] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [path, setPath] = useState<{lat: number, lng: number}[]>([]);
  
  // Challenge config
  const [isChallengeMode, setIsChallengeMode] = useState(false);
  const [challengeTargetSteps, setChallengeTargetSteps] = useState<string>("500");
  const [challengeTargetMinutes, setChallengeTargetMinutes] = useState<string>("5");
  const [challengeTimeRemaining, setChallengeTimeRemaining] = useState(0);
  const [challengeResult, setChallengeResult] = useState<'win' | 'lose' | null>(null);

  // Rep counter stats
  const [reps, setReps] = useState(0);

  // Manual entry state
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);
  const [manualDistance, setManualDistance] = useState("");
  const [manualSteps, setManualSteps] = useState("");
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);

  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const watchId = useRef<number | null>(null);
  const lastCoord = useRef<GeolocationCoordinates | null>(null);
  const lastStepTime = useRef<number>(0);
  const wakeLock = useRef<any>(null);
  const challengeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fitnessQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'fitnessRecords'), orderBy('date', 'desc'));
  }, [db, user]);

  const { data: records, isLoading: isHistoryLoading } = useCollection(fitnessQuery);

  const statsData = useMemo(() => {
    if (!records) return [];
    return [...records].reverse().slice(-7).map(r => ({
      name: r.date?.seconds ? new Date(r.date.seconds * 1000).toLocaleDateString('ar-EG', { weekday: 'short' }) : '؟',
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
    if (isTracking && !isChallengeMode) {
      timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isTracking, isChallengeMode]);

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
        
        // Reset states
        setDistance(0); setSteps(0); setElapsedTime(0); setPath([]); lastCoord.current = null;
        setChallengeResult(null);
        
        setIsTracking(true);
        requestWakeLock();
        window.addEventListener('devicemotion', handleMotion);

        // Start GPS tracking
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

        // Start Challenge Timer if mode active
        if (isChallengeMode) {
          const targetTimeSec = parseInt(challengeTargetMinutes) * 60;
          setChallengeTimeRemaining(targetTimeSec);
          challengeTimerRef.current = setInterval(() => {
            setChallengeTimeRemaining(prev => {
              if (prev <= 1) {
                stopAndSave();
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
      } else {
        setIsTracking(true);
        requestWakeLock();
        setElapsedTime(0);
        setReps(0);
      }
    } else {
      stopAndSave();
    }
  };

  const stopAndSave = () => {
    setIsTracking(false);
    releaseWakeLock();
    
    if (challengeTimerRef.current) clearInterval(challengeTimerRef.current);
    
    if (activeExercise === 'run') {
      window.removeEventListener('devicemotion', handleMotion);
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
      
      let finalResult: 'win' | 'lose' | null = null;
      if (isChallengeMode) {
        const target = parseInt(challengeTargetSteps);
        finalResult = steps >= target ? 'win' : 'lose';
        setChallengeResult(finalResult);
      }

      if (db && user) {
        addDocumentNonBlocking(collection(db, 'users', user.uid, 'fitnessRecords'), {
          type: isChallengeMode ? 'challenge' : 'run',
          date: serverTimestamp(),
          steps: steps,
          distance: Number(distance.toFixed(3)),
          reps: 0,
          durationSeconds: isChallengeMode ? (parseInt(challengeTargetMinutes) * 60 - challengeTimeRemaining) : elapsedTime,
          userId: user.uid,
          path: path,
          result: finalResult,
          targetSteps: isChallengeMode ? parseInt(challengeTargetSteps) : null
        });
      }
      
      if (!isChallengeMode) {
        toast({ title: "تم الحفظ", description: "تم تسجيل النشاط بنجاح." });
      }
    } else {
      if (db && user) {
        addDocumentNonBlocking(collection(db, 'users', user.uid, 'fitnessRecords'), {
          type: activeExercise,
          date: serverTimestamp(),
          reps: reps,
          durationSeconds: elapsedTime,
          userId: user.uid
        });
      }
      setView('hub');
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

  const renderHub = () => (
    <div className="px-6 py-6 space-y-8 animate-in fade-in duration-500">
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

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground/90 font-cairo">اختر تمرينك</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsManualDialogOpen(true)}
            className="h-8 rounded-[8px] text-[10px] font-bold border-primary/20 bg-primary/5 text-primary"
          >
            <PlusCircle className="h-3 w-3 ml-1" /> إضافة سجل سابق
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <ExerciseCard icon={Navigation} label="الجري والمشي" sub="تتبع GPS وتحديات" color="bg-blue-500" onClick={() => { setActiveExercise('run'); setView('running'); }} />
          <ExerciseCard icon={Dumbbell} label="تمارين الضغط" sub="عدّ يدوي" color="bg-orange-500" onClick={() => { setActiveExercise('pushups'); setView('rep_counter'); }} />
          <ExerciseCard icon={Zap} label="نط الحبل" sub="عدّ يدوي" color="bg-yellow-500" onClick={() => { setActiveExercise('jumprope'); setView('rep_counter'); }} />
          <ExerciseCard icon={Activity} label="تمارين البطن" sub="عدّ يدوي" color="bg-purple-500" onClick={() => { setActiveExercise('abs'); setView('rep_counter'); }} />
          <ExerciseCard icon={BarChart3} label="الإحصائيات" sub="عرض التقدم" color="bg-slate-800" onClick={() => setView('stats')} />
        </div>
      </div>

      <div className="space-y-4 pb-20">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground/90 font-cairo">سجل النشاطات</h3>
          <History className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="space-y-3">
          {isHistoryLoading ? (
            <div className="py-10 text-center text-xs text-muted-foreground">جاري تحميل السجل...</div>
          ) : records && records.length > 0 ? (
            records.slice(0, 10).map((r) => (
              <div key={r.id} className="bg-white p-4 rounded-[10px] premium-shadow border border-border/40 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-[8px] flex items-center justify-center ${r.type === 'run' ? 'bg-blue-50' : r.type === 'challenge' ? 'bg-red-50' : 'bg-orange-50'}`}>
                    {r.type === 'run' ? <Navigation className="h-5 w-5 text-blue-500" /> : r.type === 'challenge' ? <Flag className="h-5 w-5 text-red-500" /> : <Dumbbell className="h-5 w-5 text-orange-500" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{getExerciseName(r.type)}</h4>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      {r.date?.seconds ? new Date(r.date.seconds * 1000).toLocaleString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'قيد الحفظ'}
                      {r.type === 'challenge' && ` (${r.result === 'win' ? 'فوز' : 'خسارة'})`}
                    </p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-primary">
                    {r.type === 'run' || r.type === 'challenge' ? `${r.distance || 0} كم` : `${r.reps || 0} عدة`}
                  </p>
                  <p className="text-[8px] font-bold text-muted-foreground uppercase">{r.steps ? `${r.steps} خطوة` : formatTime(r.durationSeconds || 0)}</p>
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
        {/* Challenge Setup - Only visible when not tracking */}
        {!isTracking && !challengeResult && (
          <div className="bg-white p-6 rounded-[15px] premium-shadow border border-border/40 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-bold">بدء تحدي جديد</h3>
              </div>
              <Switch checked={isChallengeMode} onCheckedChange={setIsChallengeMode} />
            </div>

            {isChallengeMode && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">هدف الخطوات</Label>
                    <Input 
                      type="number" 
                      value={challengeTargetSteps} 
                      onChange={(e) => setChallengeTargetSteps(e.target.value)}
                      className="h-11 rounded-[10px] border-primary/10 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">الوقت (دقائق)</Label>
                    <Input 
                      type="number" 
                      value={challengeTargetMinutes} 
                      onChange={(e) => setChallengeTargetMinutes(e.target.value)}
                      className="h-11 rounded-[10px] border-primary/10 font-bold"
                    />
                  </div>
                </div>
                <div className="bg-primary/5 p-3 rounded-[10px] flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-[10px] font-medium text-primary/80">سيقوم النظام بالمقارنة التلقائية لخطواتك مع الهدف عند انتهاء الوقت.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Stats Card */}
        <div className={`rounded-[15px] p-6 text-white premium-shadow relative overflow-hidden transition-all duration-700 ${isTracking ? (isChallengeMode ? 'bg-red-600' : 'bg-red-500') : 'primary-gradient'}`}>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-black">{isTracking ? 'جاري التتبع...' : 'جاهز للبدء؟'}</h3>
                <p className="text-white/70 text-[10px] font-bold uppercase">{isChallengeMode ? 'وضع التحدي النشط' : 'جلسة جري حرة'}</p>
              </div>
              {isTracking && isChallengeMode && (
                <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/20">
                  <TimerReset className="h-4 w-4" />
                  <span className="text-xs font-black tabular-nums">{formatTime(challengeTimeRemaining)}</span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-8">
              <StatItem icon={Clock} label="الوقت" value={isChallengeMode ? formatTime(parseInt(challengeTargetMinutes) * 60 - challengeTimeRemaining) : formatTime(elapsedTime)} />
              <StatItem icon={Footprints} label="الخطوات" value={steps} />
              <StatItem icon={Navigation} label="المسافة" value={`${distance.toFixed(2)} كم`} />
            </div>

            {challengeResult ? (
              <div className="space-y-4 animate-in zoom-in-95">
                <div className={`p-4 rounded-[12px] flex items-center gap-4 ${challengeResult === 'win' ? 'bg-green-500' : 'bg-slate-900'}`}>
                  {challengeResult === 'win' ? <Trophy className="h-8 w-8 text-white" /> : <AlertCircle className="h-8 w-8 text-white" />}
                  <div>
                    <h4 className="font-black text-base">{challengeResult === 'win' ? 'تم تحقيق الهدف!' : 'لم تنجح هذه المرة'}</h4>
                    <p className="text-white/70 text-[10px] font-bold">لقد حققت {steps} خطوة من أصل {challengeTargetSteps}</p>
                  </div>
                </div>
                <Button onClick={() => setChallengeResult(null)} variant="secondary" className="w-full h-12 rounded-[12px] font-black text-slate-900">بدء جلسة جديدة</Button>
              </div>
            ) : (
              <Button 
                onClick={toggleTracking} 
                variant="secondary"
                className={`w-full h-14 rounded-[12px] font-black text-base shadow-2xl active:scale-95 transition-all border-none hover:bg-white/90 ${isTracking ? 'bg-white text-red-500' : 'bg-white text-primary'}`}
              >
                {isTracking ? <><Square className="h-5 w-5 ml-2 fill-current" /> إنهاء الجلسة</> : <><Play className="h-5 w-5 ml-2 fill-current" /> {isChallengeMode ? 'ابدأ التحدي' : 'ابدأ الجري'}</>}
              </Button>
            )}
          </div>
          <div className="absolute -right-20 -bottom-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
        </div>

        {/* Progress Bar for Challenge */}
        {isTracking && isChallengeMode && (
          <div className="bg-white p-5 rounded-[15px] premium-shadow border border-border/40 space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-xs font-bold text-foreground">التقدم نحو الهدف</span>
              <span className="text-[10px] font-black text-primary">{Math.min(Math.round((steps / parseInt(challengeTargetSteps)) * 100), 100)}%</span>
            </div>
            <Progress value={Math.min((steps / parseInt(challengeTargetSteps)) * 100, 100)} className="h-2.5" />
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-foreground/90 font-cairo">خارطة المسار</h3>
          <div className="h-80 w-full rounded-[15px] overflow-hidden bg-slate-50 border border-border/40 shadow-inner premium-shadow relative">
            <MapComponent path={path.map(p => [p.lat, p.lng])} />
            {!isTracking && path.length === 0 && (
              <div className="absolute inset-0 z-10 bg-black/5 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3">
                <MapPin className="h-12 w-12 text-primary/30" />
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">انتظار إشارة الموقع</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground/90 font-cairo">سجل النشاطات الأخيرة</h3>
            <History className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {records?.filter(r => r.type === 'run' || r.type === 'challenge').slice(0, 5).map((r) => (
              <div key={r.id} className="bg-white p-4 rounded-[12px] premium-shadow border border-border/40 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-[10px] flex items-center justify-center ${r.type === 'challenge' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                    {r.type === 'challenge' ? <Flag className="h-5 w-5" /> : <Navigation className="h-5 w-5" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{r.distance} كم</h4>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      {r.date?.seconds ? new Date(r.date.seconds * 1000).toLocaleString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'قيد الحفظ'}
                    </p>
                  </div>
                </div>
                <div className="text-left flex items-center gap-3">
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">{formatTime(r.durationSeconds || 0)}</p>
                    <p className={`text-[8px] font-bold ${r.result === 'win' ? 'text-green-500' : 'text-primary'}`}>{r.steps} خطوة {r.result && `(${r.result === 'win' ? 'فوز' : 'خسارة'})`}</p>
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/40 hover:text-destructive hover:bg-destructive/5 rounded-full">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="font-cairo" dir="rtl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-right">حذف السجل؟</AlertDialogTitle>
                        <AlertDialogDescription className="text-right">لا يمكن استعادة السجل بعد حذفه.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-row-reverse gap-2">
                        <AlertDialogAction onClick={() => handleDeleteRecord(r.id)} className="bg-destructive text-white font-bold">حذف</AlertDialogAction>
                        <AlertDialogCancel className="font-bold">إلغاء</AlertDialogCancel>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderRepCounter = () => (
    <div className="px-6 py-6 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className={`rounded-[15px] p-8 text-white premium-shadow text-center relative overflow-hidden transition-all duration-700 ${isTracking ? 'bg-green-600' : 'primary-gradient'}`}>
        <div className="relative z-10 space-y-6">
          <div className="h-16 w-16 rounded-[12px] bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 mx-auto shadow-xl">
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
            <Button onClick={toggleTracking} className="w-full h-12 rounded-[12px] bg-white text-primary font-black text-base shadow-2xl active:scale-95 transition-all">
              <Play className="h-5 w-5 ml-2 fill-current" /> ابدأ التمرين
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-4">
                <Button onClick={() => setReps(prev => Math.max(0, prev - 1))} variant="ghost" className="h-12 w-12 rounded-[12px] bg-white/20 text-white font-black text-xl border border-white/30">-</Button>
                <Button onClick={() => setReps(prev => prev + 1)} className="flex-1 h-12 rounded-[12px] bg-white text-green-600 font-black text-base shadow-xl">+</Button>
              </div>
              <Button onClick={stopAndSave} className="w-full h-12 rounded-[12px] bg-red-500 text-white font-black text-base shadow-xl">إنهاء وحفظ</Button>
            </div>
          )}
        </div>
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
      </div>

      <div className="bg-white p-6 rounded-[15px] premium-shadow border border-border/40 flex items-start gap-4">
        <div className="h-10 w-10 rounded-[12px] bg-primary/5 flex items-center justify-center shrink-0">
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
        <div className="h-60 w-full bg-white p-4 rounded-[15px] premium-shadow border border-border/40">
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
        <div className="h-60 w-full bg-white p-4 rounded-[15px] premium-shadow border border-border/40">
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
        <div className="bg-white p-6 rounded-[15px] premium-shadow border border-border/40 text-center">
          <Trophy className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
          <p className="text-[10px] font-bold text-muted-foreground uppercase">أفضل مسافة</p>
          <h4 className="text-xl font-black">{Math.max(...(records?.map(r => r.distance || 0) || [0])).toFixed(1)} <span className="text-xs">كم</span></h4>
        </div>
        <div className="bg-white p-6 rounded-[15px] premium-shadow border border-border/40 text-center">
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
    <div onClick={onClick} className="bg-white p-5 rounded-[12px] premium-shadow border border-border/40 space-y-4 active:scale-95 transition-all cursor-pointer group">
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
    <div className="text-center p-3 bg-white/5 rounded-[12px] backdrop-blur-sm border border-white/5 shadow-inner">
      <Icon className="h-4 w-4 mx-auto mb-2 text-white/50" />
      <p className="text-[9px] font-bold text-white/60 uppercase mb-1">{label}</p>
      <p className="text-base font-black tabular-nums">{value}</p>
    </div>
  );
}
