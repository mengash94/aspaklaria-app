import React, { useState } from "react";
import { User } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Loader2 } from "lucide-react";

const GoogleIcon = () => (
    <svg className="w-5 h-5" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Google</title><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.37 2.04-4.58 2.04-5.49 0-9.92-4.59-9.92-10.24s4.43-10.24 9.92-10.24c3.18 0 5.21 1.25 6.4 2.37l2.85-2.78C19.11 1.19 16.1.12 12.48.12 5.88.12 1.44 4.61 1.44 11.2s4.44 11.08 11.04 11.08c6.43 0 9.97-4.5 9.97-10.24 0-.74-.06-1.47-.19-2.2z" fill="currentColor"/></svg>
);

export default function WelcomePage() {
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        setIsLoading(true);
        try {
            await User.loginWithRedirect(window.location.origin + createPageUrl('Home'));
        } catch (error) {
            console.error("Login redirect failed:", error);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-sky-50" dir="rtl" style={{ fontFamily: 'Alegreya, serif' }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..900;1,400..900&display=swap');`}</style>
      
            <div className="w-full max-w-md text-center">
                <div className="w-24 h-24 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <BookOpen className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-blue-800 mb-4">המאמן הרוחני האישי</h1>
                <p className="text-gray-600 text-lg mb-8">
                    קיבלת הזמנה להצטרף למסע רוחני לגילוי הנשמה והחיבור האלוקי.
                </p>

                <Card className="bg-white shadow-lg border-gray-200 rounded-2xl overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-2xl text-gray-800">
                            הצטרף למסע
                        </CardTitle>
                        <CardDescription>
                            התחבר עם חשבון Google כדי להתחיל.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                        <Button 
                            onClick={handleLogin} 
                            disabled={isLoading} 
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3 text-lg"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>פותח...</span>
                                </>
                            ) : (
                                <>
                                    <GoogleIcon />
                                    <span>התחברות והרשמה עם Google</span>
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}