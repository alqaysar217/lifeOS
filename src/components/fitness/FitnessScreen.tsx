
"use client"

import { Play, MapPin, Clock, Zap, Target, Dumbbell, ChevronLeft } from "lucide-react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const exercises = [
  { title: "نط الحبل", duration: "10 دقائق", kcal: "120", icon: Dumbbell },
  { title: "تمارين الضغط", duration: "3 مجموعات", kcal: "85", icon: Zap },
  { title: "سكوات", duration: "15 دقيقة", kcal: "100", icon: Target },
  { title: "تمارين البطن", duration: "10 دقائق", kcal: "60", icon: Dumbbell },
];

export function FitnessScreen() {
  const mapImage = PlaceHolderImages.find(img => img.id === "running-map");

  return (
    <div className="px-6 pt-10 pb-32 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-extrabold text-foreground font-cairo">اللياقة</h2>
        <div className="h-10 w-10 rounded-[10px] bg-white border border-border/40 premium-shadow flex items-center justify-center text-primary">
          <Dumbbell className="h-5 w-5" />
        </div>
      </div>

      {/* Main Session Card */}
      <div className="primary-gradient rounded-[10px] p-6 text-white premium-shadow relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div>
            <p className="text-white/70 text-xs font-bold mb-1">جلسة اليوم</p>
            <h3 className="text-xl font-bold">جري صباحي في الحديقة</h3>
          </div>
          <button className="bg-white text-primary px-6 py-2.5 rounded-[10px] font-bold text-sm flex items-center gap-2 shadow-xl active:scale-95 transition-transform">
            <Play className="h-4 w-4 fill-primary" />
            ابدأ الجري
          </button>
        </div>
        <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-16 -translate-y-16 blur-2xl" />
      </div>

      {/* Map Section */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-foreground/90">مسار الجري</h3>
        <div className="relative h-48 w-full rounded-[10px] overflow-hidden bg-white premium-shadow border border-border/40">
          {mapImage && (
            <Image 
              src={mapImage.imageUrl} 
              alt={mapImage.description} 
              fill 
              className="object-cover opacity-80"
              data-ai-hint={mapImage.imageHint}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-[8px] flex items-center gap-2 shadow-sm">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-bold text-foreground">حديقة الملك فهد</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "المسافة", val: "3.2", unit: "كم", icon: MapPin },
          { label: "الوقت", val: "24", unit: "دقيقة", icon: Clock },
          { label: "الخطوات", val: "4500", unit: "", icon: Zap },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-[10px] premium-shadow border border-border/40 text-center space-y-1">
            <stat.icon className="h-4 w-4 text-primary/60 mx-auto" />
            <p className="text-[10px] text-muted-foreground font-bold">{stat.label}</p>
            <p className="text-lg font-extrabold text-foreground">{stat.val}</p>
            <p className="text-[8px] text-muted-foreground font-bold uppercase">{stat.unit}</p>
          </div>
        ))}
      </div>

      {/* Exercises Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground/90">تمارين مقترحة</h3>
          <button className="text-xs text-primary font-bold">عرض الكل</button>
        </div>
        <div className="space-y-3">
          {exercises.map((ex, i) => (
            <div key={i} className="bg-white p-4 rounded-[10px] premium-shadow border border-border/40 flex items-center justify-between group active:scale-[0.98] transition-all">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-[10px] soft-purple-bg flex items-center justify-center">
                  <ex.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">{ex.title}</h4>
                  <p className="text-[10px] text-muted-foreground font-medium">{ex.duration} • {ex.kcal} سعرة</p>
                </div>
              </div>
              <div className="h-8 w-8 rounded-[8px] bg-slate-50 flex items-center justify-center">
                <ChevronLeft className="h-4 w-4 text-slate-300" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
