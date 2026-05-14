import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command';
import { searchApi } from '@/lib/api';
import {
  BookOpen,
  FileText,
  HelpCircle,
  Loader2,
  Search,
  Video,
  type LucideIcon,
} from 'lucide-react';
import type { LibrarySearchResult } from '@/types';

type SourceMeta = {
  label: string;
  icon: LucideIcon;
};

const sourceMeta: Record<string, SourceMeta> = {
  video: { label: 'Video', icon: Video },
  transcript: { label: 'Transcript', icon: FileText },
  lecture: { label: 'Lecture', icon: BookOpen },
  quiz: { label: 'Quiz', icon: HelpCircle },
};

function formatField(field: string) {
  return field.replaceAll('_', ' ');
}

export function LibrarySearch() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LibrarySearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmedQuery = query.trim();
  const canSearch = trimmedQuery.length >= 2;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!canSearch) {
      setResults([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const nextResults = await searchApi.searchLibrary(trimmedQuery);
        if (!controller.signal.aborted) {
          setResults(nextResults);
        }
      } catch {
        if (!controller.signal.aborted) {
          setError('Search failed. Please try again.');
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [canSearch, open, trimmedQuery]);

  const groupedResults = useMemo(() => {
    const safeResults = Array.isArray(results) ? results : [];

    return safeResults.reduce<Record<string, LibrarySearchResult[]>>((groups, result) => {
      const key = sourceMeta[result.source]?.label ?? result.source;
      groups[key] = groups[key] ?? [];
      groups[key].push(result);
      return groups;
    }, {});
  }, [results]);

  const handleSelect = (result: LibrarySearchResult) => {
    const params = new URLSearchParams({
      tab: result.tab,
      search: trimmedQuery,
      source: result.source,
      field: result.field,
    });

    setOpen(false);
    navigate(`/videos/${result.video_id}?${params.toString()}`);
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        className="h-10 w-10 justify-center rounded-full border bg-muted/50 px-0 shadow-xs transition-colors hover:bg-muted md:w-[340px] md:justify-between md:rounded-md md:px-3"
        onClick={() => setOpen(true)}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-background">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
          </span>
          <span className="hidden truncate text-sm font-normal text-muted-foreground md:inline">
            Search videos, notes, quizzes...
          </span>
        </span>
        <kbd className="hidden rounded-md border bg-background px-2 py-1 text-[10px] font-medium text-muted-foreground shadow-xs md:inline">
          Ctrl+K
        </kbd>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search library"
        description="Search videos, transcripts, lectures, summaries, and quiz questions."
        className="max-w-2xl overflow-hidden border-border/70 bg-background p-0 shadow-2xl [&_[cmdk-group-heading]]:px-3 [&_[cmdk-input-wrapper]]:h-14 [&_[cmdk-input-wrapper]]:border-0 [&_[cmdk-input-wrapper]]:bg-muted/30 [&_[cmdk-input]]:h-14 [&_[cmdk-item]]:outline-none"
      >
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Search videos, lectures, transcripts, quizzes..."
        />
        <CommandList className="max-h-[460px]">
          {!canSearch && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Type at least 2 characters to search your library.
            </div>
          )}

          {canSearch && isLoading && (
            <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching...
            </div>
          )}

          {canSearch && error && (
            <div className="px-4 py-8 text-center text-sm text-destructive">{error}</div>
          )}

          {canSearch && !isLoading && !error && results.length === 0 && (
            <CommandEmpty>No matching videos or study materials.</CommandEmpty>
          )}

          {Object.entries(groupedResults).map(([group, groupResults]) => (
            <CommandGroup key={group} heading={group}>
              {groupResults.map((result) => {
                const meta = sourceMeta[result.source] ?? sourceMeta.video;
                const Icon = meta.icon;

                return (
                  <CommandItem
                    key={`${result.video_id}-${result.source}-${result.field}-${result.snippet}`}
                    value={`${result.video_title} ${result.source} ${result.field} ${result.snippet}`}
                    onSelect={() => handleSelect(result)}
                    className="relative mx-1 items-start gap-3 rounded-md border-0 px-3 py-3 data-[selected=true]:bg-primary/10 data-[selected=true]:shadow-none data-[selected=true]:before:absolute data-[selected=true]:before:bottom-2 data-[selected=true]:before:left-0 data-[selected=true]:before:top-2 data-[selected=true]:before:w-1 data-[selected=true]:before:rounded-full data-[selected=true]:before:bg-primary/70 data-[selected=true]:before:content-['']"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate font-medium">{result.video_title}</span>
                        <Badge variant="secondary" className="shrink-0 rounded-md text-[10px] capitalize">
                          {formatField(result.field)}
                        </Badge>
                      </div>
                      <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {result.snippet}
                      </p>
                    </div>
                    <CommandShortcut>{result.tab}</CommandShortcut>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
