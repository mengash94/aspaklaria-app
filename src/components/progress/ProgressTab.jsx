import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DailyTrackingTab from '../tracking/DailyTrackingTab';
import HistoryTab from '../history/HistoryTab';

export default function ProgressTab({ currentStageData, onEntryLogged, entries }) {
  return (
    <Tabs defaultValue="tracking" className="w-full" dir="rtl">
      <TabsList className="grid w-full grid-cols-2 bg-gray-100 rounded-lg p-1">
        <TabsTrigger value="tracking" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">מעקב יומי</TabsTrigger>
        <TabsTrigger value="history" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">היסטוריית התקדמות</TabsTrigger>
      </TabsList>
      <TabsContent value="tracking" className="mt-4">
        <DailyTrackingTab currentStageData={currentStageData} onEntryLogged={onEntryLogged} />
      </TabsContent>
      <TabsContent value="history" className="mt-4">
        <HistoryTab entries={entries} />
      </TabsContent>
    </Tabs>
  );
}