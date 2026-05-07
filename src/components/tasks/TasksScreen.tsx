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
  Pencil,
  GraduationCap,
  Dumbbell,
  Music,
  Heart,
  Globe,
  Smartphone,
  Cpu,
  ChevronDown,
  ChevronLeft,
  X,
  Type
} from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, query, where, serverTimestamp, orderBy } from "firebase/firestore";
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";

interface TasksScreenProps {
  onBack: () => void;
}

type Priority = 'low' | 'medium' | 'high';

const PROJECT_ICONS = [
  { icon: Code, name: "Code", label: "برمجة" },
  { icon: BookOpen, name: "Book", label: "تأليف" },
  { icon: Palette, name: "Art", label: "تصميم" },
  { icon: Briefcase, name: "Work", label: "عمل" },
  { icon: GraduationCap, name: "Study", label: "دراسة" },
  { icon: Dumbbell, name: "Sport", label: "رياضة" },
  { icon: Music, name: "Music", label: "فن" },
  { icon: Heart, name: "Health", label: "شخصي" },
  { icon: Globe, name: "Travel", label: "سفر" },
  { icon: Smartphone, name: "Tech", label: "تقنية" },
  { icon: Cpu, name: "Dev", label: "تطوير" }
];

export function TasksScreen({ onBack }: TasksScreenProps) {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [isAddingStage, setIsAddingStage] = useState(false);
  
  // Edit States
  const [editingProject, setEditingProject] = useState<any>(null);
  const [editingStage, setEditingStage] = useState<any>(null);
  
  // Delete States
  const [projectToDelete, setProjectToDelete] = useState<any>(null);
  const [stageToDelete, setStageToDelete] = useState<any>(null);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);

  // Project Form State
  const [projTitle, setProjTitle] = useState("");
  const [projIcon, setProjIcon] = useState("Briefcase");

  // Stage Form State
  const [stageTitle, setStageTitle] = useState("");

  const projectsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'taskProjects'), orderBy('createdAt', 'asc'));
  }, [db, user]);

  const { data: projects, isLoading: isProjectsLoading } = useCollection(projectsQuery);

  const handleAddProject = () => {
    if (!db || !user || !projTitle) return;
    const projRef = collection(db, 'users', user.uid, 'taskProjects');
    addDocumentNonBlocking(projRef, {
      title: projTitle,
      icon: projIcon,
      createdAt: serverTimestamp(),
      userId: user.uid
    });
    setProjTitle("");
    setIsAddingProject(false);
    toast({ title: "تم إنشاء المشروع", description: "يمكنك الآن إضافة مراحل العمل." });
  };

  const handleUpdateProject = () => {
    if (!db || !user || !editingProject || !projTitle) return;
    const projRef = doc(db, 'users', user.uid, 'taskProjects', editingProject.id);
    updateDocumentNonBlocking(projRef, {
      title: projTitle,
      icon: projIcon
    });
    setProjTitle("");
    setEditingProject(null);
    toast({ title: "تم التحديث", description: "تم تعديل بيانات المشروع بنجاح." });
  };

  const confirmDeleteProject = () => {
    if (!db || !user || !projectToDelete) return;
    deleteDocumentNonBlocking(doc(db, 'users', user.uid, 'taskProjects', projectToDelete.id));
    if (activeProjectId === projectToDelete.id) setActiveProjectId(null);
    setProjectToDelete(null);
    toast({ title: "تم الحذف", description: "تم إزالة المشروع بنجاح." });
  };

  const handleAddStage = () => {
    if (!db || !user || !activeProjectId || !stageTitle) return;
    const stagesRef = collection(db, 'users', user.uid, 'taskProjects', activeProjectId, 'taskStages');
    addDocumentNonBlocking(stagesRef, {
      projectId: activeProjectId,
      title: stageTitle,
      createdAt: serverTimestamp()
    });
    setStageTitle("");
    setIsAddingStage(false);
    toast({ title: "تم إضافة المرحلة", description: "ابدأ بإضافة المهام بداخلها." });
  };

  const handleUpdateStage = () => {
    if (!db || !user || !activeProjectId || !editingStage || !stageTitle) return;
    const stageRef = doc(db, 'users', user.uid, 'taskProjects', activeProjectId, 'taskStages', editingStage.id);
    updateDocumentNonBlocking(stageRef, {
      title: stageTitle
    });
    setStageTitle("");
    setEditingStage(null);
    toast({ title: "تم التحديث", description: "تم تعديل عنوان المرحلة بنجاح." });
  };

  const confirmDeleteStage = () => {
    if (!db || !user || !activeProjectId || !stageToDelete) return;
    deleteDocumentNonBlocking(doc(db, 'users', user.uid, 'taskProjects', activeProjectId, 'taskStages', stageToDelete.id));
    setStageToDelete(null);
    toast({ title: "تم الحذف", description: "تم إزالة المرحلة بنجاح." });
  };

  const getProjectIcon = (iconName: string) => {
    const iconObj = PROJECT_ICONS.find(i => i.name === iconName);
    const Icon = iconObj ? iconObj.icon : Briefcase;
    return <Icon className="h-5 w-5" />;
  };

  return (
    <div className="flex flex-col min-h-screen bg-background animate-in fade-in duration-500 pb-32">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/5 shadow-sm">
        <div className="h-[env(safe-area-inset-top,0px)]" />
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10 rounded-[10px] bg-white border border-border/40 premium-shadow">
              <ChevronRight className="h-5 w-5 text-foreground" />
            </Button>
            <h2 className="text-2xl font-extrabold text-foreground font-cairo">إدارة المشاريع</h2>
          </div>
          <div className="h-10 w-10 rounded-[10px] bg-white border border-border/40 premium-shadow flex items-center justify-center text-primary">
            <Layers className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="px-6 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground font-cairo">المشاريع الكبرى</h3>
          <Button variant="ghost" size="sm" onClick={() => { setProjTitle(""); setProjIcon("Briefcase"); setIsAddingProject(true); }} className="text-primary text-xs font-bold gap-1">
            <Plus className="h-3 w-3" />
            مشروع جديد
          </Button>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
          {isProjectsLoading ? (
             <div className="flex items-center justify-center min-w-[140px]"><Loader2 className="h-4 w-4 animate-spin text-primary/30" /></div>
          ) : projects?.map((proj) => (
            <div 
              key={proj.id}
              onClick={() => setActiveProjectId(proj.id)}
              className={`min-w-[160px] p-4 rounded-[15px] premium-shadow border cursor-pointer transition-all ${activeProjectId === proj.id ? 'primary-gradient text-white border-transparent' : 'bg-white border-border/40'}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className={`h-10 w-10 rounded-[10px] flex items-center justify-center ${activeProjectId === proj.id ? 'bg-white/20' : 'bg-slate-50 text-slate-400'}`}>
                  {getProjectIcon(proj.icon)}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className={`h-6 w-6 ${activeProjectId === proj.id ? 'text-white/40' : 'text-slate-300'}`}><MoreVertical className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="font-cairo rounded-[10px]">
                    <DropdownMenuItem onClick={() => { setEditingProject(proj); setProjTitle(proj.title); setProjIcon(proj.icon); }}>
                      <Pencil className="h-4 w-4 ml-2" />
                      تعديل المشروع
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => setProjectToDelete(proj)}>
                      <Trash2 className="h-4 w-4 ml-2" />
                      حذف المشروع
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <h4 className="text-xs font-black truncate">{proj.title}</h4>
              <p className={`text-[9px] font-bold mt-1 ${activeProjectId === proj.id ? 'text-white/60' : 'text-muted-foreground'}`}>إدارة المراحل</p>
            </div>
          ))}
        </div>
      </div>

      {/* Project Detail View */}
      <div className="flex-1 px-6 space-y-6">
        {activeProjectId ? (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-foreground font-cairo">مراحل التنفيذ</h3>
              <Button onClick={() => { setStageTitle(""); setIsAddingStage(true); }} size="sm" className="rounded-[10px] bg-primary/5 text-primary hover:bg-primary/10 border-none font-bold">
                <Plus className="h-4 w-4 ml-1" />
                إضافة مرحلة
              </Button>
            </div>
            
            <StageListView 
              projectId={activeProjectId} 
              userId={user!.uid} 
              db={db!} 
              onEdit={(stage: any) => { setEditingStage(stage); setStageTitle(stage.title); }}
              onDelete={(stage: any) => setStageToDelete(stage)}
            />
          </div>
        ) : (
          <div className="py-20 text-center space-y-4 opacity-30">
            <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
              <Layers className="h-12 w-12 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-black">لم يتم اختيار مشروع</p>
              <p className="text-[10px] font-bold">اختر مشروعاً من الأعلى للبدء في إدارة المراحل والمهام</p>
            </div>
          </div>
        )}
      </div>

      {/* Modals & Dialogs */}
      
      {/* Project Modal (Add/Edit) */}
      <Dialog open={isAddingProject || !!editingProject} onOpenChange={(open) => { if(!open) { setIsAddingProject(false); setEditingProject(null); } }}>
        <DialogContent className="font-cairo rounded-[20px]">
          <DialogHeader className="flex flex-row-reverse items-center justify-between">
             <DialogTitle className="text-right flex-1">{editingProject ? "تعديل المشروع" : "مشروع جديد"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="block text-right">اسم المشروع الكبير</Label>
              <div className="relative">
                <Input 
                  placeholder="مثلاً: تطوير تطبيق، تأليف كتاب..." 
                  value={projTitle} 
                  onChange={e => setProjTitle(e.target.value)} 
                  className="h-12 rounded-[12px] text-right pr-10"
                />
                <Type className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-4">
              <Label className="block text-right">أيقونة المشروع</Label>
              <div className="grid grid-cols-4 gap-3 max-h-[200px] overflow-y-auto p-1">
                {PROJECT_ICONS.map((item) => (
                  <button 
                    key={item.name}
                    onClick={() => setProjIcon(item.name)}
                    className={`h-12 rounded-[12px] border flex flex-col items-center justify-center gap-1 transition-all ${projIcon === item.name ? 'border-primary bg-primary/5 text-primary' : 'border-border/40'}`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-[8px] font-bold">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={editingProject ? handleUpdateProject : handleAddProject} disabled={!projTitle} className="w-full h-12 primary-gradient text-white font-black rounded-[12px] shadow-lg">
              {editingProject ? "حفظ التعديلات" : "إنشاء المشروع"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stage Modal (Add/Edit) */}
      <Dialog open={isAddingStage || !!editingStage} onOpenChange={(open) => { if(!open) { setIsAddingStage(false); setEditingStage(null); } }}>
        <DialogContent className="font-cairo rounded-[20px]">
          <DialogHeader className="flex flex-row-reverse items-center justify-between">
            <DialogTitle className="text-right flex-1">{editingStage ? "تعديل المرحلة" : "إضافة مرحلة عمل"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="block text-right">عنوان المرحلة</Label>
              <div className="relative">
                <Input 
                  placeholder="مثلاً: التحليل، التصميم، Backend..." 
                  value={stageTitle} 
                  onChange={e => setStageTitle(e.target.value)} 
                  className="h-12 rounded-[12px] text-right pr-10"
                />
                <Layers className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={editingStage ? handleUpdateStage : handleAddStage} disabled={!stageTitle} className="w-full h-12 primary-gradient text-white font-black rounded-[12px] shadow-lg">
              {editingStage ? "حفظ التعديلات" : "تأكيد الإضافة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialogs */}
      <AlertDialog open={!!projectToDelete} onOpenChange={() => setProjectToDelete(null)}>
        <AlertDialogContent className="font-cairo rounded-[15px]">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المشروع؟</AlertDialogTitle>
            <AlertDialogDescription>سيتم حذف المشروع وكافة المراحل والمهام المرتبطة به. لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2">
            <AlertDialogCancel className="flex-1 rounded-[10px]">إلغاء</AlertDialogCancel>
            <AlertDialogAction className="flex-1 bg-destructive rounded-[10px]" onClick={confirmDeleteProject}>تأكيد الحذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!stageToDelete} onOpenChange={() => setStageToDelete(null)}>
        <AlertDialogContent className="font-cairo rounded-[15px]">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المرحلة؟</AlertDialogTitle>
            <AlertDialogDescription>سيتم حذف المرحلة وكافة المهام بداخلها بشكل نهائي.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2">
            <AlertDialogCancel className="flex-1 rounded-[10px]">إلغاء</AlertDialogCancel>
            <AlertDialogAction className="flex-1 bg-destructive rounded-[10px]" onClick={confirmDeleteStage}>تأكيد الحذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

function StageListView({ projectId, userId, db, onEdit, onDelete }: { projectId: string, userId: string, db: any, onEdit: (stage: any) => void, onDelete: (stage: any) => void }) {
  const stagesQuery = useMemoFirebase(() => {
    return query(collection(db, 'users', userId, 'taskProjects', projectId, 'taskStages'), orderBy('createdAt', 'asc'));
  }, [db, userId, projectId]);

  const { data: stages, isLoading } = useCollection(stagesQuery);

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary/20" /></div>;

  return (
    <div className="space-y-6">
      {stages && stages.length > 0 ? (
        stages.map(stage => (
          <div key={stage.id} className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                 <div className="h-2 w-2 rounded-full bg-primary" />
                 <h4 className="text-sm font-black text-foreground uppercase tracking-wider">{stage.title}</h4>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300"><MoreVertical className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="font-cairo rounded-[10px]">
                  <DropdownMenuItem onClick={() => onEdit(stage)}>
                    <Pencil className="h-4 w-4 ml-2" />
                    تعديل المرحلة
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => onDelete(stage)}>
                    <Trash2 className="h-4 w-4 ml-2" />
                    حذف المرحلة
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <TaskListView projectId={projectId} stageId={stage.id} userId={userId} db={db} />
          </div>
        ))
      ) : (
        <div className="py-10 text-center text-xs text-muted-foreground border-2 border-dashed rounded-[15px] font-bold">ابدأ بإضافة أول مرحلة لمشروعك</div>
      )}
    </div>
  );
}

function TaskListView({ projectId, stageId, userId, db }: { projectId: string, stageId: string, userId: string, db: any }) {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState<Priority>("medium");
  const { toast } = useToast();

  const tasksQuery = useMemoFirebase(() => {
    return query(collection(db, 'users', userId, 'taskProjects', projectId, 'taskStages', stageId, 'tasks'), orderBy('createdAt', 'asc'));
  }, [db, userId, projectId, stageId]);

  const { data: tasks } = useCollection(tasksQuery);

  const handleAddTask = () => {
    if (!taskTitle) return;
    const tasksRef = collection(db, 'users', userId, 'taskProjects', projectId, 'taskStages', stageId, 'tasks');
    addDocumentNonBlocking(tasksRef, {
      userId,
      projectId,
      stageId,
      title: taskTitle,
      status: "pending",
      priority: taskPriority,
      createdAt: serverTimestamp()
    });
    setTaskTitle("");
    setIsAddingTask(false);
  };

  const handleUpdateTask = () => {
    if (!editingTask || !taskTitle) return;
    const taskRef = doc(db, 'users', userId, 'taskProjects', projectId, 'taskStages', stageId, 'tasks', editingTask.id);
    updateDocumentNonBlocking(taskRef, {
      title: taskTitle,
      priority: taskPriority
    });
    setTaskTitle("");
    setEditingTask(null);
  };

  const toggleTask = (taskId: string, currentStatus: string) => {
    const taskRef = doc(db, 'users', userId, 'taskProjects', projectId, 'taskStages', stageId, 'tasks', taskId);
    updateDocumentNonBlocking(taskRef, {
      status: currentStatus === 'completed' ? 'pending' : 'completed'
    });
  };

  const getPriorityColor = (p: Priority) => {
    switch(p) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-orange-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-slate-400';
    }
  };

  return (
    <div className="space-y-3">
      {tasks?.map(task => (
        <div key={task.id} className="bg-white p-3.5 rounded-[12px] premium-shadow border border-border/40 flex items-center justify-between group active:scale-[0.99] transition-all">
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => toggleTask(task.id, task.status)}
              className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${task.status === 'completed' ? 'bg-primary border-primary text-white' : 'border-slate-200'}`}
            >
              {task.status === 'completed' && <CheckCircle2 className="h-3 w-3" />}
            </button>
            <div className="flex-1">
               <h5 className={`text-xs font-bold ${task.status === 'completed' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{task.title}</h5>
               <div className={`mt-1 h-1 w-8 rounded-full ${getPriorityColor(task.priority)}`} />
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary/40 hover:text-primary" onClick={() => { setEditingTask(task); setTaskTitle(task.title); setTaskPriority(task.priority); }}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/20 hover:text-destructive" onClick={() => setTaskToDelete(task)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
      
      {(!isAddingTask && !editingTask) ? (
        <button 
          onClick={() => { setTaskTitle(""); setTaskPriority("medium"); setIsAddingTask(true); }}
          className="w-full py-2.5 rounded-[10px] border border-dashed border-primary/20 text-primary/60 text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-primary/5"
        >
          <Plus className="h-3 w-3" />
          إضافة مهمة للمرحلة
        </button>
      ) : (
        <div className="bg-slate-50 p-3 rounded-[12px] border border-border/40 space-y-3 animate-in fade-in zoom-in-95">
          <div className="relative">
            <Input 
              autoFocus
              placeholder="اكتب المهمة هنا..." 
              value={taskTitle} 
              onChange={e => setTaskTitle(e.target.value)}
              className="h-9 text-[11px] font-bold rounded-[8px] pr-8"
            />
            <CheckCircle2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as Priority[]).map(p => (
                <button 
                  key={p}
                  onClick={() => setTaskPriority(p)}
                  className={`h-5 px-2 rounded-full text-[8px] font-black transition-all ${taskPriority === p ? getPriorityColor(p) + ' text-white shadow-lg' : 'bg-white border border-border/40 text-muted-foreground'}`}
                >
                  {p === 'high' ? 'عاجل' : p === 'medium' ? 'متوسط' : 'عادي'}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              <Button size="sm" onClick={editingTask ? handleUpdateTask : handleAddTask} className="h-7 px-3 rounded-[8px] primary-gradient text-white text-[10px] font-bold transition-none">
                {editingTask ? "حفظ" : "إضافة"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setIsAddingTask(false); setEditingTask(null); }} className="h-7 px-2 rounded-[8px] text-[10px] transition-none"><X className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      )}

      {/* Task Delete Dialog */}
      <AlertDialog open={!!taskToDelete} onOpenChange={() => setTaskToDelete(null)}>
        <AlertDialogContent className="font-cairo rounded-[15px]">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المهمة؟</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف هذه المهمة نهائياً؟</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2">
            <AlertDialogCancel className="flex-1 rounded-[10px]">إلغاء</AlertDialogCancel>
            <AlertDialogAction className="flex-1 bg-destructive rounded-[10px]" onClick={() => { deleteDocumentNonBlocking(doc(db, 'users', userId, 'taskProjects', projectId, 'taskStages', stageId, 'tasks', taskToDelete.id)); setTaskToDelete(null); }}>تأكيد الحذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
