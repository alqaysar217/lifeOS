"use client"

import { Home, Dumbbell, Trophy, CheckSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";

export type TabId = 'home' | 'fitness' | 'challenges' | 'tasks' | 'profile' | 'finance' | 'study' | 'habits';

const tabs = [
  { id: 'home', label: 'الرئيسية', icon: Home },
  { id: 'fitness', label: 'اللياقة', icon: Dumbbell },
  { id: 'challenges', label: 'التحديات', icon: Trophy },
  { id: 'tasks', label: 'المهام', icon: CheckSquare },
  { id: 'profile', label: 'حسابي', icon: User },
];

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (id: TabId) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const isTabActive = (tabId: string) => {
    return activeTab === tabId;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <nav className="glass-panel rounded-t-[24px] h-20 px-4 flex items-center justify-around premium-shadow border-t border-white/60">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = isTabActive(tab.id);
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as TabId)}
              className="flex flex-col items-center justify-center gap-1 min-w-[64px] relative transition-all active:scale-90"
            >
              <div className={cn(
                "h-10 w-10 rounded-[12px] flex items-center justify-center transition-all duration-300",
                isActive 
                  ? "primary-gradient text-white shadow-lg shadow-primary/30" 
                  : "text-muted-foreground/40 hover:text-primary/60"
              )}>
                <Icon className={cn("h-5 w-5", isActive ? "scale-110" : "")} />
              </div>
              <span className={cn(
                "text-[10px] font-bold transition-all duration-300",
                isActive ? "text-primary opacity-100" : "opacity-0 h-0 overflow-hidden"
              )}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-1 h-1 w-4 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </nav>
      {/* Safe area for mobile home indicator */}
      <div className="h-6 bg-white/80 backdrop-blur-md" />
    </div>
  );
}
