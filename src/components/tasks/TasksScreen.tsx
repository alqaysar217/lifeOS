
"use client"

import React, { useState, useMemo, useEffect } from "react";
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
  Type,
  Tag,
  Timer,
  CheckCircle
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
import { collection, doc, query, where, serverTimestamp, orderBy, getDocs, collectionGroup } from "firebase/firestore";
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
  
  const [editingProject, setEditingProject] = useState<any>(null);
  const [editingStage, setEditingStage] = useState<any>(null);
  const [editingTask, setEditingTask] = useState<any>(null);
  
  const [projectToDelete, setProjectToDelete] = useState<any>(null);
  const [stageToDelete, setStageToDelete] = useState<any>(null);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);

  const [projTitle, setProjTitle] = useState("");
  const [projIcon, setProjIcon] = useState("Briefcase");
  const [stageTitle, setStageTitle] = useState("");
  
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState<Priority>("medium");
  const [taskExpectedTime, setTaskExpectedTime] = useState("");
  const [taskActualTime, setTaskActualTime] = useState("");

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
    const deletedId = projectToDelete.id;
    setProjectToDelete(null);
    setTimeout(() => {
      deleteDocumentNonBlocking(doc(db, 'users', user.uid, 'taskProjects', deletedId));
      if (activeProjectId === deletedId) setActiveProjectId(null);
      toast({ title: "تم الحذف", description: "تم إزالة المشروع بنجاح." });
    }, 150);
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
    const deletedId = stageToDelete.id;
    setStageToDelete(null);
    setTimeout(() => {
      deleteDocumentNonBlocking(doc(db, 'users', user.uid, 'taskProjects', activeProjectId, 'taskStages', deletedId));
      toast({ title: "تم الحذف", description: "تم إزالة المرحلة بنجاح." });
    }, 150);
  };

  const handleUpdateTask = () => {
    if (!db || !user || !editingTask || !taskTitle) return;
    const { id, projectId, stageId } = editingTask;
    const taskRef = doc(db, 'users', user.uid, 'taskProjects', projectId, 'taskStages', stageId, 'tasks', id);
    updateDocumentNonBlocking(taskRef, {
      title: taskTitle,
      priority: taskPriority,
      expectedTime: taskExpectedTime,
      actualTime: taskActualTime
    });
    setTaskTitle("");
    setTaskExpectedTime("");
    setTaskActualTime("");
    setEditingTask(null);
    toast({ title: "تم التحديث", description: "تم تعديل المهمة بنجاح." });
  };

  const confirmDeleteTask = () => {
    if (!db || !user || !taskToDelete) return;
    const { id, projectId, stageId } = taskToDelete;
    setTaskToDelete(null);
    setTimeout(() => {
      deleteDocumentNonBlocking(doc(db, 'users', user.uid, 'taskProjects', projectId, 'taskStages', stageId, 'tasks', id));
      toast({ title: "تم الحذف", description: "تم إزالة المهمة بنجاح." });
    }, 150);
  };

  const getProjectIcon = (iconName: string) => {
    const iconObj = PROJECT_ICONS.find(i => i.name === iconName);
    const Icon = iconObj ? iconObj.icon : Briefcase;
    return <Icon className="h-5 w-5" />;
  };

  return (
    <div className="flex flex-col min-h-screen bg-background animate-in fade-in duration-500 pb-32">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/5 shadow-sm">
        <div className="h-[env(safe-area-inset-top,0px)]" />
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10 rounded-[10px] bg-white border border-border/40 premium-shadow transition-none">
              <ChevronRight className="h-5 w-5 text-foreground" />
            </Button>
            <h2 className="text-2xl font-extrabold text-foreground font-cairo">إدارة المشاريع</h2>
          </div>
          <div className="h-10 w-10 rounded-[10px] bg-white border border-border/40 premium-shadow flex items-center justify-center text-primary">
            <Layers className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground font-cairo">المشاريع الكبرى</h3>
          <Button variant="ghost" size="sm" onClick={() => { 
            setProjTitle(""); 
            setProjIcon("Briefcase"); 
            setIsAddingProject(true); 
          }} className="text-primary text-xs font-bold gap-1 transition-none">
            <Plus className="h-3 w-3" />
            مشروع جديد
          </Button>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
          {isProjectsLoading ? (
             <div className="flex items-center justify-center min-w-[140px]"><Loader2 className="h-4 w-4 animate-spin text-primary/30" /></div>
          ) : projects?.map((proj) => (
            <ProjectCard 
              key={proj.id} 
              project={proj} 
              isActive={activeProjectId === proj.id} 
              onClick={() => setActiveProjectId(proj.id)} 
              onEdit={(p: any) => {
                setEditingProject(p);
                setProjTitle(p.title);
                setProjIcon(p.icon);
              }} 
              onDelete={setProjectToDelete} 
              getProjectIcon={getProjectIcon} 
              userId={user!.uid} 
              db={db!} 
            />
          ))}
        </div>
      </div>

      <div className="flex-1 px-6 space-y-6">
        {activeProjectId ? (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-foreground font-cairo">مراحل التنفيذ</h3>
              <Button onClick={() => { setStageTitle(""); setIsAddingStage(true); }} size="sm" className="rounded-[10px] bg-primary/5 text-primary hover:bg-primary/10 border-none font-bold transition-none">
                <Plus className="h-4 w-4 ml-1" />
                إضافة مرحلة
              </Button>
            </div>
            
            <StageListView 
              projectId={activeProjectId} 
              userId={user!.uid} 
              db={db!} 
              onEdit={(stage: any) => { 
                setEditingStage(stage); 
                setStageTitle(stage.title); 
              }}
              onDelete={(stage: any) => setStageToDelete(stage)}
              onEditTask={(task: any) => { 
                setEditingTask(task); 
                setTaskTitle(task.title); 
                setTaskPriority(task.priority); 
                setTaskExpectedTime(task.expectedTime || "");
                setTaskActualTime(task.actualTime || "");
              }}
              onDeleteTask={(task: any) => setTaskToDelete(task)}
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

      {/* Dialogs */}
      <Dialog open={isAddingProject || !!editingProject} onOpenChange={(open) => { if(!open) { setIsAddingProject(false); setEditingProject(null); } }}>
        <DialogContent className="font-cairo rounded-[20px]">
          <DialogHeader className="flex flex-row items-center justify-between">
             <DialogTitle className="text-right flex-1">{editingProject ? "تعديل المشروع" : "مشروع جديد"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label className="flex items-center justify-start gap-2 text-right mb-2">
                <Type className="h-4 w-4 text-primary" />
                <span>اسم المشروع الكبير</span>
              </Label>
              <Input placeholder="مثلاً: تطوير تطبيق، تأليف كتاب..." value={projTitle} onChange={e => setProjTitle(e.target.value)} className="h-12 rounded-[12px] text-right" />
            </div>
            <div className="space-y-4">
              <Label className="flex items-center justify-start gap-2 text-right mb-2">
                <Palette className="h-4 w-4 text-primary" />
                <span>أيقونة المشروع</span>
              </Label>
              <div className="grid grid-cols-4 gap-3 max-h-[200px] overflow-y-auto p-1">
                {PROJECT_ICONS.map((item) => (
                  <button key={item.name} onClick={() => setProjIcon(item.name)} className={`h-12 rounded-[12px] border flex flex-col items-center justify-center gap-1 transition-all ${projIcon === item.name ? 'border-primary bg-primary/5 text-primary shadow-sm' : 'border-border/40'}`}>
                    <item.icon className="h-5 w-5" />
                    <span className="text-[8px] font-bold">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={editingProject ? handleUpdateProject : handleAddProject} disabled={!projTitle} className="w-full h-12 primary-gradient text-white font-black rounded-[12px] shadow-lg transition-none">
              {editingProject ? "حفظ التعديلات" : "إنشاء المشروع"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddingStage || !!editingStage} onOpenChange={(open) => { if(!open) { setIsAddingStage(false); setEditingStage(null); } }}>
        <DialogContent className="font-cairo rounded-[20px]">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-right flex-1">{editingStage ? "تعديل المرحلة" : "إضافة مرحلة عمل"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label className="flex items-center justify-start gap-2 text-right mb-2">
                <Layers className="h-4 w-4 text-primary" />
                <span>عنوان المرحلة</span>
              </Label>
              <Input placeholder="مثلاً: التحليل، التصميم، Backend..." value={stageTitle} onChange={e => setStageTitle(e.target.value)} className="h-12 rounded-[12px] text-right" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={editingStage ? handleUpdateStage : handleAddStage} disabled={!stageTitle} className="w-full h-12 primary-gradient text-white font-black rounded-[12px] shadow-lg transition-none">
              {editingStage ? "حفظ التعديلات" : "تأكيد الإضافة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingTask} onOpenChange={(open) => { if(!open) setEditingTask(null); }}>
        <DialogContent className="font-cairo rounded-[20px]">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-right flex-1">تعديل المهمة</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-3">
              <Label className="flex items-center justify-start gap-2 text-right mb-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>عنوان المهمة</span>
              </Label>
              <Input value={taskTitle} onChange={e => setTaskTitle(e.target.value)} className="h-12 rounded-[12px] text-right" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center justify-start gap-2 text-right mb-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>وقت متوقع</span>
                </Label>
                <Input placeholder="ساعتان..." value={taskExpectedTime} onChange={e => setTaskExpectedTime(e.target.value)} className="h-10 rounded-[10px] text-right text-xs" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center justify-start gap-2 text-right mb-2">
                  <Timer className="h-4 w-4 text-primary" />
                  <span>وقت فعلي</span>
                </Label>
                <Input placeholder="ساعة..." value={taskActualTime} onChange={e => setTaskActualTime(e.target.value)} className="h-10 rounded-[10px] text-right text-xs" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center justify-start gap-2 text-right mb-2">
                <Flag className="h-4 w-4 text-primary" />
                <span>الأولوية</span>
              </Label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as Priority[]).map(p => (
                  <button key={p} onClick={() => setTaskPriority(p)} className={`flex-1 h-10 rounded-[10px] text-xs font-bold border transition-all ${taskPriority === p ? 'bg-primary text-white border-primary shadow-md' : 'bg-white text-muted-foreground border-border/40'}`}>
                    {p === 'high' ? 'عاجل' : p === 'medium' ? 'متوسط' : 'عادي'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateTask} className="w-full h-12 primary-gradient text-white font-black rounded-[12px] transition-none">حفظ التغييرات</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!projectToDelete} onOpenChange={(open) => { if(!open) setProjectToDelete(null); }}>
        <AlertDialogContent className="font-cairo rounded-[15px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">حذف المشروع؟</AlertDialogTitle>
            <AlertDialogDescription className="text-right">سيتم حذف المشروع وكافة المراحل والمهام المرتبطة به. لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 mt-4">
            <AlertDialogCancel className="flex-1 rounded-[10px] transition-none">إلغاء</AlertDialogCancel>
            <AlertDialogAction className="flex-1 bg-destructive rounded-[10px] transition-none" onClick={confirmDeleteProject}>تأكيد الحذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!stageToDelete} onOpenChange={(open) => { if(!open) setStageToDelete(null); }}>
        <AlertDialogContent className="font-cairo rounded-[15px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">حذف المرحلة؟</AlertDialogTitle>
            <AlertDialogDescription className="text-right">سيتم حذف المرحلة وكافة المهام بداخلها بشكل نهائي.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 mt-4">
            <AlertDialogCancel className="flex-1 rounded-[10px] transition-none">إلغاء</AlertDialogCancel>
            <AlertDialogAction className="flex-1 bg-destructive rounded-[10px] transition-none" onClick={confirmDeleteStage}>تأكيد الحذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!taskToDelete} onOpenChange={(open) => { if(!open) setTaskToDelete(null); }}>
        <AlertDialogContent className="font-cairo rounded-[15px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">حذف المهمة؟</AlertDialogTitle>
            <AlertDialogDescription className="text-right">هل أنت متأكد من حذف هذه المهمة نهائياً؟</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 mt-4">
            <AlertDialogCancel className="flex-1 rounded-[10px] transition-none">إلغاء</AlertDialogCancel>
            <AlertDialogAction className="flex-1 bg-destructive rounded-[10px] transition-none" onClick={confirmDeleteTask}>تأكيد الحذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ProjectCard({ project, isActive, onClick, onEdit, onDelete, getProjectIcon, userId, db }: any) {
  const stagesQuery = useMemoFirebase(() => {
    return query(collection(db, 'users', userId, 'taskProjects', project.id, 'taskStages'), orderBy('createdAt', 'asc'));
  }, [db, userId, project.id]);

  // استماع مباشر لكافة مهام المستخدم وحذف الفلترة الزائدة لضمان التفاعل
  const tasksQuery = useMemoFirebase(() => {
    return query(
      collectionGroup(db, 'tasks'), 
      where('userId', '==', userId),
      where('projectId', '==', project.id)
    );
  }, [db, project.id, userId]);

  const { data: stages } = useCollection(stagesQuery);
  const { data: tasks } = useCollection(tasksQuery);

  const stats = useMemo(() => {
    if (!stages || stages.length === 0 || !tasks) return { total: 0, completed: 0, percent: 0 };
    
    // حساب الوزن النسبي لكل مرحلة (مثلاً مرحلتين = كل مرحلة تمثل 50%)
    let totalProjectCompletion = 0;
    
    stages.forEach(stage => {
      const stageTasks = tasks.filter(t => t.stageId === stage.id);
      if (stageTasks.length > 0) {
        const completedInStage = stageTasks.filter(t => t.status === 'completed').length;
        const stageProgress = completedInStage / stageTasks.length;
        // إضافة حصة المرحلة من التقدم الكلي
        totalProjectCompletion += (stageProgress / stages.length);
      }
    });

    const percent = Math.floor(totalProjectCompletion * 100);
    return {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'completed').length,
      percent
    };
  }, [tasks, stages]);
  
  return (
    <div onClick={onClick} className={`min-w-[170px] p-4 rounded-[15px] premium-shadow border cursor-pointer transition-all flex flex-col justify-between ${isActive ? 'primary-gradient text-white border-transparent' : 'bg-white border-border/40'}`}>
      <div className="flex justify-between items-start mb-3">
        <div className={`h-10 w-10 rounded-[10px] flex items-center justify-center ${isActive ? 'bg-white/20' : 'bg-slate-50 text-slate-400'}`}>
          {getProjectIcon(project.icon)}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className={`h-6 w-6 transition-none ${isActive ? 'text-white/40' : 'text-slate-300'}`}><MoreVertical className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="font-cairo rounded-[10px]" align="start">
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onEdit(project); }}>
              <Pencil className="h-4 w-4 ml-2" />
              تعديل المشروع
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onSelect={(e) => { e.preventDefault(); onDelete(project); }}>
              <Trash2 className="h-4 w-4 ml-2" />
              حذف المشروع
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div>
        <h4 className="text-xs font-black truncate">{project.title}</h4>
        <div className="mt-3 space-y-1.5">
          <div className="flex justify-between text-[8px] font-bold opacity-60">
            <span>إنجاز المشروع</span>
            <span>{stats.percent}%</span>
          </div>
          <div className={`h-1.5 w-full rounded-full overflow-hidden ${isActive ? 'bg-white/20' : 'bg-slate-100'}`}>
            <div 
              className={`h-full transition-all duration-700 ${isActive ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]' : 'primary-gradient'}`}
              style={{ width: `${stats.percent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StageListView({ projectId, userId, db, onEdit, onDelete, onEditTask, onDeleteTask }: any) {
  const stagesQuery = useMemoFirebase(() => {
    return query(collection(db, 'users', userId, 'taskProjects', projectId, 'taskStages'), orderBy('createdAt', 'asc'));
  }, [db, userId, projectId]);

  const { data: stages, isLoading } = useCollection(stagesQuery);

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary/20" /></div>;

  return (
    <div className="space-y-8">
      {stages && stages.length > 0 ? (
        stages.map(stage => (
          <div key={stage.id} className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                 <div className="h-2 w-2 rounded-full bg-primary" />
                 <h4 className="text-sm font-black text-foreground uppercase tracking-wider">{stage.title}</h4>
              </div>
              <div className="flex items-center gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 transition-none"><MoreVertical className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="font-cairo rounded-[10px]" align="start">
                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onEdit(stage); }}>
                      <Pencil className="h-4 w-4 ml-2" />
                      تعديل المرحلة
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onSelect={(e) => { e.preventDefault(); onDelete(stage); }}>
                      <Trash2 className="h-4 w-4 ml-2" />
                      حذف المرحلة
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <TaskListView projectId={projectId} stageId={stage.id} userId={userId} db={db} onEditTask={onEditTask} onDeleteTask={onDeleteTask} />
          </div>
        ))
      ) : (
        <div className="py-10 text-center text-xs text-muted-foreground border-2 border-dashed rounded-[15px] font-bold">ابدأ بإضافة أول مرحلة لمشروعك</div>
      )}
    </div>
  );
}

function TaskListView({ projectId, stageId, userId, db, onEditTask, onDeleteTask }: any) {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState<Priority>("medium");
  const [taskExpectedTime, setTaskExpectedTime] = useState("");
  const [taskActualTime, setTaskActualTime] = useState("");

  const tasksQuery = useMemoFirebase(() => {
    return query(collection(db, 'users', userId, 'taskProjects', projectId, 'taskStages', stageId, 'tasks'), orderBy('createdAt', 'asc'));
  }, [db, userId, projectId, stageId]);

  const { data: tasks } = useCollection(tasksQuery);

  const stats = useMemo(() => {
    if (!tasks) return { total: 0, completed: 0, percent: 0 };
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    return {
      total,
      completed,
      percent: total > 0 ? Math.floor((completed / total) * 100) : 0
    };
  }, [tasks]);

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
      expectedTime: taskExpectedTime,
      actualTime: taskActualTime,
      createdAt: serverTimestamp()
    });
    setTaskTitle("");
    setTaskExpectedTime("");
    setTaskActualTime("");
    setIsAddingTask(false);
  };

  const toggleTask = (taskId: string, currentStatus: string) => {
    const taskRef = doc(db, 'users', userId, 'taskProjects', projectId, 'taskStages', stageId, 'tasks', taskId);
    updateDocumentNonBlocking(taskRef, {
      status: currentStatus === 'completed' ? 'pending' : 'completed'
    });
  };

  const getPriorityInfo = (p: Priority) => {
    switch(p) {
      case 'high': return { color: 'bg-red-500', label: 'عاجل' };
      case 'medium': return { color: 'bg-orange-500', label: 'متوسط' };
      case 'low': return { color: 'bg-green-500', label: 'عادي' };
      default: return { color: 'bg-slate-400', label: 'عادي' };
    }
  };

  return (
    <div className="space-y-3">
      {tasks && tasks.length > 0 && (
        <div className="px-1 space-y-1.5 mb-2">
           <div className="flex justify-between text-[9px] font-black text-muted-foreground/60 uppercase">
             <span>إنجاز المرحلة</span>
             <span>{stats.percent}%</span>
           </div>
           <Progress value={stats.percent} className="h-1 bg-slate-100" />
        </div>
      )}

      {tasks?.map(task => (
        <div key={task.id} className="bg-white p-4 rounded-[12px] premium-shadow border border-border/40 flex flex-col gap-3 group active:scale-[0.99] transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <button 
                onClick={() => toggleTask(task.id, task.status)}
                className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${task.status === 'completed' ? 'bg-primary border-primary text-white' : 'border-slate-200'}`}
              >
                {task.status === 'completed' && <CheckCircle className="h-4 w-4" />}
              </button>
              <div className="flex-1">
                 <h5 className={`text-sm font-bold ${task.status === 'completed' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{task.title}</h5>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-primary/40 hover:text-primary transition-none" onClick={() => onEditTask(task)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/20 hover:text-destructive transition-none" onClick={() => onDeleteTask(task)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-50">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span className="text-[10px] font-bold">متوقع: {task.expectedTime || '--'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-primary">
                <Timer className="h-3 w-3" />
                <span className="text-[10px] font-bold">فعلي: {task.actualTime || '--'}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-50 border border-slate-100">
               <div className={`h-1.5 w-1.5 rounded-full ${getPriorityInfo(task.priority).color}`} />
               <span className="text-[9px] font-black text-muted-foreground uppercase">{getPriorityInfo(task.priority).label}</span>
            </div>
          </div>
        </div>
      ))}
      
      {!isAddingTask ? (
        <button onClick={() => { setTaskTitle(""); setTaskPriority("medium"); setIsAddingTask(true); }} className="w-full py-3 rounded-[10px] border border-dashed border-primary/20 text-primary/60 text-[11px] font-bold flex items-center justify-center gap-2 hover:bg-primary/5 transition-all">
          <Plus className="h-4 w-4" />
          إضافة مهمة للمرحلة
        </button>
      ) : (
        <div className="bg-slate-50 p-4 rounded-[12px] border border-border/40 space-y-4 animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-2">
            <Input autoFocus placeholder="اكتب المهمة هنا..." value={taskTitle} onChange={e => setTaskTitle(e.target.value)} className="h-10 text-[12px] font-bold rounded-[8px] text-right" />
          </div>
          <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1">
               <Label className="flex items-center justify-start gap-2 text-right mb-1">
                 <Clock className="h-3 w-3 text-primary" />
                 <span className="text-[10px]">وقت متوقع</span>
               </Label>
               <Input placeholder="ساعتان" value={taskExpectedTime} onChange={e => setTaskExpectedTime(e.target.value)} className="h-8 text-[10px] text-right" />
             </div>
             <div className="space-y-1">
               <Label className="flex items-center justify-start gap-2 text-right mb-1">
                 <Timer className="h-3 w-3 text-primary" />
                 <span className="text-[10px]">وقت فعلي</span>
               </Label>
               <Input placeholder="ساعة" value={taskActualTime} onChange={e => setTaskActualTime(e.target.value)} className="h-8 text-[10px] text-right" />
             </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as Priority[]).map(p => (
                <button key={p} onClick={() => setTaskPriority(p)} className={`h-6 px-3 rounded-full text-[9px] font-black transition-all ${taskPriority === p ? getPriorityInfo(p).color + ' text-white shadow-lg' : 'bg-white border border-border/40 text-muted-foreground'}`}>
                  {getPriorityInfo(p).label}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              <Button size="sm" onClick={handleAddTask} className="h-8 px-4 rounded-[8px] primary-gradient text-white text-[11px] font-bold transition-none">إضافة</Button>
              <Button variant="ghost" size="sm" onClick={() => setIsAddingTask(false)} className="h-8 px-2 rounded-[8px] text-[11px] transition-none"><X className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
