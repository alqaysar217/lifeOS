"use client"

import { Settings, Bell, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardHeader() {
  return (
    <div className="px-5 pt-8 pb-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-[10px] primary-gradient flex items-center justify-center shadow-lg shadow-primary/20">
            <LayoutGrid className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground/90">حياتي</span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-[10px] bg-white border border-border/40 premium-shadow">
            <Bell className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-[10px] bg-white border border-border/40 premium-shadow">
            <Settings className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-foreground">أهلاً بك، خالد 👋</h2>
        <p className="text-sm text-muted-foreground font-medium mt-1">إليك ملخص يومك الحالي</p>
      </div>
    </div>
  );
}
