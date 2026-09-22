export type BulletinEntry = { title: string; date: string; category: string; summary: string; image: string; imageWidth: number; imageHeight: number };

const bulletin = (title: string, date: string, image: string): BulletinEntry => ({ title, date, category: "주보", summary: "예배 순서와 공동체 안내를 이 페이지에서 바로 확인하세요.", image, imageWidth: 840, imageHeight: 594 });
export const bulletins: Record<string, BulletinEntry> = {
  "2026-03-15": bulletin("2026년 3월 15일 글로벌교회 주보", "2026. 03. 15", "/assets/bulletins/2026-03-15.jpg"),
  "2026-03-08": bulletin("2026년 3월 8일 글로벌교회 주보", "2026. 03. 08", "/assets/bulletins/2026-03-08.jpg"),
  "2026-03-01": bulletin("2026년 3월 1일 글로벌교회 주보", "2026. 03. 01", "/assets/bulletins/2026-03-01.jpg"),
  "2026-02-22": bulletin("2026년 2월 22일 글로벌교회 주보", "2026. 02. 22", "/assets/bulletins/2026-02-22.jpg"),
  "2026-lunar-new-year": { title: "2026년 설 가정예배 순서지", date: "2026. 02", category: "가정예배 자료", summary: "가정에서 함께 드리는 설 예배의 순서와 말씀을 확인하세요.", image: "/assets/bulletins/2026-lunar-new-year.jpg", imageWidth: 840, imageHeight: 594 },
  "2026-02-15": bulletin("2026년 2월 15일 글로벌교회 주보", "2026. 02. 15", "/assets/bulletins/2026-02-15.jpg"),
  "2026-02-08": bulletin("2026년 2월 8일 글로벌교회 주보", "2026. 02. 08", "/assets/bulletins/2026-02-08.jpg"),
  "2026-02-01": bulletin("2026년 2월 1일 글로벌교회 주보", "2026. 02. 01", "/assets/bulletins/2026-02-01.jpg"),
};

export const bulletinRows = Object.entries(bulletins).map(([slug, bulletin]) => [slug, bulletin] as const);
