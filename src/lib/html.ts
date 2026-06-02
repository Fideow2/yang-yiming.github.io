import DOMPurify from "dompurify";

export function renderEntryHtml(html: string) {
  return {
    __html: DOMPurify.sanitize(html),
  };
}
