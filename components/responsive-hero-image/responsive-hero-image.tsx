"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const SOURCE_ASPECT_RATIO = 1774 / 887;
// The facade is seen in perspective: its lower-left and upper-right corners
// are the meaningful crop limits, rather than a centre-aligned rectangle.
const CHURCH_LEFT = 0.46;
const CHURCH_RIGHT = 0.78;
// Reserve extra breathing room for the homepage copy before cropping the right-side surroundings.
const PREFERRED_LEFT_GUTTER = 0.2;

export function ResponsiveHeroImage() {
  const mediaRef = useRef<HTMLDivElement>(null);
  const [objectPosition, setObjectPosition] = useState<string | undefined>();

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const updateObjectPosition = () => {
      if (!window.matchMedia("(max-width: 780px)").matches) {
        setObjectPosition(undefined);
        return;
      }

      const { width, height } = media.getBoundingClientRect();
      if (!width || !height) return;

      const visibleSourceWidth = Math.min(1, width / height / SOURCE_ASPECT_RATIO);
      const minimumStart = CHURCH_RIGHT - visibleSourceWidth;
      const preferredStart = CHURCH_LEFT - PREFERRED_LEFT_GUTTER;
      const cropStart = Math.max(0, minimumStart, preferredStart);
      const position = visibleSourceWidth >= 1 ? 50 : (cropStart / (1 - visibleSourceWidth)) * 100;

      setObjectPosition(`${Math.min(100, Math.max(0, position)).toFixed(2)}% 38%`);
    };

    updateObjectPosition();
    const observer = new ResizeObserver(updateObjectPosition);
    observer.observe(media);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="hero__media" ref={mediaRef}>
      <Image
        className="hero__image"
        src="/assets/images/church-building.png"
        alt="푸른 하늘 아래 자리한 글로벌교회 건물 전경"
        fill
        priority
        sizes="100vw"
        style={{ objectPosition }}
      />
      <div className="hero__veil" />
    </div>
  );
}
