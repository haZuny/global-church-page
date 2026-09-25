declare module "sanitize-html" {
  type Options = {
    allowedTags?: string[];
    allowedAttributes?: Record<string, string[]>;
    allowedSchemes?: string[];
    allowedStyles?: Record<string, Record<string, RegExp[]>>;
  };
  export default function sanitizeHtml(value: string, options?: Options): string;
}
