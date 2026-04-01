"use client"

import { Settings, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardHeader() {
  return (
    <div className="space-y-6 px-6 pt-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-white font-bold text-xl">ح</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">حياتي</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="rounded-2xl bg-white premium-shadow text-muted-foreground hover:text-primary">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-2xl bg-white premium-shadow text-muted-foreground hover:text-primary">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <div className="space-y-1">
        <h2 className="text-3xl font-bold text-foreground">أهلاً بك 👋</h2>
        <p className="text-muted-foreground font-medium">لنصنع يوماً رائعاً اليوم.</p>
      </div>
    </div>
  );
}