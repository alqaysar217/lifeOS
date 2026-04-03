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
  ChevronLeft
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

  const handleDeleteDay = (dayId: string) => {
    if (!db || !user) return;
    deleteDocumentNonBlocking(doc(db, 'users', user.uid, 'gymDays', dayId));
    if (selectedDayId === dayId) setSelectedDayId(null);
  };

  const handleAddMuscle = () => {
    if (!db || !user || !selectedDayId || !newMuscleName) return;
    const musclesRef = collection(db, 'users', user.uid, 'gymDays', selectedDayId, 'muscles');
    addDocumentNonBlocking(musclesRef, {
      name: newMuscleName
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
      reps: newExReps
    });
    setIsAddingExercise(false);
    setNewExName("");
    setNewExSets("");
    setNewExReps("");
  };

  return (
    <div className="flex flex-col h-full bg-background animate-in fade-in duration-500 pb-32">
      <div className="px-6 py-6 space-y-6">
        {/* Header / Day Overview */}
        {!selectedDayId ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground font-cairo">خطة التمارين</h3>
              <Dialog open={isAddingDay} onOpenChange={setIsAddingDay}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 rounded-[10px] border-primary/20">
                    <Plus className="h-4 w-4" />
                    إضافة يوم
                  </Button>
                </DialogTrigger>
                <DialogContent className="font-cairo">
                  <DialogHeader><DialogTitle>اختر يوم التدريب</DialogTitle></DialogHeader>
                  <div className="py-4">
                    <Select onValueChange={setNewDayName}>
                      <SelectTrigger><SelectValue placeholder="اختر اليوم..." /></SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map(d => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddDay} disabled={!newDayName} className="primary-gradient text-white w-full">تأكيد الإضافة</Button>
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
                    onClick={() => setSelectedDayId(day.id)}
                    className="bg-white p-5 rounded-[15px] premium-shadow border border-border/40 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-[12px] primary-gradient flex items-center justify-center text-white shadow-lg">
                        <Calendar className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="text-lg font-black">{day.dayName}</h4>
                        <p className="text-xs text-muted-foreground font-bold">عرض تفاصيل التمارين</p>
                      </div>
                    </div>
                    <ChevronLeft className="h-5 w-5 text-slate-300 group-hover:text-primary" />
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
          /* Day Detail View */
          <div className="space-y-6 animate-in slide-in-from-left-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => setSelectedDayId(null)} className="h-8 w-8 rounded-full bg-slate-100">
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <h3 className="text-xl font-black">{gymDays?.find(d => d.id === selectedDayId)?.dayName}</h3>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive/40 hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="font-cairo">
                  <AlertDialogTitle>حذف يوم التدريب؟</AlertDialogTitle>
                  <AlertDialogDescription>سيتم حذف كافة العضلات والتمارين المرتبطة بهذا اليوم.</AlertDialogDescription>
                  <AlertDialogFooter className="flex-row gap-2">
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDeleteDay(selectedDayId)} className="bg-destructive">حذف نهائي</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <MuscleList dayId={selectedDayId} db={db} user={user} onAddExercise={(mId) => { setActiveMuscleId(mId); setIsAddingExercise(true); }} />

            <Button onClick={() => setIsAddingMuscle(true)} className="w-full h-12 rounded-[12px] border-dashed border-2 border-primary/20 bg-primary/5 text-primary font-bold">
              <Plus className="h-4 w-4 ml-2" />
              إضافة مجموعة عضلية جديدة
            </Button>

            {/* Modals */}
            <Dialog open={isAddingMuscle} onOpenChange={setIsAddingMuscle}>
              <DialogContent className="font-cairo">
                <DialogHeader><DialogTitle>اسم المجموعة العضلية</DialogTitle></DialogHeader>
                <Input placeholder="مثلاً: صدر علوي، باي، أرجل..." value={newMuscleName} onChange={e => setNewMuscleName(e.target.value)} className="h-12" />
                <Button onClick={handleAddMuscle} className="primary-gradient text-white w-full">حفظ</Button>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddingExercise} onOpenChange={setIsAddingExercise}>
              <DialogContent className="font-cairo">
                <DialogHeader><DialogTitle>إضافة تمرين جديد</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>اسم التمرين</Label>
                    <Input placeholder="مثلاً: Bench Press" value={newExName} onChange={e => setNewExName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>عدد المجموعات</Label>
                      <Input type="number" placeholder="مثلاً: 3" value={newExSets} onChange={e => setNewExSets(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>العدات (نصي)</Label>
                      <Input placeholder="مثلاً: 12-10-8" value={newExReps} onChange={e => setNewExReps(e.target.value)} />
                    </div>
                  </div>
                </div>
                <Button onClick={handleAddExercise} className="primary-gradient text-white w-full">إضافة للتمرين</Button>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
}

function MuscleList({ dayId, db, user, onAddExercise }: { dayId: string, db: any, user: any, onAddExercise: (mId: string) => void }) {
  const musclesQuery = useMemoFirebase(() => {
    if (!db || !user || !dayId) return null;
    return collection(db, 'users', user.uid, 'gymDays', dayId, 'muscles');
  }, [db, user, dayId]);

  const { data: muscles } = useCollection(musclesQuery);

  return (
    <div className="space-y-8">
      {muscles?.map(muscle => (
        <div key={muscle.id} className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h4 className="text-sm font-black text-primary uppercase tracking-wider">{muscle.name}</h4>
            <Button variant="ghost" size="icon" onClick={() => onAddExercise(muscle.id)} className="h-6 w-6 rounded-full bg-primary/10 text-primary">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <ExerciseList dayId={dayId} muscleId={muscle.id} db={db} user={user} />
        </div>
      ))}
    </div>
  );
}

function ExerciseList({ dayId, muscleId, db, user }: { dayId: string, muscleId: string, db: any, user: any }) {
  const exQuery = useMemoFirebase(() => {
    if (!db || !user || !dayId || !muscleId) return null;
    return collection(db, 'users', user.uid, 'gymDays', dayId, 'muscles', muscleId, 'exercises');
  }, [db, user, dayId, muscleId]);

  const { data: exercises } = useCollection(exQuery);

  const handleDeleteEx = (exId: string) => {
    deleteDocumentNonBlocking(doc(db, 'users', user.uid, 'gymDays', dayId, 'muscles', muscleId, 'exercises', exId));
  };

  return (
    <div className="grid gap-3">
      {exercises?.map(ex => (
        <div key={ex.id} className="bg-white p-4 rounded-[12px] border border-border/40 premium-shadow flex items-center justify-between group">
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
          <Button variant="ghost" size="icon" onClick={() => handleDeleteEx(ex.id)} className="h-8 w-8 text-destructive/20 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}

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