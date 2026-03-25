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
      setQuestions(data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('Quiz questions not found');
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

  const createQuestion = async (data: Omit<QuizQuestion, 'id' | 'lecture_id' | 'created_at' | 'updated_at'>, lectureId: number) => {
    const newQuestion = await quizApi.createQuestion(lectureId, data);
    setQuestions((prev) => [...prev, newQuestion]);
    return newQuestion;
  };

  const updateQuestion = async (questionId: number, data: Partial<QuizQuestion>) => {
    const updated = await quizApi.updateQuestion(questionId, data);
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? updated : q))
    );
    return updated;
  };

  const deleteQuestion = async (questionId: number) => {
    await quizApi.deleteQuestion(questionId);
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
  };

  return {
    questions,
    isLoading,
    error,
    fetchQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
  };
}
