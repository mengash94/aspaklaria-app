
import React, { useState } from 'react';
import { InvokeLLM } from '@/api/integrations';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function AiReflectionsTab({ entries, currentStageData, user }) {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!currentStageData || !user) {
    return <div className="text-center p-8">טוען נתונים...</div>;
  }

  const generateReflection = async (customPrompt = '') => {
    setIsLoading(true);
    setResponse('');
    
    const contextEntries = (entries || []).slice(0, 5); // Use last 5 entries for context
    
    const fullPrompt = `
      **משימתך:** אתה מאמן רוחני אישי, חם ומעורר השראה.
      **כללי התנהגות מחייבים:**
      - **שפה:** השב תמיד בעברית בלבד.
      - **טון:** השתמש תמיד בגוף שני (פנייה אישית: "אתה", "שלך"). הטון חייב להיות חם, מעודד ומכיל.
      - **מיקוד:** תגובתך תתמקד אך ורק בהתקדמות הרוחנית של המשתמש בהתבסס על נתוני האפליקציה (שלבים, יומנים וכו'). סרב בנימוס לענות על כל שאלה שאינה קשורה להתפתחותו הרוחנית האישית.

      **הקשר:**
      אני משתמש באפליקציה להתפתחות רוחנית. אני כרגע בשלב ${currentStageData.stage_number}: "${currentStageData.stage_name}".
      תיאור השלב: ${currentStageData.description}.
      המסלול שלי הוא "${user.track || 'לא מוגדר'}".
      הנה 5 הרישומים האחרונים שלי מהיומן: ${JSON.stringify(contextEntries, null, 2)}.

      **המשימה הנוכחית:**
      כתוב לי הרהור או תובנה מעמיקה. אם סיפקתי שאלה ספציפית, ענה עליה בהקשר הנתון.
      השאלה שלי: "${customPrompt || 'תן לי תובנה כללית על ההתקדמות שלי'}"

      **הנחיות לתשובה:**
      - התייחס לנתונים הספציפיים מהרישומים (למשל, "שמתי לב שבכתיבה שלך אתה מצליח במיוחד ב...").
      - קשר את התובנה לשלב הנוכחי במסע שלך.
      - ספק עצה מעשית קטנה או שאלה למחשבה להמשך.
      - השתמש ב-Markdown לעיצוב.
    `;

    try {
      const res = await InvokeLLM({ prompt: fullPrompt });
      setResponse(res);
    } catch (error) {
      console.error(error);
      setResponse('שגיאה ביצירת ההרהור. נסה שוב מאוחר יותר.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePromptSubmit = (e) => {
      e.preventDefault();
      generateReflection(prompt);
  }

  return (
    <div className="p-2 md:p-4 lg:p-6 space-y-6 md:space-y-8" style={{ fontFamily: 'Alegreya, serif' }}>
       <Card className="bg-white shadow-lg rounded-xl">
        <CardHeader className="text-center">
            <Wand2 className="w-10 h-10 md:w-12 md:h-12 mx-auto text-blue-500 mb-4" />
          <CardTitle className="text-xl md:text-2xl lg:text-3xl text-blue-800 px-4">הרהורים בעזרת בינה מלאכותית</CardTitle>
          <CardDescription className="text-sm md:text-base lg:text-lg text-gray-600 px-4">קבל תובנות מותאמות אישית על המסע שלך</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handlePromptSubmit} className="space-y-4">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="שאל שאלה או בקש תובנה ספציפית... (אופציונלי)"
              className="min-h-[80px] md:min-h-[100px] text-sm md:text-base"
            />
            <div className="flex flex-col sm:flex-row gap-4">
                 <Button type="submit" disabled={isLoading} className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 md:py-3">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    <span className="text-sm md:text-base">
                      {prompt ? 'שאל וקבל תובנה' : 'קבל תובנה כללית'}
                    </span>
                </Button>
            </div>
          </form>

          {isLoading && (
            <div className="text-center p-6 md:p-8">
              <Loader2 className="w-6 h-6 md:w-8 md:h-8 mx-auto animate-spin text-blue-500" />
              <p className="mt-4 text-gray-600 text-sm md:text-base px-4">הבינה המלאכותית חושבת... זה עשוי לקחת מספר רגעים.</p>
            </div>
          )}

          {response && !isLoading && (
            <div className="p-4 md:p-6 bg-blue-50 rounded-lg border border-blue-200">
                <ReactMarkdown className="prose prose-sm md:prose-lg max-w-none text-gray-800">
                    {response}
                </ReactMarkdown>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
