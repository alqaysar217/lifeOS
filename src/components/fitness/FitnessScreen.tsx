"use client"

import React, { useState, useEffect, useRef } from "react";
import { Play, MapPin, Clock, Zap, Target, Dumbbell, ChevronRight, ChevronLeft, Navigation, Activity, Square, Loader2 } from "lucide-react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Button } from "@/components/ui/button";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection, serverTimestamp } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";

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
  const [distance, setDistance] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const watchId = useRef<number | null>(null);
  const lastCoord = useRef<GeolocationCoordinates | null>(null);

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

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
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
      setStartTime(Date.now());
      lastCoord.current = null;

      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          const coords = position.coords;
          if (lastCoord.current) {
            const d = calculateDistance(
              lastCoord.current.latitude, lastCoord.current.longitude,
              coords.latitude, coords.longitude
            );
            if (d > 0.001) { // Filter out minor jitter
              setDistance(prev => prev + d);
              setCurrentSpeed(coords.speed ? coords.speed * 3.6 : 0);
            }
          }
          lastCoord.current = coords;
        },
        (error) => console.error(error),
        { enableHighAccuracy: true, distanceFilter: 1 }
      );
    } else {
      stopTrackingAndSave();
    }
  };

  const stopTrackingAndSave = () => {
    setIsTracking(false);
    if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
    
    if (db && user) {
      const recordsRef = collection(db, 'users', user.uid, 'fitnessRecords');
      addDocumentNonBlocking(recordsRef, {
        date: serverTimestamp(),
        steps: Math.floor(distance * 1300), // Estimation
        distance: Number(distance.toFixed(2)),
        time: Math.floor(elapsedTime / 60),
        userId: user.uid
      });
      toast({ title: "تم الحفظ", description: `لقد قطعت مسافة ${distance.toFixed(2)} كم بنجاح!` });
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/5 px-6 pt-10 pb-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10 rounded-[10px] bg-white border border-border/40 premium-shadow">
              <ChevronRight className="h-5 w-5 text-foreground" />
            </Button>
            <h2 className="text-2xl font-extrabold text-foreground font-cairo">اللياقة المباشرة</h2>
          </div>
          <div className="h-10 w-10 rounded-[10px] bg-white border border-border/40 premium-shadow flex items-center justify-center text-primary">
            <Activity className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-8">
        <div className={`rounded-[15px] p-6 text-white premium-shadow relative overflow-hidden transition-all duration-500 ${isTracking ? 'bg-red-500' : 'primary-gradient'}`}>
          <div className="relative z-10 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/70 text-xs font-bold mb-1">{isTracking ? 'جاري التتبع الآن...' : 'بدء جلسة جري جديدة'}</p>
                <h3 className="text-2xl font-black">{isTracking ? formatTime(elapsedTime) : 'جري صباحي مباشر'}</h3>
              </div>
              <div className={`h-12 w-12 rounded-[12px] bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 ${isTracking ? 'animate-pulse' : ''}`}>
                <Navigation className="h-6 w-6 text-white" />
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-white/70 uppercase">المسافة</span>
                <span className="text-xl font-black">{distance.toFixed(2)} <span className="text-xs">كم</span></span>
              </div>
              <div className="h-8 w-px bg-white/20" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-white/70 uppercase">السرعة الحالية</span>
                <span className="text-xl font-black">{currentSpeed.toFixed(1)} <span className="text-xs">كم/س</span></span>
              </div>
            </div>

            <button onClick={toggleTracking} className={`w-full bg-white h-12 rounded-[12px] font-black text-sm flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-transform group ${isTracking ? 'text-red-500' : 'text-primary'}`}>
              {isTracking ? (
                <><Square className="h-4 w-4 fill-current" /> إنهاء الجلسة وحفظها</>
              ) : (
                <><Play className="h-4 w-4 fill-current" /> ابدأ الجري الآن عبر GPS</>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-foreground/90 font-cairo">الموقع الجغرافي</h3>
          <div className="relative h-48 w-full rounded-[15px] overflow-hidden bg-slate-100 border border-border/40 flex items-center justify-center">
            <MapPin className={`h-12 w-12 text-primary/20 ${isTracking ? 'animate-bounce' : ''}`} />
            <p className="absolute bottom-4 text-[10px] font-bold text-muted-foreground uppercase">استخدام GPS الجهاز للحساب الدقيق</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground/90 font-cairo">تمارين مقترحة</h3>
          </div>
          <div className="space-y-3">
            {exercises.map((ex, i) => (
              <div key={i} className="bg-white p-4 rounded-[12px] premium-shadow border border-border/40 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-[10px] soft-purple-bg flex items-center justify-center"><ex.icon className="h-6 w-6 text-primary" /></div>
                  <div><h4 className="text-sm font-bold text-foreground">{ex.title}</h4><p className="text-[10px] text-muted-foreground font-medium">{ex.duration} • {ex.kcal} سعرة</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
