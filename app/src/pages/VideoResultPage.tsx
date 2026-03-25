import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { lecturesApi, processingApi, quizApi } from '@/lib/api';
import type { Lecture, QuizQuestion } from '@/types';

export function VideoResultPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();

  const parsedVideoId = videoId ? Number.parseInt(videoId, 10) : null;

  const [status, setStatus] = useState('loading');
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!parsedVideoId) {
      setError('Invalid video id');
      return;
    }

    let intervalId: number | undefined;

    const loadResult = async () => {
      try {
        const processing = await processingApi.getStatus(parsedVideoId);
        setStatus(processing.video_status);

        if (processing.video_status === 'failed' || processing.video_status === 'error') {
          setError('Обработка видео завершилась с ошибкой');
          if (intervalId) window.clearInterval(intervalId);
          return;
        }

        if (processing.lecture_ready && processing.quiz_ready) {
          const [lectureData, quizData] = await Promise.all([
            lecturesApi.getLecture(parsedVideoId),
            quizApi.getQuestionsByVideo(parsedVideoId),
          ]);

          setLecture(lectureData);
          setQuiz(quizData.questions);

          if (intervalId) window.clearInterval(intervalId);
        }
      } catch (err: any) {
        setError(err?.response?.data?.detail || err.message || 'Ошибка загрузки результата');
        if (intervalId) window.clearInterval(intervalId);
      }
    };

    loadResult();
    intervalId = window.setInterval(loadResult, 3000);

    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [parsedVideoId]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <Button variant="ghost" className="-ml-4" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!error && !lecture && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Видео обрабатывается...
              </CardTitle>
              <CardDescription>Текущий статус: {status}</CardDescription>
            </CardHeader>
          </Card>
        )}

        {lecture && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>{lecture.title || 'Lecture'}</CardTitle>
                {lecture.summary && <CardDescription>{lecture.summary}</CardDescription>}
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap">{lecture.content}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quiz</CardTitle>
                <CardDescription>{quiz.length} questions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {quiz.map((q, index) => (
                  <div key={`${index}-${q.question_text}`} className="rounded-lg border p-4">
                    <p className="font-semibold">{index + 1}. {q.question_text}</p>
                    <p>A. {q.option_a}</p>
                    <p>B. {q.option_b}</p>
                    <p>C. {q.option_c}</p>
                    <p>D. {q.option_d}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </MainLayout>
  );
}
