import { cn } from '@/lib/utils';

type RichBlock =
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'quote'; text: string };

interface RichTextBlockProps {
  text?: string | null;
  emptyText?: string;
  dense?: boolean;
  className?: string;
}

function parseRichText(text: string): RichBlock[] {
  const blocks: RichBlock[] = [];
  const paragraphLines: string[] = [];
  let listItems: string[] = [];
  let listOrdered = false;

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

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    const headingMatch = trimmed.match(/^(#{2,3})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length as 2 | 3,
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

function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={`${part}-${index}`} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return part;
  });
}

export function RichTextBlock({
  text,
  emptyText = 'No content available',
  dense = false,
  className,
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
          const HeadingTag = block.level === 2 ? 'h2' : 'h3';

          return (
            <HeadingTag
              key={`${block.text}-${index}`}
              className={cn(
                'tracking-normal text-foreground',
                block.level === 2
                  ? 'mt-6 border-l-4 border-primary/70 pl-3 text-base font-semibold first:mt-0'
                  : 'mt-5 text-sm font-semibold first:mt-0',
                dense && 'mt-4 text-sm',
              )}
            >
              {renderInline(block.text)}
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
                  {renderInline(item)}
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
              {renderInline(block.text)}
            </blockquote>
          );
        }

        return (
          <p key={`${block.text}-${index}`} className="text-foreground/90">
            {renderInline(block.text)}
          </p>
        );
      })}
    </div>
  );
}
