import React from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import AppLayout from '@/components/layout/AppLayout';
import ProjectForm from '@/components/projects/ProjectForm';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

export default function EditProject() {
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
  
  const handleSuccess = (project: any) => {
    if (project) {
      setLocation(`/projects/${project.id}`);
    } else {
      setLocation('/projects');
    }
  };
  
  if (error) {
    return null; // Will redirect via onError
  }
  
  return (
    <AppLayout title={isLoading ? "Loading..." : `Edit Project: ${project.title}`}>
      <div className="mb-6">
        <Link href={`/projects/${projectId}`}>
          <Button variant="outline" size="sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 h-4 w-4">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Project
          </Button>
        </Link>
        
        <h1 className="text-2xl font-bold mt-2">
          {isLoading ? "Loading..." : `Edit Project: ${project.title}`}
        </h1>
        <p className="text-muted-foreground">Update project details and information</p>
      </div>
      
      <ProjectForm projectId={projectId} onSuccess={handleSuccess} />
    </AppLayout>
  );
}
