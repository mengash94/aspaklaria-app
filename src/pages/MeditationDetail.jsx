
import React, { useEffect, useState } from "react";
import { Meditation } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowRight, Headphones } from "lucide-react"; 
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { CompletedMeditation } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function MeditationDetail() {
  const [meditation, setMeditation] = useState(null);
  const [user, setUser] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      const list = await Meditation.list();
      const found = list.find(m => String(m.id) === String(id));
      setMeditation(found || null);

      try {
        const me = await User.me();
        setUser(me);
        if (me && found) {
          // RLS מבטיח שנקבל רק את הביצועים של המשתמש הנוכחי
          const doneList = await CompletedMeditation.filter({ meditationId: String(found.id) });
          if (Array.isArray(doneList) && doneList.length > 0) {
            setIsCompleted(true);
          }
        }
      } catch (e) {
        // משתמש לא מחובר - נתעלם מהחיווי
        // console.error("User not logged in or error fetching user:", e); // Optional: for debugging
      }
    };
    load();
  }, []);

  const markCompleted = async () => {
    if (!user || !meditation || isCompleted || saving) return;
    setSaving(true);
    try {
      await CompletedMeditation.create({
        userId: user.id,
        meditationId: String(meditation.id),
        meditationTitle: meditation.title,
        completedAt: new Date().toISOString()
      });
      setIsCompleted(true);
    } catch (error) {
      console.error("Failed to mark meditation as completed:", error);
      // Optionally, add user feedback for the error
    } finally {
      setSaving(false);
    }
  };

  if (!meditation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        טוען תרגיל...
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-8" dir="rtl" style={{ fontFamily: 'Alegreya, serif' }}>
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8 pb-4 border-b">
          <div className="flex items-center gap-4">
            <Headphones className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">{meditation.title}</h1>
          </div>
          <Link to={createPageUrl('Home')}>
            <Button 
              variant="outline"
              onClick={() => {
                // נווט לדף הבית עם הלשונית מדיטציות
                window.location.href = createPageUrl('Home') + '?tab=meditations';
              }}
            >
              <ArrowRight className="ml-2 h-4 w-4" />
              חזור למדיטציות
            </Button>
          </Link>
        </header>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-blue-800">{meditation.level} • {meditation.duration}</CardTitle>
            {meditation.source && <CardDescription>{meditation.source}</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* כפתור סימון כבוצע */}
            <div className="flex justify-end">
              {isCompleted ? (
                <Button disabled className="bg-green-600 hover:bg-green-600">
                  <CheckCircle2 className="w-4 h-4 ml-2" />
                  בוצע!
                </Button>
              ) : (
                <Button onClick={markCompleted} disabled={saving || !user} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle2 className="w-4 h-4 ml-2" />
                  {saving ? "שומר..." : "סמן כבוצע"}
                </Button>
              )}
            </div>

            <section>
              <h3 className="font-semibold mb-1">תיאור</h3>
              <p className="text-gray-700">{meditation.description}</p>
            </section>
            <section>
              <h3 className="font-semibold mb-1">הוראות לביצוע</h3>
              <pre className="whitespace-pre-wrap text-gray-800 bg-gray-50 p-3 rounded-md border">{meditation.instructions}</pre>
            </section>
            {meditation.recommended_for && (
              <section>
                <h3 className="font-semibold mb-1">מומלץ עבור</h3>
                <p className="text-gray-700">{meditation.recommended_for}</p>
              </section>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
