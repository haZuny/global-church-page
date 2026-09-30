const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

/** The single public origin used by canonical URLs, sharing previews, and sitemaps. */
export const siteUrl = (configuredSiteUrl || "http://localhost:3000").replace(/\/$/, "");

export const absoluteUrl = (path = "/") => new URL(path, `${siteUrl}/`).toString();
