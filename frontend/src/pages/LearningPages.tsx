import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { VideoUpload } from '@/components/video/VideoUpload';
import { VideoList } from '@/components/video/VideoList';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { useVideos } from '@/hooks/useVideos';
import { cn, format } from '@/lib/utils';
import {
  Bell,
  BookOpen,
  CheckCircle2,
  FileText,
  HelpCircle,
  Lock,
  Mail,
  Plus,
  RefreshCw,
  Settings,
  Shield,
  User,
  Video,
} from 'lucide-react';

const completedStatuses = ['completed'];

function formatDate(dateString?: string) {
  if (!dateString) return 'Unknown';

  try {
    return format(new Date(dateString), 'MMM d, yyyy');
  } catch {
    return dateString;
  }
}

function getInitials(name?: string | null) {
  if (!name) return 'U';

  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function MyVideosPage() {
  const [showUpload, setShowUpload] = useState(false);
  const { fetchVideos, isLoading } = useVideos();

  const handleUploadSuccess = () => {
    setShowUpload(false);
    fetchVideos();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Videos</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Manage videos and generated learning materials
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={fetchVideos} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
            <Button onClick={() => setShowUpload(!showUpload)}>
              <Plus className={cn("h-4 w-4 mr-2 transition-transform", showUpload && "rotate-45")} />
              {showUpload ? 'Cancel' : 'Add Video'}
            </Button>
          </div>
        </div>

        {showUpload && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300">
            <VideoUpload onUploadSuccess={handleUploadSuccess} />
          </div>
        )}

        <VideoList onRefresh={fetchVideos} />
      </div>
    </MainLayout>
  );
}

export function NotesPage() {
  const { videos, isLoading } = useVideos();
  const completedVideos = videos.filter((video) => completedStatuses.includes(video.status));

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notes</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Generated lecture notes from completed videos
          </p>
        </div>

        <div className="grid gap-4">
          {isLoading && (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">Loading notes...</CardContent>
            </Card>
          )}

          {!isLoading && completedVideos.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  No notes yet
                </CardTitle>
                <CardDescription>Completed videos will appear here as lecture notes.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link to="/videos">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Video
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {completedVideos.map((video) => (
            <Card key={video.id}>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <CardTitle className="truncate">{video.original_filename}</CardTitle>
                  <CardDescription>{formatDate(video.created_at)}</CardDescription>
                </div>
                <Badge variant="secondary" className="w-fit">
                  Notes ready
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button variant="outline" asChild>
                  <Link to={`/videos/${video.id}?tab=lecture`}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Open Notes
                  </Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link to={`/videos/${video.id}?tab=transcript`}>
                    <FileText className="h-4 w-4 mr-2" />
                    Transcript
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

export function QuizzesPage() {
  const { videos, isLoading } = useVideos();
  const completedVideos = videos.filter((video) => completedStatuses.includes(video.status));

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quizzes</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Practice quizzes created from your videos
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {isLoading && (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">Loading quizzes...</CardContent>
            </Card>
          )}

          {!isLoading && completedVideos.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  No quizzes yet
                </CardTitle>
                <CardDescription>Completed videos with generated quizzes will appear here.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link to="/videos">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Video
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {completedVideos.map((video) => (
            <Card key={video.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <HelpCircle className="h-8 w-8 text-primary" />
                  <Badge variant="secondary">Ready</Badge>
                </div>
                <CardTitle className="truncate">{video.original_filename}</CardTitle>
                <CardDescription>{formatDate(video.created_at)}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" asChild>
                  <Link to={`/videos/${video.id}?tab=quiz`}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Start Quiz
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

export function SettingsPage() {
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [autoOpenResults, setAutoOpenResults] = useState(false);
  const [compactLists, setCompactLists] = useState(false);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1 text-sm">Workspace preferences</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>Processing and result updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4 rounded-md border p-4">
                <Label htmlFor="email-updates" className="text-sm font-medium">
                  Email updates
                </Label>
                <Switch id="email-updates" checked={emailUpdates} onCheckedChange={setEmailUpdates} />
              </div>
              <div className="flex items-center justify-between gap-4 rounded-md border p-4">
                <Label htmlFor="auto-open-results" className="text-sm font-medium">
                  Auto-open results
                </Label>
                <Switch id="auto-open-results" checked={autoOpenResults} onCheckedChange={setAutoOpenResults} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Display
              </CardTitle>
              <CardDescription>Interface density and defaults</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4 rounded-md border p-4">
                <Label htmlFor="compact-lists" className="text-sm font-medium">
                  Compact video lists
                </Label>
                <Switch id="compact-lists" checked={compactLists} onCheckedChange={setCompactLists} />
              </div>
              <div className="rounded-md border p-4">
                <Label htmlFor="default-view" className="text-sm font-medium">
                  Default video view
                </Label>
                <Input id="default-view" className="mt-2" value="Status" readOnly />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

export function ProfilePage() {
  const { user } = useAuth();
  const { videos, isLoading } = useVideos();
  const completedCount = videos.filter((video) => video.status === 'completed').length;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground mt-1 text-sm">Account details and learning stats</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/10 text-xl font-semibold text-primary">
                  {getInitials(user?.full_name || user?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <CardTitle className="truncate">{user?.full_name || 'User'}</CardTitle>
                <CardDescription className="truncate">{user?.email}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Full name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="profile-name" className="pl-10" value={user?.full_name || ''} readOnly />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="profile-email" className="pl-10" value={user?.email || ''} readOnly />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-created">Joined</Label>
                <Input id="profile-created" value={formatDate(user?.created_at)} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-status">Status</Label>
                <Input id="profile-status" value={user?.is_active ? 'Active' : 'Inactive'} readOnly />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Library
                </CardTitle>
                <CardDescription>{isLoading ? 'Loading...' : `${videos.length} videos`}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{isLoading ? '...' : completedCount}</p>
                <p className="text-sm text-muted-foreground">completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security
                </CardTitle>
                <CardDescription>Protected account session</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/settings">
                    <Lock className="h-4 w-4 mr-2" />
                    Open Settings
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
