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
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-white/80 border-t border-gray-100 px-6 pb-10 pt-4 backdrop-blur-2xl rounded-t-[2.5rem] premium-shadow">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="group flex flex-col items-center gap-1.5 relative"
          >
            <div className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300",
              isActive 
                ? "bg-primary text-white scale-110 shadow-lg shadow-primary/30" 
                : "text-muted-foreground hover:bg-secondary hover:text-primary"
            )}>
              <Icon className={cn("h-6 w-6", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
            </div>
            <span className={cn(
              "text-[10px] font-bold transition-all duration-300",
              isActive ? "text-primary opacity-100" : "text-muted-foreground opacity-60"
            )}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}