import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { formatDistance } from 'date-fns';

// This is a simplified component that would normally pull from an API
// For brevity, we're using static data here
const activities = [
  {
    id: 1,
    type: 'timesheet',
    title: 'Timesheet Updated',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    description: 'Added 3.5 hours to South Perth Distribution project'
  },
  {
    id: 2,
    type: 'project',
    title: 'Project Updated',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    description: 'Status changed to "In Progress" for North Metro Upgrade'
  },
  {
    id: 3,
    type: 'comment',
    title: 'Comment Added',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    description: 'Added comment to South Perth Distribution project'
  }
];

export default function RecentActivity() {
  const getIconForType = (type: string) => {
    switch (type) {
      case 'timesheet':
        return (
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        );
      case 'project':
        return (
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        );
      case 'comment':
        return (
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        );
    }
  };
  
  const getBgForType = (type: string) => {
    switch (type) {
      case 'timesheet':
        return 'bg-blue-100 text-blue-600';
      case 'project':
        return 'bg-green-100 text-green-600';
      case 'comment':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-4">
          <h2 className="text-lg font-medium text-foreground">Recent Activity</h2>
        </div>
        
        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start">
              <div className="flex-shrink-0 mr-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getBgForType(activity.type)}`}>
                  {getIconForType(activity.type)}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">{activity.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistance(activity.timestamp, new Date(), { addSuffix: true })}
                </p>
                <p className="text-sm text-foreground mt-1">{activity.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        <Button variant="link" className="w-full mt-3 text-sm text-primary flex items-center justify-center">
          View All Activity
          <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Button>
      </CardContent>
    </Card>
  );
}
