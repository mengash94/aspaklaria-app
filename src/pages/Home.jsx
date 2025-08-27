
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { DailyEntry } from "@/api/entities";
import { Meditation } from "@/api/entities";
import { UserTrainingPath } from "@/api/entities";
import { LogOut, Compass as CompassIcon, BookOpen, BarChart2, BrainCircuit, History, Menu, User as UserIcon, Library, FileText, Moon, Headphones, Zap, PenSquare, Share2, Shield, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge"; // Assuming Badge component path
import TrackSelection from "../components/onboarding/TrackSelection";
import CustomTrackQuestionnaire from "../components/onboarding/CustomTrackQuestionnaire";
import JourneyTab from "../components/journey/JourneyTab";
import ProgressTab from "../components/progress/ProgressTab";
import WritingTab from "../components/writing/WritingTab";
import MeditationsTab from "../components/meditations/MeditationsTab";
import MyTrainingPathTab from "../components/meditations/MyTrainingPathTab";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";


const TABS = [
  { id: "journey", label: "המסע שלי", icon: BookOpen },
  { id: "progress", label: "מעקב והתקדמות", icon: BarChart2 },
  { id: "training", label: "תרגול", icon: Zap },
  { id: "writing", label: "יומנים והרהורים", icon: PenSquare },
];

// הסרנו את הרכיב AdminDashboard המדמה - עכשיו נפנה לדף האמיתי

const SideNav = ({ user, handleLogout, setActiveTab, setIsMenuOpen }) => {
  const navigateAndClose = (tabId) => {
    if (tabId === 'admin-dashboard') {
      // במקום לעבור לטאב, נפנה לדף הניהול האמיתי
      window.location.href = createPageUrl('AdminDashboard');
      return;
    }
    setActiveTab(tabId);
    setIsMenuOpen(false);
  };

  const NavButton = ({ tabId, children }) => (
    <button
      onClick={() => navigateAndClose(tabId)}
      className="flex items-center gap-3 py-2.5 px-4 rounded-lg hover:bg-blue-100 text-gray-700 hover:text-blue-800 transition-colors text-right w-full"
    >
      {children}
    </button>
  );
  
  const NavLink = ({ to, children }) => (
     <Link to={to} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 py-2.5 px-4 rounded-lg hover:bg-blue-100 text-gray-700 hover:text-blue-800 transition-colors">
        {children}
     </Link>
  );

  const handleShare = async () => {
    const shareData = {
        title: 'המאמן הרוחני האישי',
        text: 'הי, מצאתי אפליקציה מדהימה למסע רוחני אישי. אני חושב שזה יכול לעניין גם אותך! להורדה והצטרפות למסע:',
        url: window.location.origin + createPageUrl('Welcome')
    };

    try {
        if (!navigator.share) {
            throw new Error("Web Share API not supported.");
        }
        await navigator.share(shareData);
    } catch (error) {
        console.error('Sharing error:', error);
        
        // If user cancels the share dialog, do nothing.
        if (error.name === 'AbortError') {
            return;
        }

        // If sharing fails for other reasons (e.g., permission denied in iframe),
        // fall back to copying the link to the clipboard.
        try {
            await navigator.clipboard.writeText(shareData.url);
            toast.info("חלון השיתוף נחסם, אז הקישור הועתק!", {
                description: "כעת תוכל להדביק ולשתף אותו עם חברים."
            });
        } catch (copyError) {
            console.error('Clipboard fallback error:', copyError);
            toast.error("שגיאה בשיתוף", {
                description: "לא ניתן היה לשתף או להעתיק את הקישור."
            });
        }
    } finally {
        setIsMenuOpen(false);
    }
  };


  return (
    <div className="w-72 bg-gray-50 h-full flex flex-col shadow-lg" dir="rtl">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold text-blue-800" style={{ fontFamily: 'Alegreya, serif' }}>תפריט ראשי</h2>
        <p className="text-sm text-gray-600">שלום, {user?.full_name || 'משתמש'}</p>
        {user?.role === 'admin' && (
          <Badge className="bg-red-100 text-red-800 text-xs mt-1">מנהל מערכת</Badge>
        )}
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {user?.role === 'admin' && (
          <>
            <div>
              <h3 className="text-sm font-semibold text-red-600 uppercase px-4 mb-2">ניהול מערכת</h3>
              {/* Changed from NavLink to NavButton to make AdminDashboard a tab within HomePage */}
              <NavButton tabId="admin-dashboard"> 
                <Shield className="w-5 h-5 text-red-600" />
                <span>לוח בקרה מנהל</span>
              </NavButton>
            </div>
            <Separator />
          </>
        )}

        <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase px-4 mb-2">ניווט ראשי</h3>
            <NavButton tabId="journey"><BookOpen className="w-5 h-5 text-blue-600" /><span>המסע שלי</span></NavButton>
            <NavButton tabId="progress"><BarChart2 className="w-5 h-5 text-blue-600" /><span>מעקב והתקדמות</span></NavButton>
            <NavButton tabId="writing"><PenSquare className="w-5 h-5 text-blue-600" /><span>יומנים והרהורים</span></NavButton>
        </div>
        
        <Separator />
        
        <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase px-4 mb-2">מרכז האימונים</h3>
            <NavButton tabId="meditations-library"><Headphones className="w-5 h-5 text-blue-600" /><span>ספריית אימונים</span></NavButton>
            <NavButton tabId="my-path"><Zap className="w-5 h-5 text-blue-600" /><span>המסלול שלי</span></NavButton>
        </div>
        
        <Separator />

        <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase px-4 mb-2">כלים וחכמה</h3>
            <NavLink to={createPageUrl('Compass')}><CompassIcon className="w-5 h-5 text-blue-600" /><span>מצפן הנשמה</span></NavLink>
            <NavLink to={createPageUrl('JourneyStages')}><Library className="w-5 h-5 text-blue-600" /><span>שלבי המסע</span></NavLink>
            <NavLink to={createPageUrl('BeitMidrash')}><Library className="w-5 h-5 text-blue-600" /><span>בית המדרש</span></NavLink>
            <NavLink to={createPageUrl('Reminders')}><CalendarClock className="w-5 h-5 text-blue-600" /><span>תזכורות אישיות</span></NavLink>
        </div>
        
        <Separator />

        <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase px-4 mb-2">הגדרות וקהילה</h3>
             <NavLink to={createPageUrl('Profile')}><UserIcon className="w-5 h-5 text-blue-600" /><span>פרופיל אישי</span></NavLink>
             <NavLink to={createPageUrl('NotificationSettings')}><FileText className="w-5 h-5 text-blue-600" /><span>הגדרות התראות</span></NavLink>
              <a 
                href="https://chat.whatsapp.com/EedJYJ3pZVw4d1V6g8uTsg" 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 py-2.5 px-4 rounded-lg bg-green-100 hover:bg-green-200 text-green-800 transition-colors mt-2"
              >
                <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.688"/></svg>
                <span>קהילת וואטסאפ</span>
              </a>
              <button
                onClick={handleShare}
                className="flex items-center gap-3 py-2.5 px-4 rounded-lg hover:bg-blue-100 text-gray-700 hover:text-blue-800 transition-colors w-full mt-2"
              >
                <Share2 className="w-5 h-5 text-blue-600" />
                <span>שתף עם חבר</span>
              </button>
        </div>

      </nav>

      <div className="p-4 border-t bg-gray-100 flex-shrink-0">
        <Button onClick={handleLogout} className="w-full justify-start text-red-600 hover:bg-red-100 hover:text-red-700" variant="ghost">
          <LogOut className="ml-2 h-4 w-4" />
          <span>התנתקות</span>
        </Button>
      </div>
    </div>
  );
};


export default function HomePage() {
  const [user, setUser] = useState(null);
  const [stages, setStages] = useState([]);
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("journey");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCustomQuestionnaire, setShowCustomQuestionnaire] = useState(false);
  const [key, setKey] = useState(Date.now()); // Used to force-refresh tabs
  const [trainingPath, setTrainingPath] = useState(null);
  const [allMeditations, setAllMeditations] = useState([]);
  
  // הסרנו כל הקוד הקשור למרכז התראות
  // const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  // const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    
    const loadAppData = async () => {
      if (!mounted) return;
      
      setIsLoading(true);
      
      try {
        // This will now throw an error for unauthenticated users,
        // and the platform's auth handling will take over, redirecting to login.
        const currentUser = await User.me();
        
        if (!mounted) return;
        
        setUser(currentUser);
        
        if (currentUser.track === "מותאם אישית" && !currentUser.onboarding_completed) {
          setShowCustomQuestionnaire(true);
          setIsLoading(false);
          return;
        }

        let stagesData = [];
        
        if (currentUser.track === "מותאם אישית" && currentUser.custom_track_id) {
          const { CustomTrack } = await import("@/api/entities");
          const customTracks = await CustomTrack.filter({ id: currentUser.custom_track_id });
          if (customTracks && customTracks.length > 0) {
            stagesData = customTracks[0].generated_stages || [];
          }
        } else if (currentUser.track) {
          const { Stage } = await import("@/api/entities");
          stagesData = await Stage.list();
        }

        const [entriesData, paths, allMeditationsData] = await Promise.all([
           DailyEntry.filter({ userId: currentUser.id }, "-date"),
           UserTrainingPath.filter({ userId: currentUser.id }),
           Meditation.list()
        ]);

        if (mounted) {
            if (stagesData && Array.isArray(stagesData)) {
                const uniqueStages = Array.from(
                  new Map(stagesData.map(stage => [stage.stage_number, stage])).values()
                );
                setStages(uniqueStages.sort((a, b) => a.stage_number - b.stage_number));
              } else {
                setStages([]);
              }

            setEntries(Array.isArray(entriesData) ? entriesData : []);
            setAllMeditations(Array.isArray(allMeditationsData) ? allMeditationsData : []);
            if (paths && paths.length > 0) {
              setTrainingPath(paths[0]);
            } else {
              setTrainingPath(null); // Ensure it's null if no path found
            }
        }
        
      } catch (error) {
        // We catch the error to stop execution and prevent crashes,
        // but we don't render a custom login form.
        // The platform's redirect should have already been triggered by the failed User.me() call.
        console.error("Authentication required or data loading error:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadAppData();
    
    return () => {
      mounted = false;
    };
  }, [key]);

  // הסרנו את ה-useEffect שטען התראות
  // useEffect(() => {
  //   const loadUnreadCount = async () => {
  //     if (!user) return;
      
  //     try {
  //       const unreadNotifications = await UserNotifications.filter(
  //         { user_id: user.id, is_read: false }
  //       );
  //       setUnreadNotificationsCount(unreadNotifications?.length || 0);
  //     } catch (error) {
  //       console.error('Error loading unread notifications:', error);
  //     }
  //   };

  //   if (user) { // Only set up interval if user is loaded
  //       loadUnreadCount();
  //       const interval = setInterval(loadUnreadCount, 30000); // Check every 30 seconds
  //       return () => clearInterval(interval);
  //   }
  // }, [user, isNotificationCenterOpen]); // Re-run when user changes or notification center closes to refresh count immediately

  const handleRefresh = () => {
    setKey(Date.now());
  };
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    // הסרנו 'admin-dashboard' מהרשימה כי זה עובר לדף נפרד
    if (tabParam && (TABS.some(tab => tab.id === tabParam) || ['meditations-library', 'my-path'].includes(tabParam) )) {
      setActiveTab(tabParam);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await User.logout();
      setUser(null);
      // Instead of setting authError, we reload to let the platform handle redirection.
      window.location.reload();
    } catch (error) {
      console.error("Logout error:", error);
      window.location.reload();
    }
  };

  const handleOnboardingComplete = () => {
    setIsLoading(true);
    window.location.reload();
  };

  const handleCustomTrackCompleted = () => {
    setShowCustomQuestionnaire(false);
    setIsLoading(true);
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-sky-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-600" style={{ fontFamily: 'Alegreya, serif' }}>טוען...</p>
        </div>
      </div>
    );
  }

  // If user is null after loading, it means auth failed and redirect should be happening.
  // We render nothing or a minimal loader to avoid showing a broken page.
  if (!user) {
    return (
        <div className="flex items-center justify-center h-screen bg-sky-50">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-xl text-gray-600" style={{ fontFamily: 'Alegreya, serif' }}>טוען...</p>
            </div>
        </div>
    );
  }

  if (showCustomQuestionnaire) {
    return <CustomTrackQuestionnaire onTrackCompleted={handleCustomTrackCompleted} />;
  }

  if (!user.onboarding_completed) {
    return <TrackSelection onTrackSelected={(type) => {
      if (type === 'custom_questionnaire') {
        setShowCustomQuestionnaire(true);
      } else {
        handleOnboardingComplete();
      }
    }} />;
  }
  
  if (!stages || stages.length === 0) {
      return (
        <div className="flex items-center justify-center h-screen bg-sky-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xl text-red-600" style={{ fontFamily: 'Alegreya, serif' }}>שגיאה קריטית בטעינת שלבי המסע.</p>
             <p className="text-lg text-gray-600 mt-2">אנא רענן את הדף או פנה לתמיכה.</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 hover:bg-blue-700 text-white mt-4"
            >
              טען מחדש
            </Button>
          </div>
        </div>
      );
  }

  const currentStageData = stages.find(s => s.stage_number === user.current_stage);

  if (!currentStageData) {
    return (
        <div className="flex items-center justify-center h-screen bg-sky-50">
          <div className="text-center">
            <p className="text-lg md:text-xl text-gray-600 mb-4 px-4" style={{ fontFamily: 'Alegreya, serif' }}>
              שגיאה במציאת השלב הנוכחי ({user.current_stage || 'לא מוגדר'}). 
            </p>
            <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700 text-white">
              טען מחדש
            </Button>
          </div>
        </div>
      );
  }
  
  let nextMeditation = null;
  if (trainingPath && allMeditations.length > 0) {
    const nextIndex = trainingPath.lastCompletedIndex + 1;
    if (nextIndex < trainingPath.meditationIds.length) {
        const nextId = trainingPath.meditationIds[nextIndex];
        nextMeditation = allMeditations.find(m => m.id === nextId);
    }
  }

  const renderActiveTab = () => {
    switch (activeTab) {
        case 'journey':
            return <JourneyTab currentStageData={currentStageData} nextMeditation={nextMeditation} />;
        case 'progress':
            return <ProgressTab currentStageData={currentStageData} onEntryLogged={handleRefresh} entries={entries} />;
        case 'training': // 'training' and 'my-path' render the same component currently
            return <MyTrainingPathTab key={key} />;
        case 'writing':
            return <WritingTab entries={entries} currentStageData={currentStageData} user={user} />;
        case 'meditations-library':
            return <MeditationsTab onPathUpdate={handleRefresh} />;
        case 'my-path':
            return <MyTrainingPathTab key={key} />;
        // הסרנו את המקרה admin-dashboard כי זה כבר לא טאב אלא דף נפרד
        default:
            return <JourneyTab currentStageData={currentStageData} nextMeditation={nextMeditation} />;
    }
  }

  return (
    <div className="bg-sky-50 min-h-screen" dir="rtl">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..900;1,400..900&display=swap');`}</style>
      
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <header className="bg-white shadow-md sticky top-0 z-10">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center gap-3">
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700 w-8 h-8 md:w-10 md:h-10"
              >
                <Menu className="w-4 h-4 md:w-5 h-5" />
              </Button>
            </SheetTrigger>
            
            <h1 className="text-base sm:text-lg md:text-xl font-bold text-blue-800 text-center flex-1" style={{ fontFamily: 'Alegreya, serif' }}>המסע לגילוי הנשמה והחיבור האלוקי</h1>

            <div className="flex items-center gap-2">
              {/* Notification Bell was here */}
              <span className="text-gray-600 hidden sm:block text-sm md:text-base whitespace-nowrap">שלום, {user.full_name || 'משתמש'}</span>
            </div>
          </div>
          
          <nav className="bg-white/70 backdrop-blur-sm border-b">
            <div className="container mx-auto flex justify-around px-1">
              {TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 sm:py-3 px-1 text-xs font-medium transition-all duration-200 border-b-3 sm:border-b-4 ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-500 hover:text-blue-500 hover:bg-blue-50'
                    }`}
                  >
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="hidden sm:block text-xs leading-tight">{tab.label}</span>
                    <span className="sm:hidden text-[10px] leading-tight mt-0.5">
                      {tab.label === "המסע שלי" ? "מסע" :
                       tab.label === "מעקב והתקדמות" ? "מעקב" :
                       tab.label === "תרגול" ? "תרגול" :
                       tab.label === "יומנים והרהורים" ? "יומנים" : tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>
        </header>

        <SheetContent side="right" className="p-0 w-72 pt-10" dir="rtl">
          <SideNav 
            user={user} 
            handleLogout={handleLogout} 
            setActiveTab={setActiveTab} 
            setIsMenuOpen={setIsMenuOpen} 
          />
        </SheetContent>
      </Sheet> 

      <main className="container mx-auto px-2 md:px-4 py-4 md:py-6">
        {renderActiveTab()}
      </main>

      {/* Notification Center was here */}
    </div>
  );
}
