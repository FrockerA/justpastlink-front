import { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { useQuiz } from '@/hooks/useQuiz';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn, format } from '@/lib/utils';
import {
  BarChart3,
  Brain,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  HelpCircle,
  Layers,
  ListChecks,
  Play,
  RefreshCw,
  RotateCcw,
  Shuffle,
  Trophy,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import type {
  QuizAttempt,
  QuizDifficulty,
  QuizMode,
  QuizQuestion,
  QuizQuestionLimit,
} from '@/types';

interface QuizViewProps {
  videoId: number;
}

type OptionChoice = {
  key: string;
  text: string;
};

type ModeOption = {
  value: QuizMode;
  label: string;
  description: string;
  icon: LucideIcon;
};

const modeOptions: ModeOption[] = [
  {
    value: 'practice',
    label: 'Practice',
    description: 'Instant feedback after each answer.',
    icon: ListChecks,
  },
  {
    value: 'exam',
    label: 'Exam',
    description: 'No feedback until the final submit.',
    icon: Trophy,
  },
  {
    value: 'flashcards',
    label: 'Flashcards',
    description: 'Review question and answer cards.',
    icon: Layers,
  },
];

const difficultyOptions: Array<{ value: QuizDifficulty; label: string }> = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'mixed', label: 'Mixed' },
];

const questionLimitOptions: Array<{ value: QuizQuestionLimit; label: string }> = [
  { value: '5', label: '5' },
  { value: '10', label: '10' },
  { value: '15', label: '15' },
  { value: 'all', label: 'All' },
];

const modeLabels: Record<QuizMode, string> = {
  practice: 'Practice',
  exam: 'Exam',
  flashcards: 'Flashcards',
};

const difficultyLabels: Record<QuizDifficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  mixed: 'Mixed',
};

