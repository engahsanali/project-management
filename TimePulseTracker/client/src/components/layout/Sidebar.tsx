import React from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

export default function Sidebar() {
  const [location] = useLocation();

  const { data: projects } = useQuery<any[]>({
    queryKey: ['/api/projects'],
    staleTime: 60000, // 1 minute
  });

  return (
    <aside className="bg-white border-r border-neutral-100 w-full md:w-64 md:fixed md:h-screen overflow-y-auto shadow-sm">
      <div className="p-4 border-b border-neutral-100">
        <div className="flex items-center">
          <div className="rounded-md bg-primary w-8 h-8 flex items-center justify-center text-white font-bold">W</div>
          <span className="ml-2 text-lg font-semibold text-primary">WorkTrack</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Timesheet Manager</p>
      </div>

      <nav className="p-2 space-y-1">
        <Link href="/">
          <div className={cn(
            "flex items-center px-3 py-2 text-sm rounded-md font-medium cursor-pointer",
            location === "/" 
              ? "bg-primary-50 text-primary" 
              : "text-muted-foreground hover:bg-neutral-50"
          )}>
            <svg className="mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span>Dashboard</span>
          </div>
        </Link>

        <Link href="/timesheet">
          <div className={cn(
            "flex items-center px-3 py-2 text-sm rounded-md font-medium cursor-pointer",
            location === "/timesheet" 
              ? "bg-primary-50 text-primary" 
              : "text-muted-foreground hover:bg-neutral-50"
          )}>
            <svg className="mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>My Timesheet</span>
          </div>
        </Link>

        <Link href="/projects">
          <div className={cn(
            "flex items-center px-3 py-2 text-sm rounded-md font-medium cursor-pointer",
            location === "/projects" 
              ? "bg-primary-50 text-primary" 
              : "text-muted-foreground hover:bg-neutral-50"
          )}>
            <svg className="mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <span>Projects</span>
          </div>
        </Link>

        <Link href="/reports">
          <div className={cn(
            "flex items-center px-3 py-2 text-sm rounded-md font-medium cursor-pointer",
            location === "/reports" 
              ? "bg-primary-50 text-primary" 
              : "text-muted-foreground hover:bg-neutral-50"
          )}>
            <svg className="mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <span>Reports</span>
          </div>
        </Link>

        <div className="pt-4 pb-2">
          <div className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">My Projects</div>
        </div>

        {projects && Array.isArray(projects) ? projects.slice(0, 3).map((project: any) => (
          <div key={project.id} className="relative">
            <Link href={`/projects/${project.id}`}>
              <div className="flex items-center px-3 py-2 text-sm rounded-md text-muted-foreground hover:bg-neutral-50 cursor-pointer">
                <span className={cn(
                  "w-2 h-2 rounded-full mr-3",
                  project.status === "in_progress" ? "bg-green-500" :
                  project.status === "design_review" ? "bg-yellow-500" :
                  "bg-blue-500"
                )}></span>
                <span>{project.title}</span>
              </div>
            </Link>
          </div>
        )) : null}

        <Link href="/projects/new">
          <div className="flex items-center px-3 py-2 text-sm rounded-md text-primary hover:bg-neutral-50 cursor-pointer">
            <svg className="mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Add Project</span>
          </div>
        </Link>
      </nav>

      <div className="p-4 mt-4 border-t border-neutral-100">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-neutral-300 mr-3 flex items-center justify-center text-neutral-700">
            <span className="text-xs font-bold">SJ</span>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Sarah Johnson</p>
            <p className="text-xs text-muted-foreground">Design Engineer</p>
          </div>
        </div>
      </div>
    </aside>
  );
}