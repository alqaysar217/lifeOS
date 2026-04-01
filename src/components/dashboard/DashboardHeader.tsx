"use client"

import { Settings, Bell, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardHeader() {
  return (
    <>
      {/* الشريط العلوي الثابت */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/5 shadow-sm">
        <div className="px-6 pt-10 pb-4 flex items-center justify-between">
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
      </div>
      
      {/* قسم الترحيب القابل للتمرير */}
      <div className="px-6 py-6">
        <h2 className="text-2xl font-extrabold text-foreground font-cairo">أهلاً بك يا بطل 👋</h2>
        <p className="text-sm text-muted-foreground font-semibold mt-1">إليك ملخص إنجازاتك اليوم</p>
      </div>
    </>
  );
}
