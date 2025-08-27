
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Meditation } from '@/api/entities';
import { CompletedMeditation } from '@/api/entities';
import { UserTrainingPath } from '@/api/entities';
import { PracticeSession as PracticeSessionEntity } from '@/api/entities';
import { User } from '@/api/entities';
import { InvokeLLM } from '@/api/integrations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, Clock, Play, Pause, RotateCcw, Send, User as UserIcon, Bot, CheckCircle, FileText, Loader2, CheckCircle2, Settings, RefreshCcw, Timer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ReactMarkdown from 'react-markdown';
import { toast } from "sonner";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';


// פונקציה משופרת ליצירת צליל התראה
const playNotificationSound = async () => {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Resume AudioContext if suspended (common browser policy)
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        // צור buffer לצליל קצר
        const duration = 0.5; // seconds
        const sampleRate = audioContext.sampleRate;
        const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        // צור צליל בים של 800Hz
        for (let i = 0; i < buffer.length; i++) {
            // Apply a slight fade out at the end
            const amplitude = 0.3 * (1 - (i / buffer.length) * 0.5);
            data[i] = Math.sin(2 * Math.PI * 800 * i / sampleRate) * amplitude;
        }

        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);

        // Play the sound
        source.start();

        console.log("צליל התראה הופעל בהצלחה");

    } catch (error) {
        console.log("לא ניתן להפעיל צליל התראה דרך Web Audio API:", error);

        // Fallback - נסה Notification API עם רטט (אם נתמך)
        if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
            console.log("רטט הופעל במקום צליל");
        }

        // Fallback נוסף - הצג התראה ויזואלית מובנית (אם ניתנה הרשאה)
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🔔 הזמן הסתיים!', {
                body: 'הגיע הזמן לסיים את התרגול',
                icon: window.notificationIcon || '/icon-192x192.png', // Use provided icon or default
                tag: 'timer-finished' // Group notifications
            });
        }
    }
};

