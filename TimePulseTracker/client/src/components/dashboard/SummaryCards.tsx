import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function SummaryCards() {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/reports/summary'],
  });
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-10 w-10 rounded-md" />
              </div>
              <Skeleton className="h-4 w-24 mt-3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Hours This Week */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Hours This Week</p>
              <p className="text-2xl font-semibold mt-1">{data?.weeklyHours || 0}</p>
            </div>
            <div className="bg-blue-50 p-2 rounded-md text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>
          <div className="flex items-center mt-3 text-xs">
            <span className="text-green-600 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12 7a1 1 0 01-1 1H5a1 1 0 010-2h6a1 1 0 011 1zm-5 5a1 1 0 100-2H5a1 1 0 000 2h2z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M15.707 11.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L11 14.586V3a1 1 0 012 0v11.586l3.293-3.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              4.5%
            </span>
            <span className="text-muted-foreground ml-2">from last week</span>
          </div>
        </CardContent>
      </Card>
      
      {/* Active Projects */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Projects</p>
              <p className="text-2xl font-semibold mt-1">{data?.activeProjects || 0}</p>
            </div>
            <div className="bg-blue-50 p-2 rounded-md text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
          </div>
          <div className="flex items-center mt-3 text-xs">
            <span className="text-muted-foreground">2 due this month</span>
          </div>
        </CardContent>
      </Card>
      
      {/* Validation Hours */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Validation Hours</p>
              <p className="text-2xl font-semibold mt-1">{data?.validationHours || 0}</p>
            </div>
            <div className="bg-blue-50 p-2 rounded-md text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex items-center mt-3 text-xs">
            <span className="text-red-500 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12 13a1 1 0 01-1 1H9a1 1 0 010-2h2a1 1 0 011 1zM5 8a1 1 0 100-2H3a1 1 0 000 2h2z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M15.707 8.707a1 1 0 010-1.414l4-4a1 1 0 00-1.414-1.414L15 5.172V3a1 1 0 10-2 0v11.586l-3.293-3.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L14 14.586V3a1 1 0 012 0v2.172l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              2.3%
            </span>
            <span className="text-muted-foreground ml-2">from last week</span>
          </div>
        </CardContent>
      </Card>
      
      {/* Design Hours */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Design Hours</p>
              <p className="text-2xl font-semibold mt-1">{data?.designHours || 0}</p>
            </div>
            <div className="bg-blue-50 p-2 rounded-md text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
          </div>
          <div className="flex items-center mt-3 text-xs">
            <span className="text-green-600 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12 7a1 1 0 01-1 1H5a1 1 0 010-2h6a1 1 0 011 1zm-5 5a1 1 0 100-2H5a1 1 0 000 2h2z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M15.707 11.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L11 14.586V3a1 1 0 012 0v11.586l3.293-3.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              7.8%
            </span>
            <span className="text-muted-foreground ml-2">from last week</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
