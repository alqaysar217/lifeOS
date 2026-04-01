"use client"

import { Settings, Bell, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardHeader() {
  return (
    <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/5">
      <div className="px-6 pt-10 pb-4 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-[10px] primary-gradient flex items-center justify-center shadow-lg shadow-primary/20">
              <LayoutGrid className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-foreground/90 font-cairo">حياتي</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="h-11 w-11 rounded-[10px] bg-white border border-border/40 premium-shadow text-muted-foreground hover:text-primary transition-all">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-11 w-11 rounded-[10px] bg-white border border-border/40 premium-shadow text-muted-foreground hover:text-primary transition-all">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-foreground font-cairo">أهلاً بك، خالد 👋</h2>
          <p className="text-sm text-muted-foreground font-semibold mt-1">إليك ملخص إنجازاتك اليوم</p>
        </div>
      </div>
    </div>
  );
}
