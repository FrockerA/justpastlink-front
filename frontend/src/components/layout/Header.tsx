import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GraduationCap, Home, Video, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { to: '/welcome', label: 'Welcome', icon: Home },
  { to: '/dashboard', label: 'Your Videos', icon: Video },
];

export function Header() {
  const { user } = useAuth();
  const location = useLocation();

  const pageNames: Record<string, string> = {
    '/welcome': 'Welcome',
    '/dashboard': 'Dashboard',
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
        
        {/* Mobile menu trigger */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="mr-3">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle mobile menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="p-6 border-b">
              <Link to="/welcome" className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-primary shrink-0">
                  <GraduationCap className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-semibold">JustPastLink</span>
              </Link>
            </div>
            <nav className="p-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    (location.pathname === item.to || location.pathname.startsWith(`${item.to}/`))
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
            {user && (
              <div className="absolute bottom-4 left-4 right-4">
                 <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Page Title for Desktop/Tablet */}
        <div className="flex-1 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">
            {getPageTitle()}
          </h2>
          {/* Add extra actions here in the future if needed */}
        </div>
      </div>
    </header>
  );
}
