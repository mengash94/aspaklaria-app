import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Submission } from '@/api/entities';
import LoginForm from '../components/compass/LoginForm';
import Questionnaire from '../components/compass/Questionnaire';
import ResultsDashboard from '../components/compass/ResultsDashboard';
import { Loader2 } from 'lucide-react';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const View = {
  LOADING: 'loading',
  LOGIN: 'login',
  QUESTIONNAIRE: 'questionnaire',
  DASHBOARD: 'dashboard'
};

export default function CompassPage() {
  const [view, setView] = useState(View.LOADING);
  const [user, setUser] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [key, setKey] = useState(Date.now());

  useEffect(() => {
    const checkUserAndData = async () => {
      setView(View.LOADING);
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        const userSubmissions = await Submission.list('-created_date');
        setSubmissions(userSubmissions);
        if (userSubmissions.length > 0) {
          setView(View.DASHBOARD);
        } else {
          setView(View.QUESTIONNAIRE);
        }
      } catch (error) {
        console.error("Auth check failed", error);
        setUser(null);
        setView(View.LOGIN);
      }
    };
    checkUserAndData();
  }, [key]);

  const refreshData = () => setKey(Date.now());

  const renderContent = () => {
    switch (view) {
      case View.LOADING:
        return (
          <div className="flex items-center justify-center h-screen bg-gray-50">
            <div className="text-center" dir="rtl">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
              <p className="mt-4 text-lg text-gray-700">טוען נתונים...</p>
            </div>
          </div>
        );
      case View.LOGIN:
        return <LoginForm onLoginSuccess={refreshData} />;
      case View.QUESTIONNAIRE:
        return <Questionnaire onSubmissionSuccess={refreshData} />;
      case View.DASHBOARD:
        return <ResultsDashboard submissions={submissions} onNewTest={() => setView(View.QUESTIONNAIRE)} />;
      default:
        return <LoginForm onLoginSuccess={refreshData} />;
    }
  };

  return (
      <div className="bg-gray-50 min-h-screen" dir="rtl">
        <header className="bg-white shadow-sm p-4">
            <div className="container mx-auto flex justify-between items-center">
                 <h1 className="text-2xl font-bold text-blue-700">מצפן הנשמה</h1>
                 <Link to={createPageUrl('Home')}>
                    <Button variant="outline">
                        <ArrowRight className="ml-2 h-4 w-4" />
                        חזור לאפליקציה הראשית
                    </Button>
                </Link>
            </div>
        </header>
        <main className="p-4">
            {renderContent()}
        </main>
      </div>
  );
}