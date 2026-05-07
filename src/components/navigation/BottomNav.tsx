
"use client"

import { Home, Activity, Trophy, CheckCircle2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";

export type TabId = 'home' | 'fitness' | 'challenges' | 'tasks' | 'profile' | 'habits' | 'study' | 'finance' | 'ai' | 'analytics' | 'notifications';

const tabs = [
  { id: 'home', label: 'الرئيسية', icon: Home },
  { id: 'fitness', label: 'اللياقة', icon: Activity },
  { id: 'challenges', label: 'التحديات', icon: Trophy },
  { id: 'tasks', label: 'المهام', icon: CheckCircle2 },
  { id: 'profile', label: 'حسابي', icon: Settings },
];

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (id: TabId) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const getActiveTabId = (id: TabId) => {
    const mainTabs = ['home', 'fitness', 'challenges', 'tasks', 'profile'];
    if (mainTabs.includes(id)) return id;
    if (['habits', 'study', 'finance', 'ai', 'analytics', 'notifications'].includes(id)) return 'home';
    return 'home';
  };

  const currentActive = getActiveTabId(activeTab);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/5 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
      <nav className="h-20 px-4 flex items-center justify-around max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentActive === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as TabId)}
              className="flex flex-col items-center justify-center gap-1.5 min-w-[64px] transition-all active:scale-90"
            >
              <div className={cn(
                "h-11 w-11 rounded-[14px] flex items-center justify-center transition-all duration-300",
                isActive 
                  ? "primary-gradient text-white shadow-lg shadow-primary/25" 
                  : "text-muted-foreground/30 hover:bg-slate-100/50"
              )}>
                <Icon className={cn("h-5 w-5", isActive ? "scale-110" : "")} />
              </div>
              <span className={cn(
                "text-[10px] font-bold transition-colors duration-300 font-cairo",
                isActive ? "text-primary" : "text-muted-foreground/40"
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
      {/* مساحة أمان إضافية لأسفل الشاشة في أجهزة الآيفون والأندرويد الحديثة */}
      <div className="h-[env(safe-area-inset-bottom,0px)] bg-transparent" />
    </div>
  );
}
