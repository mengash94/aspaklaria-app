

import React, { useEffect } from 'react';
import InstallPrompt from "@/components/pwa/InstallPrompt";
import { Toaster } from "@/components/ui/sonner";

export default function Layout({ children, currentPageName }) {
  const createIcon = (size) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2 - 4, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = size/24;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    const bookWidth = size * 0.4;
    const bookHeight = size * 0.5;
    const centerX = size / 2;
    const centerY = size / 2;
    const bookLeft = centerX - bookWidth / 2;
    const bookTop = centerY - bookHeight / 2;
    
    // Left page
    ctx.beginPath();
    ctx.moveTo(bookLeft, bookTop);
    ctx.lineTo(bookLeft + bookWidth/2, bookTop);
    ctx.lineTo(bookLeft + bookWidth/2, bookTop + bookHeight); // Fixed 'top' to 'bookTop'
    ctx.lineTo(bookLeft, bookTop + bookHeight); // Fixed 'top' to 'bookTop'
    ctx.stroke();
    
    // Right page
    ctx.beginPath();
    ctx.moveTo(centerX, bookTop);
    ctx.lineTo(bookLeft + bookWidth, bookTop);
    ctx.lineTo(bookLeft + bookWidth, bookTop + bookHeight); // Fixed 'top' to 'bookTop'
    ctx.lineTo(centerX, bookTop + bookHeight); // Fixed 'top' to 'bookTop'
    ctx.stroke();
    
    return canvas.toDataURL('image/png');
  };

  const icon192 = createIcon(192);
  const icon512 = createIcon(512);

  const manifestObj = {
    name: "המאמן הרוחני האישי - מסע לגילוי הנשמה",
    short_name: "המאמן הרוחני",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2563eb",
    orientation: "portrait",
    lang: "he",
    dir: "rtl",
    icons: [
      { 
        src: icon192, 
        sizes: "192x192", 
        type: "image/png", 
        purpose: "any maskable" 
      },
      { 
        src: icon512, 
        sizes: "512x512", 
        type: "image/png", 
        purpose: "any maskable" 
      }
    ]
  };
  
  const manifestDataUrl = `data:application/manifest+json;charset=utf-8,${encodeURIComponent(JSON.stringify(manifestObj))}`;

  useEffect(() => {
    // הגדרת משתנה גלובלי לאייקון ההתראות
    window.notificationIcon = icon192;
  }, [icon192]);

  // הזרקת תגיות head + סקריפט OneSignal כראוי למסמך
  useEffect(() => {
    // ✅ FIX: Don't run this DOM manipulation logic inside an iframe (like the preview)
    // This prevents the cross-origin security error.
    if (window.self !== window.top) {
      document.title = "המאמן הרוחני (תצוגה מקדימה)";
      return;
    }

    document.title = "המאמן הרוחני האישי";

    const upsert = (tagName, id, attrs = {}, textContent) => {
      let el = document.getElementById(id);
      if (!el) {
        el = document.createElement(tagName);
        el.id = id;
        document.head.appendChild(el);
      }
      Object.entries(attrs).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        if (k in el) {
          try { el[k] = v; } catch { el.setAttribute(k, v); }
        } else {
          el.setAttribute(k, v);
        }
      });
      if (typeof textContent === 'string') el.textContent = textContent;
      return el;
    };

    // Meta tags
    upsert('meta', 'meta-charset', { charset: 'utf-8' });
    upsert('meta', 'meta-viewport', { name: 'viewport', content: 'width=device-width, initial-scale=1, user-scalable=no' });
    upsert('meta', 'meta-theme-color', { name: 'theme-color', content: '#2563eb' });
    upsert('meta', 'meta-description', { name: 'description', content: 'אפליקציה לליווי רוחני אישי ופיתוח נשמתי' });
    upsert('meta', 'meta-apple-mobile-web-app-capable', { name: 'apple-mobile-web-app-capable', content: 'yes' });
    upsert('meta', 'meta-apple-mobile-web-app-status-bar-style', { name: 'apple-mobile-web-app-status-bar-style', content: 'default' });
    upsert('meta', 'meta-apple-mobile-web-app-title', { name: 'apple-mobile-web-app-title', content: 'המאמן הרוחני' });

    // Links
    upsert('link', 'link-manifest', { rel: 'manifest', href: manifestDataUrl });
    upsert('link', 'link-favicon', { rel: 'icon', href: icon192 });
    upsert('link', 'link-apple-touch-icon', { rel: 'apple-touch-icon', href: icon192 });

    // OneSignal SDK
    if (!document.getElementById('onesignal-sdk')) {
      upsert('script', 'onesignal-sdk', { src: 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js', defer: true });
    }

    // OneSignal init
    if (!window.OneSignalDeferred) window.OneSignalDeferred = [];
    if (!window.__onesignalInitialized) {
      window.OneSignalDeferred.push(function(OneSignal) {
        try {
          if (window.__onesignalInitialized) return;
          OneSignal.init({
            appId: "6bad0788-1f97-49c1-9433-1ee9b8e22ca7",
            promptOptions: { slidedown: { enabled: false } },
            serviceWorkerParam: { scope: "/" }
          });
          window.__onesignalInitialized = true;
          console.log("OneSignal initialized");
        } catch (e) {
          console.error("OneSignal init error:", e);
        }
      });
    }
  }, [manifestDataUrl, icon192]);

  return (
    <div>
      {children}
      <InstallPrompt />
      <Toaster richColors position="top-center" />
    </div>
  );
}

