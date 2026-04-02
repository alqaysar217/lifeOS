
"use client"

import React from "react";
import { Bell, Activity, CheckSquare, Zap, Clock, ChevronRight, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface NotificationsScreenProps {
  onBack: () => void;
}

const notifications = [
  { id: 1, type: 'fitness', title: "هدف الجري", desc: "باقي 20 دقيقة لإنهاء هدفك اليومي", time: "منذ 5 د", icon: Activity, color: "text-blue-500", bg: "bg-blue-50" },
  { id: 2, type: 'tasks', title: "تذكير المهام", desc: "لديك اجتماع فريق التصميم بعد قليل", time: "منذ 15 د", icon: CheckSquare, color: "text-purple-500", bg: "bg-purple-50" },
  { id: 3, type: 'habits', title: "بناء العادات", desc: "لم تكمل عادة شرب الماء حتى الآن", time: "منذ ساعة", icon: Zap, color: "text-orange-500", bg: "bg-orange-50" },
  { id: 4, type: 'fitness', title: "إنجاز رائع", desc: "لقد حطمت رقمك القياسي في خطوات المشي", time: "منذ ساعتين", icon: Activity, color: "text-blue-500", bg: "bg-blue-50" }
];

export function NotificationsScreen({ onBack }: NotificationsScreenProps) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/5 px-6 pt-10 pb-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10 rounded-[10px] bg-white border border-border/40 premium-shadow">
              <ChevronRight className="h-5 w-5 text-foreground" />
            </Button>
            <h2 className="text-2xl font-extrabold text-foreground font-cairo">الإشعارات</h2>
          </div>
          <Badge variant="secondary" className="rounded-[6px] bg-primary/10 text-primary border-none">3 جديدة</Badge>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Categories Header */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {['الكل', 'رياضة', 'مهام', 'عادات'].map((cat, i) => (
            <button key={i} className={`px-5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${i === 0 ? 'primary-gradient text-white shadow-lg' : 'bg-white border border-border/40 text-muted-foreground'}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-4">
          {notifications.map((notif, i) => (
            <div key={notif.id} className="bg-white p-4 rounded-[12px] premium-shadow border border-border/40 flex items-start gap-4 animate-in slide-in-from-right-4 transition-all active:scale-[0.98]" style={{ animationDelay: `${i * 100}ms` }}>
              <div className={`h-12 w-12 rounded-[10px] ${notif.bg} flex items-center justify-center shrink-0`}>
                <notif.icon className={`h-6 w-6 ${notif.color}`} />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-foreground">{notif.title}</h4>
                  <span className="text-[9px] font-bold text-muted-foreground flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {notif.time}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-medium">{notif.desc}</p>
              </div>
              <button className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-slate-50">
                <MoreVertical className="h-4 w-4 text-slate-300" />
              </button>
            </div>
          ))}
        </div>

        {/* Empty State Mockup */}
        <div className="pt-10 text-center space-y-4 opacity-30">
          <div className="h-16 w-16 rounded-full soft-purple-bg flex items-center justify-center mx-auto">
            <Bell className="h-8 w-8 text-primary" />
          </div>
          <p className="text-xs font-bold">لا يوجد المزيد من التنبيهات</p>
        </div>
      </div>
    </div>
  );
}
