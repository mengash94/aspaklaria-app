import React, { useState } from 'react';
import { Submission } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Compass, Loader2 } from 'lucide-react';

const questions = [
    // קשר עם הבורא
    "באיזו מידה אתה מרגיש בדרך כלל שהתפילה שלך היא שיחה אישית עם הבורא?", // 0
    "כשאתה מתפלל, באיזו מידה אתה מצליח להרגיש שאתה עומד בפני נוכחות אלוקית?", // 1
    "באיזו תדירות אתה פונה לבורא במילים משלך, מחוץ למסגרת התפילה הרשמית?", // 2
    "כשאתה לומד תורה, באיזו מידה אתה מרגיש שהלימוד נותן לך כוח ועצה מעשית לחיים?", // 3
    "כשאתה נתקל באתגר, באיזו מידה אתה מרגיש שיש מי שמשגיח עליך והכל מכוון לטובה?", // 4
    "באיזו מידה אתה מצליח להכיר תודה לבורא על הדברים הטובים בחייך, גם הקטנים ביותר?", // 5
    "האם אתה מרגיש נוכחות אלוקית ברגעים פשוטים של החיים?", // 6
    // עבודת המידות
    "כשעולה בך רגש שלילי, באיזו מידה אתה מצליח לזהות אותו ולא לתת לו לנהל אותך?", // 7
    "באיזו מידה אתה נוהג בסבלנות כלפי עצמך וכלפי אחרים בחיי היום-יום?", // 8
    "באיזו מידה אתה מצליח לשפוט אנשים או מצבים לכף זכות?", // 9
    "באיזו מידה אתה חווה שמחה פנימית שאינה תלויה בהכרח בנסיבות חיצוניות?", // 10
    // בין אדם לחברו
    "האם אתה מחפש באופן פעיל הזדמנויות לעזור לאחרים במעשה או במילה טובה?", // 11
    "כשאתה עושה חסד, באיזו מידה אתה מרגיש שאתה שותף של הבורא בתיקון העולם?", // 12
    "באיזו מידה אתה מקפיד על דיבור נקי, ללא רכילות או לשון הרע?", // 13
    // יכולות רוחניות
    "באיזו מידה אתה שם לב ל\"צירופי מקרים\" או סימנים קטנים בחייך שמרגישים מכוונים מלמעלה?", // 14
    "באיזו מידה אתה סומך על ה\"אינטואיציה\" שלך בקבלת החלטות?", // 15
    "האם אתה חווה רגעים של השראה או בהירות, שבהם אתה מבין משהו עמוק על עצמך?", // 16
    "באיזו מידה אתה מצליח לראות את הטוב הפנימי והניצוץ האלוקי באנשים אחרים?", // 17
    // תורה ומצוות
    "באיזו תדירות אתה קובע עתים לתורה (מפנה זמן מסודר וקבוע ללימוד)?", // 18
    "איך היית מדרג את רמת הידע הכללי שלך בנושאי יסוד ביהדות?", // 19
    "באיזו מידה אתה מקפיד על שלוש התפילות ביום (שחרית, מנחה, ערבית)?", // 20
    "איך היית מתאר את רמת שמירת השבת שלך?", // 21
    "איך היית מתאר את רמת שמירת הכשרות שלך?", // 22
];

const Intro = ({ onStart }) => (
    <div className="max-w-3xl mx-auto text-center p-4">
        <Compass className="mx-auto h-16 w-16 text-blue-600 mb-6" />
        <h1 className="text-4xl font-bold text-gray-800 mb-4">ברוך הבא למצפן הנשמה,</h1>
        <div className="text-lg text-gray-600 space-y-4 leading-relaxed">
            <p>השאלון שלפניך אינו מבחן עם ציונים, אלא כלי להתבוננות פנימית – מראה אישית לנפש.</p>
            <p>מטרתו היא לעזור לך להבין איפה אתה נמצא כעת במסע הרוחני האישי שלך, לזהות את נקודות החוזק המיוחדות לך ולגלות הזדמנויות לצמיחה והתפתחות.</p>
            <p>אין כאן תשובות 'נכונות' או 'לא נכונות', רק תשובות כנות. ענה מהלב, ללא שיפוטיות.</p>
            <p className="font-semibold">המסע שלך הוא ייחודי, והמצפן הזה נועד להאיר לך את הצעד הבא בדרך.</p>
        </div>
        <Button onClick={onStart} className="mt-8 text-xl px-10 py-6 bg-blue-600 hover:bg-blue-700">התחל בשאלון</Button>
    </div>
);

export default function Questionnaire({ onSubmissionSuccess }) {
  const [answers, setAnswers] = useState(Array(questions.length).fill(5));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  const handleAnswerChange = (index, value) => {
    const newAnswers = [...answers];
    newAnswers[index] = value[0];
    setAnswers(newAnswers);
  };
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    const avg = (arr) => arr.reduce((acc, v) => acc + v, 0) / arr.length;
    const scores = {
        creator_connection: avg(answers.slice(0, 7)),
        character_work: avg(answers.slice(7, 11)),
        social_impact: avg(answers.slice(11, 14)),
        spiritual_abilities: avg(answers.slice(14, 18)),
        torah_mitzvot: avg(answers.slice(18, 23)),
        overall: avg(answers)
    };

    let archetype;
    if (scores.overall <= 3.5) archetype = "המגשש";
    else if (scores.overall <= 6.0) archetype = "הצועד בדרך";
    else if (scores.overall <= 8.0) archetype = "המתבונן";
    else archetype = "המשפיע";

    try {
      await Submission.create({ answers, scores, archetype });
      onSubmissionSuccess();
    } catch (error) {
      console.error("Failed to save submission:", error);
      setIsSubmitting(false);
    }
  };

  if (showIntro) {
      return <div className="flex items-center justify-center min-h-[70vh]"><Intro onStart={() => setShowIntro(false)} /></div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto" dir="rtl">
      <Card className="shadow-xl rounded-2xl">
        <CardHeader className="text-center bg-gray-50 rounded-t-2xl p-6">
          <CardTitle className="text-3xl font-bold">שאלון מצפן הנשמה</CardTitle>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-8">
          {questions.map((q, index) => (
            <div key={index} className="space-y-3">
              <label className="text-lg font-medium">{index + 1}. {q}</label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[answers[index]]}
                  onValueChange={(value) => handleAnswerChange(index, value)}
                  min={1} max={10} step={1}
                  className="flex-grow"
                />
                <span className="w-10 text-center font-bold text-lg text-blue-600">{answers[index]}</span>
              </div>
            </div>
          ))}
          <div className="pt-6 flex justify-center">
            <Button onClick={handleSubmit} disabled={isSubmitting} className="text-xl px-12 py-7 bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? <Loader2 className="animate-spin" /> : "שלח וגלה את התוצאות"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}