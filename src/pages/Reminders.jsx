import React from 'react';
import { User } from '@/api/entities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import ReminderForm from '../components/reminders/ReminderForm';

export default function RemindersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" dir="rtl">
      <header className="bg-white shadow-sm p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-700">תזכורות אישיות</h1>
          <Link to={createPageUrl('Home')}>
            <Button variant="outline">
              <ArrowRight className="ml-2 h-4 w-4" />
              חזור לאפליקציה הראשית
            </Button>
          </Link>
        </div>
      </header>
      
      <main className="py-8">
        <ReminderForm />
      </main>
      
      <footer className="text-center text-sm text-gray-600 p-4">
        התזכורות נשלחות באמצעות Firebase Cloud Messaging
      </footer>
    </div>
  );
}