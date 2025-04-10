import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatWeekRange } from '@/lib/date-utils';
import { addWeeks, subWeeks, startOfWeek, format } from 'date-fns';

export default function Reports() {
  // Report filtering state
  const [reportType, setReportType] = useState('weekly');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Get projects data
  const { data: projects, isLoading } = useQuery({
    queryKey: ['/api/projects'],
  });
  
  // Function to navigate date periods
  const goToPreviousPeriod = () => {
    setCurrentDate(prev => 
      reportType === 'weekly' ? subWeeks(prev, 1) : 
      new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  };
  
  const goToNextPeriod = () => {
    setCurrentDate(prev => 
      reportType === 'weekly' ? addWeeks(prev, 1) : 
      new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  };
  
  // Format the current date range display
  const getPeriodDisplay = () => {
    if (reportType === 'weekly') {
      return formatWeekRange(currentDate);
    } else {
      return format(currentDate, 'MMMM yyyy');
    }
  };
  
  // Prepare data for charts
  const projectDistributionData = projects?.map((project: any) => ({
    name: project.title,
    value: project.totalHours || 0,
    id: project.id
  })) || [];
  
  // Summary data for work types
  const workTypeData = [
    { name: 'Validation', hours: projects?.reduce((total: number, project: any) => total + (project.validationHours || 0), 0) || 0 },
    { name: 'Design', hours: projects?.reduce((total: number, project: any) => total + (project.designHours || 0), 0) || 0 },
  ];
  
  // Mock historical data for trends
  const trendData = [
    { week: 'Week 1', validation: 22, design: 18 },
    { week: 'Week 2', validation: 25, design: 22 },
    { week: 'Week 3', validation: 28, design: 24 },
    { week: 'Week 4', validation: 30, design: 28 },
    { week: 'Week 5', validation: 26, design: 32 },
    { week: 'Week 6', validation: 35, design: 30 },
  ];
  
  // Colors for the charts
  const COLORS = ['#0066b2', '#00a651', '#f59e0b', '#ef4444', '#8b5cf6'];
  
  return (
    <AppLayout title="Reports">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics & Reports</h1>
          <p className="text-muted-foreground">
            View time allocation reports and project progress analytics
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={goToPreviousPeriod}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 h-4 w-4">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Previous
          </Button>
          <span className="inline-flex items-center px-3 py-1 bg-neutral-50 text-sm rounded font-medium">
            {getPeriodDisplay()}
          </span>
          <Button variant="outline" size="sm" onClick={goToNextPeriod}>
            Next
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 h-4 w-4">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-semibold mt-1">
                  {projects?.reduce((total: number, project: any) => total + (project.totalHours || 0), 0).toFixed(1) || "0.0"}
                </p>
              </div>
              <div className="bg-blue-50 p-2 rounded-md text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Projects</p>
                <p className="text-2xl font-semibold mt-1">
                  {projects?.filter((p: any) => p.status === 'in_progress').length || 0}
                </p>
              </div>
              <div className="bg-blue-50 p-2 rounded-md text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Report Type</p>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="mt-1 w-[140px] h-8 text-base">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-blue-50 p-2 rounded-md text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full md:w-auto grid-cols-3 md:inline-flex">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="worktype">Work Type</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Distribution</CardTitle>
                <CardDescription>Total hours by project</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={projectDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {projectDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} hrs`, 'Hours']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Time Trend</CardTitle>
                <CardDescription>Hours over time by work type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={trendData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} hrs`, 'Hours']} />
                      <Legend />
                      <Line type="monotone" dataKey="validation" stroke="#0066b2" activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="design" stroke="#00a651" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>Project Hours</CardTitle>
              <CardDescription>Breakdown of hours by project</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={projectDistributionData}
                    margin={{ top: 20, right: 30, left: 30, bottom: 70 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      width={150}
                    />
                    <Tooltip formatter={(value) => [`${value} hrs`, 'Hours']} />
                    <Legend />
                    <Bar dataKey="value" name="Total Hours" fill="#0066b2" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-4">Project Details</h3>
            <div className="space-y-4">
              {isLoading ? (
                <Card>
                  <CardContent className="p-6 flex justify-center">
                    <p>Loading project data...</p>
                  </CardContent>
                </Card>
              ) : (
                projects?.map((project: any) => (
                  <Card key={project.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                        <div>
                          <h4 className="text-md font-medium">{project.title}</h4>
                          <div className="flex items-center gap-2 mt-1 mb-2">
                            <Badge variant={
                              project.status === 'in_progress' ? 'success' :
                              project.status === 'design_review' ? 'warning' :
                              project.status === 'completed' ? 'info' : 'outline'
                            }>
                              {project.status === 'in_progress' ? 'In Progress' :
                              project.status === 'design_review' ? 'Design Review' :
                              project.status === 'completed' ? 'Completed' : 'Draft'}
                            </Badge>
                            <Badge variant="outline" className="font-mono">{project.referenceNumber}</Badge>
                          </div>
                        </div>
                        
                        <div className="flex gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Total:</span>
                            <span className="ml-1 font-medium">{project.totalHours?.toFixed(1) || "0.0"} hrs</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Validation:</span>
                            <span className="ml-1 font-medium">{project.validationHours?.toFixed(1) || "0.0"} hrs</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Design:</span>
                            <span className="ml-1 font-medium">{project.designHours?.toFixed(1) || "0.0"} hrs</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="worktype">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Work Type Distribution</CardTitle>
                <CardDescription>Validation vs. Design hours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={workTypeData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} hrs`, 'Hours']} />
                      <Legend />
                      <Bar dataKey="hours" name="Hours" fill="#0066b2" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Time Allocation</CardTitle>
                <CardDescription>Percentage of work types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={workTypeData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="hours"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        <Cell fill="#0066b2" />
                        <Cell fill="#00a651" />
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} hrs`, 'Hours']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Work Type Analysis</CardTitle>
              <CardDescription>Work types across all projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 px-4 text-left font-medium">Project</th>
                      <th className="py-2 px-4 text-center font-medium">Validation Hours</th>
                      <th className="py-2 px-4 text-center font-medium">Design Hours</th>
                      <th className="py-2 px-4 text-center font-medium">Ratio</th>
                      <th className="py-2 px-4 text-center font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects?.map((project: any) => {
                      const validationHours = project.validationHours || 0;
                      const designHours = project.designHours || 0;
                      const total = validationHours + designHours;
                      const ratio = total === 0 ? "N/A" : `${(validationHours / total * 100).toFixed(0)}% / ${(designHours / total * 100).toFixed(0)}%`;
                      
                      return (
                        <tr key={project.id} className="border-b hover:bg-neutral-50">
                          <td className="py-2 px-4 text-sm">{project.title}</td>
                          <td className="py-2 px-4 text-sm text-center">{validationHours.toFixed(1)}</td>
                          <td className="py-2 px-4 text-sm text-center">{designHours.toFixed(1)}</td>
                          <td className="py-2 px-4 text-sm text-center">{ratio}</td>
                          <td className="py-2 px-4 text-sm text-center font-medium">{total.toFixed(1)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-neutral-50">
                      <td className="py-2 px-4 text-sm font-medium">Total</td>
                      <td className="py-2 px-4 text-sm text-center font-medium">
                        {projects?.reduce((total: number, project: any) => total + (project.validationHours || 0), 0).toFixed(1)}
                      </td>
                      <td className="py-2 px-4 text-sm text-center font-medium">
                        {projects?.reduce((total: number, project: any) => total + (project.designHours || 0), 0).toFixed(1)}
                      </td>
                      <td className="py-2 px-4 text-sm text-center font-medium">-</td>
                      <td className="py-2 px-4 text-sm text-center font-medium">
                        {projects?.reduce((total: number, project: any) => total + (project.totalHours || 0), 0).toFixed(1)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
