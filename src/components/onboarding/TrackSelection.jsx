import React, { useState } from "react";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Zap, Turtle, Loader2, BookOpen, Wand2 } from "lucide-react";

export default function TrackSelection({ onTrackSelected }) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState(null);

  const selectTrack = async (track) => {
    setIsLoading(true);
    setSelectedTrack(track);
    
    try {
      if (track === "מותאם אישית") {
        // עבור מסלול מותאם אישית, נשמור בינתיים רק את הבחירה
        // השלמת הקונפיגורציה תקרה בשלב הבא
        await User.updateMyUserData({ 
          track: track, 
          current_stage: 1,
          onboarding_completed: false // נשאיר false עד השלמת השאלון
        });
        // כאן נעביר לשאלון המותאם אישית
        onTrackSelected('custom_questionnaire');
      } else {
        await User.updateMyUserData({ 
          track: track, 
          current_stage: 1,
          onboarding_completed: true 
        });
        onTrackSelected();
      }
    } catch (error) {
      console.error("Failed to select track:", error);
      setIsLoading(false);
      setSelectedTrack(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-sky-50 to-blue-100" dir="rtl">
      <div className="w-full max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-blue-800 mb-4">
            ברוך הבא למסע הרוחני!
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-2 leading-relaxed max-w-2xl mx-auto">
            בחר את סגנון המסע המועדף עליך
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="cursor-pointer transition-all duration-300 transform hover:scale-105 h-full flex flex-col hover:shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
                <Zap className="w-8 h-8 text-orange-600" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-800 mb-2">מסלול המתמיד</CardTitle>
              <CardDescription className="text-sm text-gray-600 leading-relaxed">
                לאנשים שרוצים להתקדם בקצב מהיר ואינטנסיבי
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 flex-grow flex flex-col">
              <div className="space-y-2 mb-4 flex-grow">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>אתגרים יומיים מגוונים ומעמיקים</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>דורש מחויבות של 20-30 דקות ביום</span>
                </div>
              </div>
              
              <Button 
                onClick={() => selectTrack("מתמיד")} 
                disabled={isLoading}
                className="w-full py-2 font-bold transition-all mt-auto bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isLoading && selectedTrack === "מתמיד" ? (
                  <><Loader2 className="animate-spin ml-2 h-4 w-4" /> מתחיל מסע...</>
                ) : (
                  "אני רוצה להתמיד! 🔥"
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-all duration-300 transform hover:scale-105 h-full flex flex-col hover:shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
                <Turtle className="w-8 h-8 text-emerald-600" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-800 mb-2">מסלול בקצב אישי</CardTitle>
              <CardDescription className="text-sm text-gray-600 leading-relaxed">
                התקדמות הדרגתית המתאימה לקצב החיים שלך
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 flex-grow flex flex-col">
              <div className="space-y-2 mb-4 flex-grow">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span>משימות יומיות קצרות ונגישות</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span>התאמה לקצב החיים האישי</span>
                </div>
              </div>
              
              <Button 
                onClick={() => selectTrack("בקצב אישי")} 
                disabled={isLoading}
                className="w-full py-2 font-bold transition-all mt-auto bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                {isLoading && selectedTrack === "בקצב אישי" ? (
                  <><Loader2 className="animate-spin ml-2 h-4 w-4" /> מתחיל מסע...</>
                ) : (
                  "אני בוחר בקצב שלי 🌱"
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-all duration-300 transform hover:scale-105 h-full flex flex-col hover:shadow-lg border-2 border-purple-200">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                <Wand2 className="w-8 h-8 text-purple-600" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-800 mb-2">מסלול מותאם אישית</CardTitle>
              <CardDescription className="text-sm text-gray-600 leading-relaxed">
                מסלול שנבנה במיוחד עבורך על ידי AI על בסיס הצרכים והמטרות שלך
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 flex-grow flex flex-col">
              <div className="space-y-2 mb-4 flex-grow">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>שאלון אישי מותאם לצרכים שלך</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>מסלול ייחודי שנוצר על ידי AI</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>התאמה מלאה למטרות האישיות שלך</span>
                </div>
              </div>
              
              <Button 
                onClick={() => selectTrack("מותאם אישית")} 
                disabled={isLoading}
                className="w-full py-2 font-bold transition-all mt-auto bg-purple-500 hover:bg-purple-600 text-white"
              >
                {isLoading && selectedTrack === "מותאם אישית" ? (
                  <><Loader2 className="animate-spin ml-2 h-4 w-4" /> יוצר מסלול...</>
                ) : (
                  "בואו ניצור מסלול יחד! ✨"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}