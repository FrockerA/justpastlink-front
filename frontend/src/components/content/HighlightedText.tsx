import type { ReactNode } from 'react';

const SEARCH_HIGHLIGHT_CLASS =
  'rounded-sm bg-amber-200 px-0.5 text-amber-950 ring-1 ring-amber-300 dark:bg-amber-400/30 dark:text-amber-100 dark:ring-amber-300/30';

export function renderHighlightedText(text: string, query?: string | null): ReactNode[] {
  const cleanQuery = query?.trim();
  if (!cleanQuery) {
    return [text];
  }

  const lowerText = text.toLowerCase();
  const lowerQuery = cleanQuery.toLowerCase();
  const parts: ReactNode[] = [];
  let cursor = 0;
  let hitIndex = 0;

  while (cursor < text.length) {
    const matchIndex = lowerText.indexOf(lowerQuery, cursor);
    if (matchIndex === -1) {
      parts.push(text.slice(cursor));
      break;
    }

    if (matchIndex > cursor) {
      parts.push(text.slice(cursor, matchIndex));
    }

    const matchText = text.slice(matchIndex, matchIndex + cleanQuery.length);
    parts.push(
      <mark
        key={`${matchText}-${matchIndex}-${hitIndex}`}
        data-search-hit="true"
        className={SEARCH_HIGHLIGHT_CLASS}
      >
        {matchText}
      </mark>
    );

    cursor = matchIndex + cleanQuery.length;
    hitIndex += 1;
  }

  return parts;
}
