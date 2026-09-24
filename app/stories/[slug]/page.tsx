import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStoryNavigation, stories } from "@/lib/content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: stories[slug]?.title ?? "교회 이야기" };
}
export default async function StoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const story = stories[slug];
  if (!story) notFound();
  const { previousSlug, nextSlug } = getStoryNavigation(slug);
  const previousStory = previousSlug ? stories[previousSlug] : undefined;
  const nextStory = nextSlug ? stories[nextSlug] : undefined;
  return (
    <div className="subpage">
      <main id="main-content">
        <section className="detail-hero detail-hero--story">
          <div className="page-shell detail-hero__inner">
            <Link className="detail-back" href="/stories">
              <span aria-hidden="true">←</span> 교회 이야기
            </Link>
            <div className="detail-meta">
              <span>{story.category}</span>
              <time dateTime={story.dateTime}>{story.date}</time>
            </div>
            <h1>{story.title}</h1>
            <p className="detail-subtitle">{story.subtitle}</p>
            <p>{story.summary}</p>
          </div>
        </section>
        <article className="story-detail section">
          <div className="page-shell">
            <figure className="story-detail__visual">
              <Image
                src={story.image}
                alt={story.alt}
                width={story.imageWidth}
                height={story.imageHeight}
                sizes="(max-width: 980px) 100vw, 940px"
              />
            </figure>
            <div className="story-detail__body">
              {story.blocks.map((block, index) =>
                block.type === "quote" ? (
                  <blockquote className="story-detail__quote" key={index}>
                    {block.text}
                  </blockquote>
                ) : (
                  <p className={`story-detail__${block.type}`} key={index}>
                    {block.text}
                  </p>
                ),
              )}
            </div>
            <nav className="detail-nav detail-nav--stories" aria-label="교회 이야기 탐색">
              {previousStory && (
                <Link href={`/stories/${previousSlug}`}>
                  <span aria-hidden="true">←</span> 이전 이야기: {previousStory.title}
                </Link>
              )}
              <Link href="/stories">모든 이야기 보기</Link>
              {nextStory ? (
                <Link href={`/stories/${nextSlug}`}>
                  다음 이야기: {nextStory.title} <span aria-hidden="true">→</span>
                </Link>
              ) : (
                <Link href="/worship">
                  예배 안내 보기 <span aria-hidden="true">→</span>
                </Link>
              )}
            </nav>
          </div>
        </article>
      </main>
    </div>
  );
}
