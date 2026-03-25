import { useState, useEffect, useCallback } from 'react';
import { videosApi, processingApi } from '@/lib/api';
import type { Video, ProcessingStatusResponse } from '@/types';

export function useVideos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await videosApi.getVideos();
      setVideos(data);
    } catch (err) {
      setError('Failed to fetch videos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const uploadVideo = async (file: File, onProgress?: (progress: number) => void) => {
    const response = await videosApi.uploadVideo(file, onProgress);
    await fetchVideos();
    return response;
  };

  const deleteVideo = async (videoId: number) => {
    await videosApi.deleteVideo(videoId);
    await fetchVideos();
  };

  return {
    videos,
    isLoading,
    error,
    fetchVideos,
    uploadVideo,
    deleteVideo,
  };
}

export function useVideo(videoId: number | null) {
  const [video, setVideo] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVideo = useCallback(async () => {
    if (!videoId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await videosApi.getVideo(videoId);
      setVideo(data);
    } catch (err) {
      setError('Failed to fetch video');
    } finally {
      setIsLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    fetchVideo();
  }, [fetchVideo]);

  return {
    video,
    isLoading,
    error,
    fetchVideo,
  };
}

export function useProcessingStatus(videoId: number | null, pollInterval = 5000) {
  const [status, setStatus] = useState<ProcessingStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!videoId) return;
    setIsLoading(true);
    try {
      const data = await processingApi.getStatus(videoId);
      setStatus(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch processing status');
    } finally {
      setIsLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    fetchStatus();

    // Poll for updates if processing is not complete
    const interval = setInterval(() => {
      if (status && (status.video_status === 'processing' || status.video_status === 'uploaded')) {
        fetchStatus();
      }
    }, pollInterval);

    return () => clearInterval(interval);
  }, [fetchStatus, pollInterval, status?.video_status]);

  const startProcessing = async () => {
    if (!videoId) return;
    await processingApi.startProcessing(videoId);
    await fetchStatus();
  };

  return {
    status,
    isLoading,
    error,
    fetchStatus,
    startProcessing,
  };
}
