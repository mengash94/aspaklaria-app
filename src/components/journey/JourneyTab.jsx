import React, { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, Zap, BookOpen, Calendar, TrendingUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { LearningSchedule } from '@/api/entities';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const QuickActionCard = ({ to, icon, title, subtitle, className }) => (
    <Link to={to} className={`block rounded-lg p-3 text-center transition-shadow hover:shadow-md ${className}`}>
        {icon}
        <h3 className="font-semibold text-sm text-gray-800 mt-2">{title}</h3>
        {subtitle && <p className="text-xs text-gray-600">{subtitle}</p>}
    </Link>
);


export default function JourneyTab({ currentStageData, nextMeditation }) {
  const [nextSchedule, setNextSchedule] = useState(null);

  useEffect(() => {
    const fetchNextSchedule = async () => {
      const today = new Date().toISOString();
      const upcomingSchedules = await LearningSchedule.filter(
        { isCompleted: false, scheduledAt: { $gte: today } },
        'scheduledAt',
        1
      );
      if (upcomingSchedules && upcomingSchedules.length > 0) {
        setNextSchedule(upcomingSchedules[0]);
      }
    };
    fetchNextSchedule();
  }, []);

  if (!currentStageData) {
    return <div className="text-center p-8">טוען נתוני שלב...</div>;
  }

  const { stage_number, stage_name, description, learning_material, daily_tasks, success_metrics } = currentStageData;

  return (
    <div className="space-y-6 p-2 md:p-4" style={{ fontFamily: 'Alegreya, serif' }}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-blue-800 mb-2">{stage_name}</h2>
        <div className="flex items-center justify-center gap-2 text-gray-600 mb-3">
          <span className="text-sm">שלב {stage_number} מתוך 10</span>
          <div className="w-32 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(stage_number / 10) * 100}%` }}
            ></div>
          </div>
        </div>
        <p className="max-w-2xl mx-auto text-gray-700 leading-relaxed text-sm md:text-base">{description}</p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-3">
          {nextMeditation && (
              <QuickActionCard 
                to={createPageUrl(`PracticeSession?meditationId=${nextMeditation.id}`)}
                icon={<Zap className="w-6 h-6 mx-auto text-yellow-600" />}
                title="התרגול הבא"
                subtitle={nextMeditation.title}
                className="bg-yellow-50 border border-yellow-200"
              />
          )}
          {nextSchedule && (
              <QuickActionCard 
                to={createPageUrl('BeitMidrash')}
                icon={<Calendar className="w-6 h-6 mx-auto text-blue-600" />}
                title="הלימוד הבא"
                subtitle={`${nextSchedule.title} - ${format(new Date(nextSchedule.scheduledAt), 'd MMM', { locale: he })}`}
                className="bg-blue-50 border border-blue-200"
              />
          )}
          <QuickActionCard 
              to={createPageUrl('Home?tab=progress')}
              icon={<TrendingUp className="w-6 h-6 mx-auto text-green-600" />}
              title="מעקב יומי"
              subtitle="רישום התקדמות"
              className="bg-green-50 border border-green-200"
          />
          <QuickActionCard 
              to={createPageUrl('BeitMidrash')}
              icon={<BookOpen className="w-6 h-6 mx-auto text-purple-600" />}
              title="בית המדרש"
              subtitle="תכנון לימודים"
              className="bg-purple-50 border border-purple-200"
          />
      </div>

      {/* Expandable Content Sections */}
      <Accordion type="single" collapsible className="w-full space-y-3">
        <AccordionItem value="item-1" className="bg-white rounded-lg border shadow-sm">
          <AccordionTrigger className="p-4 text-base font-semibold hover:no-underline flex justify-between w-full">
            <span className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-blue-600" />חומר לימוד והעמקה</span>
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
          </AccordionTrigger>
          <AccordionContent className="p-4 pt-0">
            <div className="prose prose-sm max-w-none text-gray-800">
              <ReactMarkdown>{learning_material}</ReactMarkdown>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2" className="bg-white rounded-lg border shadow-sm">
          <AccordionTrigger className="p-4 text-base font-semibold hover:no-underline flex justify-between w-full">
            <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-600" />משימות יומיות</span>
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
          </AccordionTrigger>
          <AccordionContent className="p-4 pt-0">
            <ul className="space-y-2 pt-2 pr-5">
              {daily_tasks.map((task, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span className="text-sm text-gray-800 leading-relaxed">{task}</span>
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3" className="bg-white rounded-lg border shadow-sm">
          <AccordionTrigger className="p-4 text-base font-semibold hover:no-underline flex justify-between w-full">
            <span className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-indigo-600" />מדדי הצלחה</span>
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
          </AccordionTrigger>
          <AccordionContent className="p-4 pt-0">
            <div className="prose prose-sm max-w-none text-gray-800">
               <ReactMarkdown>{success_metrics}</ReactMarkdown>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}