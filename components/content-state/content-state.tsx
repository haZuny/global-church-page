"use client";

import styles from "./content-state.module.scss";

type ContentStateProps = { title: string; description?: string };

export function ContentState({ title, description }: ContentStateProps) {
  return <div className={styles.state} role="status"><strong>{title}</strong>{description && <p>{description}</p>}</div>;
}

export function ContentImagePlaceholder({ label }: { label: string }) {
  return <div className={styles.image} role="img" aria-label={label}><small>사진이 없습니다.</small></div>;
}
