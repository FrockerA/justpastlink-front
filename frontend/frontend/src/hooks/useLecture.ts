import { useState, useEffect, useCallback } from 'react';
import { isApiErrorStatus, lecturesApi } from '@/lib/api';
import type { Lecture } from '@/types';

export function useLecture(videoId: number | null) {
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLecture = useCallback(async () => {
    if (!videoId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await lecturesApi.getLecture(videoId);
      setLecture(data);
    } catch (err) {
      if (isApiErrorStatus(err, 404)) {
        setLecture(null);
        setError(null);
      } else {
        setError('Failed to fetch lecture');
      }
    } finally {
      setIsLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    fetchLecture();
  }, [fetchLecture]);

  const updateLecture = async (data: Partial<Lecture>) => {
    if (!videoId) return;
    const updated = await lecturesApi.updateLecture(videoId, data);
    setLecture(updated);
    return updated;
  };

  return {
    lecture,
    isLoading,
    error,
    fetchLecture,
    updateLecture,
  };
}
