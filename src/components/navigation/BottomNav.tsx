
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
  // We check if the activeTab is one of the 5 main navigation tabs
  const getActiveTabId = (id: TabId) => {
    const mainTabs = ['home', 'fitness', 'challenges', 'tasks', 'profile'];
    if (mainTabs.includes(id)) return id;
    // Fallback logic for sub-screens
    if (['habits', 'study', 'finance', 'ai', 'analytics', 'notifications'].includes(id)) return 'home';
    return 'home';
  };

  const currentActive = getActiveTabId(activeTab);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <nav className="glass-panel rounded-t-[24px] h-24 px-4 flex items-center justify-around premium-shadow border-t border-white/40">
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
                "h-11 w-11 rounded-[12px] flex items-center justify-center transition-all duration-300",
                isActive 
                  ? "primary-gradient text-white shadow-lg shadow-primary/30" 
                  : "text-muted-foreground/40 hover:bg-slate-100/50"
              )}>
                <Icon className={cn("h-5 w-5", isActive ? "scale-110" : "")} />
              </div>
              <span className={cn(
                "text-[10px] font-bold transition-colors duration-300 font-cairo",
                isActive ? "text-primary" : "text-muted-foreground/50"
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
      <div className="h-4 bg-white/95 backdrop-blur-lg" />
    </div>
  );
}
