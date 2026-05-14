import { cn } from '@/lib/utils';
import { renderHighlightedText } from '@/components/content/HighlightedText';

type RichBlock =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'quote'; text: string };

interface RichTextBlockProps {
  text?: string | null;
  emptyText?: string;
  dense?: boolean;
  className?: string;
  headingIdPrefix?: string;
  highlightQuery?: string;
}

export interface RichTextHeading {
  id: string;
  level: 1 | 2 | 3;
  text: string;
}

export function extractDisplayText(text: string) {
  const trimmed = text.trim();

  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object' && 'content' in parsed) {
      const content = (parsed as { content?: unknown }).content;
      if (typeof content === 'string') {
        return content;
      }
    }
  } catch {
    // Not JSON; render it as normal markdown-ish lecture text.
  }

  return trimmed;
}

function normalizeRichText(text: string) {
  return extractDisplayText(text)
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\n');
}

export function extractRichTextHeadings(text?: string | null, idPrefix = 'heading'): RichTextHeading[] {
  if (!text?.trim()) {
    return [];
  }

  let headingIndex = 0;
  return parseRichText(text)
    .filter((block): block is { type: 'heading'; level: 1 | 2 | 3; text: string } => block.type === 'heading')
    .map((heading) => {
      const nextHeading = {
        id: `${idPrefix}-${headingIndex}`,
        level: heading.level,
        text: heading.text,
      };
      headingIndex += 1;
      return nextHeading;
    });
}

function parseRichText(text: string): RichBlock[] {
  const blocks: RichBlock[] = [];
  const paragraphLines: string[] = [];
  let listItems: string[] = [];
  let listOrdered = false;
  const normalizedText = normalizeRichText(text);

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return;
    blocks.push({ type: 'paragraph', text: paragraphLines.join(' ') });
    paragraphLines.length = 0;
  };

  const flushList = () => {
    if (listItems.length === 0) return;
    blocks.push({ type: 'list', ordered: listOrdered, items: listItems });
    listItems = [];
  };

  for (const line of normalizedText.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length as 1 | 2 | 3,
        text: headingMatch[2].trim(),
      });
      continue;
    }

    const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      flushParagraph();
      if (listItems.length > 0 && listOrdered) flushList();
      listOrdered = false;
      listItems.push(bulletMatch[1].trim());
      continue;
    }

    const orderedMatch = trimmed.match(/^\d+[.)]\s+(.+)$/);
    if (orderedMatch) {
      flushParagraph();
      if (listItems.length > 0 && !listOrdered) flushList();
      listOrdered = true;
      listItems.push(orderedMatch[1].trim());
      continue;
    }

    const quoteMatch = trimmed.match(/^>\s+(.+)$/);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'quote', text: quoteMatch[1].trim() });
      continue;
    }

    flushList();
    paragraphLines.push(trimmed);
  }

  flushParagraph();
  flushList();

  return blocks;
}

function renderInline(text: string, highlightQuery?: string | null) {
  return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={`${part}-${index}`} className="font-semibold text-foreground">
          {renderHighlightedText(part.slice(2, -2), highlightQuery)}
        </strong>
      );
    }

    return renderHighlightedText(part, highlightQuery);
  });
}

export function RichTextBlock({
  text,
  emptyText = 'No content available',
  dense = false,
  className,
  headingIdPrefix,
  highlightQuery,
}: RichTextBlockProps) {
  const blocks = text?.trim() ? parseRichText(text) : [];

  if (blocks.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }

  return (
    <div
      className={cn(
        'space-y-4 break-words text-sm leading-7 text-foreground',
        dense && 'space-y-3 leading-6',
        className,
      )}
    >
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          const HeadingTag = block.level === 3 ? 'h3' : 'h2';
          const headingIndex = blocks
            .slice(0, index)
            .filter((item) => item.type === 'heading').length;
          const headingId = headingIdPrefix ? `${headingIdPrefix}-${headingIndex}` : undefined;

          return (
            <HeadingTag
              key={`${block.text}-${index}`}
              id={headingId}
              className={cn(
                headingId && 'scroll-mt-4',
                'tracking-normal text-foreground',
                block.level !== 3
                  ? 'mt-6 border-l-4 border-primary/70 pl-3 text-base font-semibold first:mt-0'
                  : 'mt-5 text-sm font-semibold first:mt-0',
                dense && 'mt-4 text-sm',
              )}
            >
              {renderInline(block.text, highlightQuery)}
            </HeadingTag>
          );
        }

        if (block.type === 'list') {
          const ListTag = block.ordered ? 'ol' : 'ul';

          return (
            <ListTag
              key={`${block.items.join('-')}-${index}`}
              className={cn(
                'space-y-2 pl-5 text-foreground/90',
                block.ordered ? 'list-decimal' : 'list-disc',
                dense && 'space-y-1.5',
              )}
            >
              {block.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`} className="pl-1 marker:text-primary">
                  {renderInline(item, highlightQuery)}
                </li>
              ))}
            </ListTag>
          );
        }

        if (block.type === 'quote') {
          return (
            <blockquote
              key={`${block.text}-${index}`}
              className="rounded-md border-l-4 border-primary/70 bg-muted/50 px-4 py-3 text-foreground/90"
            >
              {renderInline(block.text, highlightQuery)}
            </blockquote>
          );
        }

        return (
          <p key={`${block.text}-${index}`} className="text-foreground/90">
            {renderInline(block.text, highlightQuery)}
          </p>
        );
      })}
    </div>
  );
}
