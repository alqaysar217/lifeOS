"use client"

import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, User, BrainCircuit, ChevronRight, Video, Loader2, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { generateMotivationalVideo } from "@/ai/flows/motivational-video-flow";
import { getAIInsight } from "@/ai/flows/ai-assistant-flow";
import { useToast } from "@/hooks/use-toast";

interface AIScreenProps {
  onBack: () => void;
}

export function AIScreen({ onBack }: AIScreenProps) {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const tasksQuery = useMemoFirebase(() => (!db || !user) ? null : collection(db, 'users', user.uid, 'tasks'), [db, user]);
  const habitsQuery = useMemoFirebase(() => (!db || !user) ? null : collection(db, 'users', user.uid, 'habits'), [db, user]);
  const fitnessQuery = useMemoFirebase(() => (!db || !user) ? null : collection(db, 'users', user.uid, 'fitnessRecords'), [db, user]);

  const { data: tasks } = useCollection(tasksQuery);
  const { data: habits } = useCollection(habitsQuery);
  const { data: fitness } = useCollection(fitnessQuery);

  const [messages, setMessages] = useState([
    { id: 1, type: 'ai', text: "أهلاً بك يا بطل! أنا مساعدك الذكي. يمكنني تحليل إنجازاتك أو صناعة فيديو تحفيزي لك. كيف أساعدك؟" }
  ]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isAnalysing) return;

    const userMsg = inputMessage;
    setInputMessage("");
    setMessages(prev => [...prev, { id: Date.now(), type: 'user', text: userMsg }]);
    
    setIsAnalysing(true);

    try {
      const tasksSummary = tasks ? `لديه ${tasks.length} مهام، منها ${tasks.filter(t => t.status === 'completed').length} مكتملة.` : "لا توجد مهام حالياً.";
      const habitsSummary = habits ? `يلتزم بـ ${habits.length} عادات، أفضل سلسلة هي ${Math.max(...habits.map(h => h.streak || 0), 0)} أيام.` : "لم يسجل عادات بعد.";
      const fitnessSummary = fitness ? `آخر نشاط بدني كان مسافة ${fitness[fitness.length - 1]?.distance?.toFixed(2) || 0} كم.` : "لم يسجل نشاطاً بدنياً مؤخراً.";

      const result = await getAIInsight({
        tasksSummary,
        habitsSummary,
        fitnessSummary,
        userMessage: userMsg
      });

      setMessages(prev => [
        ...prev,
        { id: Date.now(), type: 'ai', text: result.response }
      ]);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "خطأ في الاتصال", description: "عذراً، المساعد مشغول حالياً." });
    } finally {
      setIsAnalysing(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!tasks || !habits) return;
    setIsVideoLoading(true);
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const activeHabits = habits.filter(h => h.streak > 0).length;
    const summary = `لقد أنجزت ${completedTasks} مهام ولدي إلتزام في ${activeHabits} عادات اليوم.`;
    
    try {
      const result = await generateMotivationalVideo({ progressSummary: summary });
      setGeneratedVideo(result.videoDataUri);
      setMessages(prev => [...prev, { id: Date.now(), type: 'ai', text: result.message }]);
    } catch (error) {
      toast({ variant: "destructive", title: "فشل التوليد", description: "حاول مرة أخرى لاحقاً." });
    } finally {
      setIsVideoLoading(false);
    }
  };

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
                <span className="text-[10px] font-bold text-muted-foreground uppercase">متصل ببياناتك المباشرة</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        <div className="bg-white p-6 rounded-[20px] premium-shadow border border-primary/10 relative overflow-hidden group">
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-[12px] bg-primary/10 flex items-center justify-center">
                <Video className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-sm font-bold text-foreground">الإنتاج السينمائي بالذكاء الاصطناعي</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">سأقوم بصناعة فيديو تحفيزي مخصص لك بناءً على نشاطك اليومي.</p>
            <Button onClick={handleGenerateVideo} disabled={isVideoLoading} className="w-full primary-gradient text-white font-bold h-11 rounded-[12px] shadow-lg shadow-primary/20 transition-all active:scale-95">
              {isVideoLoading ? <><Loader2 className="h-4 w-4 animate-spin ml-2" /> جاري التوليد...</> : <><Play className="h-4 w-4 ml-2 fill-current" /> اصنع فيديو إنجازاتي</>}
            </Button>
          </div>
        </div>

        {generatedVideo && (
          <div className="animate-in zoom-in-95 duration-500">
            <div className="relative aspect-video w-full rounded-[20px] overflow-hidden premium-shadow border border-border/40 bg-black">
              <video src={generatedVideo} controls autoPlay className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-start' : 'justify-end'} animate-in slide-in-from-bottom-2`}>
            <div className={`max-w-[85%] p-4 rounded-[15px] premium-shadow border border-border/40 flex gap-3 ${msg.type === 'user' ? 'bg-primary text-white' : 'bg-white text-foreground'}`}>
              {msg.type === 'ai' && <div className="h-8 w-8 rounded-full soft-purple-bg flex items-center justify-center shrink-0"><Bot className="h-4 w-4 text-primary" /></div>}
              <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
              {msg.type === 'user' && <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center shrink-0"><User className="h-4 w-4 text-white" /></div>}
            </div>
          </div>
        ))}
        
        {isAnalysing && (
          <div className="flex justify-end animate-in fade-in">
            <div className="bg-white p-4 rounded-[15px] premium-shadow border border-border/40 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-xs font-bold text-muted-foreground">جاري تحليل بياناتك...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-background border-t border-border/5">
        <div className="relative flex items-center gap-2 bg-white rounded-[15px] premium-shadow border border-border/40 p-2">
          <Input 
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="اسألني عن أدائك اليوم..." 
            className="border-none shadow-none focus-visible:ring-0 text-xs font-bold bg-transparent"
          />
          <Button onClick={handleSendMessage} size="icon" className="h-10 w-10 rounded-[10px] primary-gradient shadow-lg active:scale-90 transition-transform">
            <Send className="h-4 w-4 text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
}
