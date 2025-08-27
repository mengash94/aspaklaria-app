import React, { useState, useEffect, useRef } from "react";
import { CustomTrack } from "@/api/entities";
import { DailyEntry } from "@/api/entities";
import { User } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Bot, User as UserIcon, Sparkles, TrendingUp } from "lucide-react";
import ReactMarkdown from 'react-markdown';

const INITIAL_MESSAGE = `שלום שוב! 🙏 

אני רואה שאתה מעוניין לעדכן את המסלול הרוחני המותאם אישית שלך. זה נהדר - זה מראה על התפתחות ורצון להמשיך לצמוח!

בואו נסתכל יחד על מה שעשית עד עכשיו ואיך נוכל להתאים את השלבים הבאים בדרך הטובה ביותר עבורך.

אני אציג לך בהמשך סיכום של הפעילות שלך, ואז נדבר על איך להמשיך משם.`;

export default function UpdateCustomTrackDialog({ isOpen, onClose, user, onTrackUpdated }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: INITIAL_MESSAGE }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [userActivity, setUserActivity] = useState(null);
  const [stage, setStage] = useState('loading'); // 'loading', 'summary', 'chat', 'updating'
  const [updatedTrack, setUpdatedTrack] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && user) {
      loadUserData();
    }
  }, [isOpen, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadUserData = async () => {
    setStage('loading');
    try {
      // טעינת המסלול הנוכחי
      if (user.custom_track_id) {
        const tracks = await CustomTrack.filter({ id: user.custom_track_id });
        if (tracks && tracks.length > 0) {
          setCurrentTrack(tracks[0]);
        }
      }

      // טעינת נתוני הפעילות
      const entries = await DailyEntry.filter({ userId: user.id });
      
      const activitySummary = {
        totalEntries: entries?.length || 0,
        currentStage: user.current_stage,
        recentEntries: entries?.slice(-5) || [],
        averageRating: entries?.length > 0 ? 
          entries.reduce((sum, entry) => sum + entry.daily_rating, 0) / entries.length : 0
      };

      setUserActivity(activitySummary);
      setStage('summary');
    } catch (error) {
      console.error("Error loading user data:", error);
      setStage('chat');
    }
  };

  const generateActivitySummary = () => {
    if (!userActivity || !currentTrack) return "לא נמצאו נתוני פעילות.";

    const { totalEntries, currentStage, averageRating } = userActivity;
    const trackName = currentTrack.track_name;

    return `📊 **סיכום הפעילות שלך במסלול "${trackName}":**

• **שלב נוכחי:** ${currentStage} מתוך ${currentTrack.generated_stages?.length || 10}
• **ימי מעקב:** ${totalEntries} ימים
• **ממוצע דירוג יומי:** ${averageRating.toFixed(1)}/10
• **התקדמות כללית:** ${Math.round((currentStage / 10) * 100)}%

זה נראה מרשים! אתה באמת עובד על עצמך. 💪

עכשיו, בואו נדבר על השלבים הבאים. איזה תחום אתה מרגיש שצריך יותר חיזוק או התמקדות? מה התחדש בחיים שלך מאז שבנינו את המסלול הראשון?`;
  };

  const startConversation = () => {
    const summaryMessage = generateActivitySummary();
    setMessages(prev => [...prev, { role: 'assistant', content: summaryMessage }]);
    setStage('chat');
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;

    const userMessage = currentMessage.trim();
    setCurrentMessage('');
    
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // בניית הקונטקסט לבוט
      const conversationHistory = newMessages.slice(1).map(msg => 
        `${msg.role === 'user' ? 'משתמש' : 'מאמן'}: ${msg.content}`
      ).join('\n');

      const shouldUpdateTrack = newMessages.length >= 8; // אחרי מספר הודעות מספיק

      let prompt;
      
      if (shouldUpdateTrack) {
        prompt = `אתה מאמן רוחני מנוסה שעוזר למשתמש לעדכן את המסלול הרוחני המותאם אישית שלו.

**המסלול הנוכחי של המשתמש:**
שם: ${currentTrack?.track_name || "מסלול מותאם אישית"}
שלב נוכחי: ${user.current_stage}/${currentTrack?.generated_stages?.length || 10}

**נתוני פעילות:**
${JSON.stringify(userActivity, null, 2)}

**השיחה עד כה:**
${conversationHistory}

**המשימה שלך כעת:** צור עדכון למסלול הקיים. אל תשנה את השלבים שכבר עבר (${user.current_stage} ראשונים), אלא רק עדכן את השלבים הבאים בהתאם לשיחה ולפידבק של המשתמש.

החזר **אך ורק JSON תקין** בפורמט הבא:

{
  "track_name": "שם מעודכן למסלול (או אותו שם)",
  "updated_stages": [
    { "stage_number": ${user.current_stage + 1}, "stage_name": "שם שלב", "description": "תיאור", "learning_material": "חומר לימוד", "daily_tasks": ["משימה 1", "משימה 2"], "success_metrics": "מדדי הצלחה" },
    { "stage_number": ${user.current_stage + 2}, "stage_name": "שם שלב", "description": "תיאור", "learning_material": "חומר לימוד", "daily_tasks": ["משימה 1", "משימה 2"], "success_metrics": "מדדי הצלחה" }
  ],
  "update_summary": "סיכום קצר של מה שעודכן ולמה"
}`;
      } else {
        prompt = `אתה מאמן רוחני חם ומעמיק שעוזר למשתמש לעדכן את המסלול הרוחני שלו.

**הקשר:**
המשתמש נמצא כרגע בשלב ${user.current_stage} מתוך ${currentTrack?.generated_stages?.length || 10} במסלול המותאם אישית שלו.
הוא רוצה לעדכן את השלבים הבאים של המסלול.

**השיחה עד כה:**
${conversationHistory}

**המשימה שלך:** המשך את השיחה בצורה טבעית וחמה. שאל שאלות מעמיקות שיעזרו לך להבין איך לשפר את המסלול הבא שלו. התמקד בתחומים שחשובים לו עכשיו.

השב בעברית בלבד, בטון חם ומעודד.`;
      }

      const response = await InvokeLLM({ prompt });
      
      if (shouldUpdateTrack && response.includes('{')) {
        try {
          const jsonStart = response.indexOf('{');
          const jsonEnd = response.lastIndexOf('}') + 1;
          const jsonString = response.substring(jsonStart, jsonEnd);
          const updateData = JSON.parse(jsonString);
          
          setUpdatedTrack(updateData);
          setStage('updating');
          
          setMessages([...newMessages, { 
            role: 'assistant', 
            content: `מצוין! 🎉\n\n${updateData.update_summary}\n\nאני מעדכן את המסלול שלך עכשיו...` 
          }]);
          
          // עדכון המסלול
          setTimeout(async () => {
            await updateTrack(updateData);
          }, 2000);
          
        } catch (parseError) {
          console.error('JSON parsing error:', parseError);
          setMessages([...newMessages, { 
            role: 'assistant', 
            content: "בואו נמשיך לדבר עוד קצת כדי שאני אוכל להבין בדיוק איך לעדכן את המסלול שלך בצורה הטובה ביותר." 
          }]);
        }
      } else {
        setMessages([...newMessages, { role: 'assistant', content: response }]);
      }
    } catch (error) {
      console.error("Error in conversation:", error);
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: "סליחה, הייתה שגיאה. בואו ננסה שוב... איך אתה מרגיש לגבי השלבים הבאים במסע שלך?" 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTrack = async (updateData) => {
    try {
      if (!currentTrack) return;

      // שמירת השלבים הקיימים והחלפת הבאים
      const existingStages = currentTrack.generated_stages.slice(0, user.current_stage);
      const newStages = [...existingStages, ...updateData.updated_stages];

      const updatedTrack = await CustomTrack.update(currentTrack.id, {
        track_name: updateData.track_name,
        generated_stages: newStages
      });

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `🎯 המסלול עודכן בהצלחה!\n\nהשלבים החדשים שלך מוכנים ומחכים לך. אתה יכול לסגור את החלון ולחזור למסע המעודכן שלך.\n\nבהצלחה רבה! 💫` 
      }]);

      if (onTrackUpdated) {
        onTrackUpdated();
      }
    } catch (error) {
      console.error("Error updating track:", error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "אירעה שגיאה בעדכון המסלול. אנא נסה שוב או פנה לתמיכה." 
      }]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {stage === 'loading' && 'טוען נתונים...'}
            {stage === 'summary' && 'סיכום הפעילות שלך'}
            {stage === 'chat' && 'עדכון המסלול שלך'}
            {stage === 'updating' && 'מעדכן מסלול...'}
          </DialogTitle>
        </DialogHeader>

        {stage === 'loading' && (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-lg text-gray-700">טוען את נתוני הפעילות שלך...</p>
            </div>
          </div>
        )}

        {stage === 'summary' && userActivity && currentTrack && (
          <div className="space-y-6 py-4">
            <Card className="bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  הפעילות שלך במסלול "{currentTrack.track_name}"
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{user.current_stage}/10</div>
                    <div className="text-sm text-gray-600">שלב נוכחי</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{userActivity.totalEntries}</div>
                    <div className="text-sm text-gray-600">ימי מעקב</div>
                  </div>
                </div>
                {userActivity.averageRating > 0 && (
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{userActivity.averageRating.toFixed(1)}/10</div>
                    <div className="text-sm text-gray-600">ממוצע דירוג יומי</div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="text-center">
              <p className="text-gray-600 mb-4">
                נראה שאתה עושה עבודה נהדרת! בואו נדבר על איך להתאים את השלבים הבאים במסלול שלך.
              </p>
              <Button onClick={startConversation} className="bg-blue-600 hover:bg-blue-700">
                <Sparkles className="w-5 h-5 ml-2" />
                בואו נתחיל לדבר
              </Button>
            </div>
          </div>
        )}

        {stage === 'chat' && (
          <div className="flex flex-col h-[60vh]">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-2">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-5 h-5 text-blue-600" />
                    </div>
                  )}
                  <div className={`max-w-[80%] p-4 rounded-xl shadow-sm ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white ml-auto'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {message.role === 'assistant' ? (
                      <ReactMarkdown className="prose prose-sm max-w-none">
                        {message.content}
                      </ReactMarkdown>
                    ) : (
                      <p className="leading-relaxed">{message.content}</p>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <UserIcon className="w-5 h-5 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="bg-gray-100 p-4 rounded-xl">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex gap-3 border-t pt-4">
              <Textarea
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="שתף אותי במחשבות שלך..."
                className="flex-1 min-h-[60px] max-h-[100px] resize-none"
                disabled={isLoading}
              />
              <Button 
                onClick={sendMessage} 
                disabled={isLoading || !currentMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 self-end"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        {stage === 'updating' && (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-lg text-gray-700">מעדכן את המסלול שלך...</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}