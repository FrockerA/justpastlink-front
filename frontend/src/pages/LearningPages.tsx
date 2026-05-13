import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { MainLayout } from '@/components/layout/MainLayout';
import { VideoUpload } from '@/components/video/VideoUpload';
import { VideoList } from '@/components/video/VideoList';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useAuth } from '@/hooks/useAuth';
import { usePreferences } from '@/hooks/usePreferences';
import { useVideos } from '@/hooks/useVideos';
import { getApiErrorDetail } from '@/lib/api';
import { cn, format } from '@/lib/utils';
import {
  Bell,
  BookOpen,
  CheckCircle2,
  Edit2,
  FileText,
  HelpCircle,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  Moon,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Shield,
  Sun,
  User,
  Video,
  Camera,
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
  const { user, updateEmail, updatePassword } = useAuth();
  const { preferences, setPreference } = usePreferences();
  const { theme, setTheme } = useTheme();
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [emailPassword, setEmailPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const activeTheme = theme === 'dark' ? 'dark' : 'light';

  useEffect(() => {
    setNewEmail(user?.email || '');
  }, [user?.email]);

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingEmail(true);

    try {
      await updateEmail({
        email: newEmail.trim(),
        current_password: emailPassword,
      });
      toast.success('Email updated');
      setEmailDialogOpen(false);
      setEmailPassword('');
    } catch (error) {
      toast.error(getApiErrorDetail(error, 'Failed to update email'));
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setIsSavingPassword(true);
    try {
      await updatePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success('Password updated');
      setPasswordDialogOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(getApiErrorDetail(error, 'Failed to update password'));
    } finally {
      setIsSavingPassword(false);
    }
  };

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
                  Notifications
                </Label>
                <Switch
                  id="notifications-enabled"
                  checked={preferences.notificationsEnabled}
                  onCheckedChange={(checked) => setPreference('notificationsEnabled', checked)}
                />
              </div>
              <div className="flex items-center justify-between gap-4 rounded-md border p-4">
                <Label htmlFor="auto-open-results" className="text-sm font-medium">
                  Auto-open results
                </Label>
                <Switch
                  id="auto-open-results"
                  checked={preferences.autoOpenResults}
                  onCheckedChange={(checked) => setPreference('autoOpenResults', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Account
              </CardTitle>
              <CardDescription>Email and password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4 rounded-md border p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Email</p>
                  <p className="truncate text-sm text-muted-foreground">{user?.email || 'Not set'}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setEmailDialogOpen(true)}>
                  <Mail className="h-4 w-4" />
                  Change
                </Button>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-md border p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Password</p>
                  <p className="text-sm text-muted-foreground">Protected with your current password</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setPasswordDialogOpen(true)}>
                  <KeyRound className="h-4 w-4" />
                  Change
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Display
              </CardTitle>
              <CardDescription>Appearance preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border p-4">
                <Label className="text-sm font-medium">Theme</Label>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  value={activeTheme}
                  onValueChange={(value) => value && setTheme(value)}
                  className="mt-3 grid w-full grid-cols-2"
                >
                  <ToggleGroupItem value="light" className="w-full">
                    <Sun className="h-4 w-4" />
                    Light
                  </ToggleGroupItem>
                  <ToggleGroupItem value="dark" className="w-full">
                    <Moon className="h-4 w-4" />
                    Dark
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </CardContent>
          </Card>
        </div>

        <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
          <DialogContent>
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Change email</DialogTitle>
                <DialogDescription>Confirm with your current password.</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="new-email">New email</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={newEmail}
                  onChange={(event) => setNewEmail(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-current-password">Current password</Label>
                <Input
                  id="email-current-password"
                  type="password"
                  value={emailPassword}
                  onChange={(event) => setEmailPassword(event.target.value)}
                  minLength={8}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEmailDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSavingEmail}>
                  {isSavingEmail ? 'Saving...' : 'Save email'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
          <DialogContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Change password</DialogTitle>
                <DialogDescription>Use at least 8 characters.</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="current-password">Current password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  minLength={8}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  minLength={8}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  minLength={8}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setPasswordDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSavingPassword}>
                  {isSavingPassword ? 'Saving...' : 'Save password'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}

export function ProfilePage() {
  const { user, updateProfile, logout } = useAuth();
  const { videos, isLoading } = useVideos();
  const completedCount = videos.filter((video) => video.status === 'completed').length;
  const processingCount = videos.filter((video) =>
    ['uploaded', 'queued', 'processing', 'generating_lecture', 'generating_quiz'].includes(video.status)
  ).length;
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileAvatar, setProfileAvatar] = useState<string | null>(() => window.localStorage.getItem('justpastlink.profile_avatar'));
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [pendingAvatar, setPendingAvatar] = useState<string | null>(profileAvatar);

  useEffect(() => {
    setFullName(user?.full_name || '');
  }, [user?.full_name]);

  const handleProfileSave = async () => {
    setIsSavingProfile(true);

    try {
      await updateProfile({ full_name: fullName.trim() || null });
      toast.success('Profile updated');
      setIsEditingProfile(false);
    } catch (error) {
      toast.error(getApiErrorDetail(error, 'Failed to update profile'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleProfileEditToggle = () => {
    if (isEditingProfile) {
      setFullName(user?.full_name || '');
    }
    setIsEditingProfile((current) => !current);
  };

  const handleAvatarFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPendingAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarSave = () => {
    if (pendingAvatar) {
      window.localStorage.setItem('justpastlink.profile_avatar', pendingAvatar);
    } else {
      window.localStorage.removeItem('justpastlink.profile_avatar');
    }
    setProfileAvatar(pendingAvatar);
    setAvatarDialogOpen(false);
    toast.success('Profile photo updated');
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground mt-1 text-sm">Account details and learning stats</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <button type="button" onClick={() => setAvatarDialogOpen(true)} className="relative group rounded-full">
                <Avatar className="h-16 w-16 shrink-0">
                  {profileAvatar ? <AvatarImage src={profileAvatar} alt="Profile photo" /> : null}
                  <AvatarFallback className="bg-primary/10 text-xl font-semibold text-primary">
                    {getInitials(user?.full_name || user?.email)}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute inset-0 hidden items-center justify-center rounded-full bg-black/50 text-white text-xs group-hover:flex">
                  <Camera className="h-4 w-4" />
                </span>
                </button>
                <div className="min-w-0">
                  <CardTitle className="truncate">{user?.full_name || 'User'}</CardTitle>
                  <CardDescription className="truncate">{user?.email}</CardDescription>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleProfileEditToggle}>
                <Edit2 className="h-4 w-4" />
                {isEditingProfile ? 'Cancel' : 'Edit profile'}
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Full name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="profile-name"
                    className="pl-10"
                    value={isEditingProfile ? fullName : user?.full_name || ''}
                    onChange={(event) => setFullName(event.target.value)}
                    readOnly={!isEditingProfile}
                  />
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
              {isEditingProfile && (
                <div className="flex justify-end sm:col-span-2">
                  <Button onClick={handleProfileSave} disabled={isSavingProfile}>
                    <Save className="h-4 w-4" />
                    {isSavingProfile ? 'Saving...' : 'Save changes'}
                  </Button>
                </div>
              )}
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
              <CardContent className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md border p-3">
                  <p className="text-xl font-bold">{isLoading ? '...' : videos.length}</p>
                  <p className="text-xs text-muted-foreground">total</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xl font-bold">{isLoading ? '...' : completedCount}</p>
                  <p className="text-xs text-muted-foreground">ready</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xl font-bold">{isLoading ? '...' : processingCount}</p>
                  <p className="text-xs text-muted-foreground">active</p>
                </div>
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
                <Button variant="destructive" className="w-full justify-start mt-2" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <Dialog open={avatarDialogOpen} onOpenChange={setAvatarDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Profile photo</DialogTitle>
              <DialogDescription>Upload a new profile photo and save it.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Avatar className="h-24 w-24">
                {pendingAvatar ? <AvatarImage src={pendingAvatar} alt="Profile photo preview" /> : null}
                <AvatarFallback className="bg-primary/10 text-2xl font-semibold text-primary">
                  {getInitials(user?.full_name || user?.email)}
                </AvatarFallback>
              </Avatar>
              <Input type="file" accept="image/*" onChange={handleAvatarFileChange} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAvatarDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAvatarSave}>Save photo</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
