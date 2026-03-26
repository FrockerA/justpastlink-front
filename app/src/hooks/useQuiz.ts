import { useState, useEffect, useCallback } from 'react';
import { quizApi } from '@/lib/api';
import type { QuizQuestion } from '@/types';

export function useQuiz(videoId: number | null) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    if (!videoId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await quizApi.getQuestionsByVideo(videoId);
      setQuestions(data.questions);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setQuestions([]);
        setError(null);
      } else {
        setError('Failed to fetch quiz questions');
      }
    } finally {
      setIsLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  return {
    questions,
    isLoading,
    error,
    fetchQuestions,
  };
}
