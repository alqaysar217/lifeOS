
"use client"

import React, { useState, useMemo } from "react";
import { 
  Plus, 
  MoreVertical, 
  Calendar, 
  Folder, 
  Clock, 
  CheckCircle2, 
  Circle, 
  ChevronRight, 
  Search, 
  LayoutGrid, 
  AlertCircle,
  Flag,
  Filter,
  Layers,
  Briefcase,
  BookOpen,
  Code,
  Palette,
  Trophy,
  Loader2,
  Trash2,
  Pencil
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, query, where, serverTimestamp, orderBy } from "firebase/firestore";
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";

interface TasksScreenProps {
  onBack: () => void;
}

type Priority = 'low' | 'medium' | 'high';
type TaskStatus = 'pending' | 'in-progress' | 'completed';

export function TasksScreen({ onBack }: TasksScreenProps) {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isAddingProject, setIsAddingProject] = useState(false);
  
  // Task Form State
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>("medium");
  const [newTaskProject, setNewTaskProject] = useState<string>("general");
  
  // Project Form State
  const [newProjTitle, setNewProjTitle] = useState("");
  const [newProjColor, setNewProjColor] = useState("bg-primary");
  const [newProjIcon, setNewProjIcon] = useState("Briefcase");

  const tasksQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'tasks'), orderBy('createdAt', 'desc'));
  }, [db, user]);

  const projectsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'taskProjects'), orderBy('createdAt', 'asc'));
  }, [db, user]);

  const { data: tasks, isLoading: isTasksLoading } = useCollection(tasksQuery);
  const { data: projects, isLoading: isProjectsLoading } = useCollection(projectsQuery);

  const toggleTask = (taskId: string, currentStatus: string) => {
    if (!db || !user) return;
    const taskRef = doc(db, 'users', user.uid, 'tasks', taskId);
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    
    updateDocumentNonBlocking(taskRef, { status: newStatus });
    if (newStatus === 'completed') {
      toast({ title: "أحسنت!", description: "تم إنجاز المهمة بنجاح." });
    }
  };

  const handleAddTask = () => {
    if (!db || !user || !newTaskTitle) return;
    const tasksRef = collection(db, 'users', user.uid, 'tasks');
    addDocumentNonBlocking(tasksRef, {
      title: newTaskTitle,
      status: "pending",
      priority: newTaskPriority,
      projectId: newTaskProject,
      createdAt: serverTimestamp(),
      userId: user.uid
    });
    setNewTaskTitle("");
    setIsAddingTask(false);
  };

  const handleAddProject = () => {
    if (!db || !user || !newProjTitle) return;
    const projRef = collection(db, 'users', user.uid, 'taskProjects');
    addDocumentNonBlocking(projRef, {
      title: newProjTitle,
      color: newProjColor,
      icon: newProjIcon,
      createdAt: serverTimestamp(),
      userId: user.uid
    });
    setNewProjTitle("");
    setIsAddingProject(false);
  };

  const handleDeleteTask = (taskId: string) => {
    if (!db || !user) return;
    deleteDocumentNonBlocking(doc(db, 'users', user.uid, 'tasks', taskId));
  };

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    if (!activeProjectId) return tasks;
    return tasks.filter(t => t.projectId === activeProjectId);
  }, [tasks, activeProjectId]);

  const projectStats = useMemo(() => {
    if (!tasks || !projects) return {};
    const stats: Record<string, { total: number, completed: number }> = {};
    
    tasks.forEach(t => {
      const pid = t.projectId || 'general';
      if (!stats[pid]) stats[pid] = { total: 0, completed: 0 };
      stats[pid].total++;
      if (t.status === 'completed') stats[pid].completed++;
    });
    
    return stats;
  }, [tasks, projects]);

  const getPriorityColor = (p: Priority) => {
    switch(p) {
      case 'high': return 'text-red-500 bg-red-50';
      case 'medium': return 'text-orange-500 bg-orange-50';
      case 'low': return 'text-green-500 bg-green-50';
      default: return 'text-slate-500 bg-slate-50';
    }
  };

  const getPriorityLabel = (p: Priority) => {
    switch(p) {
      case 'high': return 'أولوية قصوى';
      case 'medium': return 'متوسطة';
      case 'low': return 'عادية';
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background animate-in fade-in duration-500">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/5 shadow-sm">
        <div className="h-[env(safe-area-inset-top,0px)]" />
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10 rounded-[10px] bg-white border border-border/40 premium-shadow">
              <ChevronRight className="h-5 w-5 text-foreground" />
            </Button>
            <h2 className="text-2xl font-extrabold text-foreground font-cairo">إدارة المهام</h2>
          </div>
          <div className="h-10 w-10 rounded-[10px] bg-white border border-border/40 premium-shadow flex items-center justify-center text-primary">
            <Layers className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        {/* Projects Horizontal Scroll */}
        <div className="px-6 py-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground font-cairo">مساحات العمل</h3>
            <Button variant="ghost" size="sm" onClick={() => setIsAddingProject(true)} className="text-primary text-xs font-bold gap-1">
              <Plus className="h-3 w-3" />
              مساحة جديدة
            </Button>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
            <div 
              onClick={() => setActiveProjectId(null)}
              className={`min-w-[140px] p-4 rounded-[15px] premium-shadow border cursor-pointer transition-all ${!activeProjectId ? 'primary-gradient text-white border-transparent' : 'bg-white border-border/40'}`}
            >
              <div className={`h-10 w-10 rounded-[10px] flex items-center justify-center mb-3 ${!activeProjectId ? 'bg-white/20' : 'bg-primary/5 text-primary'}`}>
                <LayoutGrid className="h-5 w-5" />
              </div>
              <p className="text-xs font-black">كافة المهام</p>
              <p className={`text-[9px] font-bold mt-1 ${!activeProjectId ? 'text-white/60' : 'text-muted-foreground'}`}>{tasks?.length || 0} مهمة</p>
            </div>

            {projects?.map((proj) => {
              const stats = projectStats[proj.id] || { total: 0, completed: 0 };
              const progress = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
              const isActive = activeProjectId === proj.id;

              return (
                <div 
                  key={proj.id}
                  onClick={() => setActiveProjectId(proj.id)}
                  className={`min-w-[180px] p-4 rounded-[15px] premium-shadow border cursor-pointer transition-all ${isActive ? 'bg-slate-900 text-white border-transparent' : 'bg-white border-border/40'}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className={`h-10 w-10 rounded-[10px] flex items-center justify-center ${isActive ? 'bg-white/10' : 'bg-slate-50 text-slate-400'}`}>
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground/40"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="font-cairo">
                        <DropdownMenuItem className="text-destructive" onClick={() => deleteDocumentNonBlocking(doc(db!, 'users', user!.uid, 'taskProjects', proj.id))}>حذف المساحة</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <h4 className="text-xs font-black truncate">{proj.title}</h4>
                  <div className="mt-3 space-y-1.5">
                    <div className="flex justify-between items-center text-[8px] font-bold">
                      <span className={isActive ? 'text-white/60' : 'text-muted-foreground'}>{stats.completed}/{stats.total} إنجاز</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className={`h-1 ${isActive ? 'bg-white/10' : 'bg-secondary'}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Task List Section */}
        <div className="px-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground font-cairo">
              {activeProjectId ? projects?.find(p => p.id === activeProjectId)?.title : 'كافة المهام اليومية'}
            </h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-[8px] bg-slate-50 text-slate-400"><Filter className="h-4 w-4" /></Button>
              <Button onClick={() => setIsAddingTask(true)} variant="ghost" size="icon" className="h-8 w-8 rounded-[8px] bg-primary/5 text-primary"><Plus className="h-4 w-4" /></Button>
            </div>
          </div>

          <div className="space-y-3">
            {isTasksLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary/30" /></div>
            ) : filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <div 
                  key={task.id}
                  className="bg-white p-4 rounded-[15px] premium-shadow border border-border/40 flex items-center justify-between group active:scale-[0.99] transition-all"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <button 
                      onClick={() => toggleTask(task.id, task.status)}
                      className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${task.status === 'completed' ? 'bg-primary border-primary text-white' : 'border-slate-200'}`}
                    >
                      {task.status === 'completed' && <CheckCircle2 className="h-4 w-4" />}
                    </button>
                    <div className="flex-1">
                      <h4 className={`text-sm font-bold ${task.status === 'completed' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${getPriorityColor(task.priority)}`}>
                          {getPriorityLabel(task.priority)}
                        </span>
                        <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-bold">
                          <Clock className="h-3 w-3" />
                          اليوم
                        </div>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="font-cairo">
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteTask(task.id)}>
                        <Trash2 className="h-4 w-4 ml-2" />
                        حذف المهمة
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            ) : (
              <div className="py-20 text-center space-y-4 opacity-30">
                <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                  <Layers className="h-10 w-10 text-primary" />
                </div>
                <p className="text-sm font-bold">لا توجد مهام في هذه المساحة بعد</p>
                <Button variant="outline" size="sm" onClick={() => setIsAddingTask(true)} className="rounded-[10px] font-bold">إضافة أول مهمة</Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <Button 
        onClick={() => setIsAddingTask(true)}
        className="fixed bottom-32 left-8 h-14 w-14 rounded-full primary-gradient text-white shadow-2xl shadow-primary/40 active:scale-90 transition-transform z-50"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Add Task Modal */}
      <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
        <DialogContent className="font-cairo rounded-[20px]">
          <DialogHeader><DialogTitle>إضافة مهمة احترافية</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>ما هي المهمة؟</Label>
              <Input 
                placeholder="مثلاً: مراجعة الكود، كتابة فصل جديد..." 
                value={newTaskTitle} 
                onChange={e => setNewTaskTitle(e.target.value)} 
                className="h-12 rounded-[12px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الأولوية</Label>
                <Select value={newTaskPriority} onValueChange={(v: any) => setNewTaskPriority(v)}>
                  <SelectTrigger className="h-12 rounded-[12px]">
                    <SelectValue placeholder="اختر الأولوية" />
                  </SelectTrigger>
                  <SelectContent className="font-cairo">
                    <SelectItem value="high">قصوى (عاجلة)</SelectItem>
                    <SelectItem value="medium">متوسطة</SelectItem>
                    <SelectItem value="low">عادية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>مساحة العمل</Label>
                <Select value={newTaskProject} onValueChange={setNewTaskProject}>
                  <SelectTrigger className="h-12 rounded-[12px]">
                    <SelectValue placeholder="اختر المساحة" />
                  </SelectTrigger>
                  <SelectContent className="font-cairo">
                    <SelectItem value="general">عامة</SelectItem>
                    {projects?.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddTask} disabled={!newTaskTitle} className="w-full h-12 primary-gradient text-white font-black rounded-[12px] shadow-lg">تأكيد الإضافة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Project Modal */}
      <Dialog open={isAddingProject} onOpenChange={setIsAddingProject}>
        <DialogContent className="font-cairo rounded-[20px]">
          <DialogHeader><DialogTitle>إنشاء مساحة عمل جديدة</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>اسم المساحة أو المشروع</Label>
              <Input 
                placeholder="مثلاً: تطوير التطبيق، تعلم اللغة..." 
                value={newProjTitle} 
                onChange={e => setNewProjTitle(e.target.value)} 
                className="h-12 rounded-[12px]"
              />
            </div>
            <div className="space-y-2">
              <Label>أيقونة تمييزية</Label>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { icon: Code, name: "Code" },
                  { icon: BookOpen, name: "Book" },
                  { icon: Palette, name: "Art" },
                  { icon: Briefcase, name: "Work" }
                ].map((item) => (
                  <button 
                    key={item.name}
                    onClick={() => setNewProjIcon(item.name)}
                    className={`h-12 rounded-[12px] border flex items-center justify-center transition-all ${newProjIcon === item.name ? 'border-primary bg-primary/5 text-primary' : 'border-border/40'}`}
                  >
                    <item.icon className="h-5 w-5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddProject} disabled={!newProjTitle} className="w-full h-12 primary-gradient text-white font-black rounded-[12px] shadow-lg">إنشاء المساحة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
