import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PersonalJournalTab from '../journal/PersonalJournalTab';
import DreamJournalTab from '../journal/DreamJournalTab';
import AiReflectionsTab from '../ai/AiReflectionsTab';

export default function WritingTab({ entries, currentStageData, user }) {
  return (
    <Tabs defaultValue="personal" className="w-full" dir="rtl">
      <TabsList className="grid w-full grid-cols-3 bg-gray-100 rounded-lg p-1">
        <TabsTrigger value="personal" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">יומן אישי</TabsTrigger>
        <TabsTrigger value="dreams" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">יומן חלומות</TabsTrigger>
        <TabsTrigger value="ai" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">הרהורים (AI)</TabsTrigger>
      </TabsList>
      <TabsContent value="personal" className="mt-4">
        <PersonalJournalTab />
      </TabsContent>
      <TabsContent value="dreams" className="mt-4">
        <DreamJournalTab />
      </TabsContent>
      <TabsContent value="ai" className="mt-4">
        <AiReflectionsTab entries={entries} currentStageData={currentStageData} user={user} />
      </TabsContent>
    </Tabs>
  );
}