import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import WeeklyTimesheet from '@/components/timesheet/WeeklyTimesheet';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProjectDistribution from '@/components/dashboard/ProjectDistribution';
import WorkTypeDistribution from '@/components/dashboard/WorkTypeDistribution';
import { TimesheetAssistant } from '@/components/ai/TimesheetAssistant';

export default function Timesheet() {
  return (
    <AppLayout title="My Timesheet">
      <Tabs defaultValue="timesheet" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timesheet">Weekly Timesheet</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="timesheet" className="space-y-4">
          <TimesheetAssistant />
          <WeeklyTimesheet />
          
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-medium mb-4">Your Timesheet Guide</h3>
              
              <div className="space-y-4">
                <div className="rounded-md border p-4">
                  <h4 className="font-medium mb-2 flex items-center">
                    <svg className="mr-2 h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    Timesheet Entry Tips
                  </h4>
                  <ul className="list-disc pl-5 text-sm space-y-2 text-muted-foreground">
                    <li>Enter hours spent on each project and work order by day</li>
                    <li>Use decimals for partial hours (e.g., 1.5 for 1 hour and 30 minutes)</li>
                    <li>Save your timesheet regularly to avoid losing your work</li>
                    <li>Total working hours per day should not exceed standard working hours</li>
                  </ul>
                </div>
                
                <div className="rounded-md border p-4">
                  <h4 className="font-medium mb-2 flex items-center">
                    <svg className="mr-2 h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    Tracking Standards
                  </h4>
                  <ul className="list-disc pl-5 text-sm space-y-2 text-muted-foreground">
                    <li><strong>Validation:</strong> Include time spent on requirements verification, site inspections, and documentation reviews</li>
                    <li><strong>Design:</strong> Track time spent on internal design work, drafting, and technical specifications</li>
                    <li>Ensure descriptions are clear and specific to help with future reporting</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProjectDistribution />
          <WorkTypeDistribution />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
