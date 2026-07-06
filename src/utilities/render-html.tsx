import type { ReactNode } from 'react';

export function renderHtml(text: string): ReactNode {
  const parts = text.split(/<b>(.*?)<\/b>/g);
  return parts.map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part));
}
