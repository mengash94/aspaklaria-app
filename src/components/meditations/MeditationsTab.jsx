
import React, { useEffect, useMemo, useState } from "react";
import { Meditation } from "@/api/entities";
import { UserTrainingPath } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Headphones, Clock, BookOpen, Plus, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import CreateMeditationForm from "./CreateMeditationForm";

export default function MeditationsTab({ onPathUpdate }) {
  const [level, setLevel] = useState("all");
  const [meditations, setMeditations] = useState([]);
  const [user, setUser] = useState(null);
  const [trainingPath, setTrainingPath] = useState(null);
  const [isLoading, setIsLoading] = useState({});
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);

  const loadData = async () => {
    const me = await User.me().catch(() => null);
    setUser(me);

    // Fetch meditations, sorted by creation date descending
    const list = await Meditation.list('-created_date');
    setMeditations(Array.isArray(list) ? list : []);

    if (me) {
      const paths = await UserTrainingPath.filter({ userId: me.id });
      if (paths && paths.length > 0) {
        setTrainingPath(paths[0]);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddToPath = async (meditationId) => {
    if (!user) return;
    setIsLoading(prev => ({ ...prev, [meditationId]: true }));
    try {
      if (trainingPath) {
        // Update existing path
        const newIds = [...new Set([...trainingPath.meditationIds, meditationId])];
        const updatedPath = await UserTrainingPath.update(trainingPath.id, { meditationIds: newIds });
        setTrainingPath(updatedPath);
      } else {
        // Create new path
        const newPath = await UserTrainingPath.create({
          userId: user.id,
          meditationIds: [meditationId],
          lastCompletedIndex: -1
        });
        setTrainingPath(newPath);
      }
      if (onPathUpdate) onPathUpdate();
    } catch (error) {
      console.error("Failed to add to path:", error);
    } finally {
      setIsLoading(prev => ({ ...prev, [meditationId]: false }));
    }
  };

  const filtered = useMemo(() => {
    return meditations.filter(m => level === "all" || m.level === level);
  }, [meditations, level]);

  const pathIds = useMemo(() => new Set(trainingPath?.meditationIds || []), [trainingPath]);

  return (
    <div className="space-y-4" dir="rtl" style={{ fontFamily: 'Alegreya, serif' }}>
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800"><Headphones className="w-5 h-5" />ספריית אימונים</CardTitle>
          <CardDescription>בחר תרגילים והוסף למסלול האישי שלך, או צור תרגיל חדש.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4 items-center">
            <span className="text-sm text-gray-600">סנן לפי רמה:</span>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="w-40"><SelectValue placeholder="בחר רמה" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">הכל</SelectItem>
                <SelectItem value="מתחיל">מתחיל</SelectItem>
                <SelectItem value="בינוני">בינוני</SelectItem>
                <SelectItem value="מתקדם">מתקדם</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setIsCreateFormOpen(true)}>
            <Plus className="w-4 h-4 ml-2" />
            צור תרגיל אישי
          </Button>
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(m => {
          const isInPath = pathIds.has(m.id);
          return (
            <Card 
              key={m.id} 
              className={`bg-white hover:shadow-lg transition flex flex-col ${m.is_custom ? 'border-2 border-purple-300' : ''}`}
            >
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{m.title}</span>
                  {m.is_custom && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">אישי</span>}
                </CardTitle>
                <CardDescription className="flex gap-3 text-xs">
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700">{m.level}</span>
                  <span className="flex items-center gap-1 text-gray-600"><Clock className="w-3 h-3" />{m.duration}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 flex-grow">
                <p className="text-sm text-gray-700 line-clamp-3">{m.description}</p>
              </CardContent>
              <div className="p-4 pt-0 mt-auto flex gap-2">
                <Link to={createPageUrl(`PracticeSession?meditationId=${m.id}`)} className="flex-1">
                  <Button variant="outline" className="w-full">
                    <BookOpen className="w-4 h-4 ml-2" />
                    התחל תרגול
                  </Button>
                </Link>
                <Button 
                  onClick={() => handleAddToPath(m.id)}
                  disabled={isInPath || isLoading[m.id]}
                  className={`w-auto ${isInPath ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {isInPath ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
      <CreateMeditationForm 
        isOpen={isCreateFormOpen}
        onClose={() => setIsCreateFormOpen(false)}
        onSuccess={() => {
          loadData();
          if(onPathUpdate) onPathUpdate();
        }}
      />
    </div>
  );
}
