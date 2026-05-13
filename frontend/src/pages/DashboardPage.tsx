import { Link } from 'react-router-dom';
import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useVideos } from '@/hooks/useVideos';
import { format } from '@/lib/utils';
import { AlertCircle, CheckCircle2, FileText, HelpCircle, Loader2, Plus, Video } from 'lucide-react';

const inProgressStatuses = ['queued', 'processing', 'generating_lecture', 'generating_quiz'];
type DashboardFilter = 'all' | 'processing' | 'failed';

function formatDate(dateString: string) {
  try {
    return format(new Date(dateString), 'MMM d, yyyy');
  } catch {
    return dateString;
  }
}

export function DashboardPage() {
  const { videos, isLoading, error } = useVideos();
  const [filter, setFilter] = useState<DashboardFilter>('all');
  const completedCount = videos.filter((video) => video.status === 'completed').length;
  const processingCount = videos.filter((video) => inProgressStatuses.includes(video.status)).length;
  const failedCount = videos.filter((video) => video.status === 'failed' || video.status === 'error').length;
  const filteredVideos = videos.filter((video) => {
    if (filter === 'processing') return inProgressStatuses.includes(video.status);
    if (filter === 'failed') return video.status === 'failed' || video.status === 'error';
    return true;
  });
  const recentVideos = filteredVideos.slice(0, 4);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Your learning workspace at a glance
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/videos">
                <Plus className="h-4 w-4 mr-2" />
                Add Video
              </Link>
            </Button>
          </div>
        </div>

        {error && (
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Failed to load dashboard
              </CardTitle>
              <CardDescription>Please try again from My Videos.</CardDescription>
            </CardHeader>
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Videos</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '...' : videos.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '...' : completedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processing</CardTitle>
              <Loader2 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '...' : processingCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Needs review</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '...' : failedCount}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Recent Videos</CardTitle>
                <CardDescription>Latest uploads and processing results</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'processing', label: 'Processing' },
                  { value: 'failed', label: 'Failed' },
                ].map((item) => (
                  <Button
                    key={item.value}
                    variant={filter === item.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter(item.value as DashboardFilter)}
                  >
                    {item.label}
                  </Button>
                ))}
                <Button variant="outline" size="sm" asChild>
                  <Link to="/videos">Open My Videos</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {!isLoading && videos.length === 0 && (
                <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No videos yet.
                </div>
              )}
              {!isLoading && videos.length > 0 && recentVideos.length === 0 && (
                <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No videos match this filter.
                </div>
              )}
              {isLoading && (
                <div className="rounded-md border p-4 text-sm text-muted-foreground">Loading videos...</div>
              )}
              {recentVideos.map((video) => (
                <Link
                  key={video.id}
                  to={`/videos/${video.id}`}
                  className="flex items-center justify-between gap-3 rounded-md border p-3 transition-colors hover:bg-accent"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{video.original_filename}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(video.created_at)}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {video.status}
                  </Badge>
                </Link>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notes
                </CardTitle>
                <CardDescription>Lecture notes generated from completed videos</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/notes">Open Notes</Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Quizzes
                </CardTitle>
                <CardDescription>Practice from generated quiz sets</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/quizzes">Open Quizzes</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
