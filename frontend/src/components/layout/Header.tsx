import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GraduationCap, Menu, PanelLeftOpen } from 'lucide-react';
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { navItems } from './Sidebar';
import { LibrarySearch } from './LibrarySearch';

interface HeaderProps {
  isSidebarOpen: boolean;
  onSidebarToggle: () => void;
}

export function Header({ isSidebarOpen, onSidebarToggle }: HeaderProps) {
  const { user } = useAuth();
  const location = useLocation();

  const pageNames: Record<string, string> = {
    '/welcome': 'Welcome',
    '/dashboard': 'Dashboard',
    '/videos': 'My Videos',
    '/notes': 'Notes',
    '/quizzes': 'Quizzes',
    '/settings': 'Settings',
    '/profile': 'Profile',
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (pageNames[path]) return pageNames[path];
    if (path.startsWith('/videos/')) return 'Video Details';
    return '';
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 md:px-8">
        <Button
          variant="ghost"
          size="icon"
          className="mr-3 hidden md:inline-flex"
          onClick={onSidebarToggle}
        >
          <PanelLeftOpen className={cn("h-5 w-5 transition-transform", isSidebarOpen && "rotate-180")} />
          <span className="sr-only">Toggle sidebar</span>
        </Button>

        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="mr-3">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle mobile menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <div className="p-6 border-b">
              <Link to="/dashboard" className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-primary shrink-0">
                  <GraduationCap className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-semibold">JustPastLink</span>
              </Link>
            </div>
            <nav className="p-4 space-y-2">
              {navItems.map((item) => (
                <SheetClose asChild key={item.to}>
                  <Link
                    to={item.to}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                      (location.pathname === item.to || location.pathname.startsWith(`${item.to}/`))
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                </SheetClose>
              ))}
            </nav>
            {user && (
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              </div>
            )}
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
          <h2 className="truncate text-lg font-semibold tracking-tight">
            {getPageTitle()}
          </h2>
          <LibrarySearch />
        </div>
      </div>
    </header>
  );
}
