"use client"

import { Home, Repeat, Trophy, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";

const tabs = [
  { id: 'home', label: 'الرئيسية', icon: Home },
  { id: 'habits', label: 'العادات', icon: Repeat },
  { id: 'challenges', label: 'التحديات', icon: Trophy },
  { id: 'stats', label: 'النمو', icon: BarChart3 },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
];

export function BottomNav() {
  const [activeTab, setActiveTab] = React.useState('home');

  return (
    <div className="fixed bottom-8 left-0 right-0 z-50 px-6">
      <nav className="glass-effect flex items-center justify-around h-24 px-4 rounded-[2.5rem] shadow-2xl shadow-primary/10 border border-white/40">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="group flex flex-col items-center gap-1.5 relative px-2"
            >
              <div className={cn(
                "flex h-14 w-14 items-center justify-center rounded-[1.5rem] transition-all duration-500",
                isActive 
                  ? "premium-gradient text-white scale-110 shadow-lg shadow-primary/30 glow-effect" 
                  : "text-muted-foreground/60 hover:bg-secondary/80 hover:text-primary"
              )}>
                <Icon className={cn("h-6 w-6 transition-transform duration-500", isActive ? "scale-110" : "group-hover:scale-110")} />
              </div>
              <span className={cn(
                "text-[10px] font-black transition-all duration-300",
                isActive ? "text-primary opacity-100" : "text-muted-foreground opacity-0 group-hover:opacity-60"
              )}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-1 h-1 w-4 bg-primary rounded-full animate-in fade-in zoom-in duration-500" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}