export function chunkText(text: string, maxLength: number): string[] {
  if (text.length <= maxLength) {
    return [text];
  }

  const parts: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + maxLength, text.length);

    if (end < text.length) {
      const lastBreak = text.lastIndexOf("\n", end);
      if (lastBreak > start + Math.floor(maxLength * 0.6)) {
        end = lastBreak;
      }
    }

    parts.push(text.slice(start, end));
    start = end;
  }

  return parts;
}
