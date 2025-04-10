import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';

export default function WorkTypeDistribution() {
  const { data: reports, isLoading } = useQuery({
    queryKey: ['/api/reports/summary'],
  });
  
  const chartData = useMemo(() => {
    if (!reports) return [];
    
    return [
      { name: 'Validation', hours: reports.validationHours || 0 },
      { name: 'Design', hours: reports.designHours || 0 },
    ];
  }, [reports]);
  
  // Mock monthly trend data
  const trendData = [
    { month: 'Jan', validation: 25, design: 20 },
    { month: 'Feb', validation: 28, design: 22 },
    { month: 'Mar', validation: 30, design: 24 },
    { month: 'Apr', validation: 32, design: 26 },
    { month: 'May', validation: 35, design: 30 },
    { month: 'Jun', validation: 38, design: 32 },
  ];
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-5 w-40 mb-1" />
          <Skeleton className="h-4 w-48 mb-4" />
          <Skeleton className="w-full h-64 rounded-md mb-4" />
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="w-full h-32 rounded-md" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-4">
          <h2 className="text-lg font-medium text-foreground">Work Type Distribution</h2>
          <p className="text-sm text-muted-foreground">Validation vs Design hours</p>
        </div>
        
        <div className="h-64 relative mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [`${value} hrs`, 'Hours']}
              />
              <Bar dataKey="hours" fill="#0066b2" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium mb-2">Monthly Trend</h3>
          <div className="h-32 relative">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="validation" stroke="#0066b2" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="design" stroke="#00a651" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
