"use client"

import { Home, Repeat, Trophy, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";

const tabs = [
  { id: 'home', label: 'الرئيسية', icon: Home },
  { id: 'habits', label: 'العادات', icon: Repeat },
  { id: 'challenges', label: 'التحديات', icon: Trophy },
  { id: 'stats', label: 'الإحصائيات', icon: BarChart3 },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
];

export function BottomNav() {
  const [activeTab, setActiveTab] = React.useState('home');

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-white/5 bg-background/80 px-4 pb-8 pt-3 backdrop-blur-xl">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="group flex flex-col items-center gap-1 relative min-w-[4rem]"
          >
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-300",
              isActive ? "bg-primary text-white scale-110 shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-white"
            )}>
              <Icon className="h-6 w-6" />
            </div>
            <span className={cn(
              "text-[10px] font-bold transition-all duration-300",
              isActive ? "text-primary opacity-100 translate-y-0" : "text-muted-foreground opacity-70"
            )}>
              {tab.label}
            </span>
            {isActive && (
                <div className="absolute -top-3 h-1 w-6 bg-primary rounded-full blur-[2px]" />
            )}
          </button>
        );
      })}
    </nav>
  );
}