const quizProgressChartConfig = {
  score: {
    label: 'Score',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

const attemptsStoragePrefix = 'justpastlink.quiz_attempts';

function getAttemptsStorageKey(videoId: number) {
  return `${attemptsStoragePrefix}.${videoId}`;
}

function isQuizAttempt(value: unknown): value is QuizAttempt {
  if (!value || typeof value !== 'object') return false;

  const attempt = value as Partial<QuizAttempt>;
  return (
    typeof attempt.id === 'string' &&
    typeof attempt.video_id === 'number' &&
    typeof attempt.completed_at === 'string' &&
    typeof attempt.mode === 'string' &&
    typeof attempt.difficulty === 'string' &&
    typeof attempt.question_count === 'number' &&
    (typeof attempt.score === 'number' || attempt.score === null) &&
    typeof attempt.total === 'number' &&
    typeof attempt.duration_seconds === 'number'
  );
}

function readQuizAttempts(videoId: number): QuizAttempt[] {
  try {
    const stored = window.localStorage.getItem(getAttemptsStorageKey(videoId));
    if (!stored) return [];

    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter(isQuizAttempt) : [];
  } catch {
    return [];
  }
}

function saveQuizAttempts(videoId: number, attempts: QuizAttempt[]) {
  try {
    window.localStorage.setItem(getAttemptsStorageKey(videoId), JSON.stringify(attempts));
  } catch {
    // Local storage can fail in private windows or quota-limited environments.
  }
}

function getQuestionKey(question: QuizQuestion, index: number) {
  return String(question.id ?? `question-${index}`);
}

function getAnswerOptions(question: QuizQuestion): OptionChoice[] {
  return [
    { key: 'A', text: question.option_a },
    { key: 'B', text: question.option_b },
    { key: 'C', text: question.option_c },
    { key: 'D', text: question.option_d },
  ];
}

function getAnswerText(question: QuizQuestion, answerKey: string) {
  return getAnswerOptions(question).find((option) => option.key === answerKey)?.text || answerKey;
}

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function getQuestionWeight(question: QuizQuestion) {
  const optionWeight = getAnswerOptions(question).reduce(
    (total, option) => total + countWords(option.text),
    0
  );
  const reasoningSignal = /(why|how|compare|analy|derive|calculate|tradeoff|cause|effect)/i.test(
    question.question_text
  )
    ? 12
    : 0;

  return (
    countWords(question.question_text) * 2 +
    optionWeight +
    countWords(question.explanation || '') +
    reasoningSignal
  );
}

function seededShuffle<T>(items: T[], seed: number) {
  const shuffled = [...items];
  let state = seed || 1;

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    state = (state * 1664525 + 1013904223) % 4294967296;
    const swapIndex = state % (index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function getQuestionLimit(limit: QuizQuestionLimit, total: number) {
  if (limit === 'all') return total;
  return Math.min(Number(limit), total);
}

function getEffectiveQuestionLimit(limit: QuizQuestionLimit, total: number): QuizQuestionLimit {
  if (limit === 'all') return 'all';
  return Number(limit) <= total ? limit : 'all';
}

function buildActiveQuestions(
  questions: QuizQuestion[],
  difficulty: QuizDifficulty,
  questionLimit: QuizQuestionLimit,
  randomSeed: number,
  randomized: boolean
) {
  const weightedQuestions = questions.map((question, index) => ({
    question,
    index,
    weight: getQuestionWeight(question),
  }));
  const sortedWeights = weightedQuestions.map((item) => item.weight).sort((a, b) => a - b);
  const medianWeight = sortedWeights[Math.floor(sortedWeights.length / 2)] ?? 0;

  const prepared = [...weightedQuestions];
  if (difficulty === 'easy') {
    prepared.sort((a, b) => a.weight - b.weight || a.index - b.index);
  }
  if (difficulty === 'medium') {
    prepared.sort(
      (a, b) =>
        Math.abs(a.weight - medianWeight) - Math.abs(b.weight - medianWeight) ||
        a.index - b.index
    );
  }
  if (difficulty === 'hard') {
    prepared.sort((a, b) => b.weight - a.weight || a.index - b.index);
  }

  let preparedQuestions = prepared.map((item) => item.question);
  if (difficulty === 'mixed' || randomized) {
    preparedQuestions = seededShuffle(preparedQuestions, randomSeed);
  }

  return preparedQuestions.slice(0, getQuestionLimit(questionLimit, preparedQuestions.length));
}

function formatAttemptDate(dateString: string) {
  try {
    return format(new Date(dateString), 'MMM d, HH:mm');
  } catch {
    return dateString;
  }
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
}

function getScorePercent(attempt: QuizAttempt) {
  if (attempt.score === null || attempt.total === 0) return null;
  return Math.round((attempt.score / attempt.total) * 100);
}

export function QuizView({ videoId }: QuizViewProps) {
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('mixed');
  const [mode, setMode] = useState<QuizMode>('practice');
  const [questionLimit, setQuestionLimit] = useState<QuizQuestionLimit>('10');
  const [randomSeed, setRandomSeed] = useState(() => Date.now());
  const [randomized, setRandomized] = useState(false);
  const { questions, isLoading, error, fetchQuestions } = useQuiz(videoId);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [showExplanation, setShowExplanation] = useState<Record<string, boolean>>({});
  const [quizStarted, setQuizStarted] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [revealedCards, setRevealedCards] = useState<Record<string, boolean>>({});
  const [savedAttemptId, setSavedAttemptId] = useState<string | null>(null);
  const [attemptStore, setAttemptStore] = useState(() => ({
    videoId,
    attempts: readQuizAttempts(videoId),
  }));
  const effectiveQuestionLimit = getEffectiveQuestionLimit(questionLimit, questions.length);
  const availableQuestionLimitOptions = questionLimitOptions.map((option) => ({
    ...option,
    disabled: option.value !== 'all' && Number(option.value) > questions.length,
    label: option.value === 'all' ? `All (${questions.length})` : option.label,
  }));

  const activeQuestions = useMemo(
    () =>
      buildActiveQuestions(questions, difficulty, effectiveQuestionLimit, randomSeed, randomized),
    [difficulty, effectiveQuestionLimit, questions, randomSeed, randomized]
  );
  const totalQuestions = activeQuestions.length;
  const currentQuestionIndex = Math.min(activeQuestion, Math.max(totalQuestions - 1, 0));
  const currentQuestion = activeQuestions[currentQuestionIndex];
  const currentQuestionKey = currentQuestion
    ? getQuestionKey(currentQuestion, currentQuestionIndex)
    : '';
  const selectedMode = modeOptions.find((option) => option.value === mode) ?? modeOptions[0];
  const attempts =
    attemptStore.videoId === videoId ? attemptStore.attempts : readQuizAttempts(videoId);
  const answeredCount = activeQuestions.reduce((count, question, index) => {
    return selectedAnswers[getQuestionKey(question, index)] ? count + 1 : count;
  }, 0);
  const score = activeQuestions.reduce((correct, question, index) => {
    const selectedAnswer = selectedAnswers[getQuestionKey(question, index)];
    return selectedAnswer === question.correct_answer ? correct + 1 : correct;
  }, 0);
  const progressValue =
    totalQuestions === 0 ? 0 : Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100);
  const completedAttempt = attempts.find((attempt) => attempt.id === savedAttemptId) ?? null;
  const chartData = attempts
    .filter((attempt) => attempt.score !== null)
    .slice(0, 8)
    .reverse()
    .map((attempt, index) => ({
      attempt: `#${index + 1}`,
      score: getScorePercent(attempt) ?? 0,
      label: formatAttemptDate(attempt.completed_at),
    }));

  const handleStart = () => {
    setQuizStarted(true);
    setActiveQuestion(0);
    setSelectedAnswers({});
    setShowResults(false);
    setShowExplanation({});
    setRevealedCards({});
    setSavedAttemptId(null);
    setStartedAt(Date.now());
  };

  const handleReset = () => {
    setActiveQuestion(0);
    setSelectedAnswers({});
    setShowResults(false);
    setShowExplanation({});
    setRevealedCards({});
    setQuizStarted(false);
    setSavedAttemptId(null);
    setStartedAt(null);
  };

  const handleRandomize = () => {
    setRandomized(true);
    setRandomSeed(Date.now());
    handleReset();
  };

  const completeSession = () => {
    if (savedAttemptId || totalQuestions === 0) {
      setShowResults(true);
      return;
    }

    const durationSeconds = startedAt
      ? Math.max(1, Math.round((Date.now() - startedAt) / 1000))
      : 0;
    const attempt: QuizAttempt = {
      id: `${videoId}-${Date.now()}`,
      video_id: videoId,
      completed_at: new Date().toISOString(),
      mode,
      difficulty,
      question_count: totalQuestions,
      score: mode === 'flashcards' ? null : score,
      total: totalQuestions,
      duration_seconds: durationSeconds,
    };

    setAttemptStore((currentStore) => {
      const currentAttempts =
        currentStore.videoId === videoId ? currentStore.attempts : readQuizAttempts(videoId);
      const nextAttempts = [attempt, ...currentAttempts].slice(0, 50);
      saveQuizAttempts(videoId, nextAttempts);
      return { videoId, attempts: nextAttempts };
    });
    setSavedAttemptId(attempt.id);
    setShowResults(true);
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    if (!quizStarted || showResults || mode === 'flashcards') return;

    setSelectedAnswers((prev) => ({ ...prev, [questionId]: answer }));
    if (mode === 'practice' && difficulty === 'easy') {
      setShowExplanation((prev) => ({ ...prev, [questionId]: true }));
    }
  };

  const toggleExplanation = (questionId: string) => {
    setShowExplanation((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const handleDifficultyChange = (value: string) => {
    if (!value) return;
    setDifficulty(value as QuizDifficulty);
    setRandomized(false);
    handleReset();
  };

  const handleModeChange = (value: string) => {
    if (!value) return;
    setMode(value as QuizMode);
    handleReset();
  };

  const handleQuestionLimitChange = (value: string) => {
    setQuestionLimit(value as QuizQuestionLimit);
    handleReset();
  };

  const getAnswerStatus = (question: QuizQuestion, selectedAnswer: string | undefined) => {
    if (!selectedAnswer) return 'unanswered';
    if (selectedAnswer === question.correct_answer) return 'correct';
    return 'incorrect';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-4 w-1/3" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Quiz
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription className="flex items-center justify-between gap-3">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={fetchQuestions}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Quiz
          </CardTitle>
          <CardDescription>Quiz questions are not available yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            <HelpCircle className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>Quiz questions will be generated once the lecture is ready</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  const currentSelectedAnswer = selectedAnswers[currentQuestionKey];
  const currentAnswerStatus = getAnswerStatus(currentQuestion, currentSelectedAnswer);
  const showImmediateFeedback = mode === 'practice' && Boolean(currentSelectedAnswer);
  const showCorrectness = showResults || showImmediateFeedback;
  const answersLocked = showResults || showImmediateFeedback;
  const canShowExplanation =
    Boolean(currentQuestion.explanation) &&
    (showResults || (showImmediateFeedback && difficulty !== 'hard'));
  const answerOptions = getAnswerOptions(currentQuestion);
  const currentCardRevealed = revealedCards[currentQuestionKey] ?? false;
  const reviewedCards = Object.values(revealedCards).filter(Boolean).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Quiz
            </CardTitle>
            <CardDescription>
              {questions.length} generated question{questions.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {!quizStarted ? (
              <Button variant="outline" onClick={fetchQuestions}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            ) : (
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!quizStarted ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-5">
              <div className="rounded-md border p-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Mode</Label>
                    <ToggleGroup
                      type="single"
                      variant="outline"
                      value={mode}
                      onValueChange={handleModeChange}
                      className="grid w-full grid-cols-1 sm:grid-cols-3"
                    >
                      {modeOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <ToggleGroupItem
                            key={option.value}
                            value={option.value}
                            className="h-auto min-h-11 flex-col gap-1 whitespace-normal py-2"
                          >
                            <Icon className="h-4 w-4" />
                            <span>{option.label}</span>
                          </ToggleGroupItem>
                        );
                      })}
                    </ToggleGroup>
                    <p className="text-xs text-muted-foreground">{selectedMode.description}</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Difficulty</Label>
                    <ToggleGroup
                      type="single"
                      variant="outline"
                      value={difficulty}
                      onValueChange={handleDifficultyChange}
                      className="grid w-full grid-cols-2 sm:grid-cols-4"
                    >
                      {difficultyOptions.map((option) => (
                        <ToggleGroupItem
                          key={option.value}
                          value={option.value}
                          className="min-h-10 whitespace-normal"
                        >
                          {option.label}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="quiz-question-limit">Questions</Label>
                      <Select
                        value={effectiveQuestionLimit}
                        onValueChange={handleQuestionLimitChange}
                      >
                        <SelectTrigger id="quiz-question-limit" className="w-full">
                          <SelectValue placeholder="Questions" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableQuestionLimitOptions.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                              disabled={option.disabled}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Order</Label>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={handleRandomize}
                      >
                        <Shuffle className="mr-2 h-4 w-4" />
                        Randomize questions
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{totalQuestions}</span> active
                      question{totalQuestions !== 1 ? 's' : ''} from{' '}
                      <span className="font-medium text-foreground">{questions.length}</span>
                    </div>
                    <Button onClick={handleStart} disabled={totalQuestions === 0}>
                      <Play className="mr-2 h-4 w-4" />
                      Start
                    </Button>
                  </div>
                </div>
              </div>

              <div className="rounded-md border p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">Question set</h3>
                </div>
                <div className="space-y-3">
                  {activeQuestions.slice(0, 5).map((question, index) => (
                    <div
                      key={`${getQuestionKey(question, index)}-${question.question_text}`}
                      className="flex items-start gap-3 rounded-md border p-3"
                    >
                      <Badge variant="secondary" className="shrink-0">
                        Q{index + 1}
                      </Badge>
                      <p className="text-sm">{question.question_text}</p>
                    </div>
                  ))}
                  {totalQuestions > 5 && (
                    <p className="text-xs text-muted-foreground">
                      +{totalQuestions - 5} more selected for this session
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-md border p-4">
                <div className="mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">Progress</h3>
                </div>
                {chartData.length > 1 ? (
                  <ChartContainer config={quizProgressChartConfig} className="h-[180px] w-full">
                    <LineChart data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="attempt"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                      />
                      <YAxis
                        width={32}
                        domain={[0, 100]}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="var(--color-score)"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ChartContainer>
                ) : (
                  <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
                    Complete two scored attempts to see the trend.
                  </div>
                )}
              </div>

              <div className="rounded-md border p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">Recent attempts</h3>
                </div>
                {attempts.length > 0 ? (
                  <div className="space-y-3">
                    {attempts.slice(0, 5).map((attempt) => {
                      const percent = getScorePercent(attempt);
                      return (
                        <div key={attempt.id} className="rounded-md border p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {modeLabels[attempt.mode]} / {difficultyLabels[attempt.difficulty]}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {formatAttemptDate(attempt.completed_at)} |{' '}
                                {formatDuration(attempt.duration_seconds)} |{' '}
                                {attempt.question_count} question
                                {attempt.question_count !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <Badge variant={percent === null ? 'secondary' : 'default'}>
                              {percent === null ? 'Cards' : `${percent}%`}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
                    Attempts will appear after your first session.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {showResults && (
              <div className="rounded-md border bg-primary/5 p-5 text-center">
                <Trophy className="mx-auto mb-2 h-10 w-10 text-primary" />
                <h3 className="text-xl font-bold">
                  {mode === 'flashcards' ? 'Flashcards Complete' : 'Quiz Complete'}
                </h3>
                {mode === 'flashcards' ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Reviewed {totalQuestions} card{totalQuestions !== 1 ? 's' : ''}
                    {completedAttempt ? ` in ${formatDuration(completedAttempt.duration_seconds)}` : ''}
                  </p>
                ) : (
                  <>
                    <p className="mt-2 text-lg">
                      You scored <span className="font-bold text-primary">{score}</span> out of{' '}
                      <span className="font-bold">{totalQuestions}</span>
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {score === totalQuestions
                        ? 'Perfect score. Excellent work.'
                        : score >= totalQuestions / 2
                        ? 'Good job. Keep learning.'
                        : 'Keep practicing to improve.'}
                    </p>
                  </>
                )}
              </div>
            )}

            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {mode === 'flashcards' ? 'Card' : 'Question'} {currentQuestionIndex + 1} of{' '}
                    {totalQuestions}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {modeLabels[mode]} | {difficultyLabels[difficulty]}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {mode === 'flashcards' ? (
                    <Badge variant="secondary">
                      {reviewedCards}/{totalQuestions} revealed
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      {answeredCount}/{totalQuestions} answered
                    </Badge>
                  )}
                  {showCorrectness && mode !== 'flashcards' && (
                    <Badge
                      variant={currentAnswerStatus === 'correct' ? 'default' : 'destructive'}
                    >
                      {currentAnswerStatus === 'correct' ? (
                        <>
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Correct
                        </>
                      ) : currentAnswerStatus === 'incorrect' ? (
                        <>
                          <XCircle className="mr-1 h-3 w-3" />
                          Incorrect
                        </>
                      ) : (
                        'Unanswered'
                      )}
                    </Badge>
                  )}
                </div>
              </div>
              <Progress value={progressValue} />
            </div>

            {mode === 'flashcards' ? (
              <div className="rounded-md border p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <Badge variant="outline">{currentCardRevealed ? 'Answer' : 'Question'}</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setRevealedCards((current) => ({
                        ...current,
                        [currentQuestionKey]: !currentCardRevealed,
                      }))
                    }
                  >
                    {currentCardRevealed ? (
                      <>
                        <EyeOff className="mr-2 h-4 w-4" />
                        Hide answer
                      </>
                    ) : (
                      <>
                        <Eye className="mr-2 h-4 w-4" />
                        Show answer
                      </>
                    )}
                  </Button>
                </div>

                {!currentCardRevealed ? (
                  <h3 className="text-lg font-medium">{currentQuestion.question_text}</h3>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Question</p>
                      <p className="mt-1 text-base">{currentQuestion.question_text}</p>
                    </div>
                    <div className="rounded-md bg-muted p-4">
                      <p className="text-sm font-medium">Answer</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {currentQuestion.correct_answer}.{' '}
                        {getAnswerText(currentQuestion, currentQuestion.correct_answer)}
                      </p>
                    </div>
                    {currentQuestion.explanation && (
                      <div className="rounded-md border p-4">
                        <p className="text-sm font-medium">Explanation</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {currentQuestion.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-md border p-6">
                <h3 className="mb-4 text-lg font-medium">{currentQuestion.question_text}</h3>

                <RadioGroup
                  value={currentSelectedAnswer || ''}
                  onValueChange={(value) => handleAnswerSelect(currentQuestionKey, value)}
                  className="space-y-3"
                  disabled={answersLocked}
                >
                  {answerOptions.map((option) => {
                    const isSelected = currentSelectedAnswer === option.key;
                    const isCorrect = option.key === currentQuestion.correct_answer;
                    const showOptionStatus = showCorrectness && (isCorrect || isSelected);

                    return (
                      <div
                        key={option.key}
                        className={cn(
                          'flex items-center gap-3 rounded-md border p-3 transition-colors',
                          showOptionStatus && isCorrect && 'border-emerald-500 bg-emerald-500/10',
                          showOptionStatus &&
                            isSelected &&
                            !isCorrect &&
                            'border-red-500 bg-red-500/10',
                          !showOptionStatus && isSelected && 'border-primary bg-primary/5',
                          !showOptionStatus && !answersLocked && 'hover:bg-accent'
                        )}
                      >
                        <RadioGroupItem
                          value={option.key}
                          id={`${currentQuestionKey}-${option.key}`}
                          disabled={answersLocked}
                        />
                        <Label
                          htmlFor={`${currentQuestionKey}-${option.key}`}
                          className={cn('flex-1', answersLocked ? 'cursor-default' : 'cursor-pointer')}
                        >
                          <span className="font-medium">{option.key}.</span> {option.text}
                        </Label>
                        {showOptionStatus && isCorrect && (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        )}
                        {showOptionStatus && isSelected && !isCorrect && (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                    );
                  })}
                </RadioGroup>

                {canShowExplanation && (
                  <div className="mt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExplanation(currentQuestionKey)}
                    >
                      {showExplanation[currentQuestionKey] ? (
                        <>
                          <EyeOff className="mr-2 h-4 w-4" />
                          Hide explanation
                        </>
                      ) : (
                        <>
                          <Eye className="mr-2 h-4 w-4" />
                          Show explanation
                        </>
                      )}
                    </Button>
                    {showExplanation[currentQuestionKey] && (
                      <div className="mt-2 rounded-md bg-muted p-4 text-sm">
                        <p className="font-medium">Explanation</p>
                        <p className="mt-1 text-muted-foreground">{currentQuestion.explanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                variant="outline"
                onClick={() => setActiveQuestion((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>

              <div className="flex flex-col gap-2 sm:flex-row">
                {currentQuestionIndex < totalQuestions - 1 ? (
                  <Button
                    onClick={() =>
                      setActiveQuestion((prev) => Math.min(totalQuestions - 1, prev + 1))
                    }
                    disabled={mode === 'practice' && !currentSelectedAnswer}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    onClick={completeSession}
                    disabled={
                      showResults ||
                      (mode === 'exam' && answeredCount < totalQuestions) ||
                      (mode === 'practice' && !currentSelectedAnswer)
                    }
                  >
                    {mode === 'flashcards' ? 'Finish cards' : mode === 'practice' ? 'Finish practice' : 'Submit quiz'}
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
