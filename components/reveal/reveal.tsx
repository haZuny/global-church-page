"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

type RevealProps = { children: ReactNode; className?: string; as?: "div" };

export function Reveal({ children, className = "", as: Tag = "div" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: "0px 0px -10%", threshold: 0.08 });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <Tag ref={ref} className={`reveal ${visible ? "is-visible" : ""} ${className}`.trim()}>{children}</Tag>;
}
