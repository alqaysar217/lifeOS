
"use client"

import React, { useState, useEffect, useRef } from "react";
import { Play, MapPin, Clock, Zap, Target, Dumbbell, ChevronRight, Navigation, Activity, Square, Loader2, Footprints } from "lucide-react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection, serverTimestamp } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";

const MapComponent = dynamic(() => import("./MapComponent"), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
});

interface FitnessScreenProps {
  onBack: () => void;
}

export function FitnessScreen({ onBack }: FitnessScreenProps) {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [isTracking, setIsTracking] = useState(false);
  const [distance, setDistance] = useState(0); 
  const [steps, setSteps] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [path, setPath] = useState<{lat: number, lng: number}[]>([]);
  
  const watchId = useRef<number | null>(null);
  const lastCoord = useRef<GeolocationCoordinates | null>(null);
  const stepThreshold = 12; // عتبة التسارع لاكتشاف الخطوة
  const lastStepTime = useRef<number>(0);
  const strideLength = 0.75; // طول الخطوة الافتراضي بالمتر

  const fitnessQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'fitnessRecords');
  }, [db, user]);

  const { data: records } = useCollection(fitnessQuery);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTracking) {
      timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTracking]);

  // خوارزمية اكتشاف الخطوات عبر حساس التسارع
  const handleMotion = (event: DeviceMotionEvent) => {
    const acc = event.accelerationIncludingGravity;
    if (!acc || !acc.x || !acc.y || !acc.z) return;

    // حساب القوة الكلية للتسارع
    const magnitude = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);
    const now = Date.now();

    // اكتشاف النبضة (الخطوة) مع منع التكرار السريع (0.25 ثانية بين الخطوات)
    if (magnitude > stepThreshold && now - lastStepTime.current > 250) {
      setSteps(prev => prev + 1);
      lastStepTime.current = now;

      // إذا كان الـ GPS ضعيفاً، نزيد المسافة بناءً على الخطوات
      if (!lastCoord.current) {
        setDistance(prev => prev + (strideLength / 1000));
      }
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const requestPermissions = async () => {
    // طلب إذن حساسات الحركة (مهم لـ iOS وبعض إصدارات أندرويد)
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        if (permission !== 'granted') {
          toast({ variant: "destructive", title: "تنبيه", description: "التطبيق يحتاج الوصول للحساسات لحساب الخطوات." });
          return false;
        }
      } catch (e) {
        return false;
      }
    }
    return true;
  };

  const toggleTracking = async () => {
    if (!isTracking) {
      const hasMotionPermission = await requestPermissions();
      if (!navigator.geolocation) {
        toast({ variant: "destructive", title: "عذراً", description: "متصفحك لا يدعم نظام تحديد المواقع." });
        return;
      }

      setIsTracking(true);
      setDistance(0);
      setSteps(0);
      setElapsedTime(0);
      setPath([]);
      lastCoord.current = null;

      // تفعيل مستشعر الحركة
      window.addEventListener('devicemotion', handleMotion);

      // تفعيل الـ GPS
      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          const coords = position.coords;
          const currentPos = { lat: coords.latitude, lng: coords.longitude };
          
          setPath(prev => {
            if (prev.length === 0) return [currentPos];
            const last = prev[prev.length - 1];
            if (last.lat === currentPos.lat && last.lng === currentPos.lng) return prev;
            return [...prev, currentPos];
          });

          if (lastCoord.current) {
            const d = calculateDistance(
              lastCoord.current.latitude, lastCoord.current.longitude,
              coords.latitude, coords.longitude
            );
            
            if (d > 0.002) { // 2 meters movement threshold
              setDistance(prev => prev + d);
              setCurrentSpeed(coords.speed ? coords.speed * 3.6 : 0);
            }
          }
          lastCoord.current = coords;
        },
        (error) => {
          console.error("GPS Error:", error);
        },
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
      );
    } else {
      stopTrackingAndSave();
    }
  };

  const stopTrackingAndSave = () => {
    setIsTracking(false);
    window.removeEventListener('devicemotion', handleMotion);
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    
    if (db && user && (distance > 0 || steps > 0)) {
      const recordsRef = collection(db, 'users', user.uid, 'fitnessRecords');
      
      addDocumentNonBlocking(recordsRef, {
        date: serverTimestamp(),
        steps: steps,
        distance: Number(distance.toFixed(3)),
        time: Math.floor(elapsedTime / 60),
        durationSeconds: elapsedTime,
        userId: user.uid,
        path: path.map(p => ({ lat: p.lat, lng: p.lng }))
      });
      
      toast({ title: "تم حفظ الجلسة", description: `لقد أنجزت ${steps} خطوة بمسافة ${distance.toFixed(2)} كم. بطل!` });
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? hrs + ':' : ''}${mins < 10 && hrs > 0 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const mapPath: [number, number][] = path.map(p => [p.lat, p.lng]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/5 px-6 pt-10 pb-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10 rounded-[10px] bg-white border border-border/40 premium-shadow">
              <ChevronRight className="h-5 w-5 text-foreground" />
            </Button>
            <h2 className="text-2xl font-extrabold text-foreground font-cairo">النشاط البدني</h2>
          </div>
          <div className="h-10 w-10 rounded-[10px] bg-white border border-border/40 premium-shadow flex items-center justify-center text-primary">
            <Activity className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-8">
        <div className={`rounded-[30px] p-8 text-white premium-shadow relative overflow-hidden transition-all duration-700 ${isTracking ? 'bg-red-500 shadow-red-200' : 'primary-gradient shadow-primary/20'}`}>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-[20px] bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                  <Dumbbell className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black">{isTracking ? 'جاري التتبع...' : 'جاهز للبدء؟'}</h3>
                  <p className="text-white/70 text-xs font-bold tracking-wide uppercase">كارديو صباحي</p>
                </div>
              </div>
              <Activity className={`h-6 w-6 text-white/30 ${isTracking ? 'animate-pulse' : ''}`} />
            </div>

            <div className="grid grid-cols-3 gap-2 mb-10">
              <div className="text-center p-3 bg-white/5 rounded-[20px] backdrop-blur-sm">
                <Clock className="h-4 w-4 mx-auto mb-2 text-white/50" />
                <p className="text-[10px] font-bold text-white/60 uppercase mb-1">الوقت</p>
                <p className="text-lg font-black tabular-nums">{formatTime(elapsedTime)}</p>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-[20px] backdrop-blur-sm border-x border-white/10">
                <Footprints className="h-4 w-4 mx-auto mb-2 text-white/50" />
                <p className="text-[10px] font-bold text-white/60 uppercase mb-1">الخطوات</p>
                <p className="text-lg font-black tabular-nums">{steps}</p>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-[20px] backdrop-blur-sm">
                <Navigation className="h-4 w-4 mx-auto mb-2 text-white/50" />
                <p className="text-[10px] font-bold text-white/60 uppercase mb-1">المسافة</p>
                <p className="text-lg font-black tabular-nums">{distance.toFixed(2)}<span className="text-[10px] ml-0.5">كم</span></p>
              </div>
            </div>

            <div className="flex gap-4">
              {!isTracking ? (
                <Button 
                  onClick={toggleTracking} 
                  className="flex-1 bg-white text-primary hover:bg-white/90 h-16 rounded-[22px] font-black text-lg shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <Play className="h-6 w-6 fill-current" />
                  ابدأ الجري
                </Button>
              ) : (
                <Button 
                  onClick={toggleTracking} 
                  className="flex-1 bg-white text-red-500 hover:bg-white/90 h-16 rounded-[22px] font-black text-lg shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <Square className="h-6 w-6 fill-current" />
                  إنهاء الجلسة
                </Button>
              )}
            </div>
          </div>

          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-bold text-foreground/90 font-cairo">خارطة المسار الفعلي</h3>
            {isTracking && (
              <div className="flex items-center gap-1.5 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-ping" />
                <span className="text-[10px] font-black text-green-600 uppercase">موقعك مباشر</span>
              </div>
            )}
          </div>
          <div className="relative h-80 w-full rounded-[30px] overflow-hidden bg-slate-50 border border-border/40 shadow-inner premium-shadow">
            <MapComponent path={mapPath} />
            {!isTracking && path.length === 0 && (
              <div className="absolute inset-0 z-10 bg-black/5 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 pointer-events-none">
                <div className="h-16 w-16 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
                  <MapPin className="h-8 w-8 text-primary/40" />
                </div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-white/80 px-4 py-2 rounded-full shadow-sm">
                  اضغط "ابدأ الجري" لتفعيل الخريطة
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-[25px] premium-shadow border border-border/40 space-y-3">
            <div className="h-10 w-10 rounded-[12px] bg-orange-50 flex items-center justify-center">
              <Zap className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">السرعة الحالية</p>
              <h4 className="text-xl font-black">{currentSpeed.toFixed(1)} <span className="text-xs">كم/س</span></h4>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[25px] premium-shadow border border-border/40 space-y-3">
            <div className="h-10 w-10 rounded-[12px] bg-blue-50 flex items-center justify-center">
              <Activity className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">آخر جلسة</p>
              <h4 className="text-xl font-black">
                {records && records.length > 0 ? records[records.length - 1].distance.toFixed(2) : '0.00'} <span className="text-xs">كم</span>
              </h4>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
