import { expect, test } from "@playwright/test";

test("대표 URL과 교회 검색 정보를 페이지에 제공한다", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "http://localhost:3000");
  await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute("content", "글로벌교회");
  const churchSchema = await page.locator('script[type="application/ld+json"]').evaluate((element) => element.textContent);
  expect(churchSchema).toContain('"@type":"Church"');
  expect(churchSchema).toContain("시흥글로벌교회");
});

test("검색 로봇이 사이트맵과 수집 규칙을 찾을 수 있다", async ({ request, isMobile }) => {
  test.skip(isMobile, "동일한 응답을 데스크톱 프로젝트에서 한 번만 검증");

  const [robots, sitemap] = await Promise.all([
    request.get("/robots.txt"),
    request.get("/sitemap.xml"),
  ]);
  await expect(robots).toBeOK();
  await expect(sitemap).toBeOK();
  expect(await robots.text()).toContain("Sitemap: http://localhost:3000/sitemap.xml");
  expect(await sitemap.text()).toContain("http://localhost:3000/about");
  expect(await sitemap.text()).toContain("http://localhost:3000/stories/101");
});
