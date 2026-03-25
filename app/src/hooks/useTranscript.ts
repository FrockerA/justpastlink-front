import { useState, useEffect, useCallback } from 'react';
import { transcriptsApi } from '@/lib/api';
import type { Transcript } from '@/types';

export function useTranscript(videoId: number | null) {
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTranscript = useCallback(async () => {
    if (!videoId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await transcriptsApi.getTranscript(videoId);
      setTranscript(data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('Transcript not found');
      } else {
        setError('Failed to fetch transcript');
      }
    } finally {
      setIsLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    fetchTranscript();
  }, [fetchTranscript]);

  return {
    transcript,
    isLoading,
    error,
    fetchTranscript,
  };
}
