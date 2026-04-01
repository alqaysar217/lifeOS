"use client"

import { Home, Repeat, Trophy, PieChart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";

const tabs = [
  { id: 'home', label: 'الرئيسية', icon: Home },
  { id: 'habits', label: 'العادات', icon: Repeat },
  { id: 'challenges', label: 'التحديات', icon: Trophy },
  { id: 'stats', label: 'النمو', icon: PieChart },
  { id: 'profile', label: 'حسابي', icon: User },
];

export function BottomNav() {
  const [activeTab, setActiveTab] = React.useState('home');

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 px-5">
      <nav className="glass-panel rounded-[10px] h-20 px-2 flex items-center justify-around premium-shadow border border-white/40">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center justify-center gap-1 min-w-[64px] relative"
            >
              <div className={cn(
                "h-10 w-10 rounded-[10px] flex items-center justify-center transition-all duration-300",
                isActive 
                  ? "primary-gradient text-white shadow-lg shadow-primary/30" 
                  : "text-muted-foreground/60"
              )}>
                <Icon className={cn("h-5 w-5", isActive ? "scale-110" : "")} />
              </div>
              <span className={cn(
                "text-[9px] font-bold transition-all duration-300",
                isActive ? "text-primary opacity-100" : "opacity-0"
              )}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-1 h-0.5 w-4 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
