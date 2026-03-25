import { useState } from 'react';
import { useQuiz } from '@/hooks/useQuiz';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

import { 
  HelpCircle, 
  RefreshCw, 
  CheckCircle2, 
  XCircle,
  Eye,
  EyeOff,
  Play,
  RotateCcw,
  Trophy
} from 'lucide-react';
import type { QuizQuestion } from '@/types';

interface QuizViewProps {
  videoId: number;
}

export function QuizView({ videoId }: QuizViewProps) {
  const { questions, isLoading, error, fetchQuestions } = useQuiz(videoId);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});
  const [quizMode, setQuizMode] = useState(false);

  const handleAnswerSelect = (questionId: number, answer: string) => {
    if (quizMode && !showResults) {
      setSelectedAnswers((prev) => ({ ...prev, [questionId]: answer }));
    }
  };

  const handleSubmit = () => {
    setShowResults(true);
  };

  const handleReset = () => {
    setActiveQuestion(0);
    setSelectedAnswers({});
    setShowResults(false);
    setShowExplanation({});
    setQuizMode(false);
  };

  const toggleExplanation = (questionId: number) => {
    setShowExplanation((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q, index) => {
      if (selectedAnswers[q.id ?? index] === q.correct_answer) {
        correct++;
      }
    });
    return correct;
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
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={fetchQuestions}>
                <RefreshCw className="h-4 w-4 mr-2" />
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
          <CardDescription>
            Quiz questions are not available yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Quiz questions will be generated once the lecture is ready</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[activeQuestion];
  const currentQuestionKey = currentQuestion.id ?? activeQuestion;
  const score = calculateScore();
  const totalQuestions = questions.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Quiz
            </CardTitle>
            <CardDescription>
              {totalQuestions} question{totalQuestions !== 1 ? 's' : ''} to test your understanding
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {!quizMode ? (
              <Button onClick={() => setQuizMode(true)}>
                <Play className="h-4 w-4 mr-2" />
                Start Quiz
              </Button>
            ) : (
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {quizMode && showResults && (
          <div className="bg-primary/5 border rounded-lg p-6 text-center">
            <Trophy className="h-12 w-12 mx-auto mb-2 text-primary" />
            <h3 className="text-2xl font-bold">Quiz Complete!</h3>
            <p className="text-lg mt-2">
              You scored <span className="font-bold text-primary">{score}</span> out of{' '}
              <span className="font-bold">{totalQuestions}</span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {score === totalQuestions
                ? 'Perfect score! Excellent work!'
                : score >= totalQuestions / 2
                ? 'Good job! Keep learning!'
                : 'Keep practicing to improve!'}
            </p>
          </div>
        )}

        {quizMode ? (
          <>
            {/* Progress */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Question {activeQuestion + 1} of {totalQuestions}
              </span>
              {showResults && (
                <Badge 
                  variant={getAnswerStatus(currentQuestion, selectedAnswers[currentQuestionKey]) === 'correct' ? 'default' : 'destructive'}
                >
                  {getAnswerStatus(currentQuestion, selectedAnswers[currentQuestionKey]) === 'correct' ? (
                    <><CheckCircle2 className="h-3 w-3 mr-1" /> Correct</>
                  ) : getAnswerStatus(currentQuestion, selectedAnswers[currentQuestionKey]) === 'incorrect' ? (
                    <><XCircle className="h-3 w-3 mr-1" /> Incorrect</>
                  ) : (
                    'Unanswered'
                  )}
                </Badge>
              )}
            </div>

            {/* Question */}
            <div className="border rounded-lg p-6">
              <h3 className="font-medium text-lg mb-4">{currentQuestion.question_text}</h3>
              
              <RadioGroup
                value={selectedAnswers[currentQuestionKey] || ''}
                onValueChange={(value) => handleAnswerSelect(currentQuestionKey, value)}
                className="space-y-3"
                disabled={showResults}
              >
                {[
                  { key: 'A', text: currentQuestion.option_a },
                  { key: 'B', text: currentQuestion.option_b },
                  { key: 'C', text: currentQuestion.option_c },
                  { key: 'D', text: currentQuestion.option_d },
                ].map((option) => {
                  const isSelected = selectedAnswers[currentQuestionKey] === option.key;
                  const isCorrect = option.key === currentQuestion.correct_answer;
                  const showCorrectness = showResults && (isCorrect || isSelected);
                  
                  return (
                    <div
                      key={option.key}
                      className={`flex items-center space-x-3 p-3 border rounded-lg transition-colors ${
                        showCorrectness
                          ? isCorrect
                            ? 'border-green-500 bg-green-50'
                            : isSelected
                            ? 'border-red-500 bg-red-50'
                            : ''
                          : isSelected
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-accent'
                      }`}
                    >
                      <RadioGroupItem 
                        value={option.key} 
                        id={`${currentQuestionKey}-${option.key}`}
                        disabled={showResults}
                      />
                      <Label 
                        htmlFor={`${currentQuestionKey}-${option.key}`}
                        className="flex-1 cursor-pointer"
                      >
                        <span className="font-medium">{option.key}.</span> {option.text}
                      </Label>
                      {showResults && isCorrect && (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      )}
                      {showResults && isSelected && !isCorrect && (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  );
                })}
              </RadioGroup>

              {/* Explanation */}
              {showResults && currentQuestion.explanation && (
                <div className="mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExplanation(currentQuestionKey)}
                  >
                    {showExplanation[currentQuestionKey] ? (
                      <><EyeOff className="h-4 w-4 mr-2" /> Hide Explanation</>
                    ) : (
                      <><Eye className="h-4 w-4 mr-2" /> Show Explanation</>
                    )}
                  </Button>
                  {showExplanation[currentQuestionKey] && (
                    <div className="mt-2 p-4 bg-muted rounded-lg text-sm">
                      <p className="font-medium mb-1">Explanation:</p>
                      <p className="text-muted-foreground">{currentQuestion.explanation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setActiveQuestion((prev) => Math.max(0, prev - 1))}
                disabled={activeQuestion === 0}
              >
                Previous
              </Button>
              
              {!showResults ? (
                activeQuestion === totalQuestions - 1 ? (
                  <Button 
                    onClick={handleSubmit}
                    disabled={Object.keys(selectedAnswers).length < totalQuestions}
                  >
                    Submit Quiz
                  </Button>
                ) : (
                  <Button
                    onClick={() => setActiveQuestion((prev) => Math.min(totalQuestions - 1, prev + 1))}
                  >
                    Next
                  </Button>
                )
              ) : (
                <Button
                  onClick={() => setActiveQuestion((prev) => Math.min(totalQuestions - 1, prev + 1))}
                  disabled={activeQuestion === totalQuestions - 1}
                >
                  Next
                </Button>
              )}
            </div>
          </>
        ) : (
          // Preview Mode - Show all questions
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div key={`${question.id ?? index}-${question.question_text}`} className="border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" className="shrink-0">Q{index + 1}</Badge>
                  <div className="flex-1">
                    <p className="font-medium">{question.question_text}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div>A. {question.option_a}</div>
                      <div>B. {question.option_b}</div>
                      <div>C. {question.option_c}</div>
                      <div>D. {question.option_d}</div>
                    </div>
                    <div className="mt-2 text-sm">
                      <span className="font-medium">Correct answer:</span>{' '}
                      <Badge variant="default" className="text-xs">
                        {question.correct_answer}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
