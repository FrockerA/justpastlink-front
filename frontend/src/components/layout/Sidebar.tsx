import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FileText,
  FolderOpen,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  Settings,
  User,
  Video,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/videos', label: 'My Videos', icon: Video },
  { to: '/catalog', label: 'Catalog', icon: FolderOpen },
  { to: '/notes', label: 'Notes', icon: FileText },
  { to: '/quizzes', label: 'Quizzes', icon: HelpCircle },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/profile', label: 'Profile', icon: User },
];

interface SidebarProps {
  isOpen: boolean;
}

export function Sidebar({ isOpen }: SidebarProps) {
  const location = useLocation();
    const { user } = useAuth();
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);

  useEffect(() => {
    const syncProfileAvatar = () => {
      setProfileAvatar(window.localStorage.getItem('justpastlink.profile_avatar'));
    };

    syncProfileAvatar();
    window.addEventListener('storage', syncProfileAvatar);

    return () => {
      window.removeEventListener('storage', syncProfileAvatar);
    };
  }, []);

  const userDisplayName = user?.full_name?.trim() || user?.email || 'Profile';
  const userInitials = userDisplayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('') || 'U';

  return (
    <aside
      className={cn(
        'w-64 border-r bg-background/95 backdrop-blur hidden md:flex flex-col h-screen fixed top-0 left-0 bg-secondary/10 z-50 transition-transform duration-300 ease-out',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <div className="h-16 flex items-center px-6 border-b">
        <Link to="/dashboard" className="flex min-w-0 items-center gap-3">
          <div className="p-1.5 rounded-lg bg-primary shrink-0">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg truncate tracking-tight">
            JustPastLink
          </span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      
      <div className="border-t p-3">
        <Link
          to="/profile"
          className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-accent"
        >
          <Avatar className="h-9 w-9">
            {profileAvatar ? <AvatarImage src={profileAvatar} alt="Profile photo" /> : null}
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
          <span className="truncate text-sm font-medium">{userDisplayName}</span>
        </Link>
      </div>
    </aside>
  );
}
