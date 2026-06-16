import DOMPurify from "dompurify";

const ALLOWED_TAGS = [
  "h1",
  "h2",
  "h3",
  "h4",
  "p",
  "ul",
  "ol",
  "li",
  "strong",
  "em",
  "u",
  "a",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "code",
  "pre",
  "br",
  "blockquote",
  "hr"
];

const ALLOWED_ATTR = ["href", "target", "rel", "colspan", "rowspan"];

export function sanitizeProblemHtml(html: string) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR
  });
}

/** Alias — cùng allowlist với mô tả đề bài / thông báo. */
export const sanitizeRichHtml = sanitizeProblemHtml;

export function looksLikeRichHtml(content: string) {
  return /<[a-z][\s\S]*>/i.test(content);
}
