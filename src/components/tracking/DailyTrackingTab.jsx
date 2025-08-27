import React, { useState, useEffect } from 'react';
import { DailyEntry } from '@/api/entities';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Calendar } from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';

export default function DailyTrackingTab({ currentStageData, onEntryLogged }) {
  const [taskRatings, setTaskRatings] = useState({});
  const [dailyRating, setDailyRating] = useState(5);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);
  const [hasLoggedToday, setHasLoggedToday] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = await User.me();
        if (!currentUser) return;
        
        setUser(currentUser);
        
        if (!currentStageData || !currentStageData.daily_tasks || !Array.isArray(currentStageData.daily_tasks)) {
          return;
        }
        
        const initialRatings = currentStageData.daily_tasks.reduce((acc, task) => {
          acc[task] = 5;
          return acc;
        }, {});
        setTaskRatings(initialRatings);

        try {
          const entries = await DailyEntry.filter({ userId: currentUser.id }, '-date', 1);
          if (entries && entries.length > 0 && entries[0].date && isToday(parseISO(entries[0].date))) {
            setHasLoggedToday(true);
          }
        } catch (entriesError) {
          console.error("Error loading entries:", entriesError);
        }
      } catch (userError) {
        console.error("Error loading user:", userError);
      }
    };
    
    if (currentStageData) {
      init();
    }
  }, [currentStageData]);

  if (!currentStageData || !currentStageData.daily_tasks) {
    return <div className="text-center p-8">טוען נתוני שלב...</div>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await DailyEntry.create({
        userId: user.id,
        stageNumber: currentStageData.stage_number,
        date: new Date().toISOString().split('T')[0],
        task_ratings: taskRatings,
        daily_rating: dailyRating,
        notes: notes,
      });
      
      setSuccess('הרישום היומי נשמר בהצלחה!');
      setHasLoggedToday(true);
      if (onEntryLogged) {
        onEntryLogged();
      }
    } catch (err) {
      setError(err.message || 'שגיאה בשמירת הרישום.');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (hasLoggedToday) {
      return (
          <Card className="m-2 md:m-4 lg:m-6 bg-white shadow-lg rounded-xl">
              <CardHeader className="text-center">
                <Calendar className="mx-auto w-10 h-10 md:w-12 md:h-12 text-green-500 mb-4" />
                <CardTitle className="text-xl md:text-2xl text-gray-800">הרישום היומי הושלם!</CardTitle>
                <CardDescription className="text-base md:text-lg text-gray-600">כל הכבוד על ההתמדה. נתראה מחר!</CardDescription>
              </CardHeader>
          </Card>
      )
  }

  return (
    <div className="p-2 md:p-4 lg:p-6" style={{ fontFamily: 'Alegreya, serif' }}>
      <Card className="max-w-3xl mx-auto bg-white shadow-lg rounded-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-xl md:text-2xl lg:text-3xl text-blue-800 px-4">מעקב יומי - {format(new Date(), 'dd/MM/yyyy')}</CardTitle>
          <CardDescription className="text-sm md:text-base lg:text-lg text-gray-600 px-4">דרג את ביצועיך היום בסולם של 1 עד 10</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
            <div>
              <h3 className="text-lg md:text-xl font-bold mb-4 text-gray-700">דירוג משימות</h3>
              <div className="space-y-4 md:space-y-6">
                {currentStageData.daily_tasks.map((task, index) => (
                  <div key={index}>
                    <label className="block text-base md:text-lg mb-2 text-gray-800 leading-relaxed">{task}</label>
                    <div className="flex items-center gap-3 md:gap-4">
                      <Slider
                        value={[taskRatings[task] || 5]}
                        onValueChange={(value) => setTaskRatings(prev => ({ ...prev, [task]: value[0] }))}
                        min={1} max={10} step={1}
                        className="flex-grow"
                      />
                      <span className="w-8 md:w-12 text-center font-bold text-base md:text-lg text-blue-600">{taskRatings[task] || 5}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg md:text-xl font-bold mb-4 text-gray-700">דירוג כללי ומחשבות</h3>
              <div className="space-y-4 md:space-y-6">
                 <div>
                    <label className="block text-base md:text-lg mb-2 text-gray-800">איך היית מדרג את היום שלך באופן כללי?</label>
                    <div className="flex items-center gap-3 md:gap-4">
                      <Slider
                        value={[dailyRating]}
                        onValueChange={(value) => setDailyRating(value[0])}
                        min={1} max={10} step={1}
                        className="flex-grow"
                      />
                      <span className="w-8 md:w-12 text-center font-bold text-base md:text-lg text-blue-600">{dailyRating}</span>
                    </div>
                  </div>
                <div>
                  <label htmlFor="notes" className="block text-base md:text-lg mb-2 text-gray-800">הערות, מחשבות ותובנות מהיום:</label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="מה למדתי היום? מה היה מאתגר? במה הצלחתי?"
                    className="min-h-[100px] md:min-h-[120px] text-sm md:text-base"
                  />
                </div>
              </div>
            </div>

            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            {success && <Alert variant="success"><AlertDescription>{success}</AlertDescription></Alert>}

            <div className="text-center pt-4">
              <Button type="submit" disabled={isLoading} size="lg" className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto px-6 md:px-8 py-2 md:py-3">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                שמור רישום יומי
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}