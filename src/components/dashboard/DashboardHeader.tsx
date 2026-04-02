
"use client"

import React, { useState, useEffect } from "react";
import { Settings, Bell, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";

const quotes = [
  "النجاح هو مجموع خطوات صغيرة تتكرر كل يوم.",
  "كن النسخة الأفضل من نفسك اليوم.",
  "الانضباط هو الجسر بين الأهداف والإنجاز.",
  "لا تتوقف حتى تفخر بنفسك.",
  "بداية جديدة، فرصة جديدة للتألق."
];

interface DashboardHeaderProps {
  onSearch?: (term: string) => void;
  onNotifications?: () => void;
  userName?: string;
}

export function DashboardHeader({ onSearch, onNotifications, userName }: DashboardHeaderProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [quote, setQuote] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  useEffect(() => {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setQuote(randomQuote);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch?.(value);
  };

  return (
    <>
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/5 shadow-sm">
        <div className="px-6 pt-10 pb-4 flex items-center justify-between gap-4">
          {!isSearchVisible ? (
            <>
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="h-14 w-14 flex items-center justify-center relative transition-transform active:scale-95">
                  <Image 
                    src="/logo.png" 
                    alt="لوجو حياتي" 
                    fill
                    className="object-contain drop-shadow-md"
                    priority
                  />
                </div>
                <span className="text-xl font-extrabold tracking-tight text-foreground/90 font-cairo">حياتي</span>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsSearchVisible(true)}
                  className="h-11 w-11 rounded-[10px] bg-white border border-border/40 premium-shadow text-muted-foreground hover:text-primary transition-all active:scale-90"
                >
                  <Search className="h-5 w-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onNotifications}
                  className="h-11 w-11 rounded-[10px] bg-white border border-border/40 premium-shadow text-muted-foreground hover:text-primary transition-all active:scale-90 relative"
                >
                  <Bell className="h-5 w-5" />
                  <div className="absolute top-2.5 left-2.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="ابحث عن قسم، مهمة، أو عادة..." 
                  className="w-full pr-10 h-11 bg-white border-border/40 premium-shadow rounded-[10px] focus:ring-primary/20 text-xs font-bold"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  autoFocus
                />
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  setIsSearchVisible(false);
                  setSearchTerm("");
                  onSearch?.("");
                }}
                className="h-11 w-11 shrink-0 rounded-[10px] bg-slate-50 text-muted-foreground active:scale-90"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <div className="px-6 py-6 space-y-1">
        <h2 className="text-2xl font-extrabold text-foreground font-cairo">أهلاً بك يا بطل {userName ? userName : ""} 👋</h2>
        <p className="text-[11px] text-primary/70 font-bold bg-primary/5 inline-block px-3 py-1 rounded-full animate-in fade-in slide-in-from-bottom-2 duration-700">
          "{quote}"
        </p>
      </div>
    </>
  );
}
