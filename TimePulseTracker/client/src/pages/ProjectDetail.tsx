import React from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import AppLayout from '@/components/layout/AppLayout';
import ProjectDetails from '@/components/projects/ProjectDetails';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProjectDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const projectId = Number(id);
  
  const { data: project, isLoading, error } = useQuery({
    queryKey: [`/api/projects/${projectId}`],
    onError: () => {
      // Redirect to projects page if project doesn't exist
      setLocation('/projects');
    }
  });
  
  if (error) {
    return null; // Will redirect via onError
  }
  
  return (
    <AppLayout title={isLoading ? "Loading Project..." : `Project: ${project.title}`}>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <Link href="/projects">
            <Button variant="outline" size="sm" className="mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 h-4 w-4">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back to Projects
            </Button>
          </Link>
          
          {isLoading ? (
            <Skeleton className="h-9 w-72" />
          ) : (
            <h1 className="text-2xl font-bold">{project.title}</h1>
          )}
        </div>
        
        {!isLoading && (
          <div className="flex space-x-2">
            <Link href={`/projects/${projectId}/edit`}>
              <Button variant="outline">
                <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit Project
              </Button>
            </Link>
          </div>
        )}
      </div>
      
      <ProjectDetails projectId={projectId} />
    </AppLayout>
  );
}
