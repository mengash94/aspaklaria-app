
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download } from "lucide-react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // ✅ FIX: Don't run PWA installation logic inside an iframe
    // window.self refers to the current window, window.top refers to the top-most window in the browsing context.
    // If they are not equal, it means the current window is inside an iframe.
    if (window.self !== window.top) {
      return;
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setVisible(false);
      setTimeout(() => setInstalled(false), 4000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  // ✅ FIX: Don't render anything if not visible or installed
  if (!visible && !installed) return null;
  
  // ✅ FIX: Also don't render if in an iframe (double safety)
  if (window.self !== window.top) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50" dir="rtl">
      {visible && (
        <Card className="p-3 shadow-lg bg-white border border-blue-200">
          <div className="flex items-center gap-3">
            <Download className="w-5 h-5 text-blue-600" />
            <div className="text-sm">
              <div className="font-semibold text-blue-800">להתקין את האפליקציה?</div>
              <div className="text-gray-600">לחץ התקנה להוספה למסך הבית</div>
            </div>
            <div className="flex-1" />
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleInstall}>
              התקן
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setVisible(false)}>סגור</Button>
          </div>
        </Card>
      )}
      {installed && (
        <Card className="p-3 shadow-lg bg-white border border-green-200">
          <div className="text-sm text-green-700">ההאפליקציה הותקנה בהצלחה 🎉</div>
        </Card>
      )}
    </div>
  );
}
