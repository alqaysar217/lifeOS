
"use client"

import React, { useState, useEffect, useMemo } from "react";
import { Send, Bot, User, Sparkles, ChevronRight, BrainCircuit, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";

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
  const db = useFirestore();
  const { user } = useUser();

  const tasksQuery = useMemoFirebase(() => (!db || !user) ? null : collection(db, 'users', user.uid, 'tasks'), [db, user]);
  const habitsQuery = useMemoFirebase(() => (!db || !user) ? null : collection(db, 'users', user.uid, 'habits'), [db, user]);

  const { data: tasks } = useCollection(tasksQuery);
  const { data: habits } = useCollection(habitsQuery);

  const [messages, setMessages] = useState([
    { id: 1, type: 'ai', text: "أهلاً بك يا بطل! أنا مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟" }
  ]);

  useEffect(() => {
    if (tasks && habits) {
      const pendingTasks = tasks.filter(t => t.status !== 'completed').length;
      const incompleteHabits = habits.filter(h => h.status !== 'completed').length;

      if (pendingTasks > 0 || incompleteHabits > 0) {
        setMessages(prev => [
          ...prev,
          { 
            id: Date.now(), 
            type: 'ai', 
            text: `لقد لاحظت أن لديك ${pendingTasks} مهام معلقة و ${incompleteHabits} عادات لم تكتمل اليوم. هل نراجعها معاً؟` 
          }
        ]);
      }
    }
  }, [tasks, habits]);

  return (
    <div className="flex flex-col h-screen bg-background animate-in fade-in duration-500">
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
        
        <div className="flex flex-wrap gap-2 pt-4">
          {suggestions.map((s, i) => (
            <button key={i} className="px-4 py-2 rounded-full bg-white border border-border/40 premium-shadow text-xs font-bold text-primary hover:bg-primary/5 transition-colors">
              {s}
            </button>
          ))}
        </div>
      </div>

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
