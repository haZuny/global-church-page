"use client";

import styles from "./content-state.module.scss";

type ContentStateProps = { title: string; description: string };

export function ContentState({ title, description }: ContentStateProps) {
  return <div className={styles.state} role="status"><strong>{title}</strong><p>{description}</p></div>;
}

export function ContentImagePlaceholder({ label }: { label: string }) {
  return <div className={styles.image} role="img" aria-label={label}><span>IMAGE</span><small>이미지 준비 중</small></div>;
}
