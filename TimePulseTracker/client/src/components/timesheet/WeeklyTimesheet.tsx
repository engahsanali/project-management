import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose
} from '@/components/ui/dialog';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { getWeekDates, formatWeekRange, formatDay } from '@/lib/date-utils';
import { addDays, format, parseISO, isValid, parse } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import ProjectForm from '@/components/projects/ProjectForm';
import SmartSuggestions from '@/components/timesheet/SmartSuggestions';

// Optimization: Use SVG components to reduce rerendering
const PreviousIcon = () => (
  <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const NextIcon = () => (
  <svg className="h-4 w-4 ml-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12"></path>
  </svg>
);

type TimesheetEntry = {
  id?: number;
  workOrderId: number;
  date: Date | string;
  hours: number;
  startTime?: string;
  endTime?: string;
  description?: string;
  userId?: number;
  breakTaken?: boolean;
  breakDuration?: number; // in minutes
  isLeave?: boolean;
  leaveType?: string; // full-day, half-day, hours
  leaveHours?: number; // if leaveType is "hours"
};

export default function WeeklyTimesheet() {
  const { toast } = useToast();
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay();
    // If it's a weekend, show the previous week
    if (day === 0 || day === 6) {
      return addDays(today, 1 - day); // Monday
    }
    return addDays(today, 1 - day); // Monday
  });
  
  const weekEnd = addDays(currentWeekStart, 4); // Friday
  const weekDates = getWeekDates(currentWeekStart);
  const dateStrings = weekDates.map(d => format(d, 'yyyy-MM-dd'));
  
  // Entry form state
  const [selectedDate, setSelectedDate] = useState<string | Date | null>(null);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<number | null>(null);
  const [hours, setHours] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('17:00');
  const [entryDialogOpen, setEntryDialogOpen] = useState(false);
  const [editEntryId, setEditEntryId] = useState<number | null>(null);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  
  // Break time tracking
  const [breakTaken, setBreakTaken] = useState(false);
  const [breakDuration, setBreakDuration] = useState('30');
  
  // Leave tracking
  const [isLeave, setIsLeave] = useState(false);
  const [leaveType, setLeaveType] = useState('full-day');
  const [leaveHours, setLeaveHours] = useState('8');
  
  // Fetch timesheet entries for the current week
  const { data: entries, isLoading: isLoadingEntries } = useQuery({
    queryKey: [`/api/timesheet`, { start: format(currentWeekStart, 'yyyy-MM-dd'), end: format(weekEnd, 'yyyy-MM-dd') }],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/timesheet?start=${format(currentWeekStart, 'yyyy-MM-dd')}&end=${format(weekEnd, 'yyyy-MM-dd')}`);
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Failed to fetch timesheet entries:", error);
        return [];
      }
    }
  });
  
  // Fetch projects for selection
  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['/api/projects'],
  });
  
  // Define a type for work order with project info
  type WorkOrderWithProject = {
    id: number;
    name: string;
    type: string; 
    projectId: number;
    projectTitle: string;
    projectReference: string;
  };
  
  // Create a flat list of work orders with project info
  const workOrders = React.useMemo<WorkOrderWithProject[]>(() => {
    if (!projects || !Array.isArray(projects)) return [];
    
    return projects.flatMap((project: any) => {
      return (project.workOrders || []).map((workOrder: any) => ({
        id: workOrder.id,
        name: workOrder.type === 'validation' ? 'Validation' : 'Internal Design',
        type: workOrder.type,
        projectId: project.id,
        projectTitle: project.title,
        projectReference: project.referenceNumber
      }));
    });
  }, [projects]);
  
  // Create timesheet entry
  const createMutation = useMutation({
    mutationFn: async (entry: TimesheetEntry) => {
      const response = await apiRequest('POST', '/api/timesheet', entry);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/timesheet'] });
      toast({
        title: "Entry saved",
        description: "Your timesheet entry has been saved successfully."
      });
      resetForm();
      setEntryDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save timesheet entry. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Update timesheet entry
  const updateMutation = useMutation({
    mutationFn: async ({ id, entry }: { id: number, entry: Partial<TimesheetEntry> }) => {
      const response = await apiRequest('PUT', `/api/timesheet/${id}`, entry);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/timesheet'] });
      toast({
        title: "Entry updated",
        description: "Your timesheet entry has been updated successfully."
      });
      resetForm();
      setEntryDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update timesheet entry. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Delete timesheet entry
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/timesheet/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/timesheet'] });
      toast({
        title: "Entry deleted",
        description: "Your timesheet entry has been deleted successfully."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete timesheet entry. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Go to previous week
  const goToPreviousWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, -7));
  };
  
  // Go to next week
  const goToNextWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, 7));
  };
  
  // Go to current week
  const goToCurrentWeek = () => {
    setCurrentWeekStart(() => {
      const today = new Date();
      const day = today.getDay();
      // If it's a weekend, show the previous week
      if (day === 0 || day === 6) {
        return addDays(today, 1 - day); // Monday
      }
      return addDays(today, 1 - day); // Monday
    });
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedWorkOrder || !hours || !startTime || !endTime) {
      toast({
        title: "Missing information",
        description: "Please fill out all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    // Calculate hours from start and end time if hours is not directly entered
    const calculatedHours = calculateHoursFromTime(startTime, endTime);
    
    const entryData: TimesheetEntry = {
      date: selectedDate ? new Date(selectedDate) : new Date(),
      workOrderId: selectedWorkOrder,
      hours: parseFloat(hours) || calculatedHours,
      startTime,
      endTime,
      description: description || undefined,
      breakTaken,
      breakDuration: breakTaken ? parseInt(breakDuration) : undefined,
      isLeave,
      leaveType: isLeave ? leaveType : undefined,
      leaveHours: isLeave && leaveType === 'hours' ? parseFloat(leaveHours) : undefined
    };
    
    if (editEntryId) {
      updateMutation.mutate({ id: editEntryId, entry: entryData });
    } else {
      createMutation.mutate(entryData);
    }
  };
  
  // Calculate hours between start and end time
  const calculateHoursFromTime = (start: string, end: string): number => {
    try {
      const startDate = parse(start, 'HH:mm', new Date());
      const endDate = parse(end, 'HH:mm', new Date());
      
      if (isValid(startDate) && isValid(endDate)) {
        const diffMs = endDate.getTime() - startDate.getTime();
        return Math.max(0, diffMs / (1000 * 60 * 60));
      }
      return 0;
    } catch {
      return 0;
    }
  };
  
  // Update hours when time changes
  useEffect(() => {
    if (startTime && endTime) {
      const calculatedHours = calculateHoursFromTime(startTime, endTime);
      setHours(calculatedHours.toFixed(2));
    }
  }, [startTime, endTime]);
  
  // Reset form
  const resetForm = () => {
    setSelectedDate(null);
    setSelectedWorkOrder(null);
    setHours('');
    setDescription('');
    setStartTime('09:00');
    setEndTime('17:00');
    setEditEntryId(null);
    
    // Reset break time tracking
    setBreakTaken(false);
    setBreakDuration('30');
    
    // Reset leave tracking
    setIsLeave(false);
    setLeaveType('full-day');
    setLeaveHours('8');
  };
  
  // Open dialog to add entry for a specific date
  const addEntryForDate = (date: string) => {
    setSelectedDate(date);
    setEntryDialogOpen(true);
  };
  
  // Edit existing entry
  const editEntry = (entry: any) => {
    setEditEntryId(entry.id);
    
    // Convert entry date to string format if it's a Date object
    const entryDate = entry.date instanceof Date 
      ? format(entry.date, 'yyyy-MM-dd')
      : typeof entry.date === 'string' && entry.date.includes('T')
        ? entry.date.split('T')[0]
        : entry.date;
        
    setSelectedDate(entryDate);
    setSelectedWorkOrder(entry.workOrderId);
    setHours(entry.hours.toString());
    setStartTime(entry.startTime || '09:00');
    setEndTime(entry.endTime || '17:00');
    setDescription(entry.description || '');
    
    // Set break time data
    setBreakTaken(!!entry.breakTaken);
    setBreakDuration(entry.breakDuration?.toString() || '30');
    
    // Set leave data
    setIsLeave(!!entry.isLeave);
    setLeaveType(entry.leaveType || 'full-day');
    setLeaveHours(entry.leaveHours?.toString() || '8');
    
    setEntryDialogOpen(true);
  };
  
  // Group entries by date
  const entriesByDate = React.useMemo(() => {
    const result: Record<string, any[]> = {};
    
    dateStrings.forEach(date => {
      result[date] = [];
    });
    
    if (entries) {
      entries.forEach((entry: any) => {
        // Format the entry date to match dateStrings (YYYY-MM-DD)
        const entryDate = entry.date instanceof Date 
          ? format(entry.date, 'yyyy-MM-dd')
          : typeof entry.date === 'string' && entry.date.includes('T')
            ? entry.date.split('T')[0]
            : entry.date;
            
        if (result[entryDate]) {
          result[entryDate].push(entry);
        }
      });
    }
    
    return result;
  }, [entries, dateStrings]);
  
  // Get work order details
  const getWorkOrderDetails = (workOrderId: number): WorkOrderWithProject => {
    const workOrder = workOrders.find((wo: WorkOrderWithProject) => wo.id === workOrderId);
    return workOrder || { 
      id: -1, 
      name: 'Unknown', 
      type: '', 
      projectId: -1, 
      projectTitle: 'Unknown', 
      projectReference: '' 
    };
  };
  
  // Check if any break was taken on the day
  const wasBreakTakenOnDay = (date: string): boolean => {
    if (!entriesByDate[date] || entriesByDate[date].length === 0) return false;
    return entriesByDate[date].some(entry => entry.breakTaken);
  };
  
  // Get the total hours per day, accounting for auto-break if needed
  const getDailyTotalHours = (date: string) => {
    if (!entriesByDate[date]) return 0;
    
    // Sum all hours for the day
    let totalHours = entriesByDate[date].reduce((total, entry) => total + entry.hours, 0);
    
    // If no break was taken and worked more than 4.5 hours, auto-deduct 30 min break
    const breakTaken = wasBreakTakenOnDay(date);
    const autoBreakNeeded = !breakTaken && totalHours >= 4.5;
    
    if (autoBreakNeeded) {
      totalHours = Math.max(0, totalHours - 0.5); // Deduct 30 min (0.5 hour)
    }
    
    return totalHours;
  };
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <div className="flex items-center">
            <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
              <PreviousIcon />
              Previous
            </Button>
            <div className="mx-2 px-3 py-1 bg-muted rounded text-sm font-medium">
              {formatWeekRange(currentWeekStart)}
            </div>
            <Button variant="outline" size="sm" onClick={goToNextWeek}>
              Next
              <NextIcon />
            </Button>
            <Button variant="outline" size="sm" className="ml-2" onClick={goToCurrentWeek}>
              Current Week
            </Button>
          </div>
        </div>
        
        {/* Smart Suggestions Component */}
        <SmartSuggestions 
          selectedDate={selectedDate}
          onSelectSuggestion={(suggestion) => {
            setSelectedWorkOrder(suggestion.workOrderId);
            setHours(suggestion.hours.toString());
            setStartTime(suggestion.startTime || '09:00');
            setEndTime(suggestion.endTime || '17:00');
            setDescription(suggestion.description || '');
            setBreakTaken(!!suggestion.breakTaken);
            setBreakDuration(suggestion.breakDuration?.toString() || '30');
            setIsLeave(!!suggestion.isLeave);
            if (suggestion.isLeave) {
              setLeaveType(suggestion.leaveType || 'full-day');
              setLeaveHours(suggestion.leaveHours?.toString() || '8');
            }
            
            // Open the entry dialog with the suggested data
            setEntryDialogOpen(true);
          }}
        />
        
        {isLoadingEntries ? (
          <div className="space-y-4">
            {dateStrings.map((date, i) => (
              <div key={date} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-9 w-28" />
                </div>
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full mt-2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {dateStrings.map((date, i) => (
              <div key={date} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium">{formatDay(date)}</h3>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">
                        Total: <span className="font-medium">{getDailyTotalHours(date).toFixed(2)} hours</span>
                      </p>
                      {!wasBreakTakenOnDay(date) && getDailyTotalHours(date) >= 4.5 && (
                        <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                          Break auto-added (30min)
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button size="sm" onClick={() => addEntryForDate(date)}>
                    Add Entry
                  </Button>
                </div>
                
                {entriesByDate[date]?.length > 0 ? (
                  <div className="space-y-2">
                    {entriesByDate[date].map((entry: any) => {
                      const workOrder = getWorkOrderDetails(entry.workOrderId);
                      return (
                        <div 
                          key={entry.id} 
                          className="flex flex-col md:flex-row justify-between items-start md:items-center p-3 bg-muted/30 rounded-md hover:bg-muted/50 cursor-pointer"
                          onClick={() => editEntry(entry)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant={workOrder.type === 'validation' ? 'info' : 'success'}>
                                {workOrder.name}
                              </Badge>
                              <span className="text-sm font-medium">{workOrder.projectTitle}</span>
                              <span className="text-xs text-muted-foreground">{workOrder.projectReference}</span>
                              
                              {entry.breakTaken && (
                                <Badge variant="outline" className="ml-1 bg-orange-50 text-orange-700 border-orange-200">
                                  Break: {entry.breakDuration || 30}min
                                </Badge>
                              )}
                              
                              {entry.isLeave && (
                                <Badge variant="outline" className="ml-1 bg-purple-50 text-purple-700 border-purple-200">
                                  {entry.leaveType === 'full-day' 
                                    ? 'Full Day Leave'
                                    : entry.leaveType === 'half-day'
                                      ? 'Half Day Leave'
                                      : `Leave: ${entry.leaveHours}hrs`
                                  }
                                </Badge>
                              )}
                            </div>
                            {entry.description && (
                              <p className="text-sm text-muted-foreground mt-1">{entry.description}</p>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 mt-2 md:mt-0">
                            <div className="text-right">
                              <div className="text-sm font-medium">
                                {entry.hours.toFixed(2)} hours
                              </div>
                              {entry.startTime && entry.endTime && (
                                <div className="text-xs text-muted-foreground">
                                  {entry.startTime} - {entry.endTime}
                                </div>
                              )}
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteMutation.mutate(entry.id);
                              }}
                            >
                              <span className="text-destructive">
                                <CloseIcon />
                              </span>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    No time entries for this day
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      {/* Entry Dialog */}
      <Dialog open={entryDialogOpen} onOpenChange={setEntryDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editEntryId ? 'Edit Time Entry' : 'Add Time Entry'}</DialogTitle>
            <DialogDescription>
              {selectedDate && `For ${typeof selectedDate === 'string' ? formatDay(selectedDate) : format(selectedDate, 'EEEE, MMMM d')}`}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium" htmlFor="workOrder">Project & Work Order</label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select
                    value={selectedWorkOrder?.toString() || ''}
                    onValueChange={(value) => setSelectedWorkOrder(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project and work order" />
                    </SelectTrigger>
                    <SelectContent>
                      {workOrders.map((wo: WorkOrderWithProject) => (
                        <SelectItem key={wo.id} value={wo.id.toString()}>
                          {wo.projectTitle} ({wo.projectReference}) - {wo.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setShowNewProjectDialog(true)}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="mr-1"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  New
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="block text-sm font-medium" htmlFor="startTime">Start Time</label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium" htmlFor="endTime">End Time</label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium" htmlFor="hours">Total Hours</label>
              <Input
                id="hours"
                type="number"
                min="0"
                step="0.25"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Hours are automatically calculated from start and end time, but you can adjust manually if needed.
              </p>
            </div>
            
            <div className="space-y-4 border-t pt-4 mt-4">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="breakTaken" 
                  checked={breakTaken}
                  onCheckedChange={(checked) => setBreakTaken(checked === true)}
                />
                <label htmlFor="breakTaken" className="text-sm font-medium cursor-pointer">
                  Break Taken
                </label>
              </div>
              
              {breakTaken && (
                <div className="ml-6 space-y-2">
                  <label className="block text-sm font-medium" htmlFor="breakDuration">
                    Break Duration (minutes)
                  </label>
                  <Input
                    id="breakDuration"
                    type="number"
                    min="5"
                    step="5"
                    value={breakDuration}
                    onChange={(e) => setBreakDuration(e.target.value)}
                    className="w-full max-w-[120px]"
                  />
                </div>
              )}
            </div>
            
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="isLeave" 
                  checked={isLeave}
                  onCheckedChange={(checked) => setIsLeave(checked === true)}
                />
                <label htmlFor="isLeave" className="text-sm font-medium cursor-pointer">
                  Leave Time
                </label>
              </div>
              
              {isLeave && (
                <div className="ml-6 space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Leave Type</label>
                    <div className="flex flex-wrap gap-2">
                      <Label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio" 
                          name="leaveType"
                          value="full-day"
                          checked={leaveType === 'full-day'}
                          onChange={() => setLeaveType('full-day')}
                          className="w-4 h-4"
                        />
                        <span>Full Day</span>
                      </Label>
                      
                      <Label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio" 
                          name="leaveType"
                          value="half-day"
                          checked={leaveType === 'half-day'}
                          onChange={() => setLeaveType('half-day')}
                          className="w-4 h-4"
                        />
                        <span>Half Day</span>
                      </Label>
                      
                      <Label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio" 
                          name="leaveType"
                          value="hours"
                          checked={leaveType === 'hours'}
                          onChange={() => setLeaveType('hours')}
                          className="w-4 h-4"
                        />
                        <span>Hours</span>
                      </Label>
                    </div>
                  </div>
                  
                  {leaveType === 'hours' && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium" htmlFor="leaveHours">Hours</label>
                      <Input
                        id="leaveHours"
                        type="number"
                        min="1"
                        step="0.5"
                        value={leaveHours}
                        onChange={(e) => setLeaveHours(e.target.value)}
                        className="w-full max-w-[120px]"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium" htmlFor="description">Description (Optional)</label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full min-h-[80px]"
                placeholder="Enter details about the work performed"
              />
            </div>
            
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">Save Entry</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* New Project Dialog */}
      <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Fill out the form below to create a new project. Work orders will be created automatically.
            </DialogDescription>
          </DialogHeader>
          
          <ProjectForm 
            onSuccess={(project) => {
              if (project) {
                queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
                toast({
                  title: "Project created",
                  description: "The project has been created successfully, and work orders have been automatically added."
                });
              }
              setShowNewProjectDialog(false);
            }} 
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
