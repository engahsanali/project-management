import React from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import SummaryCards from '@/components/dashboard/SummaryCards';
import WeeklyTimesheet from '@/components/timesheet/WeeklyTimesheet';
import ProjectDistribution from '@/components/dashboard/ProjectDistribution';
import WorkTypeDistribution from '@/components/dashboard/WorkTypeDistribution';
import RecentActivity from '@/components/dashboard/RecentActivity';
import { useQuery } from '@tanstack/react-query';
import ProjectDetails from '@/components/projects/ProjectDetails';

export default function Dashboard() {
  const { data: projects } = useQuery({
    queryKey: ['/api/projects'],
  });
  
  // Get the first active project ID for the project details section
  const activeProjectId = projects && projects.length > 0 
    ? projects.find((p: any) => p.status === 'in_progress')?.id || projects[0].id
    : null;
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar />
      
      <main className="flex-1 md:ml-64 min-h-screen">
        <Header title="Dashboard" />
        
        <div className="p-4 md:p-6">
          <SummaryCards />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <WeeklyTimesheet />
              
              {activeProjectId && (
                <ProjectDetails projectId={activeProjectId} />
              )}
            </div>
            
            <div className="space-y-6">
              <ProjectDistribution />
              <WorkTypeDistribution />
              <RecentActivity />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
