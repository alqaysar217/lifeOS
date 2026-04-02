
"use client"

import React, { useState } from "react";
import { Send, Bot, User, Sparkles, ChevronRight, BrainCircuit, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AIScreenProps {
  onBack: () => void;
}

const suggestions = [
  "إنشاء خطة جري",
  "تنظيم جدول دراسة",
  "نصيحة لتوفير المال",
  "كيف أحسن نومي؟"
];

export function AIScreen({ onBack }: AIScreenProps) {
  const [messages, setMessages] = useState([
    { id: 1, type: 'ai', text: "أهلاً بك يا بطل! أنا مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟" },
    { id: 2, type: 'ai', text: "لقد لاحظت أن أداءك في الجري تحسن بنسبة 10% هذا الأسبوع. استمر في هذا الإنجاز!" },
    { id: 3, type: 'ai', text: "بالمناسبة، تأخرت قليلاً في مهامك أمس، هل نراجع جدولك اليوم؟" }
  ]);

  return (
    <div className="flex flex-col h-screen bg-background animate-in fade-in duration-500">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/5 px-6 pt-10 pb-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10 rounded-[10px] bg-white border border-border/40 premium-shadow">
            <ChevronRight className="h-5 w-5 text-foreground" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-[10px] primary-gradient flex items-center justify-center shadow-lg shadow-primary/20">
              <BrainCircuit className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground font-cairo">المساعد الذكي</h2>
              <div className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">نشط الآن</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-start' : 'justify-end'} animate-in slide-in-from-bottom-2`}>
            <div className={`max-w-[85%] p-4 rounded-[15px] premium-shadow border border-border/40 flex gap-3 ${msg.type === 'user' ? 'bg-primary text-white' : 'bg-white text-foreground'}`}>
              {msg.type === 'ai' && (
                <div className="h-8 w-8 rounded-full soft-purple-bg flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
              {msg.type === 'user' && (
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* Suggestion Chips */}
        <div className="flex flex-wrap gap-2 pt-4">
          {suggestions.map((s, i) => (
            <button key={i} className="px-4 py-2 rounded-full bg-white border border-border/40 premium-shadow text-xs font-bold text-primary hover:bg-primary/5 transition-colors">
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-6 bg-background border-t border-border/5">
        <div className="relative flex items-center gap-2 bg-white rounded-[15px] premium-shadow border border-border/40 p-2">
          <Input 
            placeholder="اسألني أي شيء..." 
            className="border-none shadow-none focus-visible:ring-0 text-xs font-bold bg-transparent"
          />
          <Button size="icon" className="h-10 w-10 rounded-[10px] primary-gradient shadow-lg">
            <Send className="h-4 w-4 text-white" />
          </Button>
        </div>
        <p className="text-center text-[9px] text-muted-foreground mt-3 font-bold">مدعوم بالذكاء الاصطناعي لتحليل نمط حياتك</p>
      </div>
    </div>
  );
}
