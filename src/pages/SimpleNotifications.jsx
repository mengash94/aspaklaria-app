import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, ArrowRight, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

export default function SimpleNotificationsPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notificationStatus, setNotificationStatus] = useState('unknown'); // 'denied', 'granted', 'default', 'unknown'

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        
        // בדיקת מצב הרשאות דפדפן
        if ('Notification' in window) {
          setNotificationStatus(Notification.permission);
        }
      } catch (error) {
        console.error("Error loading user:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('הדפדפן שלך לא תומך בהתראות');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);
      
      if (permission === 'granted') {
        toast.success('הרשאה להתראות ניתנה בהצלחה!');
        
        // התראת בדיקה
        new Notification('🔔 המאמן הרוחני', {
          body: 'התראות מופעלות בהצלחה!',
          icon: '/icon-192.png'
        });
      } else {
        toast.error('לא ניתנה הרשאה להתראות');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('שגיאה בבקשת הרשאה');
    }
  };

  const sendTestNotification = () => {
    if (notificationStatus !== 'granted') {
      toast.error('אין הרשאה להתראות');
      return;
    }

    new Notification('🕯️ התראת בדיקה', {
      body: 'זוהי הודעת בדיקה מהמאמן הרוחני שלך',
      icon: '/icon-192.png'
    });
    
    toast.success('התראת בדיקה נשלחה!');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center" dir="rtl">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">טוען...</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = () => {
    switch (notificationStatus) {
      case 'granted':
        return <Badge className="bg-green-100 text-green-800">✅ מופעל</Badge>;
      case 'denied':
        return <Badge className="bg-red-100 text-red-800">❌ חסום</Badge>;
      case 'default':
        return <Badge className="bg-yellow-100 text-yellow-800">⏳ לא הוגדר</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">❓ לא ידוע</Badge>;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to={createPageUrl("Home")} className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
            <ArrowRight className="w-5 h-5" />
            חזור לדף הבית
          </Link>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center bg-blue-50">
            <CardTitle className="text-2xl font-bold text-blue-800 flex items-center justify-center gap-3">
              <Bell className="w-8 h-8" />
              מערכת התראות פשוטה
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-6 space-y-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                שלום {user?.full_name || 'משתמש'}! זוהי מערכת התראות פשוטה המבוססת על הדפדפן.
              </p>
              
              <div className="flex items-center justify-center gap-3 mb-6">
                <span className="text-lg font-medium">סטטוס התראות:</span>
                {getStatusBadge()}
              </div>
            </div>

            {notificationStatus === 'default' && (
              <Alert>
                <Bell className="h-4 w-4" />
                <AlertDescription>
                  כדי לקבל התראות, אנא לחץ על הכפתור למטה לאישור הרשאה.
                </AlertDescription>
              </Alert>
            )}

            {notificationStatus === 'denied' && (
              <Alert className="border-red-200">
                <AlertDescription className="text-red-700">
                  ההתראות נחסמו על ידך. כדי לאפשר אותן, עבור להגדרות הדפדפן ואשר התראות לאתר זה.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-3">
              {notificationStatus !== 'granted' ? (
                <Button 
                  onClick={requestNotificationPermission}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  בקש הרשאה להתראות
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="text-center">
                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                    <p className="text-green-700 font-medium">התראות מופעלות!</p>
                  </div>
                  
                  <Button 
                    onClick={sendTestNotification}
                    variant="outline"
                    className="w-full"
                  >
                    שלח התראת בדיקה
                  </Button>
                </div>
              )}
            </div>

            {notificationStatus === 'granted' && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">מה עכשיו?</h3>
                <p className="text-green-700 text-sm">
                  התראות מופעלות! המערכת תוכל לשלוח לך התראות על עדכונים במסע הרוחני שלך.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}