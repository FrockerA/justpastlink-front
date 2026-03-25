import { useProcessingStatus } from '@/hooks/useVideos';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Play,
  FileText,
  BookOpen,
  HelpCircle,
  RefreshCw
} from 'lucide-react';

interface ProcessingStatusProps {
  videoId: number;
}

const jobTypeLabels: Record<string, string> = {
  transcription: 'Transcription',
  lecture_generation: 'Lecture Generation',
  quiz_generation: 'Quiz Generation',
  summary_generation: 'Summary Generation',
};

const jobStatusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="h-4 w-4 text-muted-foreground" />,
  processing: <Loader2 className="h-4 w-4 animate-spin text-blue-500" />,
  completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  failed: <XCircle className="h-4 w-4 text-red-500" />,
};

const jobStatusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  processing: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

export function ProcessingStatus({ videoId }: ProcessingStatusProps) {
  const { 
    status, 
    isLoading, 
    error, 
    fetchStatus,
    startProcessing 
  } = useProcessingStatus(videoId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Processing Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <XCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-destructive">{error}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={fetchStatus}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Processing Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No processing information available</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = () => {
    switch (status.video_status) {
      case 'uploaded':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getStatusBadge = () => {
    switch (status.video_status) {
      case 'uploaded':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Uploaded</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Processing</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const hasRunningJob = status.jobs.some((job) => ['pending', 'processing', 'queued'].includes(job.status));
  const canStartProcessing = !status.quiz_ready && !hasRunningJob;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon()}
              Processing Status
            </CardTitle>
            <CardDescription>
              Track the progress of your video transformation
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          {canStartProcessing && (
            <Button onClick={startProcessing} size="sm">
              <Play className="h-4 w-4 mr-2" />
              Start Processing
            </Button>
          )}
        </div>

        {/* Processing Jobs */}
        {status.jobs.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Processing Jobs</h4>
            <div className="space-y-2">
              {status.jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {jobStatusIcons[job.status]}
                    <div>
                      <p className="font-medium text-sm">
                        {jobTypeLabels[job.job_type] || job.job_type}
                      </p>
                      {job.error_message && (
                        <p className="text-xs text-destructive mt-0.5">
                          {job.error_message}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${jobStatusColors[job.status]}`}
                  >
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Availability */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Content Availability</h4>
          <div className="grid grid-cols-3 gap-3">
            <div className={`p-3 border rounded-lg text-center ${status.transcript_ready ? 'border-green-200 bg-green-50' : ''}`}>
              <FileText className={`h-5 w-5 mx-auto mb-1 ${status.transcript_ready ? 'text-green-600' : 'text-muted-foreground'}`} />
              <p className="text-xs font-medium">Transcript</p>
              <p className={`text-xs ${status.transcript_ready ? 'text-green-600' : 'text-muted-foreground'}`}>
                {status.transcript_ready ? 'Ready' : 'Not ready'}
              </p>
            </div>
            <div className={`p-3 border rounded-lg text-center ${status.lecture_ready ? 'border-green-200 bg-green-50' : ''}`}>
              <BookOpen className={`h-5 w-5 mx-auto mb-1 ${status.lecture_ready ? 'text-green-600' : 'text-muted-foreground'}`} />
              <p className="text-xs font-medium">Lecture</p>
              <p className={`text-xs ${status.lecture_ready ? 'text-green-600' : 'text-muted-foreground'}`}>
                {status.lecture_ready ? 'Ready' : 'Not ready'}
              </p>
            </div>
            <div className={`p-3 border rounded-lg text-center ${status.quiz_ready ? 'border-green-200 bg-green-50' : ''}`}>
              <HelpCircle className={`h-5 w-5 mx-auto mb-1 ${status.quiz_ready ? 'text-green-600' : 'text-muted-foreground'}`} />
              <p className="text-xs font-medium">Quiz</p>
              <p className={`text-xs ${status.quiz_ready ? 'text-green-600' : 'text-muted-foreground'}`}>
                {status.quiz_ready ? 'Ready' : 'Not ready'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
