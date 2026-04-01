"use client"

import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardHeader() {
  return (
    <div className="space-y-6 px-4 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-white">حياتي</h1>
        <Button variant="ghost" size="icon" className="rounded-full bg-white/5 hover:bg-white/10 text-white">
          <Settings className="h-6 w-6" />
        </Button>
      </div>
      <div className="space-y-1">
        <h2 className="text-3xl font-bold text-white">مرحباً بك 👋</h2>
        <p className="text-lg text-muted-foreground font-medium">جاهز لتحسين يومك؟</p>
      </div>
    </div>
  );
}