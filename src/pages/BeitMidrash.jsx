
import React, { useState, useEffect } from 'react';
import { UserLibrary } from '@/api/entities';
import { LearningSchedule } from '@/api/entities';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Book, Calendar, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import Bookshelf from '@/components/beit-midrash/Bookshelf';
import LearningScheduleComponent from '@/components/beit-midrash/LearningSchedule';
import { toast } from 'sonner';

export default function BeitMidrashPage() {
  const [user, setUser] = useState(null);
  const [books, setBooks] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      const [userBooks, userSchedules] = await Promise.all([
        UserLibrary.filter({ userId: currentUser.id }),
        LearningSchedule.filter({ userId: currentUser.id })
      ]);
      
      setBooks(userBooks || []);
      setSchedules(userSchedules || []);
    } catch (error) {
      console.error("Error loading Beit Midrash data:", error);
      toast.error("שגיאה בטעינת נתוני בית המדרש.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50" dir="rtl">
        <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
            <p className="mt-4 text-lg text-gray-700">טוען את בית המדרש...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-8" dir="rtl">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..900;1,400..900&display=swap');`}</style>
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8 pb-4 border-b">
          <div className="flex items-center gap-4">
            <Book className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">בית המדרש</h1>
          </div>
          <Link to={createPageUrl('Home')}>
            <Button variant="outline">
              <ArrowRight className="ml-2 h-4 w-4" />
              חזור למסע
            </Button>
          </Link>
        </header>
        
        <main>
          <Tabs defaultValue="bookshelf" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="bookshelf">
                <Book className="w-4 h-4 ml-2" />
                ארון הספרים
              </TabsTrigger>
              <TabsTrigger value="schedule">
                <Calendar className="w-4 h-4 ml-2" />
                לוח הלימוד
              </TabsTrigger>
            </TabsList>
            <TabsContent value="bookshelf" className="mt-6">
                <Bookshelf 
                  user={user}
                  initialBooks={books}
                  onBooksChange={setBooks}
                />
            </TabsContent>
            <TabsContent value="schedule" className="mt-6">
                <LearningScheduleComponent
                  user={user}
                  books={books}
                  initialSchedules={schedules}
                  onSchedulesChange={setSchedules}
                  onBooksChange={setBooks}
                />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
