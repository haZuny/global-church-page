import { sanitizeRichText } from "@/lib/rich-text";
import styles from "./rich-text.module.scss";

export function RichText({ html, className = "" }: { html?: string; className?: string }) {
  const safeHtml = sanitizeRichText(html);
  return safeHtml ? <div className={`${styles.content} ${className}`} dangerouslySetInnerHTML={{ __html: safeHtml }} /> : null;
}
