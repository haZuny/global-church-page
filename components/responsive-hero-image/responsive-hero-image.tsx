"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export function ResponsiveHeroImage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 780px)");
    const updateImageSource = () => setIsMobile(mobileQuery.matches);

    updateImageSource();
    mobileQuery.addEventListener("change", updateImageSource);
    return () => {
      mobileQuery.removeEventListener("change", updateImageSource);
    };
  }, []);

  return (
    <div className="hero__media">
      <Image
        className="hero__image"
        src={isMobile ? "/assets/images/church-building-mobile.png" : "/assets/images/church-building.png"}
        alt="푸른 하늘 아래 자리한 글로벌교회 건물 전경"
        fill
        priority
        sizes="100vw"
      />
      <div className="hero__veil" />
    </div>
  );
}
