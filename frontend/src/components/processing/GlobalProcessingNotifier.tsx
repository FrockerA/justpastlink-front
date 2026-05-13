import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { videosApi } from '@/lib/api';
import type { VideoStatus } from '@/types';

const POLL_INTERVAL_MS = 7000;

export function GlobalProcessingNotifier() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const previousStatuses = useRef<Map<number, VideoStatus>>(new Map());
  const notifiedVideos = useRef<Set<number>>(new Set());
  const initialized = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      initialized.current = false;
      previousStatuses.current.clear();
      return;
    }

    let isMounted = true;

    const checkVideos = async () => {
      try {
        const videos = await videosApi.getVideos();
        if (!isMounted) return;

        const nextStatuses = new Map(videos.map((video) => [video.id, video.status]));

        if (!initialized.current) {
          previousStatuses.current = nextStatuses;
          initialized.current = true;
          return;
        }

        videos.forEach((video) => {
          const previousStatus = previousStatuses.current.get(video.id);
          const justCompleted = previousStatus && previousStatus !== 'completed' && video.status === 'completed';

          if (!justCompleted || notifiedVideos.current.has(video.id)) {
            return;
          }

          notifiedVideos.current.add(video.id);
          toast.success('Lecture is ready', {
            description: video.original_filename,
            action: {
              label: 'Open',
              onClick: () => navigate(`/videos/${video.id}?tab=lecture`),
            },
            duration: 12000,
          });
        });

        previousStatuses.current = nextStatuses;
      } catch {
        // Background polling should never interrupt the page the user is on.
      }
    };

    checkVideos();
    const intervalId = window.setInterval(checkVideos, POLL_INTERVAL_MS);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated, navigate]);

  return null;
}
