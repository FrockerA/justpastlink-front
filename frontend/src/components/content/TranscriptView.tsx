import { useTranscript } from '@/hooks/useTranscript';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { renderHighlightedText } from '@/components/content/HighlightedText';
import { Copy, Download, FileText, RefreshCw, CheckCircle, Languages, AlignLeft } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface TranscriptViewProps {
  videoId: number;
  searchQuery?: string;
}

function splitTranscriptIntoParagraphs(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const existingParagraphs = trimmed
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  if (existingParagraphs.length > 1) {
    return existingParagraphs;
  }

  const sentences = trimmed
    .replace(/\s+/g, ' ')
    .match(/[^.!?]+[.!?]+|[^.!?]+$/g);

  if (!sentences) return [trimmed];

  const paragraphs: string[] = [];
  for (let index = 0; index < sentences.length; index += 3) {
    paragraphs.push(sentences.slice(index, index + 3).join(' ').trim());
  }

  return paragraphs;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function TranscriptView({ videoId, searchQuery = '' }: TranscriptViewProps) {
  const transcriptScrollAreaRef = useRef<HTMLDivElement | null>(null);
  const transcriptContentRef = useRef<HTMLElement | null>(null);
  const { transcript, isLoading, error, fetchTranscript } = useTranscript(videoId);
  const [copied, setCopied] = useState(false);
  const transcriptParagraphs = transcript ? splitTranscriptIntoParagraphs(transcript.full_text) : [];
  const transcriptWordCount = transcript ? countWords(transcript.full_text) : 0;
  const trimmedSearchQuery = searchQuery.trim();

  useEffect(() => {
    if (!trimmedSearchQuery || !transcript) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const viewport = transcriptScrollAreaRef.current?.querySelector<HTMLDivElement>(
        '[data-slot="scroll-area-viewport"]'
      );
      const hit = transcriptContentRef.current?.querySelector<HTMLElement>('[data-search-hit="true"]');

      if (viewport && hit) {
        viewport.scrollTo({
          top: Math.max(hit.offsetTop - 120, 0),
          behavior: 'smooth',
        });
      }
    }, 150);

    return () => window.clearTimeout(timeoutId);
  }, [transcript, trimmedSearchQuery]);

  const handleCopy = async () => {
    if (transcript?.full_text) {
      await navigator.clipboard.writeText(transcript.full_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (transcript?.full_text) {
      const blob = new Blob([transcript.full_text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcript-${videoId}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
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
            <FileText className="h-5 w-5" />
            Transcript
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={fetchTranscript}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!transcript) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Transcript
          </CardTitle>
          <CardDescription>
            Transcript is not available yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>The transcript will appear here once processing is complete</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 space-y-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl tracking-normal">
                <FileText className="h-5 w-5" />
                Transcript
              </CardTitle>
              <CardDescription>
                Clean reading view of the video transcript
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {transcript.language && (
                <Badge variant="outline" className="rounded-md uppercase">
                  <Languages className="h-3 w-3" />
                  {transcript.language}
                </Badge>
              )}
              <Badge variant="secondary" className="rounded-md">
                <AlignLeft className="h-3 w-3" />
                {transcriptWordCount.toLocaleString()} words
              </Badge>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div ref={transcriptScrollAreaRef}>
          <ScrollArea className="h-[560px] w-full bg-background">
            <article ref={transcriptContentRef} className="mx-auto max-w-3xl px-5 py-6 md:px-8">
            {transcriptParagraphs.map((paragraph, index) => (
              <p
                key={`${paragraph.slice(0, 40)}-${index}`}
                className="mb-5 break-words text-sm leading-7 text-foreground/90 last:mb-0"
              >
                {renderHighlightedText(paragraph, trimmedSearchQuery)}
              </p>
            ))}
            </article>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
