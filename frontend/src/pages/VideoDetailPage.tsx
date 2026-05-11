import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProcessingStatus } from '@/components/video/ProcessingStatus';
import { TranscriptView } from '@/components/content/TranscriptView';
import { LectureView } from '@/components/content/LectureView';
import { QuizView } from '@/components/content/QuizView';
import { useVideo } from '@/hooks/useVideos';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  FileText, 
  BookOpen, 
  HelpCircle, 
  Activity,
  Play,
  Clock,
  Calendar
} from 'lucide-react';
import { format } from '@/lib/utils';

export function VideoDetailPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { video, isLoading, error } = useVideo(videoId ? parseInt(videoId) : null);
  
  const currentTab = searchParams.get('tab') || 'status';
  
  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  const formatDuration = (seconds: number | null | undefined) => {
    if (!seconds) return 'Unknown duration';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  const formatFileSize = (bytes: number | null | undefined) => {
    if (bytes === null || bytes === undefined || !Number.isFinite(bytes)) {
      return 'Unknown size';
    }
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (error || !video) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <Alert variant="destructive">
            <AlertDescription>
              {error || 'Video not found'}
            </AlertDescription>
          </Alert>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <Button 
              variant="ghost" 
              className="mb-2 -ml-4"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">{video.original_filename}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Play className="h-4 w-4" />
                {formatDuration(video.duration_seconds)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatFileSize(video.file_size)}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(video.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="status" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Status</span>
            </TabsTrigger>
            <TabsTrigger value="transcript" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Transcript</span>
            </TabsTrigger>
            <TabsTrigger value="lecture" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Lecture</span>
            </TabsTrigger>
            <TabsTrigger value="quiz" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Quiz</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="mt-6">
            {currentTab === 'status' && <ProcessingStatus videoId={video.id} />}
          </TabsContent>

          <TabsContent value="transcript" className="mt-6">
            {currentTab === 'transcript' && <TranscriptView videoId={video.id} />}
          </TabsContent>

          <TabsContent value="lecture" className="mt-6">
            {currentTab === 'lecture' && <LectureView videoId={video.id} />}
          </TabsContent>

          <TabsContent value="quiz" className="mt-6">
            {currentTab === 'quiz' && <QuizView videoId={video.id} />}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
