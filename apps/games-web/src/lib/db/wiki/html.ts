/**
 * Wiki content is HTML (with `<br>`, `<b>`, etc.) authored upstream. We
 * render it via `dangerouslySetInnerHTML` on detail pages, but for
 * listing previews we need a plain-text excerpt.
 */

/** Strip every tag and decode the few HTML entities the content actually uses. */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Plain-text excerpt of `length` chars, ending on a word boundary + ellipsis. */
export function excerpt(html: string, length = 150): string {
  const text = stripHtml(html);
  if (text.length <= length) return text;
  const cut = text.slice(0, length);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut) + "…";
}
