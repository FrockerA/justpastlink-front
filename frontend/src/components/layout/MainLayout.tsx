import { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} />
      <div
        className={cn(
          "flex flex-col min-h-screen transition-[margin] duration-300 ease-out",
          isSidebarOpen ? "md:ml-64" : "md:ml-0"
        )}
      >
        <Header
          isSidebarOpen={isSidebarOpen}
          onSidebarToggle={() => setIsSidebarOpen((current) => !current)}
        />
        <main className="flex-1 container mx-auto p-4 md:p-8 max-w-6xl">
          {children}
        </main>
      </div>
    </div>
  );
}
