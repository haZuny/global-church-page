import sanitizeHtml from "sanitize-html";

const richTextOptions = {
  allowedTags: ["p", "br", "strong", "em", "u", "s", "h2", "h3", "blockquote", "ul", "ol", "li", "a", "hr"],
  allowedAttributes: { a: ["href", "target", "rel"], "*": ["style"] },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedStyles: {
    "*": {
      color: [/^#[0-9a-f]{3,8}$/i, /^rgb\((?:\d{1,3},\s*){2}\d{1,3}\)$/],
      "font-size": [/^(0\.875|1|1\.125|1\.25|1\.5)em$/],
    },
  },
};

const escapeHtml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");

export function plainTextToRichText(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "";
  if (/<\/?[a-z][\s\S]*>/i.test(value)) return sanitizeRichText(value);
  return value.split(/\n{2,}/).map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll("\n", "<br />")}</p>`).join("");
}

export function sanitizeRichText(value: unknown): string {
  return typeof value === "string" ? sanitizeHtml(value, richTextOptions) : "";
}
