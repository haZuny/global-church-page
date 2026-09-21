import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { LegacyScripts } from "./legacy-scripts";

type LegacyPageProps = { file: string; pageClass: string };

function extractBody(html: string) {
  const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? html;

  return body
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/href="index\.html#([^\"]+)"/g, 'href="/#$1"')
    .replace(/href="index\.html"/g, 'href="/"')
    .replace(/href="about\.html"/g, 'href="/about"')
    .replace(/href="worship\.html"/g, 'href="/worship"')
    .replace(/href="stories\.html"/g, 'href="/stories"')
    .replace(/href="sermons\.html"/g, 'href="/sermons"')
    .replace(/href="news\.html"/g, 'href="/news"')
    .replace(/href="story\.html\?id=([^\"]+)"/g, 'href="/stories/$1"')
    .replace(/href="bulletin\.html\?date=([^\"]+)"/g, 'href="/news/$1"')
    .replace(/src="assets\//g, 'src="/assets/')
    .replace(/href="assets\//g, 'href="/assets/');
}

export async function LegacyPage({ file, pageClass }: LegacyPageProps) {
  const html = await readFile(join(process.cwd(), file), "utf8");
  return <><div className={pageClass} dangerouslySetInnerHTML={{ __html: extractBody(html) }} /><LegacyScripts /></>;
}
