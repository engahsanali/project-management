import React from 'react';
import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDate } from '@/lib/date-utils';

type ProjectListProps = {
  projects: any[];
  isLoading: boolean;
  bulkMode?: boolean;
  selectedProjects?: number[];
  onToggleSelect?: (projectId: number) => void;
}

export default function ProjectList({ 
  projects, 
  isLoading, 
  bulkMode = false,
  selectedProjects = [],
  onToggleSelect = () => {}
}: ProjectListProps) {
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
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-6 w-64" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                </div>
                <div className="flex flex-col md:items-end gap-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-9 w-28" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <svg className="mx-auto h-12 w-12 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
            <polyline points="13 2 13 9 20 9"></polyline>
          </svg>
          <h3 className="mt-2 text-lg font-medium">No projects found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your search or filter criteria.
          </p>
          <div className="mt-4">
            <Link href="/projects/new">
              <Button>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Create a project
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <Card key={project.id} className={selectedProjects.includes(project.id) ? "border-primary" : ""}>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {bulkMode && (
                    <Checkbox 
                      checked={selectedProjects.includes(project.id)} 
                      onCheckedChange={() => onToggleSelect(project.id)}
                      className="mr-2"
                    />
                  )}
                  <h3 className="text-lg font-medium">{project.title}</h3>
                </div>
                <div className="flex flex-wrap gap-2 mt-1 mb-2">
                  {getStatusBadge(project.status)}
                  <Badge variant="outline" className="font-mono">{project.referenceNumber}</Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.notes || "No description available"}
                </p>
                
                <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium text-foreground">{project.totalHours || 0}</span> total hours
                  </div>
                  <div>
                    <span className="font-medium text-foreground">{project.validationHours || 0}</span> validation hours
                  </div>
                  <div>
                    <span className="font-medium text-foreground">{project.designHours || 0}</span> design hours
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col md:items-end">
                <div className="text-sm text-muted-foreground">
                  Form Code: <span className="font-mono">{project.formCodeType}</span>
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  Created: {formatDate(project.createdAt)}
                </div>
                {!bulkMode && (
                  <Link href={`/projects/${project.id}`}>
                    <Button variant="outline">View Project</Button>
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
