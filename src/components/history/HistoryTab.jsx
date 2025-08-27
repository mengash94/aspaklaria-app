
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';

export default function HistoryTab({ entries }) {

  if (!entries || !Array.isArray(entries) || entries.length === 0) {
    return (
      <div className="text-center p-6 md:p-8">
        <p className="text-base md:text-lg text-gray-600 px-4">אין עדיין רישומים. התחל למלא מעקב יומי כדי לראות את ההיסטוריה שלך.</p>
      </div>
    );
  }

  const chartData = entries.filter(entry => entry && entry.date && entry.daily_rating).map(entry => ({
    date: format(parseISO(entry.date), 'd/M'),
    'דירוג יומי': entry.daily_rating,
  })).reverse();

  return (
    <div className="p-2 md:p-4 lg:p-6 space-y-6 md:space-y-8" style={{ fontFamily: 'Alegreya, serif' }}>
      <Card className="bg-white shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl lg:text-3xl text-blue-800">התקדמות לאורך זמן</CardTitle>
          <CardDescription className="text-sm md:text-base">גרף המציג את הדירוג היומי הכללי שלך</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[1, 10]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="דירוג יומי" stroke="#1d4ed8" strokeWidth={2} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl lg:text-3xl text-blue-800">פירוט רישומים יומיים</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {entries.filter(entry => entry && entry.date && entry.task_ratings).map(entry => (
              <AccordionItem key={entry.id} value={entry.id}>
                <AccordionTrigger className="text-base md:text-lg lg:text-xl font-bold">
                  {format(parseISO(entry.date), 'eeee, d MMMM yyyy', { locale: he })} - דירוג כללי: {entry.daily_rating}
                </AccordionTrigger>
                <AccordionContent className="p-4 bg-gray-50 rounded-md">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-base md:text-lg mb-2">דירוג משימות:</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {entry.task_ratings && Object.entries(entry.task_ratings).map(([task, rating]) => (
                          <li key={task} className="text-sm md:text-base"><strong>{task}:</strong> {rating}/10</li>
                        ))}
                      </ul>
                    </div>
                    {entry.notes && (
                      <div>
                        <h4 className="font-bold text-base md:text-lg mb-2">הערות:</h4>
                        <p className="text-gray-700 whitespace-pre-wrap text-sm md:text-base leading-relaxed">{entry.notes}</p>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
