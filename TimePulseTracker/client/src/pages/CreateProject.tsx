import React from 'react';
import { useLocation } from 'wouter';
import AppLayout from '@/components/layout/AppLayout';
import ProjectForm from '@/components/projects/ProjectForm';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

export default function CreateProject() {
  const [, setLocation] = useLocation();
  
  const handleSuccess = (project: any) => {
    if (project) {
      setLocation(`/projects/${project.id}`);
    } else {
      setLocation('/projects');
    }
  };
  
  return (
    <AppLayout title="Create New Project">
      <div className="mb-6">
        <Link href="/projects">
          <Button variant="outline" size="sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 h-4 w-4">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Projects
          </Button>
        </Link>
        
        <h1 className="text-2xl font-bold mt-2">Create New Project</h1>
        <p className="text-muted-foreground">Add a new project to track validation and design work</p>
      </div>
      
      <ProjectForm onSuccess={handleSuccess} />
    </AppLayout>
  );
}
