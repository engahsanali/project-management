import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import ProjectList from '@/components/projects/ProjectList';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function Projects() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const initialSearch = searchParams.get('search') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [bulkActionMode, setBulkActionMode] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: projects, isLoading } = useQuery({
    queryKey: ['/api/projects'],
  });
  
  // Mutation for bulk deleting projects
  const bulkDeleteMutation = useMutation({
    mutationFn: async (projectIds: number[]) => {
      const response = await apiRequest('POST', '/api/projects/bulk-delete', { projectIds });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({
        title: "Projects deleted",
        description: `Successfully deleted ${selectedProjects.length} projects.`,
      });
      setSelectedProjects([]);
      setBulkActionMode(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete projects. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  const filteredProjects = React.useMemo(() => {
    if (!projects) return [];
    
    return projects.filter((project: any) => {
      const matchesSearch = searchQuery === '' || 
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Update URL with search params
    const newParams = new URLSearchParams(location.split('?')[1] || '');
    newParams.set('search', searchQuery);
    setLocation(`?${newParams.toString()}`);
  };
  
  const toggleSelectProject = (projectId: number) => {
    if (selectedProjects.includes(projectId)) {
      setSelectedProjects(prev => prev.filter(id => id !== projectId));
    } else {
      setSelectedProjects(prev => [...prev, projectId]);
    }
  };
  
  const toggleBulkMode = () => {
    setBulkActionMode(!bulkActionMode);
    if (bulkActionMode) {
      setSelectedProjects([]);
    }
  };
  
  const confirmDeleteProjects = () => {
    if (selectedProjects.length > 0) {
      bulkDeleteMutation.mutate(selectedProjects);
    }
  };
  
  const selectAllProjects = () => {
    if (!filteredProjects) return;
    
    if (selectedProjects.length === filteredProjects.length) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects(filteredProjects.map((project: any) => project.id));
    }
  };
  
  return (
    <AppLayout title="Projects">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <form onSubmit={handleSearch} className="w-full md:w-auto">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-w-[240px]"
            />
            <Button type="submit">Search</Button>
          </div>
        </form>
        
        <div className="flex gap-2 w-full md:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="design_review">Design Review</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          
          {bulkActionMode ? (
            <>
              <Button onClick={selectAllProjects} variant="outline">
                {selectedProjects.length === (filteredProjects?.length || 0) ? "Deselect All" : "Select All"}
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive"
                    disabled={selectedProjects.length === 0}
                  >
                    Delete Selected
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the {selectedProjects.length} selected project(s) and all associated work orders, timesheet entries, and events.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDeleteProjects}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              <Button onClick={toggleBulkMode} variant="outline">
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button onClick={toggleBulkMode} variant="outline">
                <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                Bulk Actions
              </Button>
              
              <Link href="/projects/new">
                <Button>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  New Project
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
      
      <ProjectList 
        projects={filteredProjects}
        isLoading={isLoading} 
        bulkMode={bulkActionMode}
        selectedProjects={selectedProjects}
        onToggleSelect={toggleSelectProject}
      />
    </AppLayout>
  );
}
