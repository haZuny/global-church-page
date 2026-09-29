import Link from "next/link";
import styles from "./content-pagination.module.scss";

type ContentPaginationProps = {
  currentPage: number;
  totalPages: number;
  hrefForPage: (page: number) => string;
};

const visiblePages = (currentPage: number, totalPages: number) => {
  const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
};

export function ContentPagination({ currentPage, totalPages, hrefForPage }: ContentPaginationProps) {
  if (totalPages <= 1) return null;
  const pages = visiblePages(currentPage, totalPages);

  return (
    <nav className={styles.pagination} aria-label="목록 페이지">
      {currentPage > 1 ? <Link className={styles.direction} href={hrefForPage(currentPage - 1)} rel="prev" aria-label="이전 페이지">이전</Link> : <span className={styles.direction} aria-hidden="true">이전</span>}
      <ol>
        {pages.map((page) => <li key={page}><Link href={hrefForPage(page)} aria-label={`${page}페이지`} aria-current={page === currentPage ? "page" : undefined}>{page}</Link></li>)}
      </ol>
      {currentPage < totalPages ? <Link className={styles.direction} href={hrefForPage(currentPage + 1)} rel="next" aria-label="다음 페이지">다음</Link> : <span className={styles.direction} aria-hidden="true">다음</span>}
    </nav>
  );
}
