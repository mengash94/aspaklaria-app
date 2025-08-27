
import React, { useEffect, useState, useMemo } from "react";
import { Meditation } from "@/api/entities";
import { UserTrainingPath } from "@/api/entities";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, Clock, Lock, Play, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const LevelCard = ({ title, meditations, lastCompletedIndex, pathIds }) => {
  if (meditations.length === 0) return null;

  return (
    <div>
      <h2 className="text-xl font-bold text-blue-800 mb-4 border-r-4 border-blue-500 pr-3">{title}</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {meditations.map(m => {
          const pathIndex = pathIds.indexOf(m.id);
          const isLocked = !m.is_custom && pathIndex > lastCompletedIndex + 1;
          const isNext = pathIndex === lastCompletedIndex + 1;

          return (
            <Card key={m.id} className={`bg-white hover:shadow-lg transition flex flex-col ${isLocked ? 'opacity-50' : ''} ${m.is_custom ? 'border-2 border-purple-300' : ''}`}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                    <span>{m.title}</span>
                    {m.is_custom && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">אישי</span>}
                </CardTitle>
                <CardDescription className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-gray-600"><Clock className="w-3 h-3" />{m.duration}</span>
                  {isNext && <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 font-bold">הבא בתור</span>}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 flex-grow">
                <p className="text-sm text-gray-700 line-clamp-4">{m.description}</p>
              </CardContent>
              <div className="p-4 pt-0 mt-auto">
                <Link to={createPageUrl(`PracticeSession?meditationId=${m.id}`)} className={isLocked ? 'pointer-events-none' : ''}>
                  <Button 
                    className="w-full" 
                    disabled={isLocked}
                  >
                    {isLocked ? <Lock className="w-4 h-4 ml-2" /> : <Play className="w-4 h-4 ml-2" />}
                    {isLocked ? "נעול" : "התחל תרגול"}
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default function MyTrainingPathTab() {
  const [user, setUser] = useState(null);
  const [trainingPath, setTrainingPath] = useState(null);
  const [allMeditations, setAllMeditations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const me = await User.me();
        setUser(me);

        const [meditationsList, paths] = await Promise.all([
          Meditation.list(),
          UserTrainingPath.filter({ userId: me.id })
        ]);
        
        setAllMeditations(Array.isArray(meditationsList) ? meditationsList : []);
        if (paths && paths.length > 0) {
          setTrainingPath(paths[0]);
        }
      } catch (error) {
        console.error("Failed to load training path data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const { pathMeditations, pathIds } = useMemo(() => {
    if (!trainingPath || allMeditations.length === 0) {
      return { pathMeditations: [], pathIds: [] };
    }
    const meditationMap = new Map(allMeditations.map(m => [m.id, m]));
    const meditations = trainingPath.meditationIds
      .map(id => meditationMap.get(id))
      .filter(Boolean); // Filter out any undefined meditations
    return { pathMeditations: meditations, pathIds: trainingPath.meditationIds };
  }, [trainingPath, allMeditations]);

  if (isLoading) {
    return <div className="text-center p-8">טוען את מסלול התרגולים שלך...</div>;
  }

  if (!trainingPath || pathMeditations.length === 0) {
    return (
      <div className="text-center p-8 space-y-4">
        <h2 className="text-2xl font-bold">המסלול שלך עדיין ריק!</h2>
        <p className="text-gray-600">עבור ללשונית "ספריית אימונים" כדי לבחור תרגילים ולהוסיף אותם למסלול האישי שלך.</p>
      </div>
    );
  }

  const groupedMeditations = {
    "מתחיל": pathMeditations.filter(m => m.level === 'מתחיל').sort((a,b) => pathIds.indexOf(a.id) - pathIds.indexOf(b.id)),
    "בינוני": pathMeditations.filter(m => m.level === 'בינוני').sort((a,b) => pathIds.indexOf(a.id) - pathIds.indexOf(b.id)),
    "מתקדם": pathMeditations.filter(m => m.level === 'מתקדם').sort((a,b) => pathIds.indexOf(a.id) - pathIds.indexOf(b.id)),
  };

  return (
    <div className="space-y-8" dir="rtl" style={{ fontFamily: 'Alegreya, serif' }}>
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800"><Zap className="w-5 h-5" />המסלול שלי</CardTitle>
          <CardDescription>זהו מסלול התרגול האישי שבנית. התקדם צעד אחר צעד.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>השלמת <span className="font-bold">{trainingPath.lastCompletedIndex + 1}</span> מתוך <span className="font-bold">{pathMeditations.length}</span> תרגולים.</p>
        </CardContent>
      </Card>
      
      {Object.entries(groupedMeditations).map(([level, meditations]) => (
        <LevelCard 
          key={level}
          title={`רמת ${level}`}
          meditations={meditations}
          lastCompletedIndex={trainingPath.lastCompletedIndex}
          pathIds={pathIds}
        />
      ))}
    </div>
  );
}
