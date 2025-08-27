
import React, { useState, useRef, useEffect } from "react";
import { CustomTrack } from "@/api/entities";
import { User } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Bot, User as UserIcon, Sparkles, ArrowLeft } from "lucide-react";
import ReactMarkdown from 'react-markdown';

const INITIAL_MESSAGE = `שלום! 🙏 אני כאן לעזור לך לבנות מסלול רוחני מותאם אישית במיוחד עבורך.

בשיחה הקצרה הזו, אני אכיר אותך קצת יותר טוב כדי לבנות עבורך מסלול שבאמת מתאים לך ולמטרות שלך.

בואו נתחיל! ספר לי, מה מוביל אותך להתחיל במסע רוחני? מה המטרה העיקרית שלך? 🌟`;

export default function CustomTrackQuestionnaire({ onTrackCompleted }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: INITIAL_MESSAGE }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [user, setUser] = useState(null);
  const [trackGenerated, setTrackGenerated] = useState(false);
  const [generatedTrack, setGeneratedTrack] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await User.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;

    const userMessage = currentMessage.trim();
    setCurrentMessage('');
    
    // הוסף את הודעת המשתמש
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    // הוסף להיסטוריית השיחה
    const newConversation = [...conversation, { role: 'user', content: userMessage }];
    setConversation(newConversation);

    try {
      // בדוק אם אספנו מספיק מידע לבנות מסלול
      const shouldGenerateTrack = newConversation.length >= 6; // לפחות 3 חילופי דברים
      
      let prompt;
      const personaPrompt = `**משימתך העיקרית:** אתה מאמן רוחני חם, מנוסה ומעמיק. מטרתך היא לנהל שיחה אישית כדי לבנות למשתמש מסלול צמיחה רוחני מותאם אישית.
**כללי התנהגות מחייבים:**
- **שפה:** השב תמיד בעברית בלבד.
- **טון:** השתמש תמיד בגוף שני (פנייה אישית: "אתה", "שלך"). הטון חייב להיות חם, מעודד, סבלני ומכיל.
- **מיקוד:** שאלותיך ותשובותיך חייבות להיות קשורות אך ורק למטרות הרוחניות של המשתמש, תחומי העניין שלו, רמתו הנוכחית והאתגרים שלו. אם השיחה סוטה, השב אותה בעדינות ובנימוס לנושא.`;

      if (shouldGenerateTrack) {
        prompt = `${personaPrompt}

**המשימה הנוכחית:** אספת מספיק מידע. עליך ליצור מסלול רוחני מותאם אישית.
היסטוריית השיחה עד כה:
${newConversation.map(msg => `${msg.role === 'user' ? 'משתמש' : 'מאמן'}: ${msg.content}`).join('\n')}

**כלל חשוב לחומרי לימוד:** חומרי הלימוד ("learning_material") חייבים להיות מבוססי טקסט בלבד. אין להציע צפייה בסרטונים, הרצאות וידאו או כל תוכן ויזואלי אחר. התמקד בהצעת קריאה, התבוננות ותרגילים מעשיים.

**הפלט הנדרש:**
החזר **אך ורק JSON תקין** בפורמט המדויק הבא, ללא שום טקסט לפניו או אחריו. התוכן חייב להיות בעברית.

{
  "track_name": "שם מסלול יצירתי ומעורר השראה",
  "summary": "סיכום קצר, חם ואישי של מה שהבנת מהמשתמש ומה מטרת המסלול.",
  "stages": [
    { "stage_number": 1, "stage_name": "שם שלב", "description": "תיאור שלב", "learning_material": "חומר לימוד", "daily_tasks": ["משימה 1", "משימה 2"], "success_metrics": "מדדי הצלחה" },
    { "stage_number": 2, "stage_name": "שם שלב", "description": "תיאור שלב", "learning_material": "חומר לימוד", "daily_tasks": ["משימה 1", "משימה 2"], "success_metrics": "מדדי הצלחה" },
    { "stage_number": 3, "stage_name": "שם שלב", "description": "תיאור שלב", "learning_material": "חומר לימוד", "daily_tasks": ["משימה 1", "משימה 2"], "success_metrics": "מדדי הצלחה" },
    { "stage_number": 4, "stage_name": "שם שלב", "description": "תיאור שלב", "learning_material": "חומר לימוד", "daily_tasks": ["משימה 1", "משימה 2"], "success_metrics": "מדדי הצלחה" },
    { "stage_number": 5, "stage_name": "שם שלב", "description": "תיאור שלב", "learning_material": "חומר לימוד", "daily_tasks": ["משימה 1", "משימה 2"], "success_metrics": "מדדי הצלחה" },
    { "stage_number": 6, "stage_name": "שם שלב", "description": "תיאור שלב", "learning_material": "חומר לימוד", "daily_tasks": ["משימה 1", "משימה 2"], "success_metrics": "מדדי הצלחה" }
  ]
}`;
      } else {
        prompt = `${personaPrompt}

**המשימה הנוכחית:** המשך את השיחה עם המשתמש כדי לאסוף מידע.
היסטוריית השיחה:
${newConversation.map(msg => `${msg.role === 'user' ? 'משתמש' : 'מאמן'}: ${msg.content}`).join('\n')}

הודעה חדשה מהמשתמות: "${userMessage}"

**הפלט הנדרש:**
השב למשתמש בצורה חמה ומעודדת, ושאל שאלה אחת או שתיים נוספות שיעמיקו את ההבנה שלך לגבי צרכיו.`;
      }

      const response = await InvokeLLM({ prompt });
      
      // בדוק אם המענה מכיל JSON
      if (shouldGenerateTrack && (response.includes('{') && response.includes('}'))) {
        try {
          // חפש את תחילת הJSON
          const jsonStart = response.indexOf('{');
          const jsonEnd = response.lastIndexOf('}') + 1;
          
          if (jsonStart === -1 || jsonEnd <= jsonStart) {
            throw new Error('לא נמצא JSON תקין בתגובה');
          }
          
          const jsonString = response.substring(jsonStart, jsonEnd);
          console.log('Attempting to parse JSON:', jsonString); // לדיבוג
          
          const trackData = JSON.parse(jsonString);
          
          // וודא שיש את השדות הנדרשים
          if (!trackData.track_name || !trackData.summary || !trackData.stages || !Array.isArray(trackData.stages)) {
            throw new Error('JSON חסרים שדות נדרשים או שדה stages אינו מערך');
          }
          
          setGeneratedTrack(trackData);
          setTrackGenerated(true);
          setMessages([...newMessages, { 
            role: 'assistant', 
            content: `מצוין! 🎉\n\n${trackData.summary}\n\nבניתי עבורך מסלול מותאם אישית בשם **${trackData.track_name}**.\n\nאני אציג לך את השלבים בהמשך לאישור שלך.` 
          }]);
        } catch (parseError) {
          console.error('JSON parsing error:', parseError);
          console.error('Response that failed to parse:', response);
          
          // אם נכשל בפרסור, נמשיך עם השיחה
          const fallbackMessage = "אני עדיין מעבד את המידע... בואו ננסה לאסף עוד קצת פרטים. איזה תחום רוחני מעניין אותך הכי הרבה - תפילה, לימוד תורה, עבודת המידות, או משהו אחר?";
          setMessages([...newMessages, { 
            role: 'assistant', 
            content: fallbackMessage 
          }]);
          setConversation([...newConversation, { 
            role: 'assistant', 
            content: fallbackMessage 
          }]);
        }
      } else {
        setMessages([...newMessages, { role: 'assistant', content: response }]);
        setConversation([...newConversation, { role: 'assistant', content: response }]);
      }
    } catch (error) {
      console.error("Error in conversation:", error);
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: "סליחה, הייתה שגיאה. בואו ננסה שוב... ספר לי בבקשה, מה הדבר הכי חשוב לך במסע הרוחני?" 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const finalizeTrack = async () => {
    if (!user || !generatedTrack) return;
    
    setIsLoading(true);
    try {
      // יצירת CustomTrack חדש
      const customTrack = await CustomTrack.create({
        userId: user.id,
        track_name: generatedTrack.track_name,
        responses: { conversation_summary: generatedTrack.summary },
        generated_stages: generatedTrack.stages,
        is_active: true
      });

      // עדכון המשתמש
      await User.updateMyUserData({
        custom_track_id: customTrack.id,
        onboarding_completed: true
      });

      onTrackCompleted();
    } catch (error) {
      console.error("Error creating track:", error);
      alert("אירעה שגיאה ביצירת המסלול. נסה שוב.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCancelAndGoBack = async () => {
    setIsCancelling(true);
    try {
        // איפוס מלא של כל נתוני המסלול המותאם
        await User.updateMyUserData({ 
          track: null,
          onboarding_completed: false,
          custom_track_id: null,
          current_stage: 1
        });
        
        // רענון הדף כדי לחזור למסך בחירת המסלול
        window.location.reload();
        
    } catch (error) {
        console.error("Error cancelling track selection:", error);
        alert("אירעה שגיאה. אנא נסה לרענן את הדף.");
        setIsCancelling(false); // Make sure to reset loading state on error
    }
  };

  if (trackGenerated && generatedTrack) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 p-4" dir="rtl">
        <div className="max-w-6xl mx-auto">
          <Card className="bg-white shadow-lg">
            <CardHeader className="text-center bg-gradient-to-r from-purple-100 to-blue-100 rounded-t-lg">
              <Sparkles className="w-16 h-16 mx-auto text-purple-600 mb-4" />
              <CardTitle className="text-3xl font-bold text-gray-800 mb-2">המסלול שלך מוכן! 🎉</CardTitle>
              <h2 className="text-2xl font-bold text-purple-800 mb-2">{generatedTrack.track_name}</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">{generatedTrack.summary}</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">שלבי המסלול שלך:</h3>
                <div className="grid gap-6">
                  {generatedTrack.stages.map((stage, index) => (
                    <Card key={index} className="border-2 border-purple-200 hover:border-purple-300 transition-colors">
                      <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-t-lg">
                        <CardTitle className="text-xl font-bold text-purple-800">
                          שלב {stage.stage_number}: {stage.stage_name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2">תיאור השלב:</h4>
                          <p className="text-gray-600 leading-relaxed">{stage.description}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2">חומר לימוד:</h4>
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <ReactMarkdown className="prose prose-sm max-w-none">
                              {stage.learning_material}
                            </ReactMarkdown>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2">משימות יומיות:</h4>
                          <ul className="space-y-2">
                            {stage.daily_tasks.map((task, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                                <span className="text-gray-700">{task}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2">מדדי הצלחה:</h4>
                          <div className="bg-green-50 p-4 rounded-lg">
                            <ReactMarkdown className="prose prose-sm max-w-none">
                              {stage.success_metrics}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={finalizeTrack} 
                  disabled={isLoading}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin ml-2" /> : <Sparkles className="w-5 h-5 ml-2" />}
                  מעולה! בואו נתחיל את המסע
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => {
                    setTrackGenerated(false);
                    setGeneratedTrack(null);
                    setMessages([...messages, { 
                      role: 'assistant', 
                      content: "בסדר, בואו נשנה משהו במסלול. מה היית רוצה להתאים?" 
                    }]);
                  }}
                  className="border-purple-600 text-purple-600 hover:bg-purple-50 px-8 py-4 text-lg"
                >
                  אני רוצה לשנות משהו
                </Button>
              </div>

              <div className="mt-8 text-center">
                 <Button 
                    variant="link" 
                    onClick={handleCancelAndGoBack}
                    disabled={isLoading || isCancelling}
                    className="text-gray-500 hover:text-gray-700"
                >
                    {isCancelling ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : null}
                    לא, אני רוצה לבחור מסלול אחר לגמרי
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 p-4" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white shadow-lg h-[90vh] flex flex-col">
          <CardHeader className="text-center bg-gradient-to-r from-purple-100 to-blue-100 rounded-t-lg">
            <Bot className="w-12 h-12 mx-auto text-purple-600 mb-4" />
            <CardTitle className="text-2xl font-bold text-gray-800">בואו נבנה יחד את המסלול שלך</CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-6 overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-6 mb-6">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-5 h-5 text-purple-600" />
                    </div>
                  )}
                  <div className={`max-w-[80%] p-4 rounded-xl shadow-sm ${
                    message.role === 'user' 
                      ? 'bg-purple-600 text-white ml-auto'
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
                <div className="flex justify-start gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="bg-gray-100 p-4 rounded-xl">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex gap-3">
              <Textarea
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="כתוב את התשובה שלך..."
                className="flex-1 min-h-[80px] max-h-[120px] resize-none border-purple-200 focus:border-purple-400"
                disabled={isLoading}
              />
              <Button 
                onClick={sendMessage} 
                disabled={isLoading || !currentMessage.trim()}
                className="bg-purple-600 hover:bg-purple-700 px-6 self-end"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
           <CardFooter className="p-4 border-t bg-gray-50 flex justify-center">
              <Button 
                  variant="ghost" 
                  onClick={handleCancelAndGoBack}
                  disabled={isLoading || isCancelling}
                  className="text-gray-600 hover:text-gray-800"
              >
                  {isCancelling ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <ArrowLeft className="w-4 h-4 ml-2" />}
                  חזור ובחר מסלול אחר
              </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
