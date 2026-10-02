import Link from "next/link";
import styles from "./site-footer.module.scss";

export type FooterInfo = {
  churchName: string;
  address?: string;
  phone?: string;
  pastorName?: string;
  pastorRole?: string;
};

const defaultLinks = [
  ["교회 이야기", "/stories"],
  ["주보·소식", "/news"],
  ["오시는 길", "/#location"],
] as const;

function displayPastorName(name?: string, role?: string) {
  const normalizedName = name?.trim();
  const normalizedRole = role?.trim();

  if (!normalizedName) return undefined;
  if (!normalizedRole) return normalizedName;

  const escapedRole = normalizedRole.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const withoutRepeatedRole = normalizedName.replace(new RegExp(`^${escapedRole}\\s*`), "").trim();

  return withoutRepeatedRole || undefined;
}

export function SiteFooter({ info }: { info: FooterInfo }) {
  const directusAdminUrl = process.env.NEXT_PUBLIC_DIRECTUS_ADMIN_URL ?? "http://127.0.0.1:8055/admin";
  const pastorName = displayPastorName(info.pastorName, info.pastorRole);

  return (
    <footer className={styles.footer}>
      <div className="page-shell">
        <div className={styles.top}>
          <Link className={styles.brand} href="/#home">
            <span className={styles.mark} aria-hidden="true" />
            <span>{info.churchName}</span>
          </Link>

          <dl className={styles.details}>
            <div>
              <dt>주소</dt>
              <dd className={styles.address}>{info.address || "주소 안내 준비 중"}</dd>
            </div>
            <div>
              <dt>연락처</dt>
              <dd>{info.phone ? <a href={`tel:${info.phone.replaceAll("-", "")}`}>{info.phone}</a> : "연락처 안내 준비 중"}</dd>
            </div>
            <div>
              <dt>담임목사</dt>
              <dd>{pastorName || "담임목사 안내 준비 중"}</dd>
            </div>
          </dl>
        </div>

        <div className={styles.bottom}>
          <div className={styles.links}>
            {defaultLinks.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
          </div>
          <div className={styles.meta}>
            <p className={styles.copyright}>© {new Date().getFullYear()} {info.churchName.toUpperCase()}</p>
            <a className={styles.adminLink} href={directusAdminUrl} target="_blank" rel="noreferrer">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <rect x="5" y="10" width="14" height="10" rx="1" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
              <span>관리자</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
