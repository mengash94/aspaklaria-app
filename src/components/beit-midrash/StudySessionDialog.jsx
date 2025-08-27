import React, { useState } from 'react';
import { LearningSchedule } from '@/api/entities';
import { LearningSession } from '@/api/entities';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, MessageCircle, Brain, BookOpen } from 'lucide-react';
import ChatInterface from './ChatInterface';

export default function StudySessionDialog({ isOpen, onClose, schedule, onComplete }) {
  const [stage, setStage] = useState('options'); // 'options', 'chat', 'completed'
  const [selectedLevel, setSelectedLevel] = useState(null);

  if (!schedule) return null;

  const handleSimpleComplete = async () => {
    try {
      await LearningSchedule.update(schedule.id, { isCompleted: true });
      setStage('completed');
      setTimeout(() => {
        onComplete();
        setStage('options');
      }, 1500);
    } catch (error) {
      console.error("Error completing schedule:", error);
    }
  };

  const handleAISession = (level) => {
    setSelectedLevel(level);
    setStage('chat');
  };

  const handleChatComplete = async (summary, transcript) => {
    try {
      // Save the learning session
      await LearningSession.create({
        userId: schedule.userId,
        scheduleId: schedule.id,
        sessionDate: new Date().toISOString(),
        userSummary: summary,
        aiInteractionLevel: selectedLevel,
        chatTranscript: transcript,
        ai_summary: summary
      });

      // Mark schedule as completed
      await LearningSchedule.update(schedule.id, { isCompleted: true });
      
      setStage('completed');
      setTimeout(() => {
        onComplete();
        setStage('options');
        setSelectedLevel(null);
      }, 1500);
    } catch (error) {
      console.error("Error saving session:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {stage === 'options' && `השלמת לימוד: ${schedule.title}`}
            {stage === 'chat' && `חברותא AI - ${schedule.title}`}
            {stage === 'completed' && `בוצע בהצלחה! 🎉`}
          </DialogTitle>
        </DialogHeader>

        {stage === 'options' && (
          <div className="space-y-4 py-4">
            <p className="text-center text-gray-600 mb-6">
              איך היית רוצה לסיים את הלימוד?
            </p>
            
            <div className="grid gap-4 md:grid-cols-3">
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-green-500"
                onClick={handleSimpleComplete}
              >
                <CardHeader className="text-center pb-3">
                  <CheckCircle className="w-12 h-12 mx-auto text-green-600 mb-2" />
                  <CardTitle className="text-lg">סיום פשוט</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600 text-center">
                    סמן את הלימוד כהושלם ללא דיון נוסף
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-500"
                onClick={() => handleAISession(1)}
              >
                <CardHeader className="text-center pb-3">
                  <MessageCircle className="w-12 h-12 mx-auto text-blue-600 mb-2" />
                  <CardTitle className="text-lg">סיכום ותובנות</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600 text-center">
                    שתף את הסיכום שלך והחברותא יעזור לך להעמיק
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-purple-500"
                onClick={() => handleAISession(2)}
              >
                <CardHeader className="text-center pb-3">
                  <Brain className="w-12 h-12 mx-auto text-purple-600 mb-2" />
                  <CardTitle className="text-lg">דיון מעמיק</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600 text-center">
                    דיון מעמיק על החומר עם חיבורים והרחבות
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {stage === 'chat' && (
          <ChatInterface 
            schedule={schedule}
            level={selectedLevel}
            onComplete={handleChatComplete}
            onCancel={() => setStage('options')}
          />
        )}

        {stage === 'completed' && (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
            <h3 className="text-xl font-bold text-green-800 mb-2">מעולה!</h3>
            <p className="text-gray-600">הלימוד הושלם בהצלחה</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}