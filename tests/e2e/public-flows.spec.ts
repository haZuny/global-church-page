import { expect, test } from "@playwright/test";

test.describe("새신자 핵심 흐름", () => {
  test("홈에서 교회 소개와 방문 정보를 바로 확인한다", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toContainText("시흥에서 함께 예배하고 함께 자라는 공동체");
    await expect(page.getByRole("link", { name: "교회 소개 더보기" })).toHaveAttribute("href", "/about");
    await expect(page.getByRole("link", { name: "지도에서 길 찾기" })).toHaveAttribute("href", "https://map.example.test/global-church");
    await expect(page.getByTitle("글로벌교회 위치 지도")).toHaveAttribute("loading", "lazy");
    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(hasHorizontalOverflow).toBe(false);
  });

  test("교회 이야기와 주보·소식의 목록에서 상세로 이동한다", async ({ page }) => {
    await page.goto("/stories");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("함께한 날들의 작은 기록");
    await Promise.all([
      page.waitForURL("**/stories/101"),
      page.getByRole("link", { name: /함께한 주일의 기록 이야기 보기/ }).click({ force: true }),
    ]);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("함께한 주일의 기록");

    await page.goto("/news");
    await page.getByRole("link", { name: "공지", exact: true }).click();
    await expect(page).toHaveURL(/category=/);
    await Promise.all([
      page.waitForURL("**/news/n-201"),
      page.getByRole("link", { name: /추석 예배 안내 상세 보기/ }).click({ force: true }),
    ]);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("추석 예배 안내");
  });

  test("모바일에서 메뉴와 핵심 탐색 링크를 사용할 수 있다", async ({ page, isMobile }) => {
    test.skip(!isMobile, "모바일 전용 검증");
    await page.goto("/");

    const menuButton = page.getByRole("button", { name: "메뉴 열기" });
    await menuButton.click({ force: true });
    await expect(page.getByRole("button", { name: "메뉴 닫기" })).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("navigation", { name: "모바일 주요 메뉴" }).getByRole("link", { name: "교회 이야기" })).toHaveAttribute("href", "/stories");
  });
});

test.describe("콘텐츠 조회 실패 상태", () => {
  test("목록 API가 닿지 않아도 오류 상태와 핵심 안내가 표시된다", async ({ page }) => {
    await page.request.get("http://127.0.0.1:8056/test/failure?enabled=1");
    try {
      await page.goto("/stories");
      await expect(page.getByText("교회 이야기를 불러오지 못했습니다.")).toBeVisible();

      await page.goto("/news");
      await expect(page.getByText("주보·소식을 불러오지 못했습니다.")).toBeVisible();

      await page.goto("/");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.getByRole("heading", { name: "예배 시간" })).toBeVisible();
    } finally {
      await page.request.get("http://127.0.0.1:8056/test/failure?enabled=0");
    }
  });
});
