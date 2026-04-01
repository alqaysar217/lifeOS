
"use client"

import { CheckSquare, Plus, MoreVertical, Calendar, Folder, Clock, CheckCircle2, Circle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

const todayTasks = [
  { id: 1, title: "مراجعة تقرير المشروع", completed: true, time: "09:00 ص" },
  { id: 2, title: "اجتماع فريق التصميم", completed: false, time: "11:30 ص" },
  { id: 3, title: "تحديث قاعدة البيانات", completed: false, time: "02:00 م" },
];

const projects = [
  { title: "تطبيق حياتي", progress: 75, tasks: 12, color: "bg-primary" },
  { title: "خطة التدريب", progress: 40, tasks: 5, color: "bg-blue-500" },
];

export function TasksScreen() {
  return (
    <div className="px-6 pt-10 pb-32 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-extrabold text-foreground font-cairo">المهام</h2>
        <div className="h-10 w-10 rounded-[10px] bg-white border border-border/40 premium-shadow flex items-center justify-center text-primary">
          <Calendar className="h-5 w-5" />
        </div>
      </div>

      {/* قسم المشاريع */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground/90">المشاريع</h3>
          <button className="h-8 w-8 rounded-[8px] bg-primary/5 text-primary flex items-center justify-center">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {projects.map((proj, i) => (
            <div key={i} className="min-w-[200px] bg-white p-5 rounded-[10px] premium-shadow border border-border/40 space-y-4">
              <div className="flex justify-between items-start">
                <div className={`h-10 w-10 rounded-[10px] ${proj.color} flex items-center justify-center text-white`}>
                  <Folder className="h-5 w-5" />
                </div>
                <MoreVertical className="h-4 w-4 text-slate-300" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">{proj.title}</h4>
                <p className="text-[10px] text-muted-foreground font-bold">{proj.tasks} مهمة</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-bold text-muted-foreground">
                  <span>الإنجاز</span>
                  <span>{proj.progress}%</span>
                </div>
                <Progress value={proj.progress} className="h-1.5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* تبويبات المهام */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-foreground/90">قائمة المهام</h3>
        <Tabs defaultValue="ongoing" className="w-full">
          <TabsList className="w-full bg-white premium-shadow border border-border/40 h-12 p-1.5 rounded-[10px]">
            <TabsTrigger value="ongoing" className="flex-1 rounded-[8px] data-[state=active]:primary-gradient data-[state=active]:text-white text-xs font-bold">قيد التنفيذ</TabsTrigger>
            <TabsTrigger value="completed" className="flex-1 rounded-[8px] data-[state=active]:primary-gradient data-[state=active]:text-white text-xs font-bold">مكتمل</TabsTrigger>
            <TabsTrigger value="later" className="flex-1 rounded-[8px] data-[state=active]:primary-gradient data-[state=active]:text-white text-xs font-bold">لاحقاً</TabsTrigger>
          </TabsList>
          
          <TabsContent value="ongoing" className="mt-6 space-y-3">
            {todayTasks.map((task) => (
              <div key={task.id} className="bg-white p-4 rounded-[10px] premium-shadow border border-border/40 flex items-center justify-between group active:scale-[0.99] transition-all">
                <div className="flex items-center gap-4">
                  <div className="h-6 w-6 rounded-full border-2 border-primary/20 flex items-center justify-center text-primary group-hover:border-primary/50 transition-colors">
                    {task.completed ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4 text-transparent" />}
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold ${task.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                      {task.title}
                    </h4>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground font-medium">{task.time}</span>
                    </div>
                  </div>
                </div>
                <div className="h-8 w-8 rounded-[8px] bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4 text-slate-300" />
                </div>
              </div>
            ))}
          </TabsContent>
          <TabsContent value="completed" className="mt-6">
            <div className="text-center py-10 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm font-bold">لا توجد مهام مكتملة بعد</p>
            </div>
          </TabsContent>
          <TabsContent value="later" className="mt-6">
            <div className="text-center py-10 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm font-bold">خطط لمهامك القادمة هنا</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* زر إضافة عائم */}
      <button className="fixed bottom-32 left-8 h-14 w-14 rounded-full primary-gradient text-white flex items-center justify-center shadow-2xl shadow-primary/40 active:scale-90 transition-transform z-40">
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}
