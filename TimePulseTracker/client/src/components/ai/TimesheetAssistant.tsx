import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, parse, isValid } from 'date-fns';

// Define the interface for a prompt example
interface PromptExample {
  text: string;
  description: string;
}

export function TimesheetAssistant() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState<string>('');
  const [processing, setProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<{ message: string; success: boolean } | null>(null);

  // Example prompts to help users understand what they can ask
  const examples: PromptExample[] = [
    {
      text: 'I worked on project PRJ-2023-0001 validation from 9:00 to 11:30 today on site inspection',
      description: 'Create an entry with times and description'
    },
    {
      text: 'Log 3 hours of internal design on PRJ-2023-0001 yesterday for network planning',
      description: 'Log hours with project reference and work type'
    },
    {
      text: 'I spent 2 hours on validation for North Metro Upgrade this morning from 10am to 12pm',
      description: 'Create entry using project name instead of reference'
    }
  ];

  // Create timesheet entry mutation
  const createEntry = useMutation({
    mutationFn: async (entry: any) => {
      const response = await apiRequest('POST', '/api/timesheet', entry);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/timesheet'] });
      toast({
        title: "Entry created",
        description: "Your timesheet entry has been created successfully."
      });
    },
    onError: (error) => {
      console.error('Error creating timesheet entry:', error);
      toast({
        title: "Error",
        description: "Failed to create timesheet entry. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Function to process the natural language prompt
  const processPrompt = async (userPrompt: string) => {
    try {
      setProcessing(true);
      
      // Extract project reference or name
      let projectRef: string | undefined;
      let projectName: string | undefined;
      
      // Check for project reference (format like PRJ-YYYY-NNNN)
      const refMatch = userPrompt.match(/PRJ-\d{4}-\d{4}/i);
      if (refMatch) {
        projectRef = refMatch[0];
      } else {
        // Check for project name
        const projectNames = await fetchProjects();
        for (const project of projectNames) {
          if (userPrompt.toLowerCase().includes(project.title.toLowerCase())) {
            projectName = project.title;
            projectRef = project.referenceNumber;
            break;
          }
        }
      }
      
      if (!projectRef && !projectName) {
        return {
          success: false,
          message: "I couldn't identify a project reference or name in your request. Please include a project reference (like PRJ-2023-0001) or a project name."
        };
      }
      
      // Determine work type (validation or internal design)
      let workType = '';
      if (userPrompt.toLowerCase().includes('validation')) {
        workType = 'validation';
      } else if (
        userPrompt.toLowerCase().includes('internal design') || 
        userPrompt.toLowerCase().includes('design')
      ) {
        workType = 'internal_design';
      } else {
        return {
          success: false,
          message: "I couldn't determine if you were working on validation or internal design. Please specify the type of work."
        };
      }
      
      // Extract hours or time range
      const hoursMatch = userPrompt.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/i);
      const timeRangeMatch = userPrompt.match(/(\d{1,2}(?::\d{2})?(?:am|pm)?)\s*(?:to|-)\s*(\d{1,2}(?::\d{2})?(?:am|pm)?)/i);
      
      let hours = 0;
      let startTime = '';
      let endTime = '';
      
      if (hoursMatch) {
        hours = parseFloat(hoursMatch[1]);
      } else if (timeRangeMatch) {
        // Parse time range
        startTime = normalizeTime(timeRangeMatch[1]);
        endTime = normalizeTime(timeRangeMatch[2]);
        
        // Calculate hours from time range
        hours = calculateHoursFromTimeRange(startTime, endTime);
      } else {
        return {
          success: false,
          message: "I couldn't determine how many hours you worked or what time range. Please specify either the number of hours or a time range (e.g., 9:00 to 12:00)."
        };
      }
      
      // Extract date
      let date = new Date();
      if (userPrompt.toLowerCase().includes('yesterday')) {
        date = addDays(date, -1);
      } else if (userPrompt.toLowerCase().includes('tomorrow')) {
        date = addDays(date, 1);
      }
      
      // Format date as YYYY-MM-DD
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      // Extract description
      let description = extractDescription(userPrompt, projectRef, projectName);
      
      // Now we need to fetch the workOrder ID for this project and work type
      const workOrders = await fetchWorkOrders(projectRef || '');
      const workOrder = workOrders.find((wo: any) => wo.type === workType);
      
      if (!workOrder) {
        return {
          success: false,
          message: `I couldn't find a ${workType} work order for this project. Please check the project reference and try again.`
        };
      }
      
      // Create the entry
      const entry = {
        workOrderId: workOrder.id,
        date: new Date(formattedDate), // Convert string to Date object
        hours,
        startTime,
        endTime,
        description
      };
      
      await createEntry.mutateAsync(entry);
      
      return {
        success: true,
        message: `Successfully logged ${hours.toFixed(2)} hours for ${projectRef || projectName} (${workType}) on ${formatDate(formattedDate)}${description ? ' with description: ' + description : ''}.`
      };
    } catch (error) {
      console.error('Error processing prompt:', error);
      return {
        success: false,
        message: "I encountered an error while processing your request. Please try again with more specific details."
      };
    } finally {
      setProcessing(false);
    }
  };
  
  // Extract meaningful description from prompt
  const extractDescription = (prompt: string, projectRef?: string, projectName?: string): string => {
    // List of common words to filter out to better identify the actual work description
    const commonWords = [
      'i', 'worked', 'on', 'project', 'for', 'from', 'to', 'hours', 'hour', 'validation', 
      'internal', 'design', 'today', 'yesterday', 'tomorrow', 'morning', 'afternoon',
      'spent', 'log', 'logged', 'please', 'create', 'entry'
    ];
    
    // Remove project reference or name
    let filteredPrompt = prompt.toLowerCase();
    if (projectRef) {
      filteredPrompt = filteredPrompt.replace(projectRef.toLowerCase(), '');
    }
    if (projectName) {
      filteredPrompt = filteredPrompt.replace(projectName.toLowerCase(), '');
    }
    
    // Remove time patterns
    filteredPrompt = filteredPrompt.replace(/\d{1,2}(?::\d{2})?(?:am|pm)?/g, '');
    filteredPrompt = filteredPrompt.replace(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/g, '');
    
    // Split into words and filter out common words
    const words = filteredPrompt.split(/\s+/);
    const meaningfulWords = words.filter(word => {
      const cleaned = word.replace(/[.,!?]/g, '');
      return cleaned.length > 2 && !commonWords.includes(cleaned);
    });
    
    // Join the meaningful words back into a sentence
    return meaningfulWords.join(' ').trim();
  };
  
  // Normalize time to HH:MM format
  const normalizeTime = (timeStr: string): string => {
    // Handle formats like 9am, 9:00am, 9, 9:00
    let time = timeStr.toLowerCase().trim();
    let hour = 0;
    let minute = 0;
    let isPM = time.includes('pm');
    
    // Remove am/pm
    time = time.replace(/[ap]m/, '');
    
    // Split into hours and minutes
    const parts = time.split(':');
    if (parts.length === 1) {
      // Just hours
      hour = parseInt(parts[0]);
      minute = 0;
    } else {
      // Hours and minutes
      hour = parseInt(parts[0]);
      minute = parseInt(parts[1]);
    }
    
    // Adjust for PM
    if (isPM && hour < 12) {
      hour += 12;
    }
    
    // Format as HH:MM
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };
  
  // Calculate hours from time range
  const calculateHoursFromTimeRange = (start: string, end: string): number => {
    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    // Calculate difference in hours
    return Math.round((endMinutes - startMinutes) / 60 * 100) / 100;
  };
  
  // Format date for display
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return format(date, 'EEEE, MMMM d');
  };
  
  // Fetch projects
  const fetchProjects = async () => {
    try {
      const response = await apiRequest('GET', '/api/projects');
      return await response.json();
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  };
  
  // Fetch work orders for a project
  const fetchWorkOrders = async (projectRef: string) => {
    try {
      // First get the project ID from the reference
      const projects = await fetchProjects();
      const project = projects.find((p: any) => p.referenceNumber === projectRef);
      
      if (!project) {
        throw new Error(`Project not found with reference: ${projectRef}`);
      }
      
      const response = await apiRequest('GET', `/api/projects/${project.id}/workorders`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching work orders:', error);
      return [];
    }
  };
  
  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      toast({
        title: "Empty prompt",
        description: "Please enter a description of your work.",
        variant: "destructive"
      });
      return;
    }
    
    setResult(null);
    const result = await processPrompt(prompt);
    setResult(result);
    
    if (result.success) {
      // Clear the prompt on success
      setPrompt('');
    }
  };
  
  // Example prompt handler
  const handleExampleClick = (exampleText: string) => {
    setPrompt(exampleText);
  };

  return (
    <Card className="w-full mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          Timesheet Assistant
        </CardTitle>
        <CardDescription>
          Describe what you worked on in natural language, and I'll create a timesheet entry for you.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ai-prompt">Tell me what you worked on</Label>
            <div className="flex">
              <Input
                id="ai-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., I worked on PRJ-2023-0001 validation from 9am to 11am today for site verification"
                className="flex-1"
                disabled={processing}
              />
              <Button type="submit" className="ml-2" disabled={processing}>
                {processing ? (
                  <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                )}
              </Button>
            </div>
          </div>
          
          {result && (
            <div className={`p-3 rounded-md text-sm ${result.success ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
              {result.message}
            </div>
          )}
          
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Example prompts</Label>
            <div className="flex flex-col gap-2">
              {examples.map((example, i) => (
                <Button
                  key={i}
                  variant="outline"
                  className="justify-start h-auto py-2 px-3 text-left"
                  onClick={() => handleExampleClick(example.text)}
                >
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                    <div>
                      <div className="font-medium text-left line-clamp-1">{example.text}</div>
                      <div className="text-xs text-muted-foreground">{example.description}</div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}