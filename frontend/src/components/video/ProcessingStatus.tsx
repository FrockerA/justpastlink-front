import { useProcessingStatus } from '@/hooks/useVideos';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  HelpCircle,
  Loader2,
  Play,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import type { ProcessingStage, ProcessingStageTiming } from '@/types';

interface ProcessingStatusProps {
  videoId: number;
}

const stageOrder: ProcessingStage[] = ['download', 'transcribe', 'summarize', 'quiz'];

const stageMeta: Record<
  ProcessingStage,
  { label: string; icon: React.ReactNode; contentLabel: string }
> = {
  download: {
    label: 'Download',
    icon: <Download className="h-4 w-4" />,
    contentLabel: 'Source',
  },
  transcribe: {
    label: 'Transcribe',
    icon: <FileText className="h-4 w-4" />,
    contentLabel: 'Transcript',
  },
  summarize: {
    label: 'Lecture',
    icon: <BookOpen className="h-4 w-4" />,
    contentLabel: 'Lecture',
  },
  quiz: {
    label: 'Quiz',
    icon: <HelpCircle className="h-4 w-4" />,
    contentLabel: 'Quiz',
  },
};

const jobTypeLabels: Record<string, string> = {
  video_pipeline: 'Video Pipeline',
  transcription: 'Transcription',
  lecture_generation: 'Lecture Generation',
  quiz_generation: 'Quiz Generation',
  summary_generation: 'Summary Generation',
};

const jobStatusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  queued: 'bg-amber-100 text-amber-800',
  processing: 'bg-blue-100 text-blue-700',
  generating_lecture: 'bg-indigo-100 text-indigo-700',
  generating_quiz: 'bg-violet-100 text-violet-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

function getStageState(
  stage: ProcessingStage,
  currentStage: ProcessingStage | null,
  timing?: ProcessingStageTiming
) {
  if (timing?.status) return timing.status;
  if (currentStage === stage) return 'processing';
  return 'pending';
}

function getStageIcon(state: string) {
  if (state === 'completed') return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  if (state === 'failed') return <XCircle className="h-4 w-4 text-red-600" />;
  if (state === 'processing' || state === 'retrying') {
    return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
  }
  return <Clock className="h-4 w-4 text-muted-foreground" />;
}

function formatEta(seconds: number | null | undefined) {
  if (!seconds) return 'Calculating ETA';
  if (seconds < 60) return `About ${seconds}s left`;
  const minutes = Math.ceil(seconds / 60);
  return `About ${minutes} min left`;
}

function formatDuration(durationMs: number | null | undefined) {
  if (!durationMs) return null;
  const seconds = Math.max(1, Math.round(durationMs / 1000));
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export function ProcessingStatus({ videoId }: ProcessingStatusProps) {
  const { status, isLoading, error, fetchStatus, startProcessing } = useProcessingStatus(videoId);

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
          <div className="py-4 text-center">
            <XCircle className="mx-auto mb-2 h-8 w-8 text-destructive" />
            <p className="text-destructive">{error}</p>
            <Button variant="outline" className="mt-4" onClick={fetchStatus}>
              <RefreshCw className="mr-2 h-4 w-4" />
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

  const jobs = Array.isArray(status.jobs) ? status.jobs : [];
  const latestJob = jobs[0];
  const stageTimings = latestJob?.stage_timings ?? {};
  const hasRunningJob = jobs.some((job) =>
    ['pending', 'queued', 'processing', 'generating_lecture', 'generating_quiz'].includes(job.status)
  );
  const hasAllContent = status.transcript_ready && status.lecture_ready && status.quiz_ready;
  const canStartProcessing = !hasAllContent && !hasRunningJob;
  const progress = status.progress_percent ?? 0;
  const isActive = hasRunningJob || status.video_status === 'queued';
  const stageIndex = status.stage_index || (status.video_status === 'completed' ? status.stage_count : 0);
  const etaText =
    status.video_status === 'completed'
      ? 'Complete'
      : status.video_status === 'failed' || status.video_status === 'error'
        ? 'Stopped'
        : formatEta(status.eta_seconds);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              {isActive ? (
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              ) : status.video_status === 'completed' ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : status.video_status === 'failed' || status.video_status === 'error' ? (
                <XCircle className="h-5 w-5 text-red-500" />
              ) : (
                <Clock className="h-5 w-5 text-muted-foreground" />
              )}
              Processing Status
            </CardTitle>
            <CardDescription>
              Step {stageIndex}/{status.stage_count}: {status.current_stage ? stageMeta[status.current_stage].label : status.video_status}
            </CardDescription>
          </div>
          <Badge variant={status.video_status === 'failed' ? 'destructive' : 'secondary'}>
            {status.video_status.replaceAll('_', ' ')}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium">{progress}% complete</span>
            <span className="text-muted-foreground">{etaText}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {canStartProcessing && (
          <Button onClick={startProcessing} size="sm">
            <Play className="mr-2 h-4 w-4" />
            Start Processing
          </Button>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stageOrder.map((stage) => {
            const timing = stageTimings[stage];
            const state = getStageState(stage, status.current_stage, timing);
            const duration = formatDuration(timing?.duration_ms);

            return (
              <div key={stage} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {stageMeta[stage].icon}
                    {stageMeta[stage].label}
                  </div>
                  {getStageIcon(state)}
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="capitalize">{state}</span>
                  {duration && <span>{duration}</span>}
                </div>
                {timing?.attempts && timing.attempts > 1 && (
                  <p className="mt-1 text-xs text-amber-700">Attempt {timing.attempts}</p>
                )}
                {timing?.error_message && (
                  <p className="mt-1 line-clamp-2 text-xs text-destructive">{timing.error_message}</p>
                )}
              </div>
            );
          })}
        </div>

        {jobs.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Processing Jobs</h4>
            <div className="space-y-2">
              {jobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {jobTypeLabels[job.job_type] || job.job_type}
                    </p>
                    {job.correlation_id && (
                      <p className="truncate text-xs text-muted-foreground">{job.correlation_id}</p>
                    )}
                    {job.error_message && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-destructive">{job.error_message}</p>
                    )}
                  </div>
                  <Badge variant="secondary" className={`shrink-0 text-xs ${jobStatusColors[job.status]}`}>
                    {job.status.replaceAll('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Content Availability</h4>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Transcript', ready: status.transcript_ready, icon: FileText },
              { label: 'Lecture', ready: status.lecture_ready, icon: BookOpen },
              { label: 'Quiz', ready: status.quiz_ready, icon: HelpCircle },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className={`rounded-lg border p-3 text-center ${
                    item.ready ? 'border-green-200 bg-green-50' : ''
                  }`}
                >
                  <Icon
                    className={`mx-auto mb-1 h-5 w-5 ${
                      item.ready ? 'text-green-600' : 'text-muted-foreground'
                    }`}
                  />
                  <p className="text-xs font-medium">{item.label}</p>
                  <p className={`text-xs ${item.ready ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {item.ready ? 'Ready' : 'Not ready'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
