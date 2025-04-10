import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

type AppLayoutProps = {
  children: React.ReactNode;
  title: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar />
      
      <main className="flex-1 md:ml-64 min-h-screen">
        <Header title={title} />
        
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
