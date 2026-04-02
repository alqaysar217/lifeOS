
"use client"

import React, { useState, useEffect, useRef } from "react";
import { Play, MapPin, Clock, Zap, Target, Dumbbell, ChevronRight, Navigation, Activity, Square, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection, serverTimestamp } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";

// استيراد الخارطة بشكل ديناميكي لتجنب مشاكل SSR في Next.js
const MapComponent = dynamic(() => import("./MapComponent"), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
});

const exercises = [
  { title: "نط الحبل", duration: "10 دقائق", kcal: "120", icon: Dumbbell },
  { title: "تمارين الضغط", duration: "3 مجموعات", kcal: "85", icon: Zap },
  { title: "سكوات", duration: "15 دقيقة", kcal: "100", icon: Target },
];

interface FitnessScreenProps {
  onBack: () => void;
}

export function FitnessScreen({ onBack }: FitnessScreenProps) {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [isTracking, setIsTracking] = useState(false);
  const [distance, setDistance] = useState(0); // بالكيلومتر
  const [elapsedTime, setElapsedTime] = useState(0); // بالثواني
  const [currentSpeed, setCurrentSpeed] = useState(0); // كم/ساعة
  const [path, setPath] = useState<[number, number][]>([]);
  
  const watchId = useRef<number | null>(null);
  const lastCoord = useRef<GeolocationCoordinates | null>(null);

  // استعلام السجلات السابقة
  const fitnessQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'fitnessRecords');
  }, [db, user]);

  const { data: records } = useCollection(fitnessQuery);

  // مؤقت الوقت المستغرق
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTracking) {
      timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTracking]);

  // دالة حساب المسافة بين نقطتين (Haversine Formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // نصف قطر الأرض بالكيلومتر
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const toggleTracking = () => {
    if (!isTracking) {
      if (!navigator.geolocation) {
        toast({ variant: "destructive", title: "عذراً", description: "متصفحك لا يدعم نظام تحديد المواقع." });
        return;
      }

      setIsTracking(true);
      setDistance(0);
      setElapsedTime(0);
      setPath([]);
      lastCoord.current = null;

      // بدء مراقبة الموقع الجغرافي
      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          const coords = position.coords;
          const currentPos: [number, number] = [coords.latitude, coords.longitude];
          
          setPath(prev => {
            // إضافة النقطة الجديدة للمسار إذا تحرك المستخدم مسافة معقولة
            if (prev.length === 0) return [currentPos];
            return [...prev, currentPos];
          });

          if (lastCoord.current) {
            const d = calculateDistance(
              lastCoord.current.latitude, lastCoord.current.longitude,
              coords.latitude, coords.longitude
            );
            
            // فلترة الضجيج البسيط (أقل من 2 متر) لزيادة الدقة
            if (d > 0.002) { 
              setDistance(prev => prev + d);
              // تحويل السرعة من م/ث إلى كم/س
              setCurrentSpeed(coords.speed ? coords.speed * 3.6 : 0);
            }
          }
          lastCoord.current = coords;
        },
        (error) => {
          console.error("GPS Error:", error);
          toast({ variant: "destructive", title: "خطأ في الـ GPS", description: "تأكد من تفعيل الموقع الجغرافي للحصول على نتائج دقيقة." });
        },
        { enableHighAccuracy: true, distanceFilter: 1, maximumAge: 0 }
      );
    } else {
      stopTrackingAndSave();
    }
  };

  const stopTrackingAndSave = () => {
    setIsTracking(false);
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    
    if (db && user && distance > 0) {
      const recordsRef = collection(db, 'users', user.uid, 'fitnessRecords');
      // تقدير الخطوات: المتوسط 1312 خطوة لكل كيلومتر مشي/جري
      const estimatedSteps = Math.floor(distance * 1312);
      
      addDocumentNonBlocking(recordsRef, {
        date: serverTimestamp(),
        steps: estimatedSteps,
        distance: Number(distance.toFixed(3)),
        time: Math.floor(elapsedTime / 60), // بالدقائق
        durationSeconds: elapsedTime,
        userId: user.uid,
        path: path
      });
      
      toast({ title: "تم حفظ الجلسة", description: `لقد قطعت ${distance.toFixed(2)} كم وخطوت حوالي ${estimatedSteps} خطوة. بطل!` });
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? hrs + ':' : ''}${mins < 10 && hrs > 0 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/5 px-6 pt-10 pb-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10 rounded-[10px] bg-white border border-border/40 premium-shadow">
              <ChevronRight className="h-5 w-5 text-foreground" />
            </Button>
            <h2 className="text-2xl font-extrabold text-foreground font-cairo">تتبع الجري المباشر</h2>
          </div>
          <div className="h-10 w-10 rounded-[10px] bg-white border border-border/40 premium-shadow flex items-center justify-center text-primary">
            <Activity className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-8">
        {/* بطاقة التحكم الرئيسية */}
        <div className={`rounded-[20px] p-8 text-white premium-shadow relative overflow-hidden transition-all duration-700 ${isTracking ? 'bg-red-500 shadow-red-200' : 'primary-gradient shadow-primary/20'}`}>
          <div className="relative z-10 space-y-8">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/70 text-xs font-bold mb-2 uppercase tracking-widest">{isTracking ? 'تتبع نشط الآن' : 'جاهز للبدء؟'}</p>
                <h3 className="text-4xl font-black tabular-nums">{isTracking ? formatTime(elapsedTime) : '00:00'}</h3>
              </div>
              <div className={`h-14 w-14 rounded-[15px] bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 ${isTracking ? 'animate-pulse' : ''}`}>
                <Navigation className="h-7 w-7 text-white" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-white/70 uppercase">المسافة (كم)</span>
                <p className="text-2xl font-black tabular-nums">{distance.toFixed(3)}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-white/70 uppercase">السرعة (كم/س)</span>
                <p className="text-2xl font-black tabular-nums">{currentSpeed.toFixed(1)}</p>
              </div>
            </div>

            <button 
              onClick={toggleTracking} 
              className={`w-full bg-white h-14 rounded-[15px] font-black text-sm flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all group ${isTracking ? 'text-red-500' : 'text-primary'}`}
            >
              {isTracking ? (
                <><Square className="h-5 w-5 fill-current" /> إنهاء وحفظ الإنجاز</>
              ) : (
                <><Play className="h-5 w-5 fill-current" /> ابدأ التتبع الحقيقي</>
              )}
            </button>
          </div>
          {/* لمسات جمالية خلفية */}
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
        </div>

        {/* الخارطة الحية */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-bold text-foreground/90 font-cairo">خارطة المسار الفعلي</h3>
            {isTracking && (
              <div className="flex items-center gap-1.5 bg-green-500/10 px-3 py-1 rounded-full">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-ping" />
                <span className="text-[10px] font-black text-green-600 uppercase">موقعك مباشر</span>
              </div>
            )}
          </div>
          <div className="relative h-80 w-full rounded-[20px] overflow-hidden bg-slate-50 border border-border/40 shadow-inner premium-shadow">
            <MapComponent path={path} />
            {!isTracking && path.length === 0 && (
              <div className="absolute inset-0 z-10 bg-black/5 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 pointer-events-none">
                <div className="h-16 w-16 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
                  <MapPin className="h-8 w-8 text-primary/40" />
                </div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-white/80 px-4 py-2 rounded-full shadow-sm">
                  اضغط "ابدأ التتبع" لتفعيل الخريطة
                </p>
              </div>
            )}
          </div>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-[15px] premium-shadow border border-border/40 space-y-3">
            <div className="h-10 w-10 rounded-[10px] bg-orange-50 flex items-center justify-center">
              <Zap className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">الخطوات المقدَّرة</p>
              <h4 className="text-xl font-black">{Math.floor(distance * 1312)}</h4>
            </div>
          </div>
          <div className="bg-white p-5 rounded-[15px] premium-shadow border border-border/40 space-y-3">
            <div className="h-10 w-10 rounded-[10px] bg-blue-50 flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">الوقت النشط</p>
              <h4 className="text-xl font-black">{Math.floor(elapsedTime / 60)} <span className="text-xs">دقيقة</span></h4>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
