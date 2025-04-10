import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, startOfDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { apiRequest } from '@/lib/queryClient';
import { formatDay } from '@/lib/date-utils';

// Define the shape of a timesheet suggestion
type TimesheetSuggestion = {
  id: number;
  workOrderId: number;
  projectTitle: string;
  projectReference: string;
  workOrderName: string;
  workOrderType: string;
  hours: number;
  startTime: string;
  endTime: string;
  description?: string;
  frequency: number;
  lastUsed: Date;
  breakTaken?: boolean;
  breakDuration?: number;
  isLeave?: boolean;
  leaveType?: string;
  leaveHours?: number;
};

type SmartSuggestionsProps = {
  selectedDate: Date | string | null;
  onSelectSuggestion: (suggestion: TimesheetSuggestion) => void;
};

export default function SmartSuggestions({ 
  selectedDate,
  onSelectSuggestion
}: SmartSuggestionsProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Calculate date range for analysis (last 30 days)
  const endDate = new Date();
  const startDate = subDays(endDate, 30);

  // Fetch user's recent timesheet entries
  const { data: entries, isLoading } = useQuery({
    queryKey: ['/api/timesheet/analysis', { start: format(startDate, 'yyyy-MM-dd'), end: format(endDate, 'yyyy-MM-dd') }],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', 
          `/api/timesheet?start=${format(startDate, 'yyyy-MM-dd')}&end=${format(endDate, 'yyyy-MM-dd')}`
        );
        return response.json();
      } catch (error) {
        console.error("Failed to fetch entries for analysis:", error);
        return [];
      }
    },
    enabled: !isDismissed // Only fetch if component is not dismissed
  });

  // Generate smart suggestions based on past entries
  // This analyzes patterns in the user's work history
  const suggestions = React.useMemo<TimesheetSuggestion[]>(() => {
    if (!entries || entries.length === 0) return [];

    // Group entries by workOrderId
    const entriesByWorkOrder = entries.reduce((acc: Record<number, any[]>, entry: any) => {
      const key = entry.workOrderId;
      if (!acc[key]) acc[key] = [];
      acc[key].push(entry);
      return acc;
    }, {} as Record<number, any[]>);

    // Create suggestions from frequent work orders
    return Object.entries(entriesByWorkOrder)
      .map(([workOrderId, workOrderEntries]: [string, any[]]) => {
        // Skip if fewer than 2 occurrences (not recurring)
        if (workOrderEntries.length < 2) return null;
        
        const latestEntry = workOrderEntries.sort((a: any, b: any) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0];
        
        // Extract data from the latest entry
        const frequency = workOrderEntries.length;
        const lastUsed = new Date(latestEntry.date);

        // Check if this is a work order used in the last 7 days
        const isRecent = (new Date().getTime() - lastUsed.getTime()) / (1000 * 60 * 60 * 24) < 7;
        
        // Only suggest entries from the last 7 days or high-frequency entries
        if (!isRecent && frequency < 3) return null;
        
        return {
          id: latestEntry.id,
          workOrderId: parseInt(workOrderId),
          projectTitle: latestEntry.workOrder?.project?.title || "",
          projectReference: latestEntry.workOrder?.project?.referenceNumber || "",
          workOrderName: latestEntry.workOrder?.type || "",
          workOrderType: latestEntry.workOrder?.type || "",
          hours: latestEntry.hours,
          startTime: latestEntry.startTime || "09:00",
          endTime: latestEntry.endTime || "17:00",
          description: latestEntry.description,
          frequency,
          lastUsed,
          breakTaken: latestEntry.breakTaken,
          breakDuration: latestEntry.breakDuration,
          isLeave: latestEntry.isLeave,
          leaveType: latestEntry.leaveType,
          leaveHours: latestEntry.leaveHours
        };
      })
      .filter((item): item is TimesheetSuggestion => item !== null)
      .sort((a, b) => b.frequency - a.frequency);
  }, [entries]);

  // Discard component if no suggestions
  if (isDismissed || !suggestions || suggestions.length === 0) return null;

  return (
    <Card className="mb-4 border-blue-200 bg-blue-50">
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-blue-700">
            Smart Suggestions
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 text-blue-700 hover:text-blue-800 hover:bg-blue-100"
            onClick={() => setIsDismissed(true)}
          >
            Dismiss
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-3">
        <p className="text-xs text-blue-600 mb-3">
          Based on your recent activity, here are some suggested entries for {selectedDate ? (
            typeof selectedDate === 'string' ? formatDay(selectedDate) : format(selectedDate, 'EEEE, MMMM d')
          ) : 'today'}:
        </p>
        
        <div className="flex flex-wrap gap-2">
          {suggestions.slice(0, 5).map((suggestion) => (
            <TooltipProvider key={`${suggestion.workOrderId}-${suggestion.hours}`}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-white border-blue-200 hover:bg-blue-100"
                    onClick={() => onSelectSuggestion(suggestion)}
                  >
                    <span className="truncate max-w-[200px]">
                      {suggestion.projectTitle} - {suggestion.workOrderName} ({suggestion.hours}h)
                    </span>
                    <Badge 
                      variant="outline" 
                      className="ml-2 h-5 bg-blue-100 text-blue-700 hover:bg-blue-200"
                    >
                      {suggestion.frequency}x
                    </Badge>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs space-y-1">
                    <p>Project: {suggestion.projectTitle}</p>
                    <p>Reference: {suggestion.projectReference}</p>
                    <p>Hours: {suggestion.hours} ({suggestion.startTime} - {suggestion.endTime})</p>
                    {suggestion.description && <p>Description: {suggestion.description}</p>}
                    <p>Used {suggestion.frequency} times in the last 30 days</p>
                    <p>Last used: {format(new Date(suggestion.lastUsed), 'MMM d, yyyy')}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}