
"use client"

import { Wallet, Plus, Coffee, Book, CreditCard, Car, Info, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection, serverTimestamp } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";

interface FinanceScreenProps {
  onBack: () => void;
}

export function FinanceScreen({ onBack }: FinanceScreenProps) {
  const db = useFirestore();
  const { user } = useUser();

  const financeQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'financeTransactions');
  }, [db, user]);

  const { data: transactions } = useCollection(financeQuery);

  const totalSpent = transactions?.reduce((acc, t) => acc + Number(t.amount || 0), 0) || 0;

  const handleAddTransaction = () => {
    if (!db || !user) return;
    const financeRef = collection(db, 'users', user.uid, 'financeTransactions');
    addDocumentNonBlocking(financeRef, {
      title: "مصروف جديد",
      amount: 100,
      category: "أخرى",
      date: serverTimestamp(),
      userId: user.uid
    });
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/5 px-6 pt-10 pb-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10 rounded-[10px] bg-white border border-border/40 premium-shadow">
              <ChevronRight className="h-5 w-5 text-foreground" />
            </Button>
            <h2 className="text-2xl font-extrabold text-foreground font-cairo">المصاريف</h2>
          </div>
          <div className="h-10 w-10 rounded-[10px] bg-white border border-border/40 premium-shadow flex items-center justify-center text-primary">
            <Wallet className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-8">
        <div className="primary-gradient rounded-[10px] p-8 text-white premium-shadow relative overflow-hidden shadow-[0_20px_40px_-15px_rgba(139,92,246,0.4)]">
          <div className="relative z-10 space-y-2">
            <p className="text-white/70 text-sm font-bold">إجمالي المصاريف</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-black">{totalSpent.toLocaleString()}</h3>
              <span className="text-sm font-bold opacity-80">ريال</span>
            </div>
          </div>
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        </div>

        <div className="glass-panel p-4 rounded-[10px] border border-primary/10 flex gap-4 items-start">
          <div className="h-10 w-10 rounded-[8px] soft-purple-bg flex items-center justify-center shrink-0">
            <Info className="h-5 w-5 text-primary" />
          </div>
          <p className="text-xs font-bold text-foreground/80 leading-relaxed">
            تحليل ذكي: حافظ على توازن ميزانيتك من خلال تتبع المصاريف اليومية بدقة.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-foreground/90 font-cairo">توزيع الصرف</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "أكل", val: 65, color: "bg-orange-500", icon: Coffee },
              { label: "دراسة", val: 40, color: "bg-blue-500", icon: Book },
              { label: "اشتراكات", val: 20, color: "bg-purple-500", icon: CreditCard },
              { label: "سيارة", val: 15, color: "bg-slate-500", icon: Car },
            ].map((cat, i) => (
              <div key={i} className="bg-white p-4 rounded-[10px] premium-shadow border border-border/40 space-y-3">
                <div className="flex items-center gap-2">
                  <cat.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-bold text-foreground">{cat.label}</span>
                </div>
                <Progress value={cat.val} className="h-1.5" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground/90 font-cairo">آخر العمليات</h3>
            <button className="text-xs text-primary font-bold">عرض الكل</button>
          </div>
          <div className="space-y-3">
            {transactions?.map((t, i) => (
              <div key={i} className="bg-white p-4 rounded-[10px] premium-shadow border border-border/40 flex items-center justify-between active:scale-[0.98] transition-all">
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-[10px] soft-purple-bg flex items-center justify-center">
                    <Coffee className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{t.title}</h4>
                    <p className="text-[10px] text-muted-foreground font-medium">{t.category}</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-foreground">{t.amount} ريال</p>
                  <p className="text-[8px] font-bold text-muted-foreground">اليوم</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button onClick={handleAddTransaction} className="fixed bottom-32 left-8 h-14 w-14 rounded-full primary-gradient text-white flex items-center justify-center shadow-2xl shadow-primary/40 active:scale-90 transition-transform z-40">
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}
