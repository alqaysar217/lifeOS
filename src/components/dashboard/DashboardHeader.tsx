"use client"

import { Settings, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardHeader() {
  return (
    <div className="space-y-8 px-6 pt-10 pb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl premium-gradient flex items-center justify-center shadow-lg shadow-primary/20 glow-effect">
            <span className="text-white font-bold text-2xl">ح</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground/90">حياتي</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" size="icon" className="h-11 w-11 rounded-2xl bg-white soft-neumorphic text-muted-foreground hover:text-primary transition-all duration-300 active:scale-90">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-11 w-11 rounded-2xl bg-white soft-neumorphic text-muted-foreground hover:text-primary transition-all duration-300 active:scale-90">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <div className="space-y-1.5">
        <h2 className="text-4xl font-black text-foreground leading-tight">أهلاً بك 👋</h2>
        <p className="text-muted-foreground/80 font-semibold text-lg">لنصنع يوماً استثنائياً اليوم.</p>
      </div>
    </div>
  );
}