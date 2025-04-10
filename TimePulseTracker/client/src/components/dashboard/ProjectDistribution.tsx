import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function ProjectDistribution() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['/api/projects'],
  });
  
  const chartData = useMemo(() => {
    if (!projects) return [];
    
    return projects.map((project: any) => ({
      name: project.title,
      value: project.totalHours || 0,
      id: project.id
    }));
  }, [projects]);
  
  const totalHours = useMemo(() => {
    if (!chartData.length) return 0;
    return chartData.reduce((total: number, item: any) => total + item.value, 0);
  }, [chartData]);
  
  const COLORS = ['#0066b2', '#00a651', '#f59e0b', '#ef4444', '#8b5cf6'];
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-5 w-32 mb-1" />
          <Skeleton className="h-4 w-48 mb-4" />
          <Skeleton className="w-full aspect-square rounded-md mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-4">
          <h2 className="text-lg font-medium text-foreground">Time Distribution</h2>
          <p className="text-sm text-muted-foreground">Current week by project</p>
        </div>
        
        <div className="aspect-square relative mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="80%"
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                label={false}
              >
                {chartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [`${value} hrs`, 'Hours']}
                labelFormatter={(name) => `${name}`}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-lg font-semibold">{totalHours.toFixed(1)} hrs</span>
            <span className="text-xs text-muted-foreground">Total</span>
          </div>
        </div>
        
        <div className="space-y-2">
          {chartData.map((project: any, index: number) => (
            <div key={project.id} className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                <span className="text-sm">{project.name}</span>
              </div>
              <div className="text-sm font-medium">
                {project.value.toFixed(1)} hrs 
                <span className="text-muted-foreground ml-1">
                  ({totalHours ? ((project.value / totalHours) * 100).toFixed(0) : 0}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
