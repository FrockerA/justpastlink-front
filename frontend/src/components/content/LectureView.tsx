import { useEffect, useMemo, useRef, useState } from 'react';
import { useLecture } from '@/hooks/useLecture';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { extractRichTextHeadings, RichTextBlock } from '@/components/content/RichTextBlock';
import { getApiErrorDetail, lecturesApi } from '@/lib/api';
import type { LectureChatMessage } from '@/types';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  BookOpen, 
  RefreshCw, 
  Edit2, 
  Save, 
  X,
  FileText,
  ListChecks,
  Sparkles,
  MessageCircle,
  Send,
  Bot,
  UserRound,
  Quote,
  HelpCircle
} from 'lucide-react';

interface LectureViewProps {
  videoId: number;
  searchQuery?: string;
  searchSource?: string;
  searchField?: string;
}

const SUGGESTED_QUESTIONS = [
  'What are the main ideas in this lecture?',
  'Explain this lecture in simpler terms.',
  'Give me a practical example from the lecture.',
  'What should I remember for a test?',
  'Create 3 review questions from this lecture.',
];

const LECTURE_HEADING_PREFIX = 'lecture-heading';

function createChatMessageId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeSelectedText(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, 1200);
}

export function LectureView({
  videoId,
  searchQuery = '',
  searchSource = '',
  searchField = '',
}: LectureViewProps) {
  const { lecture, isLoading, error, fetchLecture, updateLecture } = useLecture(videoId);
  const lectureContentRef = useRef<HTMLDivElement | null>(null);
  const lectureScrollAreaRef = useRef<HTMLDivElement | null>(null);
  const summaryRef = useRef<HTMLDivElement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [editedSummary, setEditedSummary] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [chatMessages, setChatMessages] = useState<LectureChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [selectedLectureText, setSelectedLectureText] = useState('');
  const [readingProgress, setReadingProgress] = useState(0);
  const [activeHeadingId, setActiveHeadingId] = useState('');
  const summaryText = lecture?.summary?.trim() ?? '';
  const trimmedQuestion = question.trim();
  const trimmedSearchQuery = searchQuery.trim();
  const highlightSummary = searchSource === 'lecture' && searchField === 'summary';
  const highlightContent =
    searchSource === 'lecture' &&
    (searchField === 'content' || searchField === 'title' || !searchField);
  const summaryHighlightQuery = highlightSummary ? trimmedSearchQuery : '';
  const contentHighlightQuery = highlightContent ? trimmedSearchQuery : '';
  const lectureHeadings = useMemo(
    () => extractRichTextHeadings(lecture?.content, LECTURE_HEADING_PREFIX),
    [lecture?.content]
  );

  useEffect(() => {
    const viewport = lectureScrollAreaRef.current?.querySelector<HTMLDivElement>(
      '[data-slot="scroll-area-viewport"]'
    );
    if (!viewport) {
      return;
    }

    const updateReadingPosition = () => {
      const maxScroll = viewport.scrollHeight - viewport.clientHeight;
      const nextProgress = maxScroll <= 0 ? 100 : Math.round((viewport.scrollTop / maxScroll) * 100);
      setReadingProgress(Math.min(100, Math.max(0, nextProgress)));

      let nextActiveHeading = lectureHeadings[0]?.id ?? '';
      for (const heading of lectureHeadings) {
        const element = document.getElementById(heading.id);
        if (element && element.offsetTop <= viewport.scrollTop + 72) {
          nextActiveHeading = heading.id;
        }
      }
      setActiveHeadingId(nextActiveHeading);
    };

    updateReadingPosition();
    viewport.addEventListener('scroll', updateReadingPosition, { passive: true });

    return () => {
      viewport.removeEventListener('scroll', updateReadingPosition);
    };
  }, [lectureHeadings]);

  useEffect(() => {
    if (!trimmedSearchQuery || !lecture) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (highlightSummary) {
        const summaryHit = summaryRef.current?.querySelector<HTMLElement>('[data-search-hit="true"]');
        if (summaryHit) {
          summaryHit.scrollIntoView({ block: 'center', behavior: 'smooth' });
          return;
        }
      }

      const viewport = lectureScrollAreaRef.current?.querySelector<HTMLDivElement>(
        '[data-slot="scroll-area-viewport"]'
      );
      const contentHit = lectureContentRef.current?.querySelector<HTMLElement>('[data-search-hit="true"]');

      if (viewport && contentHit) {
        viewport.scrollTo({
          top: Math.max(contentHit.offsetTop - 120, 0),
          behavior: 'smooth',
        });
      }
    }, 150);

    return () => window.clearTimeout(timeoutId);
  }, [contentHighlightQuery, highlightSummary, lecture, summaryHighlightQuery, trimmedSearchQuery]);

  const handleEdit = () => {
    if (lecture) {
      setEditedTitle(lecture.title ?? "");
      setEditedContent(lecture.content);
      setEditedSummary(lecture.summary ?? "");
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateLecture({
        title: editedTitle,
        content: editedContent,
        summary: editedSummary,
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedTitle('');
    setEditedContent('');
    setEditedSummary('');
  };

  const submitQuestion = async (nextQuestion: string) => {
    const cleanQuestion = nextQuestion.trim();

    if (!cleanQuestion || isAsking) {
      return;
    }

    const userMessage: LectureChatMessage = {
      id: createChatMessageId('user'),
      role: 'user',
      content: cleanQuestion,
    };

    setActiveTab('ask');
    setChatMessages((messages) => [...messages, userMessage]);
    setAskError(null);
    setIsAsking(true);

    try {
      const response = await lecturesApi.askLecture(videoId, cleanQuestion);
      const assistantMessage: LectureChatMessage = {
        id: createChatMessageId('assistant'),
        role: 'assistant',
        content: response.answer,
        citations: response.citations,
      };

      setChatMessages((messages) => [...messages, assistantMessage]);
      setQuestion('');
    } catch (askError) {
      setAskError(getApiErrorDetail(askError, 'Could not get an answer. Please try again.'));
    } finally {
      setIsAsking(false);
    }
  };

  const handleAskSubmit = async () => {
    await submitQuestion(trimmedQuestion);
  };

  const handleSuggestedQuestion = async (suggestedQuestion: string) => {
    await submitQuestion(suggestedQuestion);
  };

  const updateSelectedLectureText = () => {
    const selection = window.getSelection();
    const container = lectureContentRef.current;

    if (!selection || !container || !selection.anchorNode || !selection.focusNode) {
      setSelectedLectureText('');
      return;
    }

    if (!container.contains(selection.anchorNode) || !container.contains(selection.focusNode)) {
      setSelectedLectureText('');
      return;
    }

    setSelectedLectureText(normalizeSelectedText(selection.toString()));
  };

  const handleExplainSelection = async () => {
    if (!selectedLectureText || isAsking) {
      return;
    }

    const selectionQuestion = (
      'I do not understand this part. Explain it more simply using only the lecture:\n\n'
      + `"${selectedLectureText}"`
    );

    window.getSelection()?.removeAllRanges();
    setSelectedLectureText('');
    await submitQuestion(selectionQuestion);
  };

  const handleHeadingClick = (headingId: string) => {
    const viewport = lectureScrollAreaRef.current?.querySelector<HTMLDivElement>(
      '[data-slot="scroll-area-viewport"]'
    );
    const heading = document.getElementById(headingId);

    if (!viewport || !heading) {
      return;
    }

    viewport.scrollTo({
      top: Math.max(heading.offsetTop - 16, 0),
      behavior: 'smooth',
    });
    setActiveHeadingId(headingId);
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
            <BookOpen className="h-5 w-5" />
            Lecture
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={fetchLecture}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!lecture) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Lecture
          </CardTitle>
          <CardDescription>
            Lecture is not available yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>The lecture will be generated once transcription is complete</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="rounded-md">
                  <Sparkles className="h-3 w-3" />
                  AI lecture
                </Badge>
                {lecture.status && (
                  <Badge variant="outline" className="rounded-md capitalize">
                    {lecture.status}
                  </Badge>
                )}
              </div>
              <CardTitle className="flex items-start gap-2 text-xl leading-tight tracking-normal">
                <BookOpen className="mt-0.5 h-5 w-5 shrink-0" />
                <span className="break-words">{lecture.title || 'Untitled Lecture'}</span>
              </CardTitle>
              <CardDescription>
                Generated lecture from your video
              </CardDescription>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {summaryText && (
            <div ref={summaryRef} className="border-b bg-background px-5 py-5 md:px-6">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-normal">
                <ListChecks className="h-4 w-4 text-primary" />
                Key takeaways
              </div>
              <RichTextBlock
                text={summaryText}
                dense
                highlightQuery={summaryHighlightQuery}
              />
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full p-5 md:p-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Lecture
              </TabsTrigger>
              <TabsTrigger value="summary" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Summary
              </TabsTrigger>
              <TabsTrigger value="ask" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Ask
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="content" className="mt-4">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
                <div className="min-w-0">
                  {lectureHeadings.length > 0 && (
                    <div className="mb-3 space-y-3 rounded-md border bg-muted/20 p-3 lg:hidden">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-medium">Contents</div>
                        <div className="text-xs text-muted-foreground">{readingProgress}% read</div>
                      </div>
                      <Progress value={readingProgress} className="h-1.5" />
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {lectureHeadings.map((heading) => (
                          <Button
                            key={heading.id}
                            type="button"
                            variant={activeHeadingId === heading.id ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleHeadingClick(heading.id)}
                            className="h-auto shrink-0 whitespace-nowrap"
                          >
                            {heading.text}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedLectureText && (
                    <div className="mb-3 flex items-center justify-between gap-3 rounded-md border bg-muted/30 px-4 py-3">
                      <div className="min-w-0 text-sm text-muted-foreground">
                        <span className="line-clamp-1">{selectedLectureText}</span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleExplainSelection}
                        disabled={isAsking}
                        className="shrink-0"
                      >
                        <HelpCircle className="h-4 w-4" />
                        I don't understand this part
                      </Button>
                    </div>
                  )}
                  <div ref={lectureScrollAreaRef}>
                    <ScrollArea
                      className="h-[560px] w-full rounded-md border bg-background"
                    >
                      <div
                        ref={lectureContentRef}
                        className="px-5 py-5 md:px-6"
                        onKeyUp={updateSelectedLectureText}
                        onMouseUp={updateSelectedLectureText}
                      >
                        <RichTextBlock
                          text={lecture.content}
                          headingIdPrefix={LECTURE_HEADING_PREFIX}
                          highlightQuery={contentHighlightQuery}
                        />
                      </div>
                    </ScrollArea>
                  </div>
                </div>

                {lectureHeadings.length > 0 && (
                  <aside className="hidden lg:block">
                    <div className="sticky top-24 rounded-md border bg-muted/20 p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold">Contents</h3>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {lectureHeadings.length} section{lectureHeadings.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <Badge variant="secondary" className="rounded-md">
                          {readingProgress}%
                        </Badge>
                      </div>
                      <Progress value={readingProgress} className="mb-4 h-1.5" />
                      <nav className="max-h-[440px] space-y-1 overflow-y-auto pr-1">
                        {lectureHeadings.map((heading) => (
                          <button
                            key={heading.id}
                            type="button"
                            onClick={() => handleHeadingClick(heading.id)}
                            aria-current={activeHeadingId === heading.id ? 'true' : undefined}
                            className={`block w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                              activeHeadingId === heading.id
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                            } ${heading.level === 3 ? 'pl-6 text-xs' : ''}`}
                          >
                            <span className="line-clamp-2">{heading.text}</span>
                          </button>
                        ))}
                      </nav>
                    </div>
                  </aside>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="summary" className="mt-4">
              <ScrollArea className="h-[360px] w-full rounded-md border bg-muted/20">
                <div className="px-5 py-5 md:px-6">
                  <RichTextBlock text={summaryText} emptyText="No summary available" dense />
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="ask" className="mt-4">
              <div className="space-y-3">
                <ScrollArea className="h-[420px] w-full rounded-md border bg-background">
                  <div className="flex min-h-[420px] flex-col gap-3 p-4">
                    {chatMessages.length === 0 ? (
                      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
                        <div className="space-y-2">
                          <MessageCircle className="mx-auto h-8 w-8 text-muted-foreground/70" />
                          <p className="text-sm text-muted-foreground">
                            Ask a question about this lecture
                          </p>
                        </div>
                        <div className="flex max-w-2xl flex-wrap justify-center gap-2">
                          {SUGGESTED_QUESTIONS.map((suggestedQuestion) => (
                            <Button
                              key={suggestedQuestion}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => void handleSuggestedQuestion(suggestedQuestion)}
                              disabled={isAsking}
                              className="h-auto whitespace-normal text-left"
                            >
                              {suggestedQuestion}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      chatMessages.map((message) => {
                        const isUser = message.role === 'user';

                        return (
                          <div
                            key={message.id}
                            className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-md border px-4 py-3 text-sm leading-relaxed shadow-xs ${
                                isUser
                                  ? 'border-primary/30 bg-primary text-primary-foreground'
                                  : 'border-border bg-muted/30 text-foreground'
                              }`}
                            >
                              <div className="mb-2 flex items-center gap-2 text-xs font-medium opacity-80">
                                {isUser ? (
                                  <UserRound className="h-3.5 w-3.5" />
                                ) : (
                                  <Bot className="h-3.5 w-3.5" />
                                )}
                                {isUser ? 'You' : 'Assistant'}
                              </div>
                              <div className="whitespace-pre-wrap break-words">{message.content}</div>
                              {!isUser && message.citations && message.citations.length > 0 && (
                                <div className="mt-4 space-y-2 rounded-md border bg-background/80 px-3 py-3">
                                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                                    <Quote className="h-3.5 w-3.5" />
                                    From the lecture
                                  </div>
                                  <div className="space-y-2">
                                    {message.citations.map((citation, citationIndex) => (
                                      <blockquote
                                        key={`${message.id}-citation-${citationIndex}`}
                                        className="border-l-2 border-primary/50 pl-3 text-xs leading-relaxed text-muted-foreground"
                                      >
                                        {citation}
                                      </blockquote>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}

                    {isAsking && (
                      <div className="flex justify-start">
                        <div className="max-w-[85%] rounded-md border bg-muted/30 px-4 py-3 text-sm text-muted-foreground shadow-xs">
                          <div className="flex items-center gap-2">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Thinking...
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {askError && (
                  <Alert variant="destructive">
                    <AlertDescription>{askError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col gap-2 md:flex-row md:items-end">
                  <Textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask a question about this lecture"
                    className="min-h-[86px] md:min-h-[72px]"
                    disabled={isAsking}
                  />
                  <Button
                    type="button"
                    onClick={handleAskSubmit}
                    disabled={!trimmedQuestion || isAsking}
                    className="md:w-auto"
                  >
                    {isAsking ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Send
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Lecture</DialogTitle>
            <DialogDescription>
              Make changes to the lecture content
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                placeholder="Lecture title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                placeholder="Lecture content"
                className="min-h-[200px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                value={editedSummary}
                onChange={(e) => setEditedSummary(e.target.value)}
                placeholder="Lecture summary"
                className="min-h-[100px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
