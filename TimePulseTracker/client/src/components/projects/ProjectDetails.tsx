import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';
import ProjectTimeline from './ProjectTimeline';

type ProjectDetailsProps = {
  projectId: number;
};

export default function ProjectDetails({ projectId }: ProjectDetailsProps) {
  const { data: project, isLoading } = useQuery({
    queryKey: [`/api/projects/${projectId}`],
  });
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-9 w-32" />
          </div>
          
          <div className="border rounded-lg divide-y">
            <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Skeleton className="h-5 w-40 mb-1" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
            
            <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-4 w-40" />
              </div>
              <div className="md:col-span-3 space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
            
            <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="md:col-span-3">
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <Badge variant="success">In Progress</Badge>;
      case 'design_review':
        return <Badge variant="warning">Design Review</Badge>;
      case 'completed':
        return <Badge variant="info">Completed</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-foreground">Project Details</h2>
          <Link href={`/projects/${projectId}/edit`}>
            <Button variant="outline" className="flex items-center">
              <svg className="mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit Project
            </Button>
          </Link>
        </div>
        
        <div className="border rounded-lg divide-y">
          <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <h3 className="text-sm font-medium text-foreground">Project Information</h3>
              <p className="text-xs text-muted-foreground mt-1">Basic project details</p>
            </div>
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Project Title</p>
                <p className="text-sm font-medium">{project.title}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Project Reference</p>
                <p className="text-sm font-medium font-mono">{project.referenceNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Application Form Code</p>
                <p className="text-sm font-medium font-mono">{project.formCodeType}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Current Status</p>
                {getStatusBadge(project.status)}
              </div>
            </div>
          </div>
          
          <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <h3 className="text-sm font-medium text-foreground">Work Orders</h3>
              <p className="text-xs text-muted-foreground mt-1">Associated work orders</p>
            </div>
            <div className="md:col-span-3 space-y-3">
              {project.workOrders.map((workOrder: any) => (
                <div key={workOrder.id} className="flex items-center justify-between border p-3 rounded-md">
                  <div>
                    <Badge 
                      variant={workOrder.type === 'validation' ? 'validation' : 'design'} 
                      className="mb-1"
                    >
                      {workOrder.type === 'validation' ? 'Validation' : 'Design'}
                    </Badge>
                    <p className="text-sm font-medium">{workOrder.description}</p>
                    <p className="text-xs text-muted-foreground">Work Order: {workOrder.identifier}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{workOrder.totalHours || 0} hrs</p>
                    <p className="text-xs text-muted-foreground">Total hours</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <h3 className="text-sm font-medium text-foreground">Project Notes</h3>
              <p className="text-xs text-muted-foreground mt-1">Important details</p>
            </div>
            <div className="md:col-span-3">
              <p className="text-sm text-foreground">
                {project.notes || "No notes available for this project."}
              </p>
            </div>
          </div>
        </div>

        <ProjectTimeline projectId={projectId} />
      </CardContent>
    </Card>
  );
}
