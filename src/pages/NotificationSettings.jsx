
// הנתיב: src/pages/NotificationSettingsPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@/api/entities';
import { sendOneSignalNotification } from '@/api/functions';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight, Bell, CheckCircle, XCircle, AlertTriangle, Send, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationSettingsPage() {
  const [user, setUser] = useState(null);
  const [oneSignalReady, setOneSignalReady] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [error, setError] = useState(null);
  const [isAttemptingRetry, setIsAttemptingRetry] = useState(false); // New state for retry button loading

  const loadOneSignal = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setOneSignalReady(false); // New: reset oneSignalReady state

    console.log('Attempting to init OneSignal at', window.location.origin);

    let cleaned = false;
    const cleanUp = () => { // New: cleanUp function to manage timeouts/intervals
      if (cleaned) return;
      cleaned = true;
      clearTimeout(timeoutId);
      clearInterval(pollId);
    };

    const onReady = () => { // New: unified onReady logic
      if (cleaned) return; // Prevent multiple executions if already cleaned up
      cleanUp(); // Clear timers once ready

      try {
        if (!window.OneSignal || !window.OneSignal.User || !window.OneSignal.User.PushSubscription) {
          throw new Error('OneSignal API לא זמין בדף זה (ייתכן שהדומיין לא מאושר).');
        }

        // Attach change listener only once per page load to prevent duplicate listeners
        if (!window.__onesignalChangeHandlerAttached) { // New: global flag for listener
          window.OneSignal.User.PushSubscription.addEventListener('change', (event) => {
            console.log("Push subscription changed:", event);
            // Use optional chaining and nullish coalescing for safety with event.current
            const isCurrentlySubscribed = event.current?.optedIn ?? false;
            setIsSubscribed(isCurrentlySubscribed);

            // Tagging the user if subscribed and user data is available
            if (isCurrentlySubscribed && user?.id) {
              window.OneSignal.User.addTag('user_id', user.id);
              window.OneSignal.User.addTag('user_email', user.email);
            }
          });
          window.__onesignalChangeHandlerAttached = true;
        }

        // Check current subscription status and tag if already subscribed
        const isAlreadySubscribed = !!window.OneSignal.User.PushSubscription.optedIn;
        setIsSubscribed(isAlreadySubscribed);

        if (isAlreadySubscribed && user?.id) {
          window.OneSignal.User.addTag('user_id', user.id);
          window.OneSignal.User.addTag('user_email', user.email);
        }

        setOneSignalReady(true);
        console.log('OneSignal initialization completed successfully');
      } catch (err) {
        console.error('Error connecting to OneSignal:', err);
        setError(`שגיאה בהתחברות ל-OneSignal: ${err.message}.
דומיין נוכחי: ${window.location.origin}.
ודא שהדומיין מוגדר ב-OneSignal Dashboard.`);
      } finally {
        setIsLoading(false);
        setIsAttemptingRetry(false); // Reset retry state in all final scenarios
      }
    };

    // 10s timeout guard for the entire OneSignal initialization process
    const timeoutId = setTimeout(() => { // New: timeout for the whole process
      cleanUp(); // Ensure all timers are cleared
      console.error('OneSignal initialization timed out for', window.location.origin);
      setError(`התחברות ל-OneSignal נכשלה (פסק זמן) עבור ${window.location.origin}.
אפשרויות:
1) בדוק את חיבור האינטרנט
2) ודא שהדומיין מאושר ב-OneSignal
3) נסה לרענן את הדף`);
      setIsLoading(false);
      setIsAttemptingRetry(false); // Reset retry state
    }, 10000); // 10 seconds timeout

    // Polling fallback (in case deferred/hook doesn't fire immediately or OneSignal SDK is already loaded)
    const pollId = setInterval(() => { // New: Polling mechanism
      if (window.OneSignal && window.OneSignal.User && window.OneSignal.User.PushSubscription) {
        onReady(); // If OneSignal is ready via polling, call onReady
      }
    }, 300); // Poll every 300ms

    // Use OneSignalDeferred (this array fires callbacks once the OneSignal SDK is fully loaded)
    if (!window.OneSignalDeferred) window.OneSignalDeferred = []; // Ensure OneSignalDeferred exists
    window.OneSignalDeferred.push(onReady); // Push onReady to deferred array
  }, [user]); // `user` is a dependency because `onReady` uses `user.id` and `user.email` for tagging.

  useEffect(() => {
    const initUserAndOneSignal = async () => {
      setIsLoading(true); // Ensure loading state is active
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        // loadOneSignal will be called in the next useEffect once user is set
      } catch (error) {
        console.error('Failed to load user or OneSignal:', error);
        setError('שגיאה בטעינת נתוני משתמש או מערכת ההתראות.');
        setIsLoading(false);
      }
    };
    initUserAndOneSignal();
  }, []); // This useEffect runs once on component mount to load user data.

  useEffect(() => {
    // This useEffect activates loadOneSignal only once the user data is available.
    if (user) {
      loadOneSignal();
    }
  }, [user, loadOneSignal]);

  // Effect to reset isAttemptingRetry when the global loading state or error state changes
  // This serves as an additional safeguard, though setIsAttemptingRetry(false) is now also called in loadOneSignal's success/error/timeout paths.
  useEffect(() => {
    if (isAttemptingRetry && !isLoading && !error) { // Only reset if not loading and no active error
      setIsAttemptingRetry(false);
    }
  }, [isLoading, isAttemptingRetry, error]);
  
  const handleRetry = useCallback(() => {
    setIsAttemptingRetry(true); // Set local loading state for the button
    loadOneSignal(); // Trigger the main OneSignal loading logic
  }, [loadOneSignal]); // loadOneSignal is a dependency, setIsAttemptingRetry is a stable setter

  const handleSubscriptionToggle = async () => {
    if (!oneSignalReady || !window.OneSignal) {
      toast.error('OneSignal עדיין לא מוכן');
      return;
    }

    try {
      if (isSubscribed) {
        await window.OneSignal.User.PushSubscription.optOut();
        setIsSubscribed(false); // עדכון סטטוס מיידי
        toast.success('ביטלת את המנוי להתראות');
      } else {
        await window.OneSignal.User.PushSubscription.optIn();
        setIsSubscribed(true); // עדכון סטטוס מיידי
        toast.success('נרשמת להתראות בהצלחה!');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('שגיאה בהגדרת ההתראות: ' + error.message);
    }
  };

  const sendTestNotification = async () => {
    if (!user) {
      toast.error('משתמש לא מחובר');
      return;
    }

    setIsSendingTest(true);
    try {
      const response = await sendOneSignalNotification({
        title: 'בדיקת התראה 📢',
        message: `שלום ${user.full_name || user.email}! זוהי התראת בדיקה מהמאמן הרוחני האישי.`,
        targetUserId: user.id
      });

      if (response.ok && response.data.success) {
        toast.success('התראת הבדיקה נשלחה! היא אמורה להגיע תוך מספר שניות.');
      } else {
        toast.error('שגיאה בשליחת התראת הבדיקה');
        console.error('Notification error:', response.data);
      }
    } catch (error) {
      console.error('Test notification error:', error);
      toast.error('שגיאה בשליחת התראת הבדיקה');
    } finally {
      setIsSendingTest(false);
    }
  };

  const renderStatus = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center gap-3 p-4 bg-red-50 text-red-800 border border-red-200 rounded-lg">
          <div className="flex items-center gap-3">
            <XCircle className="w-6 h-6" />
            <div>
              <p className="font-bold">אירעה שגיאה</p>
              <p className="text-sm whitespace-pre-wrap">{error}</p>
            </div>
          </div>
          <Button 
            onClick={handleRetry} 
            variant="destructive" 
            size="sm" 
            className="mt-2"
            disabled={isAttemptingRetry || isLoading} // Disable while attempting retry or general loading
          >
            {isAttemptingRetry || isLoading ? ( // Show loading spinner if attempting retry OR general loading
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                טוען...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 ml-2"/>
                נסה שוב
              </>
            )}
          </Button>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex items-center gap-3 p-4 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg">
          <Loader2 className="w-6 h-6 animate-spin" />
          <div>
            <p className="font-bold">טוען הגדרות התראות...</p>
            <p className="text-sm">מתחבר למערכת OneSignal</p>
          </div>
        </div>
      );
    }

    if (isSubscribed) {
      return (
        <div className="flex items-center gap-3 p-4 bg-green-50 text-green-800 border border-green-200 rounded-lg">
          <CheckCircle className="w-6 h-6" />
          <div>
            <p className="font-bold">ההתראות מופעלות</p>
            <p className="text-sm">אתה רשום לקבלת התראות</p>
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-3 p-4 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-lg">
          <AlertTriangle className="w-6 h-6" />
          <div>
            <p className="font-bold">ההתראות כבויות</p>
            <p className="text-sm">לחץ על "הירשם להתראות" כדי להפעיל</p>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Bell className="w-7 h-7 text-blue-600" />
            הגדרות התראות
          </h1>
          <Link to={createPageUrl('Home')}>
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              <span>חזרה</span>
            </Button>
          </Link>
        </header>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>ניהול התראות Push</CardTitle>
            <CardDescription>
              הירשם כדי לקבל תזכורות, עדכונים ומסרים מעוררי השראה ישירות למכשיר שלך.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderStatus()}

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={handleSubscriptionToggle}
                disabled={isLoading || !oneSignalReady || error}
                className={`flex-1 ${isSubscribed ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
              >
                {isSubscribed ? 'בטל הרשמה להתראות' : 'הירשם להתראות'}
              </Button>
              
              <Button 
                onClick={sendTestNotification} 
                variant="secondary" 
                className="flex-1"
                disabled={isLoading || !isSubscribed || isSendingTest || error}
              >
                {isSendingTest ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    שולח בדיקה...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 ml-2" />
                    שלח התראת בדיקה
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
