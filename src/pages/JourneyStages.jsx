import React, { useState, useEffect } from 'react';
import { Stage } from '@/api/entities';
import { CustomTrack } from '@/api/entities';
import { User } from '@/api/entities';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, Library, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function JourneyStagesPage() {
    const [stages, setStages] = useState([]);
    const [user, setUser] = useState(null);
    const [trackName, setTrackName] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStagesAndUser = async () => {
            try {
                // טעינת נתוני המשתמש
                const currentUser = await User.me();
                setUser(currentUser);

                let stagesData = [];
                let displayTrackName = 'שלבי המסע';

                if (currentUser && currentUser.track === "מותאם אישית" && currentUser.custom_track_id) {
                    // טעינת שלבים מותאמים אישית
                    const customTracks = await CustomTrack.filter({ id: currentUser.custom_track_id });
                    if (customTracks && customTracks.length > 0) {
                        const customTrack = customTracks[0];
                        stagesData = customTrack.generated_stages || [];
                        displayTrackName = customTrack.track_name || 'מסלול מותאם אישית';
                    }
                } else {
                    // טעינת שלבים רגילים
                    stagesData = await Stage.list();
                    if (currentUser && currentUser.track) {
                        displayTrackName = `שלבי מסלול ${currentUser.track}`;
                    }
                }

                if (stagesData && Array.isArray(stagesData)) {
                    setStages(stagesData.sort((a, b) => a.stage_number - b.stage_number));
                }
                setTrackName(displayTrackName);
            } catch (error) {
                console.error("Failed to fetch stages or user data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStagesAndUser();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="text-center" dir="rtl">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
                    <p className="mt-4 text-lg text-gray-700">טוען שלבי המסע...</p>
                </div>
            </div>
        );
    }

    if (!stages || stages.length === 0) {
        return (
            <div className="bg-gray-50 min-h-screen p-4 md:p-8" dir="rtl">
                <div className="max-w-4xl mx-auto text-center">
                    <header className="flex justify-between items-center mb-8 pb-4 border-b">
                        <div className="flex items-center gap-4">
                            <Library className="w-8 h-8 text-blue-600" />
                            <h1 className="text-3xl font-bold text-gray-800">שלבי המסע</h1>
                        </div>
                        <Link to={createPageUrl('Home')}>
                            <Button variant="outline">
                                <ArrowRight className="ml-2 h-4 w-4" />
                                חזור למסע
                            </Button>
                        </Link>
                    </header>
                    <p className="text-lg text-gray-600">לא נמצאו שלבי מסע. אנא וודא שבחרת מסלול במסך הראשי.</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="bg-gray-50 min-h-screen p-4 md:p-8" dir="rtl">
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..900;1,400..900&display=swap');`}</style>
            <div className="max-w-4xl mx-auto">
                <header className="flex justify-between items-center mb-8 pb-4 border-b">
                    <div className="flex items-center gap-4">
                        <Library className="w-8 h-8 text-blue-600" />
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">{trackName}</h1>
                            {user && user.track && (
                                <p className="text-gray-600 mt-1">
                                    {user.track === "מותאם אישית" 
                                        ? "המסלול המותאם אישית שלך" 
                                        : `מסלול ${user.track}`}
                                    {user.current_stage && ` • אתה כרגע בשלב ${user.current_stage}`}
                                </p>
                            )}
                        </div>
                    </div>
                    <Link to={createPageUrl('Home')}>
                        <Button variant="outline">
                            <ArrowRight className="ml-2 h-4 w-4" />
                            חזור למסע
                        </Button>
                    </Link>
                </header>

                <main>
                    <Accordion type="single" collapsible className="w-full space-y-4">
                        {stages.map(stage => (
                            <AccordionItem 
                                key={stage.id || `stage-${stage.stage_number}`} 
                                value={`stage-${stage.stage_number}`} 
                                className={`bg-white rounded-lg shadow-sm border ${
                                    user && user.current_stage === stage.stage_number 
                                        ? 'border-blue-500 bg-blue-50' 
                                        : 'border-gray-200'
                                }`}
                            >
                                <AccordionTrigger className={`p-6 text-xl font-bold hover:no-underline ${
                                    user && user.current_stage === stage.stage_number
                                        ? 'text-blue-800'
                                        : 'text-blue-700'
                                }`}>
                                    <div className="flex items-center gap-3">
                                        <span>שלב {stage.stage_number}: {stage.stage_name}</span>
                                        {user && user.current_stage === stage.stage_number && (
                                            <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-sm">
                                                שלב נוכחי
                                            </span>
                                        )}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-6 pt-0">
                                    <div className="space-y-6">
                                        <p className="text-lg text-gray-600">{stage.description}</p>
                                        
                                        <div className="prose prose-lg max-w-none">
                                            <h3 className="font-semibold">חומרי לימוד:</h3>
                                            <ReactMarkdown>{stage.learning_material}</ReactMarkdown>
                                            
                                            <h3 className="font-semibold">משימות יומיות:</h3>
                                            <ul>
                                                {stage.daily_tasks.map((task, i) => <li key={i}>{task}</li>)}
                                            </ul>

                                            <h3 className="font-semibold">מדדי הצלחה:</h3>
                                            <ReactMarkdown>{stage.success_metrics}</ReactMarkdown>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </main>
            </div>
        </div>
    );
}