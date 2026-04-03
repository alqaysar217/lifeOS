
"use client"

import React, { useState } from "react";
import { 
  Plus, 
  Trash2, 
  Dumbbell, 
  ChevronRight, 
  ChevronDown, 
  Save, 
  Calendar, 
  LayoutGrid,
  Loader2,
  X,
  ChevronLeft,
  Pencil,
  Eye,
  Settings2,
  MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";

const DAYS_OF_WEEK = [
  "السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"
];

interface GymWorkoutScreenProps {
  onBack: () => void;
}

export function GymWorkoutScreen({ onBack }: GymWorkoutScreenProps) {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [isAddingDay, setIsAddingDay] = useState(false);
  const [newDayName, setNewDayName] = useState<string>("");
  
  const [isAddingMuscle, setIsAddingMuscle] = useState(false);
  const [newMuscleName, setNewMuscleName] = useState("");
  
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [activeMuscleId, setActiveMuscleId] = useState<string | null>(null);
  const [newExName, setNewExName] = useState("");
  const [newExSets, setNewExSets] = useState("");
  const [newExReps, setNewExReps] = useState("");

  // Edit States
  const [isEditingDay, setIsEditingDay] = useState(false);
  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [editDayName, setEditDayName] = useState("");

  const [viewMode, setViewMode] = useState<'manage' | 'table'>('manage');

  const gymDaysQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'gymDays'), orderBy('createdAt', 'asc'));
  }, [db, user]);

  const { data: gymDays, isLoading: isDaysLoading } = useCollection(gymDaysQuery);

  const handleAddDay = () => {
    if (!db || !user || !newDayName) return;
    const daysRef = collection(db, 'users', user.uid, 'gymDays');
    addDocumentNonBlocking(daysRef, {
      dayName: newDayName,
      createdAt: serverTimestamp()
    });
    setIsAddingDay(false);
    setNewDayName("");
    toast({ title: "تم إضافة اليوم", description: "يمكنك الآن إضافة مجموعات عضلية." });
  };

  const handleUpdateDay = () => {
    if (!db || !user || !editingDayId || !editDayName) return;
    const dayRef = doc(db, 'users', user.uid, 'gymDays', editingDayId);
    updateDocumentNonBlocking(dayRef, { dayName: editDayName });
    setIsEditingDay(false);
    setEditingDayId(null);
    toast({ title: "تم التحديث", description: "تم تعديل اسم اليوم بنجاح." });
  };

  const handleDeleteDay = (dayId: string) => {
    if (!db || !user) return;
    deleteDocumentNonBlocking(doc(db, 'users', user.uid, 'gymDays', dayId));
    if (selectedDayId === dayId) setSelectedDayId(null);
    toast({ title: "تم الحذف", description: "تم حذف اليوم وكافة بياناته." });
  };

  const handleAddMuscle = () => {
    if (!db || !user || !selectedDayId || !newMuscleName) return;
    const musclesRef = collection(db, 'users', user.uid, 'gymDays', selectedDayId, 'muscles');
    addDocumentNonBlocking(musclesRef, {
      name: newMuscleName,
      createdAt: serverTimestamp()
    });
    setIsAddingMuscle(false);
    setNewMuscleName("");
  };

  const handleAddExercise = () => {
    if (!db || !user || !selectedDayId || !activeMuscleId || !newExName) return;
    const exRef = collection(db, 'users', user.uid, 'gymDays', selectedDayId, 'muscles', activeMuscleId, 'exercises');
    addDocumentNonBlocking(exRef, {
      name: newExName,
      sets: parseInt(newExSets) || 0,
      reps: newExReps,
      createdAt: serverTimestamp()
    });
    setIsAddingExercise(false);
    setNewExName("");
    setNewExSets("");
    setNewExReps("");
  };

  return (
    <div className="flex flex-col h-full bg-background animate-in fade-in duration-500 pb-32">
      <div className="px-6 py-6 space-y-6">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setViewMode('manage')} 
            variant={viewMode === 'manage' ? 'default' : 'outline'}
            className={`flex-1 rounded-[10px] h-10 font-bold transition-all ${viewMode === 'manage' ? 'primary-gradient text-white border-none shadow-md' : 'bg-white'}`}
          >
            <Settings2 className="h-4 w-4 ml-2" />
            إدارة الخطة
          </Button>
          <Button 
            onClick={() => setViewMode('table')} 
            variant={viewMode === 'table' ? 'default' : 'outline'}
            className={`flex-1 rounded-[10px] h-10 font-bold transition-all ${viewMode === 'table' ? 'primary-gradient text-white border-none shadow-md' : 'bg-white'}`}
          >
            <Eye className="h-4 w-4 ml-2" />
            عرض الجدول
          </Button>
        </div>

        {viewMode === 'table' ? (
          <GymTableView gymDays={gymDays} db={db} user={user} onSelectDay={setSelectedDayId} />
        ) : (
          /* Manage Mode */
          <>
            {!selectedDayId ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-foreground font-cairo">خطة التمارين</h3>
                  <Dialog open={isAddingDay} onOpenChange={setIsAddingDay}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2 rounded-[10px] border-primary/20 bg-white shadow-sm">
                        <Plus className="h-4 w-4" />
                        إضافة يوم
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="font-cairo rounded-[10px]">
                      <DialogHeader><DialogTitle>اختر يوم التدريب</DialogTitle></DialogHeader>
                      <div className="py-4">
                        <Select onValueChange={setNewDayName}>
                          <SelectTrigger className="rounded-[10px]"><SelectValue placeholder="اختر اليوم..." /></SelectTrigger>
                          <SelectContent>
                            {DAYS_OF_WEEK.map(d => (
                              <SelectItem key={d} value={d}>{d}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleAddDay} disabled={!newDayName} className="primary-gradient text-white w-full rounded-[10px] h-11">تأكيد الإضافة</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {isDaysLoading ? (
                  <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary/30" /></div>
                ) : gymDays && gymDays.length > 0 ? (
                  <div className="grid gap-4">
                    {gymDays.map(day => (
                      <div 
                        key={day.id} 
                        className="bg-white p-4 rounded-[10px] premium-shadow border border-border/40 flex items-center justify-between group relative"
                      >
                        <div 
                          onClick={() => setSelectedDayId(day.id)}
                          className="flex items-center gap-4 flex-1 cursor-pointer"
                        >
                          <div className="h-12 w-12 rounded-[10px] primary-gradient flex items-center justify-center text-white shadow-lg">
                            <Calendar className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="text-lg font-black">{day.dayName}</h4>
                            <p className="text-[10px] text-muted-foreground font-bold">اضغط للإدارة والتمارين</p>
                          </div>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-muted-foreground/50">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="font-cairo rounded-[10px]">
                            <DropdownMenuItem onClick={() => {
                              setEditingDayId(day.id);
                              setEditDayName(day.dayName);
                              setIsEditingDay(true);
                            }}>
                              <Pencil className="h-4 w-4 ml-2" />
                              تعديل الاسم
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDeleteDay(day.id)}
                            >
                              <Trash2 className="h-4 w-4 ml-2" />
                              حذف اليوم
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center space-y-4 opacity-30">
                    <LayoutGrid className="h-16 w-16 mx-auto text-primary" />
                    <p className="text-sm font-bold">لا توجد أيام مسجلة في خطتك</p>
                  </div>
                )}
              </div>
            ) : (
              /* Day Detail View (Edit/Manage) */
              <div className="space-y-6 animate-in slide-in-from-left-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedDayId(null)} className="h-8 w-8 rounded-full bg-slate-100">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <h3 className="text-xl font-black">{gymDays?.find(d => d.id === selectedDayId)?.dayName}</h3>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-primary/60"
                      onClick={() => {
                        const day = gymDays?.find(d => d.id === selectedDayId);
                        if (day) {
                          setEditingDayId(day.id);
                          setEditDayName(day.dayName);
                          setIsEditingDay(true);
                        }
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive/40 hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="font-cairo rounded-[10px]">
                        <AlertDialogTitle>حذف يوم التدريب؟</AlertDialogTitle>
                        <AlertDialogDescription>سيتم حذف كافة العضلات والتمارين المرتبطة بهذا اليوم.</AlertDialogDescription>
                        <AlertDialogFooter className="flex-row gap-2">
                          <AlertDialogCancel className="rounded-[10px]">إلغاء</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteDay(selectedDayId)} className="bg-destructive rounded-[10px]">حذف نهائي</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <MuscleList dayId={selectedDayId} db={db} user={user} onAddExercise={(mId) => { setActiveMuscleId(mId); setIsAddingExercise(true); }} />

                <Button onClick={() => setIsAddingMuscle(true)} className="w-full h-12 rounded-[10px] border-dashed border-2 border-primary/20 bg-primary/5 text-primary font-bold">
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة مجموعة عضلية جديدة
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Day Dialog */}
      <Dialog open={isEditingDay} onOpenChange={setIsEditingDay}>
        <DialogContent className="font-cairo rounded-[10px]">
          <DialogHeader><DialogTitle>تعديل اسم اليوم</DialogTitle></DialogHeader>
          <div className="py-4">
            <Select value={editDayName} onValueChange={setEditDayName}>
              <SelectTrigger className="rounded-[10px]"><SelectValue placeholder="اختر اليوم..." /></SelectTrigger>
              <SelectContent>
                {DAYS_OF_WEEK.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateDay} className="primary-gradient text-white w-full rounded-[10px] h-11">حفظ التغييرات</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adding Modals (Muscles & Exercises) */}
      <Dialog open={isAddingMuscle} onOpenChange={setIsAddingMuscle}>
        <DialogContent className="font-cairo rounded-[10px]">
          <DialogHeader><DialogTitle>اسم المجموعة العضلية</DialogTitle></DialogHeader>
          <Input placeholder="مثلاً: صدر علوي، باي، أرجل..." value={newMuscleName} onChange={e => setNewMuscleName(e.target.value)} className="h-12 rounded-[10px]" />
          <Button onClick={handleAddMuscle} className="primary-gradient text-white w-full rounded-[10px] h-11">حفظ</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddingExercise} onOpenChange={setIsAddingExercise}>
        <DialogContent className="font-cairo rounded-[10px]">
          <DialogHeader><DialogTitle>إضافة تمرين جديد</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>اسم التمرين</Label>
              <Input placeholder="مثلاً: Bench Press" value={newExName} onChange={e => setNewExName(e.target.value)} className="rounded-[10px]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>عدد المجموعات</Label>
                <Input type="number" placeholder="مثلاً: 3" value={newExSets} onChange={e => setNewExSets(e.target.value)} className="rounded-[10px]" />
              </div>
              <div className="space-y-2">
                <Label>العدات (نصي)</Label>
                <Input placeholder="مثلاً: 12-10-8" value={newExReps} onChange={e => setNewExReps(e.target.value)} className="rounded-[10px]" />
              </div>
            </div>
          </div>
          <Button onClick={handleAddExercise} className="primary-gradient text-white w-full rounded-[10px] h-11">إضافة للتمرين</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GymTableView({ gymDays, db, user, onSelectDay }: { gymDays: any[] | null, db: any, user: any, onSelectDay: (id: string) => void }) {
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {gymDays?.map(day => (
          <Button 
            key={day.id} 
            variant={selectedDayId === day.id ? 'default' : 'outline'}
            onClick={() => setSelectedDayId(day.id)}
            className={`shrink-0 h-10 px-6 rounded-[10px] font-black transition-all ${selectedDayId === day.id ? 'primary-gradient text-white border-none shadow-md' : 'bg-white'}`}
          >
            {day.dayName}
          </Button>
        ))}
      </div>

      {selectedDayId ? (
        <div className="bg-white p-4 rounded-[10px] premium-shadow border border-border/40 space-y-6 animate-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between border-b pb-4">
            <h3 className="text-lg font-black text-foreground">جدول {gymDays?.find(d => d.id === selectedDayId)?.dayName}</h3>
            <Button variant="ghost" size="sm" onClick={() => onSelectDay(selectedDayId)} className="text-xs font-bold text-primary">إدارة التمارين</Button>
          </div>
          
          <div className="overflow-hidden border rounded-[10px]">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="text-right font-bold text-foreground">اسم التمرين</TableHead>
                  <TableHead className="text-center font-bold text-foreground">المجموعات</TableHead>
                  <TableHead className="text-center font-bold text-foreground">التكرارات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <MuscleTableView dayId={selectedDayId} db={db} user={user} />
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center space-y-3 opacity-30">
          <Eye className="h-12 w-12 mx-auto text-primary" />
          <p className="text-sm font-bold">اختر يوماً لعرض الجدول الاحترافي</p>
        </div>
      )}
    </div>
  );
}

function MuscleTableView({ dayId, db, user }: { dayId: string, db: any, user: any }) {
  const musclesQuery = useMemoFirebase(() => {
    if (!db || !user || !dayId) return null;
    return query(collection(db, 'users', user.uid, 'gymDays', dayId, 'muscles'), orderBy('createdAt', 'asc'));
  }, [db, user, dayId]);

  const { data: muscles } = useCollection(musclesQuery);

  return (
    <>
      {muscles?.map(muscle => (
        <React.Fragment key={muscle.id}>
          <TableRow className="bg-primary/5 hover:bg-primary/10 transition-colors">
            <TableCell colSpan={3} className="text-center font-black py-2.5 text-primary text-base">
              {muscle.name}
            </TableCell>
          </TableRow>
          <ExerciseTableView dayId={dayId} muscleId={muscle.id} db={db} user={user} />
        </React.Fragment>
      ))}
    </>
  );
}

function ExerciseTableView({ dayId, muscleId, db, user }: { dayId: string, muscleId: string, db: any, user: any }) {
  const exQuery = useMemoFirebase(() => {
    if (!db || !user || !dayId || !muscleId) return null;
    return query(collection(db, 'users', user.uid, 'gymDays', dayId, 'muscles', muscleId, 'exercises'), orderBy('createdAt', 'asc'));
  }, [db, user, dayId, muscleId]);

  const { data: exercises } = useCollection(exQuery);

  return (
    <>
      {exercises?.map(ex => (
        <TableRow key={ex.id} className="hover:bg-slate-50 transition-colors">
          <TableCell className="font-bold text-foreground/80">{ex.name}</TableCell>
          <TableCell className="text-center font-medium">{ex.sets}</TableCell>
          <TableCell className="text-center font-black text-primary">{ex.reps}</TableCell>
        </TableRow>
      ))}
    </>
  );
}

function MuscleList({ dayId, db, user, onAddExercise }: { dayId: string, db: any, user: any, onAddExercise: (mId: string) => void }) {
  const musclesQuery = useMemoFirebase(() => {
    if (!db || !user || !dayId) return null;
    return query(collection(db, 'users', user.uid, 'gymDays', dayId, 'muscles'), orderBy('createdAt', 'asc'));
  }, [db, user, dayId]);

  const { data: muscles } = useCollection(musclesQuery);

  const [isEditingMuscle, setIsEditingMuscle] = useState(false);
  const [editingMuscleId, setEditingMuscleId] = useState<string | null>(null);
  const [editMuscleName, setEditMuscleName] = useState("");

  const handleUpdateMuscle = () => {
    if (!db || !user || !dayId || !editingMuscleId || !editMuscleName) return;
    const muscleRef = doc(db, 'users', user.uid, 'gymDays', dayId, 'muscles', editingMuscleId);
    updateDocumentNonBlocking(muscleRef, { name: editMuscleName });
    setIsEditingMuscle(false);
    setEditingMuscleId(null);
  };

  const handleDeleteMuscle = (muscleId: string) => {
    deleteDocumentNonBlocking(doc(db, 'users', user.uid, 'gymDays', dayId, 'muscles', muscleId));
  };

  return (
    <div className="space-y-8">
      {muscles?.map(muscle => (
        <div key={muscle.id} className="space-y-4">
          <div className="flex items-center justify-between border-b border-primary/10 pb-2">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black text-primary uppercase tracking-wider">{muscle.name}</h4>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground/30">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="font-cairo rounded-[10px]">
                  <DropdownMenuItem onClick={() => {
                    setEditingMuscleId(muscle.id);
                    setEditMuscleName(muscle.name);
                    setIsEditingMuscle(true);
                  }}>
                    <Pencil className="h-4 w-4 ml-2" />
                    تعديل الاسم
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => handleDeleteMuscle(muscle.id)}
                  >
                    <Trash2 className="h-4 w-4 ml-2" />
                    حذف العضلة
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onAddExercise(muscle.id)} className="h-7 w-7 rounded-full bg-primary/5 text-primary">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          <ExerciseList dayId={dayId} muscleId={muscle.id} db={db} user={user} />
        </div>
      ))}

      {/* Edit Muscle Dialog */}
      <Dialog open={isEditingMuscle} onOpenChange={setIsEditingMuscle}>
        <DialogContent className="font-cairo rounded-[10px]">
          <DialogHeader><DialogTitle>تعديل اسم المجموعة العضلية</DialogTitle></DialogHeader>
          <Input value={editMuscleName} onChange={e => setEditMuscleName(e.target.value)} className="h-12 rounded-[10px]" />
          <Button onClick={handleUpdateMuscle} className="primary-gradient text-white w-full rounded-[10px] h-11">حفظ</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ExerciseList({ dayId, muscleId, db, user }: { dayId: string, muscleId: string, db: any, user: any }) {
  const exQuery = useMemoFirebase(() => {
    if (!db || !user || !dayId || !muscleId) return null;
    return query(collection(db, 'users', user.uid, 'gymDays', dayId, 'muscles', muscleId, 'exercises'), orderBy('createdAt', 'asc'));
  }, [db, user, dayId, muscleId]);

  const { data: exercises } = useCollection(exQuery);

  const [isEditingEx, setIsEditingEx] = useState(false);
  const [editingExId, setEditingExId] = useState<string | null>(null);
  const [editExName, setEditExName] = useState("");
  const [editExSets, setEditExSets] = useState("");
  const [editExReps, setEditExReps] = useState("");

  const handleUpdateEx = () => {
    if (!db || !user || !dayId || !muscleId || !editingExId || !editExName) return;
    const exRef = doc(db, 'users', user.uid, 'gymDays', dayId, 'muscles', muscleId, 'exercises', editingExId);
    updateDocumentNonBlocking(exRef, { 
      name: editExName, 
      sets: parseInt(editExSets) || 0, 
      reps: editExReps 
    });
    setIsEditingEx(false);
    setEditingExId(null);
  };

  const handleDeleteEx = (exId: string) => {
    deleteDocumentNonBlocking(doc(db, 'users', user.uid, 'gymDays', dayId, 'muscles', muscleId, 'exercises', exId));
  };

  return (
    <div className="grid gap-3">
      {exercises?.map(ex => (
        <div key={ex.id} className="bg-white p-4 rounded-[10px] border border-border/40 premium-shadow flex items-center justify-between group">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-[8px] soft-purple-bg flex items-center justify-center text-primary">
              <Dumbbell className="h-4 w-4" />
            </div>
            <div>
              <h5 className="text-sm font-bold">{ex.name}</h5>
              <p className="text-[10px] text-muted-foreground font-bold">
                {ex.sets} مجموعات × {ex.reps} عدات
              </p>
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-primary/40 hover:text-primary"
              onClick={() => {
                setEditingExId(ex.id);
                setEditExName(ex.name);
                setEditExSets(ex.sets.toString());
                setEditExReps(ex.reps);
                setIsEditingEx(true);
              }}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleDeleteEx(ex.id)} className="h-8 w-8 text-destructive/20 hover:text-destructive">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}

      {/* Edit Exercise Dialog */}
      <Dialog open={isEditingEx} onOpenChange={setIsEditingEx}>
        <DialogContent className="font-cairo rounded-[10px]">
          <DialogHeader><DialogTitle>تعديل التمرين</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>اسم التمرين</Label>
              <Input value={editExName} onChange={e => setEditExName(e.target.value)} className="rounded-[10px]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المجموعات</Label>
                <Input type="number" value={editExSets} onChange={e => setEditExSets(e.target.value)} className="rounded-[10px]" />
              </div>
              <div className="space-y-2">
                <Label>العدات</Label>
                <Input value={editExReps} onChange={e => setEditExReps(e.target.value)} className="rounded-[10px]" />
              </div>
            </div>
          </div>
          <Button onClick={handleUpdateEx} className="primary-gradient text-white w-full rounded-[10px] h-11">حفظ</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
