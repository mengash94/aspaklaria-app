import React, { useState } from 'react';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Compass, Loader2 } from 'lucide-react';

const GoogleIcon = () => (
    <svg className="w-5 h-5" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Google</title><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.37 2.04-4.58 2.04-5.49 0-9.92-4.59-9.92-10.24s4.43-10.24 9.92-10.24c3.18 0 5.21 1.25 6.4 2.37l2.85-2.78C19.11 1.19 16.1.12 12.48.12 5.88.12 1.44 4.61 1.44 11.2s4.44 11.08 11.04 11.08c6.43 0 9.97-4.5 9.97-10.24 0-.74-.06-1.47-.19-2.2z" fill="currentColor"/></svg>
);

export default function LoginForm({ onLoginSuccess }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await User.login();
      // onLoginSuccess will be called by the parent page's reload mechanism
    } catch (error) {
      console.error('Login failed:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh] p-4" dir="rtl">
      <Card className="w-full max-w-md shadow-lg rounded-2xl">
        <CardHeader className="text-center">
            <Compass className="mx-auto h-12 w-12 text-blue-600 mb-4" />
          <CardTitle className="text-3xl font-bold">מצפן הנשמה</CardTitle>
          <CardDescription>גלה את המסע הרוחני שלך</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <p className="text-center text-gray-600 mb-6">כדי להתחיל, יש להתחבר באמצעות חשבון Google מאובטח.</p>
          <Button onClick={handleLogin} disabled={isLoading} className="w-full text-lg py-6 bg-blue-600 hover:bg-blue-700 flex items-center gap-3">
            {isLoading ? <Loader2 className="animate-spin" /> : <GoogleIcon />}
            {isLoading ? 'מתחבר...' : 'התחבר עם Google'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}