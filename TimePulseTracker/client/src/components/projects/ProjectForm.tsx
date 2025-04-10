import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

// Project status options
const projectStatuses = [
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'review', label: 'Review' },
  { value: 'more_information', label: 'More Information' },
  { value: 'pending', label: 'Pending' },
  { value: 'validation', label: 'Validation' },
  { value: 'redirected', label: 'Redirected' },
  { value: 'auto_expired', label: 'Auto Expired' },
];

// Form validation schema
const formSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
  referenceNumber: z.string().min(1, { message: 'Reference number is required' }),
  formCodeType: z.string().min(3, { message: 'Form code must be at least 3 characters' }),
  status: z.enum(['accepted', 'rejected', 'review', 'more_information', 'pending', 'validation', 'redirected', 'auto_expired']),
  notes: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof formSchema>;

type ProjectFormProps = {
  projectId?: number;
  onSuccess: (project: any) => void;
};

export default function ProjectForm({ projectId, onSuccess }: ProjectFormProps) {
  const { toast } = useToast();
  const isEditMode = !!projectId;
  
  // Fetch project data if in edit mode
  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: projectId ? [`/api/projects/${projectId}`] : [],
    enabled: !!projectId,
  } as any);
  
  // Set up form with default values
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      referenceNumber: 'PRJ-' + new Date().getFullYear() + '-',
      formCodeType: '',
      status: 'pending',
      notes: '',
    },
  });
  
  // Update form with project data when loaded
  React.useEffect(() => {
    if (project && isEditMode) {
      const typedProject = project as any;
      form.reset({
        title: typedProject.title || '',
        referenceNumber: typedProject.referenceNumber || '',
        formCodeType: typedProject.formCodeType || '',
        status: typedProject.status || 'pending',
        notes: typedProject.notes || '',
      });
    }
  }, [project, form, isEditMode]);
  
  // Handle form submission
  const onSubmit = async (data: ProjectFormValues) => {
    try {
      let response;
      
      if (isEditMode) {
        // Update existing project
        response = await apiRequest('PUT', `/api/projects/${projectId}`, data);
      } else {
        // Create new project
        response = await apiRequest('POST', '/api/projects', data);
      }
      
      const result = await response.json();
      
      toast({
        title: isEditMode ? "Project updated" : "Project created",
        description: isEditMode 
          ? "The project has been updated successfully."
          : "New project has been created successfully.",
      });
      
      onSuccess(result);
    } catch (error) {
      toast({
        title: "Error",
        description: isEditMode
          ? "Failed to update project. Please try again."
          : "Failed to create project. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  if (isLoadingProject && isEditMode) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="h-6 bg-neutral-100 rounded animate-pulse"></div>
            <div className="h-10 bg-neutral-100 rounded animate-pulse"></div>
            <div className="h-10 bg-neutral-100 rounded animate-pulse"></div>
            <div className="h-10 bg-neutral-100 rounded animate-pulse"></div>
            <div className="h-32 bg-neutral-100 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter project title" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter a descriptive name for the project.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="referenceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Reference Number</FormLabel>
                    <FormControl>
                      <Input placeholder="PRJ-2023-0001" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter a reference number for this project (e.g., PRJ-2023-0001)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="formCodeType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application Form Code Type</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. NM-DES-2023" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter the application form code.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Status</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projectStatuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Current status of the project.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add important details about the project"
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: Include any additional information about the project.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => onSuccess(null)}>
                Cancel
              </Button>
              <Button type="submit">
                {isEditMode ? 'Update Project' : 'Create Project'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
