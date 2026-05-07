
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
  CheckCircle,
  ChevronUp,
  Target,
  Sparkles,
  Zap
} from "lucide-react";
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
import { cn } from "@/lib/utils";

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
    <div className="flex flex-col min-h-screen bg-slate-50/50 animate-in fade-in duration-500 pb-32">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm">
        <div className="h-[env(safe-area-inset-top,0px)]" />
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10 rounded-xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-all active:scale-95">
              <ChevronRight className="h-5 w-5 text-slate-600" />
            </Button>
            <div>
              <h2 className="text-xl font-black text-slate-900 font-cairo tracking-tight">إدارة المشاريع</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">تحكم في أهدافك الكبرى</p>
            </div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            <Target className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Projects Scroller */}
      <div className="px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-black text-slate-800 font-cairo">مساحات العمل النشطة</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { 
            setProjTitle(""); 
            setProjIcon("Briefcase"); 
            setIsAddingProject(true); 
          }} className="text-primary hover:bg-primary/5 text-xs font-black gap-2 transition-all rounded-lg">
            <Plus className="h-4 w-4" />
            مشروع جديد
          </Button>
        </div>
        
        <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
          {isProjectsLoading ? (
             <div className="flex items-center justify-center min-w-[160px] h-32 bg-white rounded-2xl border border-dashed border-slate-200">
               <Loader2 className="h-6 w-6 animate-spin text-primary/30" />
             </div>
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
          {projects?.length === 0 && !isProjectsLoading && (
            <div onClick={() => setIsAddingProject(true)} className="min-w-[200px] h-32 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white hover:border-primary/30 transition-all group">
               <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                 <Plus className="h-5 w-5" />
               </div>
               <span className="text-[11px] font-black text-slate-400 group-hover:text-primary transition-all">ابدأ مشروعك الأول</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-6 space-y-6">
        {activeProjectId ? (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 font-cairo">مراحل التنفيذ</h3>
                <p className="text-[10px] font-bold text-slate-400">قسم مشروعك لخطوات صغيرة</p>
              </div>
              <Button onClick={() => { setStageTitle(""); setIsAddingStage(true); }} size="sm" className="rounded-xl primary-gradient text-white border-none font-black shadow-lg shadow-primary/20 transition-all active:scale-95">
                <Plus className="h-4 w-4 ml-1.5" />
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
          <div className="py-24 text-center space-y-6 opacity-40 grayscale group">
            <div className="h-32 w-32 rounded-full bg-white shadow-inner flex items-center justify-center mx-auto border border-slate-100 group-hover:scale-110 transition-transform">
              <Layers className="h-16 w-16 text-primary/30" />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-black text-slate-600 font-cairo">بانتظار اختيار المهمة الكبرى</p>
              <p className="text-xs font-bold text-slate-400 max-w-[200px] mx-auto leading-relaxed">اختر مشروعاً من القائمة العلوية لتبدأ في إدارة مراحله ومهامه بكل احترافية</p>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs - Shared Styles */}
      <Dialog open={isAddingProject || !!editingProject} onOpenChange={(open) => { if(!open) { setIsAddingProject(false); setEditingProject(null); } }}>
        <DialogContent className="font-cairo rounded-[24px] max-w-[95%] sm:max-w-md p-8 border-none shadow-2xl">
          <DialogHeader className="mb-6">
             <DialogTitle className="text-right text-xl font-black text-slate-900">{editingProject ? "تعديل المشروع" : "مشروع جديد"}</DialogTitle>
             <p className="text-right text-xs font-bold text-slate-400 mt-1">أعطِ مشروعك هوية مميزة</p>
          </DialogHeader>
          <div className="space-y-8 py-2">
            <div className="space-y-3">
              <Label className="flex items-center justify-start gap-2 text-right text-slate-500 font-black">
                <Tag className="h-4 w-4 text-primary" />
                <span>اسم المشروع</span>
              </Label>
              <Input placeholder="مثلاً: تطوير تطبيق، تأليف كتاب..." value={projTitle} onChange={e => setProjTitle(e.target.value)} className="h-14 rounded-2xl text-right bg-slate-50 border-slate-100 focus:bg-white transition-all text-sm font-bold" />
            </div>
            <div className="space-y-4">
              <Label className="flex items-center justify-start gap-2 text-right text-slate-500 font-black">
                <Palette className="h-4 w-4 text-primary" />
                <span>أيقونة التمييز</span>
              </Label>
              <div className="grid grid-cols-4 gap-3 max-h-[220px] overflow-y-auto p-2 scrollbar-hide bg-slate-50 rounded-2xl border border-slate-100">
                {PROJECT_ICONS.map((item) => (
                  <button key={item.name} onClick={() => setProjIcon(item.name)} className={cn(
                    "h-16 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-90",
                    projIcon === item.name 
                      ? "border-primary bg-white text-primary shadow-md shadow-primary/10" 
                      : "border-transparent bg-white/50 text-slate-400 hover:bg-white hover:text-slate-600"
                  )}>
                    <item.icon className="h-6 w-6" />
                    <span className="text-[8px] font-black">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="mt-8">
            <Button onClick={editingProject ? handleUpdateProject : handleAddProject} disabled={!projTitle} className="w-full h-14 primary-gradient text-white font-black rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95">
              {editingProject ? "حفظ التعديلات" : "إطلاق المشروع"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddingStage || !!editingStage} onOpenChange={(open) => { if(!open) { setIsAddingStage(false); setEditingStage(null); } }}>
        <DialogContent className="font-cairo rounded-[24px] max-w-[92%] p-8 border-none shadow-2xl">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-right text-xl font-black text-slate-900">{editingStage ? "تعديل المرحلة" : "مرحلة عمل جديدة"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="flex items-center justify-start gap-2 text-right text-slate-500 font-black">
                <Layers className="h-4 w-4 text-primary" />
                <span>عنوان المرحلة</span>
              </Label>
              <Input placeholder="مثلاً: التحليل، التصميم، الإطلاق..." value={stageTitle} onChange={e => setStageTitle(e.target.value)} className="h-14 rounded-2xl text-right bg-slate-50 border-slate-100 font-bold" />
            </div>
          </div>
          <DialogFooter className="mt-8">
            <Button onClick={editingStage ? handleUpdateStage : handleAddStage} disabled={!stageTitle} className="w-full h-14 primary-gradient text-white font-black rounded-2xl shadow-xl transition-all">
              {editingStage ? "تحديث المرحلة" : "تأكيد الإضافة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingTask} onOpenChange={(open) => { if(!open) setEditingTask(null); }}>
        <DialogContent className="font-cairo rounded-[24px] max-w-[95%] p-8 border-none shadow-2xl">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-right text-xl font-black text-slate-900">تحرير المهمة</DialogTitle>
          </DialogHeader>
          <div className="space-y-8">
            <div className="space-y-3">
              <Label className="flex items-center justify-start gap-2 text-right text-slate-500 font-black">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>عنوان المهمة</span>
              </Label>
              <Input value={taskTitle} onChange={e => setTaskTitle(e.target.value)} className="h-14 rounded-2xl text-right bg-slate-50 border-slate-100 font-bold" />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-3">
                <Label className="flex items-center justify-start gap-2 text-right text-slate-500 font-black">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>وقت متوقع</span>
                </Label>
                <Input placeholder="ساعتان..." value={taskExpectedTime} onChange={e => setTaskExpectedTime(e.target.value)} className="h-12 rounded-xl text-right text-xs font-bold bg-slate-50" />
              </div>
              <div className="space-y-3">
                <Label className="flex items-center justify-start gap-2 text-right text-slate-500 font-black">
                  <Timer className="h-4 w-4 text-primary" />
                  <span>وقت فعلي</span>
                </Label>
                <Input placeholder="ساعة..." value={taskActualTime} onChange={e => setTaskActualTime(e.target.value)} className="h-12 rounded-xl text-right text-xs font-bold bg-slate-50" />
              </div>
            </div>
            <div className="space-y-3">
              <Label className="flex items-center justify-start gap-2 text-right text-slate-500 font-black">
                <Flag className="h-4 w-4 text-primary" />
                <span>درجة الأولوية</span>
              </Label>
              <div className="flex gap-3">
                {(['low', 'medium', 'high'] as Priority[]).map(p => (
                  <button key={p} onClick={() => setTaskPriority(p)} className={cn(
                    "flex-1 h-12 rounded-xl text-[10px] font-black border transition-all active:scale-95",
                    taskPriority === p 
                      ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                      : "bg-slate-50 text-slate-400 border-slate-100"
                  )}>
                    {p === 'high' ? 'عاجل جداً' : p === 'medium' ? 'متوسط' : 'عادي'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="mt-8">
            <Button onClick={handleUpdateTask} className="w-full h-14 primary-gradient text-white font-black rounded-2xl shadow-xl transition-all">حفظ التغييرات</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialogs for Deletion */}
      <AlertDialog open={!!projectToDelete} onOpenChange={(open) => { if(!open) setProjectToDelete(null); }}>
        <AlertDialogContent className="font-cairo rounded-[24px] border-none p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right text-xl font-black text-slate-900">حذف المشروع؟</AlertDialogTitle>
            <AlertDialogDescription className="text-right text-sm font-bold text-slate-500 mt-2">
              سيتم حذف المشروع وكافة المراحل والمهام المرتبطة به. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3 mt-8">
            <AlertDialogCancel className="flex-1 h-12 rounded-xl border-slate-200 text-slate-500 font-black transition-all">إلغاء</AlertDialogCancel>
            <AlertDialogAction className="flex-1 h-12 bg-destructive rounded-xl text-white font-black shadow-lg shadow-destructive/20 transition-all hover:bg-destructive/90" onClick={confirmDeleteProject}>تأكيد الحذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!stageToDelete} onOpenChange={(open) => { if(!open) setStageToDelete(null); }}>
        <AlertDialogContent className="font-cairo rounded-[24px] border-none p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right text-xl font-black text-slate-900">حذف المرحلة؟</AlertDialogTitle>
            <AlertDialogDescription className="text-right text-sm font-bold text-slate-500 mt-2">سيتم حذف المرحلة وكافة المهام بداخلها بشكل نهائي.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3 mt-8">
            <AlertDialogCancel className="flex-1 h-12 rounded-xl border-slate-200 font-black">إلغاء</AlertDialogCancel>
            <AlertDialogAction className="flex-1 h-12 bg-destructive rounded-xl font-black shadow-lg" onClick={confirmDeleteStage}>تأكيد الحذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!taskToDelete} onOpenChange={(open) => { if(!open) setTaskToDelete(null); }}>
        <AlertDialogContent className="font-cairo rounded-[24px] border-none p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right text-xl font-black text-slate-900">حذف المهمة؟</AlertDialogTitle>
            <AlertDialogDescription className="text-right text-sm font-bold text-slate-500 mt-2">هل أنت متأكد من حذف هذه المهمة نهائياً من سجلاتك؟</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3 mt-8">
            <AlertDialogCancel className="flex-1 h-12 rounded-xl border-slate-200 font-black">إلغاء</AlertDialogCancel>
            <AlertDialogAction className="flex-1 h-12 bg-destructive rounded-xl font-black shadow-lg" onClick={confirmDeleteTask}>تأكيد الحذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ProjectCard({ project, isActive, onClick, onEdit, onDelete, getProjectIcon, userId, db }: any) {
  const tasksQuery = useMemoFirebase(() => {
    return query(
      collectionGroup(db, 'tasks'), 
      where('userId', '==', userId),
      where('projectId', '==', project.id)
    );
  }, [db, project.id, userId]);

  const { data: tasks } = useCollection(tasksQuery);

  const stats = useMemo(() => {
    if (!tasks) return { total: 0, completed: 0 };
    return {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'completed').length
    };
  }, [tasks]);
  
  return (
    <div 
      onClick={onClick} 
      className={cn(
        "min-w-[190px] p-5 rounded-[22px] border cursor-pointer transition-all duration-300 flex flex-col justify-between h-40 active:scale-95 group relative overflow-hidden",
        isActive 
          ? "primary-gradient text-white border-transparent shadow-xl shadow-primary/25" 
          : "bg-white border-slate-100 text-slate-900 shadow-sm hover:border-primary/20 hover:shadow-md"
      )}
    >
      {/* Background decoration for active card */}
      {isActive && <div className="absolute -top-4 -left-4 h-16 w-16 bg-white/10 rounded-full blur-xl" />}
      
      <div className="flex justify-between items-start relative z-10">
        <div className={cn(
          "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500",
          isActive ? "bg-white/20 backdrop-blur-md border border-white/20" : "bg-slate-50 text-slate-400 group-hover:bg-primary/5 group-hover:text-primary"
        )}>
          {getProjectIcon(project.icon)}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => { e.stopPropagation(); }}>
            <Button variant="ghost" size="icon" className={cn(
              "h-8 w-8 rounded-full transition-all",
              isActive ? "text-white/40 hover:text-white hover:bg-white/10" : "text-slate-300 hover:text-slate-600 hover:bg-slate-100"
            )}><MoreVertical className="h-5 w-5" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="font-cairo rounded-xl p-2 border-none shadow-2xl" align="start">
            <DropdownMenuItem className="rounded-lg gap-2 font-bold py-2.5" onSelect={(e) => { e.preventDefault(); onEdit(project); }}>
              <Pencil className="h-4 w-4 text-primary" />
              تعديل المشروع
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive rounded-lg gap-2 font-bold py-2.5" onSelect={(e) => { e.preventDefault(); onDelete(project); }}>
              <Trash2 className="h-4 w-4" />
              حذف المشروع
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="relative z-10">
        <h4 className={cn("text-[13px] font-black truncate font-cairo", isActive ? "text-white" : "text-slate-800")}>{project.title}</h4>
        <div className="mt-3 flex items-center justify-between">
           <div className="flex items-center gap-1.5">
             <div className={cn("h-1.5 w-1.5 rounded-full", isActive ? "bg-white/50" : "bg-slate-200")} />
             <span className={cn("text-[9px] font-black uppercase tracking-widest", isActive ? "text-white/60" : "text-slate-400")}>إنجازك</span>
           </div>
           <span className={cn("text-[11px] font-black tabular-nums", isActive ? "text-white" : "text-primary")}>{stats.completed}/{stats.total}</span>
        </div>
      </div>
    </div>
  );
}

function StageListView({ projectId, userId, db, onEdit, onDelete, onEditTask, onDeleteTask }: any) {
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({});

  const stagesQuery = useMemoFirebase(() => {
    return query(collection(db, 'users', userId, 'taskProjects', projectId, 'taskStages'), orderBy('createdAt', 'asc'));
  }, [db, userId, projectId]);

  const { data: stages, isLoading } = useCollection(stagesQuery);

  const toggleStage = (id: string) => {
    setExpandedStages(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    if (stages && stages.length > 0 && Object.keys(expandedStages).length === 0) {
      setExpandedStages({ [stages[0].id]: true });
    }
  }, [stages]);

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary/20" /></div>;

  return (
    <div className="space-y-5">
      {stages && stages.length > 0 ? (
        stages.map(stage => (
          <div key={stage.id} className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
            <div className="flex items-center justify-between p-4 bg-white">
              <div 
                onClick={() => toggleStage(stage.id)} 
                className="flex items-center gap-4 flex-1 cursor-pointer group"
              >
                <div className={cn(
                  "h-10 w-10 rounded-2xl flex items-center justify-center transition-all duration-300",
                  expandedStages[stage.id] ? "primary-gradient text-white shadow-lg shadow-primary/20" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100"
                )}>
                   {expandedStages[stage.id] ? <ChevronDown className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                </div>
                <div>
                   <h4 className="text-[15px] font-black text-slate-800 font-cairo tracking-tight">{stage.title}</h4>
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-slate-300 hover:text-slate-600 transition-all"><MoreVertical className="h-5 w-5" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="font-cairo rounded-xl border-none shadow-2xl p-2" align="start">
                  <DropdownMenuItem className="rounded-lg gap-2 font-bold" onSelect={(e) => { e.preventDefault(); onEdit(stage); }}>
                    <Pencil className="h-4 w-4 text-primary" />
                    تعديل المرحلة
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive rounded-lg gap-2 font-bold" onSelect={(e) => { e.preventDefault(); onDelete(stage); }}>
                    <Trash2 className="h-4 w-4" />
                    حذف المرحلة
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {expandedStages[stage.id] && (
              <div className="px-5 pb-6 pt-2 animate-in fade-in slide-in-from-top-2 duration-500 bg-slate-50/30">
                <TaskListView 
                  projectId={projectId} 
                  stageId={stage.id} 
                  userId={userId} 
                  db={db} 
                  onEditTask={onEditTask} 
                  onDeleteTask={onDeleteTask} 
                />
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="py-16 text-center bg-white rounded-[24px] border border-dashed border-slate-200 space-y-4">
           <Zap className="h-10 w-10 text-slate-200 mx-auto" />
           <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">ابدأ بإضافة أول مرحلة لتنظيم عملك</p>
        </div>
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
      case 'high': return { color: 'bg-rose-500', label: 'عاجل جداً', light: 'bg-rose-50 text-rose-600' };
      case 'medium': return { color: 'bg-amber-500', label: 'متوسط', light: 'bg-amber-50 text-amber-600' };
      case 'low': return { color: 'bg-emerald-500', label: 'عادي', light: 'bg-emerald-50 text-emerald-600' };
      default: return { color: 'bg-slate-400', label: 'عادي', light: 'bg-slate-50 text-slate-400' };
    }
  };

  return (
    <div className="space-y-4">
      {tasks?.map(task => (
        <div key={task.id} className="bg-white p-5 rounded-[20px] shadow-sm border border-slate-100 flex flex-col gap-4 group hover:shadow-md transition-all active:scale-[0.99]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <button 
                onClick={() => toggleTask(task.id, task.status)}
                className={cn(
                  "h-7 w-7 rounded-xl border-2 flex items-center justify-center transition-all duration-300",
                  task.status === 'completed' 
                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                    : "border-slate-100 bg-slate-50 text-transparent"
                )}
              >
                <CheckCircle className="h-5 w-5" />
              </button>
              <div className="flex-1">
                 <h5 className={cn(
                   "text-[13px] font-black font-cairo leading-tight",
                   task.status === 'completed' ? "text-slate-300 line-through" : "text-slate-800"
                 )}>{task.title}</h5>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-primary/30 hover:text-primary hover:bg-primary/5 transition-all" onClick={() => onEditTask(task)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-rose-300 hover:text-rose-500 hover:bg-rose-50 transition-all" onClick={() => onDeleteTask(task)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-50">
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-[10px] font-black uppercase tracking-tighter">متوقع: <span className="text-slate-600">{task.expectedTime || '--'}</span></span>
              </div>
              <div className="flex items-center gap-2 text-primary">
                <Timer className="h-3.5 w-3.5" />
                <span className="text-[10px] font-black uppercase tracking-tighter">فعلي: <span className="text-primary-foreground font-bold">{task.actualTime || '--'}</span></span>
              </div>
            </div>
            <div className={cn(
              "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-2",
              getPriorityInfo(task.priority).light
            )}>
               <div className={cn("h-1.5 w-1.5 rounded-full", getPriorityInfo(task.priority).color)} />
               {getPriorityInfo(task.priority).label}
            </div>
          </div>
        </div>
      ))}
      
      {!isAddingTask ? (
        <button onClick={() => { setTaskTitle(""); setTaskPriority("medium"); setIsAddingTask(true); }} className="w-full py-4 rounded-[20px] border-2 border-dashed border-slate-100 text-slate-400 text-[11px] font-black flex items-center justify-center gap-2 hover:bg-white hover:border-primary/20 hover:text-primary transition-all duration-300 active:scale-95 group">
          <div className="h-6 w-6 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-primary/10 transition-all">
            <Plus className="h-4 w-4" />
          </div>
          <span>إضافة مهمة جديدة للمرحلة</span>
        </button>
      ) : (
        <div className="bg-white p-6 rounded-[24px] shadow-lg border border-primary/10 space-y-6 animate-in fade-in zoom-in-95">
          <div className="space-y-3">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المهمة</Label>
            <Input autoFocus placeholder="اكتب عنوان المهمة..." value={taskTitle} onChange={e => setTaskTitle(e.target.value)} className="h-14 text-sm font-black rounded-2xl text-right bg-slate-50 border-slate-100" />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label className="flex items-center justify-start gap-2 text-right text-slate-400 font-black">
                 <Clock className="h-3.5 w-3.5 text-primary/40" />
                 <span className="text-[10px]">وقت متوقع</span>
               </Label>
               <Input placeholder="ساعتان" value={taskExpectedTime} onChange={e => setTaskExpectedTime(e.target.value)} className="h-11 text-xs font-bold rounded-xl text-right bg-slate-50" />
             </div>
             <div className="space-y-2">
               <Label className="flex items-center justify-start gap-2 text-right text-slate-400 font-black">
                 <Timer className="h-3.5 w-3.5 text-primary/40" />
                 <span className="text-[10px]">وقت فعلي</span>
               </Label>
               <Input placeholder="ساعة" value={taskActualTime} onChange={e => setTaskActualTime(e.target.value)} className="h-11 text-xs font-bold rounded-xl text-right bg-slate-50" />
             </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as Priority[]).map(p => (
                <button key={p} onClick={() => setTaskPriority(p)} className={cn(
                  "flex-1 h-9 rounded-xl text-[9px] font-black transition-all",
                  taskPriority === p ? getPriorityInfo(p).color + " text-white shadow-md shadow-primary/20" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                )}>
                  {getPriorityInfo(p).label}
                </button>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleAddTask} className="flex-1 h-12 rounded-2xl primary-gradient text-white font-black shadow-lg shadow-primary/20 transition-all active:scale-95">حفظ المهمة</Button>
              <Button variant="ghost" onClick={() => setIsAddingTask(false)} className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all"><X className="h-5 w-5" /></Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