export default function PracticeSessionPage() {
    const location = useLocation();
    const [meditation, setMeditation] = useState(null);
    const [user, setUser] = useState(null);

    // States for the multi-step flow
    // 'loading', 'error', 'chat' are major steps. 'timerSetup' will encompass preparation and practice.
    const [currentStep, setCurrentStep] = useState('loading');

    // States for timer
    const [timeLeft, setTimeLeft] = useState(0); // Renamed from timeRemaining, represents time in seconds
    const [isTimerRunning, setIsTimerRunning] = useState(false); // Renamed from timerActive
    const timerInterval = useRef(null);
    const [timerFinished, setTimerFinished] = useState(false); // New state to track if timer finished naturally

    // NEW STATES for custom timer duration
    const [timerDuration, setTimerDuration] = useState(10); // Stores the selected duration in minutes
    const [customDuration, setCustomDuration] = useState('10'); // For the input field value
    const [showCustomDuration, setShowCustomDuration] = useState(false);

    // States for chat
    const [chatHistory, setChatHistory] = useState([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false); // For AI response loading
    const messagesEndRef = useRef(null);

    // User's training path, to be fetched and updated.
    const [userTrainingPath, setUserTrainingPath] = useState(null);

    // Function to convert time string (e.g., "10 דק") to minutes
    const parseTimeToMinutes = (timeString) => {
        if (!timeString) return 10;
        const match = timeString.match(/(\d+)\s*דק/); // Matches "X דק"
        if (match) {
            return parseInt(match[1]);
        }
        return 10; // Default to 10 minutes if parsing fails
    };

    // Handler for custom duration input change
    const handleCustomDurationChange = (value) => {
        const minutes = parseInt(value);
        if (!isNaN(minutes) && minutes > 0 && minutes <= 120) { // Limit 1-120 minutes
            setCustomDuration(value);
            setTimerDuration(minutes); // Update the active timer duration
            setTimeLeft(minutes * 60); // Update timeLeft immediately
        } else if (value === '') { // Allow empty input temporarily
             setCustomDuration('');
             // No change to timerDuration or timeLeft if input is empty
        }
    };

    // Resets timer duration to the meditation's recommended default
    const resetToDefault = () => {
        if (!meditation) return;
        const defaultMinutes = parseTimeToMinutes(meditation.duration);
        setTimerDuration(defaultMinutes);
        setTimeLeft(defaultMinutes * 60);
        setCustomDuration(defaultMinutes.toString());
        setShowCustomDuration(false);
        if (timerInterval.current) {
            clearInterval(timerInterval.current);
            timerInterval.current = null;
        }
        setIsTimerRunning(false);
        setTimerFinished(false);
    };

    useEffect(() => {
        const loadData = async () => {
            const urlParams = new URLSearchParams(location.search);
            const meditationId = urlParams.get('meditationId');

            if (!meditationId) {
                setCurrentStep('error');
                return;
            }

            try {
                const fetchedUser = await User.me();
                const [meditationData, trainingPathsData] = await Promise.all([
                    Meditation.filter({ id: meditationId }),
                    UserTrainingPath.filter({ userId: fetchedUser.id })
                ]);


                if (meditationData && meditationData.length > 0) {
                    const med = meditationData[0];
                    setMeditation(med);
                    setUser(fetchedUser);

                    if (trainingPathsData && trainingPathsData.length > 0) {
                        setUserTrainingPath(trainingPathsData[0]);
                    }

                    // Parse duration and set initial timer states
                    const defaultMinutes = parseTimeToMinutes(med.duration);
                    setTimerDuration(defaultMinutes);
                    setTimeLeft(defaultMinutes * 60); // Time in seconds
                    setCustomDuration(defaultMinutes.toString()); // For the input field

                    setCurrentStep('timerSetup'); // New step for the combined UI (meditation info + timer controls)
                } else {
                    setCurrentStep('error');
                }
            } catch (error) {
                console.error('Error loading meditation or user data:', error);
                setCurrentStep('error');
            }
        };
        loadData();
    }, [location.search]);

    // Scroll to bottom of chat history
    useEffect(() => {
        if (currentStep === 'chat') {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatHistory, currentStep]);

    // Cleanup interval on component unmount
    useEffect(() => {
        return () => {
            if (timerInterval.current) {
                clearInterval(timerInterval.current);
            }
        };
    }, []);

    // פונקציה להכנת AudioContext מוקדמת (יקרא כשהמשתמש ילחץ התחל)
    const prepareAudio = async () => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }
            console.log("Audio context מוכן לשימוש");
        } catch (error) {
            console.log("לא ניתן להכין Audio context:", error);
            toast.error("שגיאה", { description: "הדפדפן חסם את הרשאות השמע. אנא אפשר זאת בהגדרות הדפדפן." });
        }
    };

    // Timer functions
    const startTimer = async () => {
        if (timerInterval.current) {
            clearInterval(timerInterval.current);
        }

        // הכן את ה-Audio context כשהמשתמש מתחיל את הטיימר
        await prepareAudio();

        setIsTimerRunning(true);
        setTimerFinished(false);

        // If timer is at 0 (finished previously or just started), re-initialize it to the chosen duration
        if (timeLeft === 0 || timerFinished) {
            setTimeLeft(timerDuration * 60);
        }

        timerInterval.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerInterval.current);
                    setIsTimerRunning(false);
                    setTimerFinished(true);

                    // הפעל את הצליל המשופר
                    playNotificationSound();

                    // הצג גם Toast notification
                    toast.success("🔔 הזמן הסתיים!", {
                        description: "הגיע הזמן לסיים את התרגול ולהתחיל בעיבוד החוויה.",
                        duration: 5000
                    });

                    setCurrentStep('chat');
                    // הבוט מתחיל עם שאלה אוטומטית
                    setChatHistory([{
                        role: 'assistant',
                        content: `ברוך הבא לתרגול "${meditation.title}".\n\n**הוראות התרגול:**\n${meditation.instructions}\n\nהטיימר סיים את זמנו - כל הכבוד על השלמת התרגול! 🎉\n\nאיך היה לך? ספר לי על החוויה שלך מהתרגול.`
                    }]);

                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const pauseTimer = () => { // Renamed from stopTimer
        if (timerInterval.current) {
            clearInterval(timerInterval.current);
            timerInterval.current = null;
        }
        setIsTimerRunning(false);
    };

    const resetTimer = () => { // New function to reset timer to selected duration
        if (timerInterval.current) {
            clearInterval(timerInterval.current);
            timerInterval.current = null;
        }
        setIsTimerRunning(false);
        setTimeLeft(timerDuration * 60); // Reset to the currently set duration
        setTimerFinished(false);
    };

    // New function to end session early and go to chat (replaces old stopTimer/skipToChat functionality)
    const endSessionAndGoToChat = () => {
        if (timerInterval.current) {
            clearInterval(timerInterval.current);
            timerInterval.current = null;
        }
        setIsTimerRunning(false);
        setTimerFinished(false); // Not a natural finish

        setCurrentStep('chat');
        setChatHistory([{
            role: 'assistant',
            content: `ברוך הבא לתרגול "${meditation.title}".\n\n**הוראות התרגול:**\n${meditation.instructions}\n\nבחרת לסיים את התרגול מוקדם. איך היה לך? ספר לי על החוויה שלך מהתרגול.`
        }]);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const sendMessage = async () => {
        if (!currentMessage.trim() || isLoading) return;

        const userMessage = currentMessage.trim();
        setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
        setCurrentMessage('');
        setIsLoading(true);

        try {
            const prompt = `
**משימתך:** אתה מאמן רוחני חם ומעודד המלווה את המשתמש במהלך תרגול מדיטציה.
**כללי התנהגות מחייבים:**
- **שפה:** השב תמיד בעברית בלבד.
- **טון:** השתמש תמיד בגוף שני (פנייה אישית: "אתה", "שלך"). הטון חייב להיות מעודד, חם ותומך.
- **מיקוד:** תגובתך תתמקד אך ורק בתרגול המדיטציה הנוכחי, בחוויות הרוחניות ובהדרכה. סרב בנימוס לענות על כל שאלה שחורגת מתחומים אלו.

**הקשר:** המשתמש ביצע כעת את התרגול "${meditation.title}".
הוראות התרגול: "${meditation.instructions}"

**היסטוריית השיחה:**
${chatHistory.map(m => `${m.role}: ${m.content}`).join('\n')}

**הודעה חדשה מהמשתמש:** "${userMessage}"

**הפלט הנדרש:**
השב למשתמש בצורה חמה ומעודדת, עזור לו להעמיק את התרגול או להתמודד עם אתגרים. שאל שאלות מנחות לפי הצורך.`;

            const response = await InvokeLLM({ prompt });
            setChatHistory(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (error) {
            console.error('Error sending message:', error);
            setChatHistory(prev => [...prev, {
                role: 'assistant',
                content: 'סליחה, הייתה בעיה טכנית. בואו נמשיך בעיבוד החוויה...'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChatComplete = async () => {
        if (!meditation || !user) {
            console.error("Cannot complete chat: meditation or user data missing.");
            toast.error("שגיאה", { description: "חסרים נתונים לסיום השיחה." });
            return;
        }

        setIsLoading(true);

        const userMessages = chatHistory.filter(m => m.role === 'user');

        if (userMessages.length === 0) {
            await saveSession(chatHistory.map(m => `${m.role}: ${m.content}`).join('\n'), "התרגול הסתיים. לא נוצר סיכום חוויה אוטומטי מכיוון שלא שותפה שיחה עם המאמן.", 0);
            return;
        }

        const fullTranscript = chatHistory.map(m => `${m.role}: ${m.content}`).join('\n');

        const prompt = `
**משימתך העיקרית:** אתה מאמן רוחני חם, מעודד וחכם. מטרתך היא לעזור למשתמש לצמוח.
**כללי התנהגות מחייבים:**
- **שפה:** השב תמיד בעברית בלבד.
- **טון:** השתמש תמיד בגוף שני (פנייה אישית: "אתה", "שלך"). הטון חייב להיות מעודד, חם ותומך.
- **מיקוד:** תשובותיך חייבות להיות קשורות אך ורק לצמיחה רוחנית, להתבוננות פנימית ולתרגול שהמשתמש ביצע. סרב בנימוס לענות על שאלות שאינן קשורות לנושאים אלו.

**המשימה הנוכחית:**
נתח את תמליל השיחה הבא של משתמש שסיים תרגול בשם "${meditation.title}".
הוראות התרגול היו: "${meditation.instructions}"

תמליל השיחה:
${fullTranscript}

**הפלט הנדרש:**
בהתבסס על הניתוח, החזר אובייקט JSON בלבד, ללא טקסט נוסף, בפורמט הבא:
{
  "summary": "כתוב כאן סיכום אישי, חם ומעודד בעברית, הפונה ישירות למשתמש ומסכם את חוויתו.",
  "score": <מספר בין 1 ל-10 המייצג את רמת המעורבות וההבנה של המשתמש>
}`;

        try {
            const response = await InvokeLLM({
                prompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        summary: { type: "string" },
                        score: { type: "number" }
                    },
                    required: ["summary", "score"]
                }
            });

            await saveSession(fullTranscript, response.summary, response.score);

        } catch (error) {
            console.error('Error generating AI summary:', error);
            toast.error("שגיאה", { description: "אירעה שגיאה ביצירת סיכום AI." });
            await saveSession(fullTranscript, "התרגול הסתיים. אירעה שגיאה ביצירת סיכום AI.", 0);
        } finally {
            setIsLoading(false);
        }
    };

    const saveSession = async (transcript, summary, score) => {
        if (!user || !meditation) {
            console.error("Cannot save session: user or meditation data missing.");
            toast.error("שגיאה", { description: "חסרים נתונים לשמירת הסשן." });
            return;
        }
        try {
            await PracticeSessionEntity.create({
                userId: user.id,
                meditationId: meditation.id,
                sessionDate: new Date().toISOString(),
                chatTranscript: transcript,
                ai_summary: summary,
                ai_score: score
            });

            if (userTrainingPath) {
                const currentMeditationIndex = userTrainingPath.meditationIds.indexOf(meditation.id);
                if (currentMeditationIndex !== -1 && currentMeditationIndex === userTrainingPath.lastCompletedIndex + 1) {
                    await UserTrainingPath.update(userTrainingPath.id, {
                        lastCompletedIndex: currentMeditationIndex
                    });
                }
            }

            await CompletedMeditation.create({
                userId: user.id,
                meditationId: meditation.id,
                meditationTitle: meditation.title,
                completedAt: new Date().toISOString()
            });

            toast.success("תרגול נשמר בהצלחה!", { description: "היסטוריית התרגול שלך עודכנה." });

            window.location.href = createPageUrl('Home?tab=training');
        } catch (error) {
            console.error('Error saving session:', error);
            toast.error('שגיאה בשמירת הסשן', { description: "נסה שוב או פנה לתמיכה." });
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // --- Conditional Rendering based on currentStep ---

    if (currentStep === 'loading' || !meditation) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-2" />
                <div className="text-center text-gray-700">טוען תרגול...</div>
            </div>
        );
    }

    if (currentStep === 'error') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-red-50 p-4" dir="rtl">
                <Card className="shadow-lg p-6 text-center max-w-md">
                    <CardTitle className="text-xl text-red-700 mb-4">שגיאה בטעינת התרגול</CardTitle>
                    <CardDescription className="mt-2 text-gray-600 mb-4">
                        אירעה בעיה בטעינת המדיטציה. אנא ודא שהקישור תקין ונסה שוב.
                    </CardDescription>
                    <div className="text-sm text-gray-500 mb-4 p-3 bg-gray-100 rounded">
                        <p><strong>URL נוכחי:</strong> {window.location.href}</p>
                        <p><strong>פרמטרים:</strong> {location.search || 'אין'}</p>
                    </div>
                    <div className="flex gap-3">
                        <Button onClick={() => window.location.href = createPageUrl('Home?tab=training')} className="flex-1">
                            חזור למסלול התרגולים
                        </Button>
                        <Button variant="outline" onClick={() => window.location.reload()} className="flex-1">
                            נסה שוב
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    // This section replaces the original 'preparation' and 'practice' steps
    if (currentStep === 'timerSetup') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir="rtl" style={{ fontFamily: 'Alegreya, serif' }}>
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <Link to={createPageUrl('Home?tab=training')} className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
                            <ArrowRight className="w-5 h-5" />
                            חזור למסלול
                        </Link>
                        <h1 className="text-2xl font-bold text-blue-800">מרכז התרגול</h1>
                        <div></div> {/* Placeholder for alignment */}
                    </div>

                    {/* Meditation Info Card */}
                    <Card className="mb-6 bg-white/80 backdrop-blur-sm shadow-xl">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-2xl text-blue-800 mb-2">{meditation.title}</CardTitle>
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            {meditation.duration} (מומלץ)
                                        </span>
                                        <Badge className={`${
                                            meditation.level === 'מתחיל' ? 'bg-green-100 text-green-800' :
                                                meditation.level === 'בינוני' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                            }`}>
                                            {meditation.level}
                                        </Badge>
                                        {meditation.is_custom && (
                                            <Badge className="bg-purple-100 text-purple-700">אישי</Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <CardDescription className="mt-4 leading-relaxed">
                                {meditation.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">הוראות התרגיל:</h3>
                            <div className="prose prose-lg max-w-none text-gray-700">
                                <ReactMarkdown>{meditation.instructions}</ReactMarkdown>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Timer Controls */}
                    <Card className="mb-6 bg-white/80 backdrop-blur-sm shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Timer className="w-5 h-5 text-blue-600" />
                                טיימר תרגול
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* Timer Display */}
                                <div className="text-center">
                                    <div className="text-6xl font-mono text-blue-600 bg-blue-50 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-2">
                                        {formatTime(timeLeft)}
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        {timerDuration} דקות תרגול
                                    </p>
                                </div>

                                {/* Duration Controls */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-center gap-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowCustomDuration(!showCustomDuration)}
                                            disabled={isTimerRunning}
                                        >
                                            <Settings className="w-4 h-4 mr-2" />
                                            התאם זמן
                                        </Button>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={resetToDefault}
                                            disabled={isTimerRunning}
                                        >
                                            <RefreshCcw className="w-4 h-4 mr-2" />
                                            זמן מומלץ ({parseTimeToMinutes(meditation.duration)} דק׳)
                                        </Button>
                                    </div>

                                    {/* Custom Duration Input */}
                                    {showCustomDuration && (
                                        <div className="flex items-center justify-center gap-3 p-4 bg-blue-50 rounded-lg">
                                            <Label htmlFor="custom-duration">זמן בדקות:</Label>
                                            <Input
                                                id="custom-duration"
                                                type="number"
                                                value={customDuration}
                                                onChange={(e) => handleCustomDurationChange(e.target.value)}
                                                onBlur={(e) => { // Handle case where input is left empty
                                                    if (e.target.value === '') {
                                                        setCustomDuration(timerDuration.toString());
                                                    }
                                                }}
                                                min="1"
                                                max="120"
                                                className="w-20 text-center"
                                                disabled={isTimerRunning}
                                            />
                                            <span className="text-sm text-gray-600">(1-120 דקות)</span>
                                        </div>
                                    )}
                                </div>

                                {/* Timer Control Buttons */}
                                <div className="flex justify-center gap-3">
                                    <Button
                                        onClick={startTimer}
                                        disabled={isTimerRunning || (timeLeft <= 0 && timerFinished)}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        <Play className="w-4 h-4 mr-2" />
                                        {isTimerRunning ? 'ממשיך' : 'התחל'}
                                    </Button>

                                    <Button
                                        onClick={pauseTimer}
                                        disabled={!isTimerRunning}
                                        variant="outline"
                                    >
                                        <Pause className="w-4 h-4 mr-2" />
                                        השהה
                                    </Button>

                                    <Button
                                        onClick={resetTimer}
                                        disabled={isTimerRunning}
                                        variant="outline"
                                    >
                                        <RefreshCcw className="w-4 h-4 mr-2" />
                                        איפוס
                                    </Button>
                                </div>
                                <div className="mt-4">
                                    <Button
                                        onClick={endSessionAndGoToChat}
                                        className="w-full bg-blue-600 hover:bg-blue-700 py-3 text-lg"
                                    >
                                        <FileText className="w-5 h-5 ml-2" />
                                        סיים תרגול ועבור לשיח עם המאמן
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (currentStep === 'chat') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-4" dir="rtl">
                <div className="max-w-4xl mx-auto">
                    <Card className="shadow-xl">
                        <CardHeader className="bg-green-50 text-center">
                            <CardTitle className="text-2xl font-bold text-green-800">משוב על התרגיל</CardTitle>
                            <CardDescription>ספר על החוויה שלך וקבל משוב מותאם אישית</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="flex flex-col h-[400px]">
                                <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1">
                                    {chatHistory.map((message, index) => (
                                        <div key={index} className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            {message.role === 'assistant' && (
                                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <Bot className="w-3 h-3 text-blue-600" />
                                                </div>
                                            )}
                                            <div className={`max-w-[85%] p-2 rounded-lg text-sm ${
                                                message.role === 'user'
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {message.role === 'assistant' ? (
                                                    <ReactMarkdown className="prose prose-xs max-w-none [&>*]:my-1">
                                                        {message.content}
                                                    </ReactMarkdown>
                                                ) : (
                                                    <p>{message.content}</p>
                                                )}
                                            </div>
                                            {message.role === 'user' && (
                                                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <UserIcon className="w-3 h-3 text-gray-600" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {isLoading && (
                                        <div className="flex justify-start gap-2">
                                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <Bot className="w-3 h-3 text-blue-600" />
                                            </div>
                                            <div className="bg-gray-100 p-2 rounded-lg">
                                                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                <div className="flex gap-2 mt-auto">
                                    <Input
                                        value={currentMessage}
                                        onChange={(e) => setCurrentMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="שתף את החוויה שלך..."
                                        className="flex-1 h-9 text-sm"
                                        disabled={isLoading}
                                    />
                                    <Button
                                        onClick={sendMessage}
                                        disabled={isLoading || !currentMessage.trim()}
                                        className="bg-blue-600 hover:bg-blue-700 px-3 h-9"
                                    >
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="mt-4">
                                    <Button
                                        onClick={handleChatComplete}
                                        disabled={isLoading}
                                        className="w-full bg-green-600 hover:bg-green-700 py-3 text-lg"
                                    >
                                        <CheckCircle className="w-5 h-5 ml-2" />
                                        סיים שיחה וקבל סיכום
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return null;
}
