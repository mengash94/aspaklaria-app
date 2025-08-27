
import React, { useEffect, useState } from "react";
import { PersonalJournal } from "@/api/entities";
import { User } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, FileText, Wand2, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function PersonalJournalTab() {
  const [user, setUser] = useState(null);
  const [entries, setEntries] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ title: "", content: "" });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState("");

  useEffect(() => {
    const load = async () => {
      const me = await User.me();
      setUser(me);
      const list = await PersonalJournal.filter({ created_by: me.email }, "-created_date");
      setEntries(list);
    };
    load();
  }, []);

  const resetForm = () => {
    setSelected(null);
    setForm({ title: "", content: "" });
    setAiResult("");
  };

  const createOrUpdate = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    if (selected) {
      await PersonalJournal.update(selected.id, { title: form.title, content: form.content });
    } else {
      await PersonalJournal.create({
        userId: user.id,
        createdAt: new Date().toISOString(),
        title: form.title,
        content: form.content
      });
    }
    const list = await PersonalJournal.filter({ created_by: user.email }, "-created_date");
    setEntries(list);
    setSaving(false);
    if (!selected) resetForm();
  };

  const deleteEntry = async () => {
    if (!selected || !user) return;
    
    const confirmDelete = window.confirm(`האם אתה בטוח שברצונך למחוק את הרשומה "${selected.title || 'ללא כותרת'}"?`);
    if (!confirmDelete) return;

    setDeleting(true);
    try {
      await PersonalJournal.delete(selected.id);
      const list = await PersonalJournal.filter({ created_by: user.email }, "-created_date");
      setEntries(list);
      resetForm();
    } catch (error) {
      console.error("Error deleting entry:", error);
      alert("אירעה שגיאה במחיקת הרשומה. נסה שוב.");
    } finally {
      setDeleting(false);
    }
  };

  const selectEntry = (entry) => {
    setSelected(entry);
    setForm({ title: entry.title || "", content: entry.content || "" });
    setAiResult("");
  };

  const runAI = async () => {
    if (!form.content?.trim()) return;
    setAiLoading(true);
    setAiResult("");
    const prompt = `
**משימתך:** אתה עוזר רוחני אישי, חם ומכיל.
**כללי התנהגות מחייבים:**
- **שפה:** השב תמיד בעברית בלבד.
- **טון:** השתמש תמיד בגוף שני (פנייה אישית: "אתה", "שלך"). הטון חייב להיות חם, מעודד ולא שיפוטי.
- **מיקוד:** תגובתך תתמקד אך ורק בניתוח וסיכום של רגשות, תובנות ודפוסים מתוך היומן האישי. סרב בנימוס לענות על כל שאלה שחורגת מתחום זה.

**המשימה הנוכחית:**
קבל את הטקסט הבא מתוך יומן אישי של משתמש. נתח וסכם אותו עבור המשתמש:
- סכם עבורו ב-3-5 נקודות מפתח מה הוא כתב.
- זהה עבורו רגשות מרכזיים ודפוסים חוזרים אם קיימים.
- הצע לו תובנה קצרה ושאל אותו שאלה אחת להתבוננות נוספת.

הטקסט לניתוח:
"${form.content}"

**הפלט הנדרש:**
ענה בעברית ובפורמט Markdown.`;
    const res = await InvokeLLM({ prompt });
    setAiResult(res);
    setAiLoading(false);
  };

  return (
    <div className="grid md:grid-cols-3 gap-4 md:gap-6" dir="rtl" style={{ fontFamily: 'Alegreya, serif' }}>
      <Card className="md:col-span-1 bg-blue-50 border-blue-200 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800"><FileText className="w-5 h-5" />יומן אישי</CardTitle>
          <CardDescription className="text-blue-600">בחר רשומה לצפייה/עריכה או צור חדשה</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col flex-grow">
          <Button className="w-full mb-3 bg-blue-600 hover:bg-blue-700" onClick={resetForm}>רשומה חדשה</Button>
          <Separator className="mb-3 bg-blue-200" />
          <div className="space-y-2 flex-grow overflow-auto pr-1">
            {entries.map((e) => (
              <button key={e.id} onClick={() => selectEntry(e)} className={`w-full text-right p-3 rounded-lg border ${selected?.id===e.id ? "border-blue-400 bg-blue-100" : "border-blue-200 hover:bg-blue-50"}`}>
                <div className="text-xs text-blue-500">{new Date(e.created_date).toLocaleString()}</div>
                <div className="font-semibold text-blue-800 line-clamp-1">{e.title || "ללא כותרת"}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 bg-white border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">{selected ? "עריכת רשומה" : "רשומה חדשה"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={createOrUpdate} className="space-y-4">
            <Input placeholder="כותרת (אופציונלי)" value={form.title} onChange={(e)=>setForm({...form, title:e.target.value})} className="border-blue-200 focus:border-blue-400" />
            <Textarea placeholder="כתוב/י את המחשבות והרגשות שלך..." className="min-h-[220px] border-blue-200 focus:border-blue-400" value={form.content} onChange={(e)=>setForm({...form, content:e.target.value})} />
            <div className="flex gap-3 justify-between">
              <div className="flex gap-3">
                <Button type="submit" disabled={saving || !form.content.trim()} className="bg-blue-600 hover:bg-blue-700">
                  {saving && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}שמירה
                </Button>
                {selected && (
                  <Button type="button" variant="outline" onClick={runAI} disabled={aiLoading || !form.content.trim()} className="border-blue-500 text-blue-600 hover:bg-blue-50">
                    {aiLoading ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Wand2 className="w-4 h-4 ml-2" />}
                    קבל תובנה (AI)
                  </Button>
                )}
              </div>
              {selected && (
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={deleteEntry} 
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {deleting ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Trash2 className="w-4 h-4 ml-2" />}
                  מחק
                </Button>
              )}
            </div>
          </form>

          {aiResult && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <ReactMarkdown className="prose prose-blue max-w-none">{aiResult}</ReactMarkdown>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
