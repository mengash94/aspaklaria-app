
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { DailyEntry } from "@/api/entities";
import { Submission } from "@/api/entities";
import { NotificationSettings } from "@/api/entities";
import { CustomTrack } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowRight, Save, Trash2, AlertTriangle, RefreshCw, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import UpdateCustomTrackDialog from "../components/profile/UpdateCustomTrackDialog";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResettingTrack, setIsResettingTrack] = useState(false);
  const [formData, setFormData] = useState({});
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      setFormData({
        full_name: userData.full_name || "",
        track: userData.track || "",
        current_stage: userData.current_stage || 1,
        phone: userData.phone || "",
        notifications_enabled: userData.notifications_enabled || false
      });
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { current_stage, track, ...dataToUpdate } = formData;
      await User.updateMyUserData(dataToUpdate);
      await loadUserData();
      alert("הפרטים נשמרו בהצלחה!");
    } catch (error) {
      console.error("Error saving user data:", error);
      alert("אירעה שגיאה בשמירת הנתונים");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTrackReset = async () => {
    if (!user || !user.id || !user.email) {
        alert("שגיאה: לא ניתן לזהות את המשתמש לאיפוס המסלול.");
        return;
    }

    setIsResettingTrack(true);
    try {
      // 1. מחיקת כל נתוני המעקב היומי
      const entries = await DailyEntry.filter({ created_by: user.email });
      if (entries) {
        await Promise.all(entries.map(entry => DailyEntry.delete(entry.id)));
      }

      // 2. מחיקת מסלול מותאם אישית אם קיים
      if (user.custom_track_id) {
        try {
          await CustomTrack.delete(user.custom_track_id);
        } catch (error) {
          console.log("No custom track to delete or already deleted");
        }
      }

      // 3. איפוס נתוני המשתמש הרלוונטיים
      await User.updateMyUserData({
        track: null,
        current_stage: 1,
        onboarding_completed: false,
        custom_track_id: null
      });

      // 4. מעבר למסך בחירת מסלול
      window.location.href = createPageUrl("Home");
      
    } catch (error) {
      console.error("Error resetting track:", error);
      alert("אירעה שגיאה באיפוס המסלול. אנא נסה שוב או פנה לתמיכה.");
      setIsResettingTrack(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !user.id || !user.email) {
        alert("שגיאה: לא ניתן לזהות את המשתמש למחיקה.");
        return;
    }

    setIsDeleting(true);
    try {
      // 1. Find and delete all user-related data
      const [entries, submissions, settings, customTracks] = await Promise.all([
        DailyEntry.filter({ created_by: user.email }),
        Submission.filter({ created_by: user.email }),
        NotificationSettings.filter({ created_by: user.email }),
        CustomTrack.filter({ created_by: user.email })
      ]);

      const deletionPromises = [];
      if (entries) entries.forEach(e => deletionPromises.push(DailyEntry.delete(e.id)));
      if (submissions) submissions.forEach(s => deletionPromises.push(Submission.delete(s.id)));
      if (settings) settings.forEach(s => deletionPromises.push(NotificationSettings.delete(s.id)));
      if (customTracks) customTracks.forEach(ct => deletionPromises.push(CustomTrack.delete(ct.id)));
      
      await Promise.all(deletionPromises);

      // 2. Delete the user record itself
      await User.delete(user.id);
      
      // 3. Logout and redirect
      await User.logout();
      window.location.href = "/";
      
    } catch (error) {
      console.error("Error deleting account data:", error);
      alert("אירעה שגיאה במחיקת החשבון. אנא נסה שוב או פנה לתמיכה.");
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">טוען נתונים...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl("Home")} className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
            <ArrowRight className="w-5 h-5" />
            חזרה לדף הבית
          </Link>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800">הפרופיל שלי</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="full_name">שם מלא</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  placeholder="הכנס את שמך המלא"
                />
              </div>

              <div>
                <Label htmlFor="email">כתובת מייל</Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-gray-100"
                />
                <p className="text-sm text-gray-500 mt-1">לא ניתן לשנות את כתובת המייל</p>
              </div>

              <div>
                <Label htmlFor="phone">טלפון</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="מספר טלפון (אופציונלי)"
                />
              </div>

              <div>
                <Label htmlFor="track">המסלול הנוכחי שלי</Label>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex-1 p-3 bg-gray-100 rounded-md border">
                    <span className="text-gray-800 font-medium">
                      {user?.track === "מתמיד" ? "מסלול המתמיד" :
                       user?.track === "בקצב אישי" ? "מסלול בקצב אישי" :
                       user?.track === "מותאם אישית" ? "מסלול מותאם אישית" :
                       "לא נבחר מסלול"}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {/* כפתור עדכון מסלול - רק למסלול מותאם אישית */}
                    {user?.track === "מותאם אישית" && (
                      <Button 
                        variant="outline" 
                        onClick={() => setIsUpdateDialogOpen(true)}
                        className="border-blue-500 text-blue-600 hover:bg-blue-50"
                      >
                        <Settings className="w-4 h-4 ml-2" />
                        עדכון מסלול
                      </Button>
                    )}
                    
                    {/* כפתור שינוי מסלול */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50">
                          <RefreshCw className="w-4 h-4 ml-2" />
                          שינוי מסלול
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <div className="flex items-center gap-3">
                            <AlertTriangle className="w-8 h-8 text-orange-600" />
                            <AlertDialogTitle className="text-xl">שינוי מסלול רוחני</AlertDialogTitle>
                          </div>
                          <AlertDialogDescription className="text-base leading-relaxed pt-2">
                            <strong>שים לב!</strong>
                            <br />
                            שינוי המסלול יגרום לאיפוס מלא של כל נתוני ההתקדמות שלך:
                            <br />
                            <br />
                            • כל הרישומים היומיים שלך יימחקו
                            <br />
                            • השלב הנוכחי יאופס לשלב 1
                            <br />
                            • המסלול המותאם אישית (אם קיים) יימחק
                            <br />
                            • תתחיל את המסע מההתחלה עם מסלול חדש
                            <br />
                            <br />
                            <span className="text-orange-600 font-semibold">פעולה זו אינה הפיכה!</span>
                            <br />
                            <br />
                            האם אתה בטוח שברצונך להמשיך?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>ביטול</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleTrackReset}
                            disabled={isResettingTrack}
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            {isResettingTrack ? "מאפס מסלול..." : "כן, אני רוצה לשנות מסלול"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="current_stage">שלב נוכחי</Label>
                <Input
                  id="current_stage"
                  type="number"
                  value={formData.current_stage}
                  disabled
                  className="bg-gray-100"
                />
                 <p className="text-sm text-gray-500 mt-1">השלב מתעדכן אוטומטית עם התקדמותך במסע.</p>
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-4">
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSaving ? (
                  <>שומר נתונים...</>
                ) : (
                  <>
                    <Save className="w-4 h-4 ml-2" />
                    שמירת שינויים
                  </>
                )}
              </Button>

              {/* כפתור מחיקת חשבון */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="w-4 h-4 ml-2" />
                    איפוס ומחיקת חשבון
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-8 h-8 text-red-600" />
                      <AlertDialogTitle className="text-xl">איפוס ומחיקת חשבון</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="text-base leading-relaxed pt-2">
                      <strong>אזהרה!</strong>
                      <br />
                      פעולה זו תמחק לצמיתות את המשתמש שלך ואת כל נתוני ההתקדמות שלך באפליקציה.
                      <br />
                      <br />
                      לאחר המחיקה, תועבר החוצה ותצטרך להירשם מחדש כדי להתחיל את המסע מההתחלה.
                      <br />
                      <span className="text-red-600 font-semibold">לא ניתן לשחזר את הנתונים או את החשבון לאחר המחיקה!</span>
                      <br />
                      <br />
                      האם אתה בטוח שברצונך להמשיך?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>ביטול</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isDeleting ? "מוחק חשבון..." : "כן, מחק את החשבון שלי"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* דיאלוג עדכון מסלול */}
      <UpdateCustomTrackDialog 
        isOpen={isUpdateDialogOpen}
        onClose={() => setIsUpdateDialogOpen(false)}
        user={user}
        onTrackUpdated={loadUserData}
      />
    </div>
  );
}
