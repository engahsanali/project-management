import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { formatDateTime } from '@/lib/date-utils';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

type ProjectTimelineProps = {
  projectId: number;
};

export default function ProjectTimeline({ projectId }: ProjectTimelineProps) {
  const { toast } = useToast();
  const [comment, setComment] = useState('');
  
  const { data: project, isLoading } = useQuery({
    queryKey: [`/api/projects/${projectId}`],
  });
  
  const addComment = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/projects/${projectId}/events`, {
        type: 'comment',
        content: comment,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      setComment('');
      toast({
        title: "Comment Added",
        description: "Your comment has been added to the project timeline.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      addComment.mutate();
    }
  };
  
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'status_change':
        return (
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
        );
      case 'comment':
        return (
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
        );
      case 'created':
        return (
          <div className="w-3 h-3 bg-primary rounded-full"></div>
        );
      default:
        return (
          <div className="w-3 h-3 bg-neutral-500 rounded-full"></div>
        );
    }
  };
  
  const getEventContent = (event: any) => {
    switch (event.type) {
      case 'status_change':
        return (
          <>
            <p className="text-sm font-medium mt-1">
              Status Change: <span className="text-primary">{event.content.split(': ')[1]}</span>
            </p>
            <p className="text-sm text-foreground mt-1">{event.content}</p>
          </>
        );
      case 'comment':
        return (
          <>
            <p className="text-sm font-medium mt-1">Comment Added</p>
            <p className="text-sm text-foreground mt-1">{event.content}</p>
          </>
        );
      case 'created':
        return (
          <>
            <p className="text-sm font-medium mt-1">Project Created</p>
            <p className="text-sm text-foreground mt-1">{event.content}</p>
          </>
        );
      default:
        return (
          <p className="text-sm text-foreground mt-1">{event.content}</p>
        );
    }
  };
  
  if (isLoading) {
    return (
      <div className="mt-6">
        <Skeleton className="h-5 w-32 mb-3" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex">
              <div className="flex flex-col items-center mr-4">
                <Skeleton className="w-3 h-3 rounded-full" />
                <Skeleton className="w-0.5 h-16" />
              </div>
              <div className="pb-5 space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="mt-6">
      <h3 className="text-sm font-medium text-foreground mb-3">Project Timeline</h3>
      
      <div className="space-y-4">
        {project.events && project.events.map((event: any, index: number) => (
          <div key={event.id} className="flex">
            <div className="flex flex-col items-center mr-4">
              {getEventIcon(event.type)}
              {index < project.events.length - 1 && <div className="w-0.5 h-full bg-neutral-200"></div>}
            </div>
            <div className={index < project.events.length - 1 ? "pb-5" : ""}>
              <p className="text-xs text-muted-foreground">{formatDateTime(event.createdAt)}</p>
              {getEventContent(event)}
            </div>
          </div>
        ))}
      </div>
      
      <form onSubmit={handleAddComment} className="mt-4">
        <div className="flex">
          <Input
            type="text"
            placeholder="Add a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="flex-1 rounded-l-md"
          />
          <Button 
            type="submit" 
            disabled={!comment.trim() || addComment.isPending}
            className="rounded-l-none"
          >
            Add
          </Button>
        </div>
      </form>
    </div>
  );
}
