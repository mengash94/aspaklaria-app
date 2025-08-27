import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { format } from "date-fns";
import { he } from "date-fns/locale";

const archetypes = {
    "המגשש": {
        description: "אתה בתחילת הדרך, מלא ברצון כן להתקרב ובשאלות טובות...",
        recommendations: [
            "יעד יומי קטן: נסה כל יום להגיד 'תודה' מכל הלב לבורא על דבר אחד ספציפי.",
            "צעד ראשון במעשה: בחר מצווה אחת קטנה שאתה עוד לא מקיים (למשל, נטילת ידיים בבוקר) ונסה להתמיד בה השבוע.",
            "טעימה של לימוד: הקשב פעם בשבוע לשיעור תורה קצר (5-10 דקות) שמעניין אותך."
        ]
    },
    "הצועד בדרך": {
        description: "אימצת לעצמך הרגלים רוחניים ואתה צועד בעקביות. האתגר שלך כעת הוא להעמיק את החוויה...",
        recommendations: [
            "העמקת הכוונה: בחר משפט אחד בתפילה שאתה אוהב במיוחד, והתמקד השבוע רק בו.",
            "קביעות בלימוד: אם אתה עוד לא לומד באופן קבוע, קבע לעצמך זמן של 15 דקות, פעמיים בשבוע. אם אתה כבר לומד, נסה להוסיף עוד 10 דקות לזמן הקיים.",
            "חסד עם נשמה: כשאתה עושה חסד, עשה זאת עם חיוך ומחשבה טובה..."
        ]
    },
    "המתבונן": {
        description: "אתה מתחיל לראות את החיבורים הנסתרים... אתה מזהה יותר השגחה פרטית...",
        recommendations: [
            "יומן השגחה פרטית: רשום כל יום 1-2 \"צירופי מקרים\" או דברים מדויקים שקרו לך...",
            "לימוד לעומק: בחר נושא אחד ביהדות שמרתק אותך (למשל, משמעות החגים, פרקי אבות) והקדש לו זמן לימוד מעמיק יותר פעם בשבוע.",
            "מצווה מתוך הבנה: בחר מצווה שאתה מקיים באופן אוטומטי, ולמד השבוע על המשמעות הפנימית והעמוקה שלה. נסה לקיים אותה עם הכוונה החדשה."
        ]
    },
    "המשפיע": {
        description: "הרוחניות הפכה לחלק טבעי ובלתי נפרד ממך... המשימה שלך היא להרחיב את מעגלי ההשפעה...",
        recommendations: [
            "חסד בסתר: חפש דרך להשפיע טוב על מישהו מבלי שהוא יידע שזה ממך...",
            "שתף מהידע שלך: מצא דרך ללמד משהו שלמדת - אפילו תובנה קטנה מפרשת השבוע - לחבר, לבן משפחה או בקבוצה קטנה.",
            "היה עין טובה: באופן אקטיבי, חפש את הנקודות הטובות באנשים סביבך ושקף להם אותן..."
        ]
    }
};
const categoryLabels = {
    creator_connection: "קשר עם הבורא",
    character_work: "עבודת המידות",
    social_impact: "בין אדם לחברו",
    spiritual_abilities: "יכולות רוחניות",
    torah_mitzvot: "תורה ומצוות"
};

const ScoreDisplay = ({ scores }) => (
    <Card>
        <CardHeader><CardTitle>הפרופיל הרוחני שלך</CardTitle></CardHeader>
        <CardContent className="space-y-4">
            {Object.entries(scores).filter(([key]) => key !== 'overall' && categoryLabels[key]).map(([key, value]) => (
                <div key={key}>
                    <div className="flex justify-between mb-1">
                        <span className="font-medium">{categoryLabels[key]}</span>
                        <span className="font-bold text-blue-600">{value.toFixed(1)}</span>
                    </div>
                    <Progress value={value * 10} />
                </div>
            ))}
             <div className="pt-4">
                <div className="flex justify-between mb-1 text-lg">
                    <span className="font-bold">ציון כללי</span>
                    <span className="font-extrabold text-blue-700">{scores.overall.toFixed(1)}</span>
                </div>
                <Progress value={scores.overall * 10} className="h-3" />
            </div>
        </CardContent>
    </Card>
);

const ArchetypeDisplay = ({ archetype }) => {
    const data = archetypes[archetype];
    if (!data) return null;
    return (
        <Card>
            <CardHeader>
                <CardTitle>הארכיטיפ הרוחני שלך: {archetype}</CardTitle>
                <CardDescription className="pt-2">{data.description}</CardDescription>
            </CardHeader>
            <CardContent>
                <h3 className="font-bold mb-3">המלצות לצמיחה:</h3>
                <ul className="list-disc pr-5 space-y-2">
                    {data.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                </ul>
            </CardContent>
        </Card>
    );
};

const HistoryChart = ({ submissions }) => {
    const data = submissions.map(s => ({
        name: format(new Date(s.created_date), 'd MMM', { locale: he }),
        'ציון כללי': s.scores.overall,
    })).reverse();

    return (
        <Card>
            <CardHeader><CardTitle>התקדמות לאורך זמן</CardTitle></CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[1, 10]} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="ציון כללי" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}

export default function ResultsDashboard({ submissions, onNewTest }) {
    const latestSubmission = submissions[0];
    
    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto" dir="rtl">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold">תוצאות מצפן הנשמה</h1>
                <p className="text-lg text-gray-600 mt-2">
                    תאריך הבדיקה: {format(new Date(latestSubmission.created_date), 'd MMMM yyyy', { locale: he })}
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <ScoreDisplay scores={latestSubmission.scores} />
                <ArchetypeDisplay archetype={latestSubmission.archetype} />
            </div>
            
            {submissions.length > 1 && (
                 <div className="my-8">
                    <HistoryChart submissions={submissions} />
                </div>
            )}
            
            <div className="mt-8 text-center">
                <Button onClick={onNewTest} className="text-lg px-8 py-5">בצע שאלון חדש</Button>
            </div>
        </div>
    );
}