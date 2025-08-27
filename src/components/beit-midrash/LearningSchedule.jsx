
import React, { useState, useEffect, useMemo } from 'react';
import { LearningSchedule } from '@/api/entities';
import { UserLibrary } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Calendar as CalendarIcon, Plus, BookOpen, Clock, CheckCircle, Edit2, Loader2, ChevronLeft, ChevronRight, Book } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO, addDays, startOfWeek, subDays, isSameDay } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from 'sonner';
import StudySessionDialog from './StudySessionDialog';

export default function LearningScheduleComponent({ user, books, initialSchedules, onSchedulesChange, onBooksChange }) {
  const [schedules, setSchedules] = useState(initialSchedules || []);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    title: '',
    sourceBookId: '',
    scheduledAt: new Date(),
    recurrence: 'none'
  });

  useEffect(() => {
    setSchedules(initialSchedules || []);
  }, [initialSchedules]);

  const handleCreateSchedule = async () => {
    if (!user || !newSchedule.title || !newSchedule.sourceBookId) {
      toast.error("יש למלא את כל השדות הנדרשים");
      return;
    }

    try {
      const selectedBook = books.find(b => b.id === newSchedule.sourceBookId);
      const scheduleData = {
        ...newSchedule,
        userId: user.id,
        sourceBookTitle: selectedBook?.bookTitle || '',
        scheduledAt: newSchedule.scheduledAt.toISOString()
      };
      
      const createdSchedule = await LearningSchedule.create(scheduleData);
      
      // Update schedules state
      onSchedulesChange([...schedules, createdSchedule]);
      
      // Check and update book status
      if (selectedBook && selectedBook.status !== 'במהלך לימוד') {
        const updatedBook = await UserLibrary.update(selectedBook.id, { status: 'במהלך לימוד' });
        // Ensure that the book object returned by the update function is used for state update
        const updatedBooks = books.map(b => b.id === selectedBook.id ? updatedBook : b);
        onBooksChange(updatedBooks);
      }
      
      setIsCreateDialogOpen(false);
      setNewSchedule({
        title: '',
        sourceBookId: '',
        scheduledAt: new Date(),
        recurrence: 'none'
      });
      toast.success("סדר הלימוד נוצר בהצלחה!");
    } catch (error) {
      console.error("Error creating schedule:", error);
      toast.error("שגיאה ביצירת סדר הלימוד");
    }
  };

  // New function to open the study session dialog
  const handleOpenStudySessionDialog = (schedule) => {
    setSelectedSchedule(schedule);
    setIsSessionDialogOpen(true);
  };

  // Modified handleCompleteSchedule: This now performs the actual completion logic (DB update)
  const handleCompleteSchedule = async (schedule) => {
    try {
      await LearningSchedule.update(schedule.id, { isCompleted: true });
      const updatedSchedules = schedules.map(s => 
        s.id === schedule.id ? { ...s, isCompleted: true } : s
      );
      setSchedules(updatedSchedules); // Update local state for immediate UI refresh
      onSchedulesChange(updatedSchedules); // Propagate change to parent
      toast.success("סדר הלימוד סומן כהושלם!");
    } catch (error) {
      console.error("Error completing schedule:", error);
      toast.error("שגיאה בסימון ההשלמה");
    }
  };

  // Modified handleSessionComplete: This now only handles closing the dialog and clearing selected schedule
  const handleSessionComplete = () => {
    setIsSessionDialogOpen(false);
    setSelectedSchedule(null);
    // Data is already updated by handleCompleteSchedule, which is called before this function from the dialog's onComplete prop
  };

  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 0 }); // Sunday
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, [selectedDate]);

  const getSchedulesForDate = (date) => {
    return schedules.filter(schedule => 
      isSameDay(parseISO(schedule.scheduledAt), date)
    );
  };

  const scheduledDaysModifier = useMemo(() => {
    return schedules.map(s => parseISO(s.scheduledAt));
  }, [schedules]);

  const schedulesForSelectedDay = useMemo(() => {
      if (!selectedDate) return [];
      return getSchedulesForDate(selectedDate);
  }, [selectedDate, schedules]);
  
  const shortDayNames = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
  const fullDayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">לוח הלימוד שלי</h2>
          <p className="text-gray-500">תכנן ונהל את סדרי הלימוד שלך</p>
        </div>
        <div className="flex items-center gap-4">
            <div className="flex border rounded-lg p-1">
                <Button 
                    variant={viewMode === 'week' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('week')}
                    className="rounded-md"
                >
                    שבועי
                </Button>
                <Button 
                    variant={viewMode === 'month' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('month')}
                    className="rounded-md"
                >
                    חודשי
                </Button>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                <Plus className="w-4 h-4 ml-2" />
                סדר לימוד חדש
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>יצירת סדר לימוד חדש</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="title">נושא הלימוד</Label>
                  <Input
                    id="title"
                    placeholder="לדוגמה: פרק ג' בזהירות"
                    value={newSchedule.title}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="source">מקור</Label>
                  <Select value={newSchedule.sourceBookId} onValueChange={(value) => setNewSchedule(prev => ({ ...prev, sourceBookId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר ספר מארון הספרים" />
                    </SelectTrigger>
                    <SelectContent>
                      {books.map(book => (
                        <SelectItem key={book.id} value={book.id}>
                          {book.bookTitle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>תאריך ושעה</Label>
                  <Input
                    type="datetime-local"
                    value={format(newSchedule.scheduledAt, "yyyy-MM-dd'T'HH:mm")}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, scheduledAt: new Date(e.target.value) }))}
                  />
                </div>
                
                <div>
                  <Label>חזרתיות</Label>
                  <Select value={newSchedule.recurrence} onValueChange={(value) => setNewSchedule(prev => ({ ...prev, recurrence: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">ללא</SelectItem>
                      <SelectItem value="daily">יומי</SelectItem>
                      <SelectItem value="weekly">שבועי</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>ביטול</Button>
                <Button onClick={handleCreateSchedule}>שמור</Button>
              </DialogFooter>
            </DialogContent>
            </Dialog>
        </div>
      </div>

      {books.length === 0 ? (
        <Card className="p-8 text-center">
          <Book className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">ארון הספרים שלך ריק</h3>
          <p className="text-gray-500">עבור ל"ארון הספרים" והוסף ספרים כדי להתחיל לתכנן את הלימוד שלך.</p>
        </Card>
      ) : (
        <div>
          {viewMode === 'week' && (
            <div className="grid grid-cols-7 gap-1 md:gap-2">
              {weekDays.map((date, index) => (
                <div key={date.toISOString()} className="text-center font-semibold text-gray-600 bg-gray-100 rounded-t-lg p-2 text-xs md:text-base">
                  <span className="hidden md:inline">{fullDayNames[index]}</span>
                  <span className="md:hidden">{shortDayNames[index]}</span>
                </div>
              ))}
              
              {weekDays.map(date => {
                const daySchedules = getSchedulesForDate(date);
                const isToday = isSameDay(date, new Date());
                
                return (
                  <Card key={date.toISOString()} className={`min-h-[120px] rounded-t-none ${isToday ? 'border-blue-500 bg-blue-50' : 'bg-white'}`}>
                    <CardHeader className="p-2">
                      <div className="text-xs md:text-sm font-semibold text-gray-600 text-center">
                        {format(date, 'd')}
                      </div>
                    </CardHeader>
                    <CardContent className="p-1 md:p-2 space-y-1">
                      {daySchedules.map(schedule => (
                        <div 
                          key={schedule.id}
                          className={`p-1.5 rounded text-[10px] md:text-xs cursor-pointer transition-colors ${
                            schedule.isCompleted 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                          }`}
                          onClick={() => !schedule.isCompleted && handleOpenStudySessionDialog(schedule)}
                        >
                          <div className="font-medium truncate">{schedule.title}</div>
                          <div className="text-gray-600 truncate opacity-75">{schedule.sourceBookTitle}</div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {viewMode === 'month' && (
             <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-0 border-0 md:border md:p-2">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(day) => day && setSelectedDate(day)}
                      locale={he}
                      modifiers={{ scheduled: scheduledDaysModifier }}
                      modifiersClassNames={{ scheduled: 'bg-blue-100 rounded-md font-bold' }}
                      className="p-0"
                    />
                </Card>
                <div className="space-y-4">
                  <h3 className="font-bold text-lg">סדרי לימוד ליום {format(selectedDate, 'd בMMMM', {locale: he})}</h3>
                  {schedulesForSelectedDay.length > 0 ? (
                      schedulesForSelectedDay.map(schedule => (
                        <div 
                          key={schedule.id}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            schedule.isCompleted 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                          }`}
                          onClick={() => !schedule.isCompleted && handleOpenStudySessionDialog(schedule)}
                        >
                           <div className="flex items-center justify-between">
                            <span className="font-medium">{schedule.title}</span>
                            {schedule.isCompleted ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <Clock className="w-4 h-4" />
                            )}
                          </div>
                          <div className="text-sm text-gray-600">{schedule.sourceBookTitle}</div>
                          <div className="text-sm text-gray-500">
                            {format(parseISO(schedule.scheduledAt), 'HH:mm')}
                          </div>
                        </div>
                      ))
                  ) : (
                      <p className="text-gray-500 pt-4 text-center">אין סדרי לימוד מתוכננים ליום זה.</p>
                  )}
                </div>
            </div>
          )}
        </div>
      )}

      <StudySessionDialog 
        isOpen={isSessionDialogOpen}
        onClose={() => setIsSessionDialogOpen(false)}
        schedule={selectedSchedule}
        // When the dialog's complete action is triggered, first complete the schedule via API, then close the dialog.
        onComplete={async () => {
          if (selectedSchedule) {
            await handleCompleteSchedule(selectedSchedule);
          }
          handleSessionComplete(); // This closes the dialog and clears selected schedule
        }}
      />
    </div>
  );
}
