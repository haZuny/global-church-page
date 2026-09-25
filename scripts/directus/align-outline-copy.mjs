import { readFile } from "node:fs/promises";

const env = Object.fromEntries((await readFile(new URL("../../.env", import.meta.url), "utf8")).split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#")).map((line) => line.split(/=(.*)/s)));
const baseUrl = env.DIRECTUS_URL ?? "http://127.0.0.1:8055";
const login = await fetch(`${baseUrl}/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD }) });
const { data: session } = await login.json();
if (!session) throw new Error("Directus login failed.");

const copy = {
  hero_copy: "시흥에서 함께 예배하고, 삶의 질문을 나누며, 각 사람 안의 비전을 함께 세워갑니다.",
  introduction: "글로벌교회는 시흥에서 함께 예배하고, 삶의 자리에서 말씀을 배우며, 서로의 걸음을 응원하는 공동체입니다.",
  greeting_title: "시흥에서 함께 예배하고 함께 자라는 공동체",
  greeting_lead: "글로벌교회는 말씀을 배우고 삶을 나누며, 각 사람 안에 주신 비전을 함께 세워가는 교회입니다.",
  greeting_body: "글로벌교회는 경기도 시흥에 자리한 공동체입니다. 예배 가운데 말씀을 배우고, 서로의 삶을 살피며, 어린이부터 다음 세대와 장년에 이르기까지 함께 믿음의 걸음을 이어갑니다.\n\n우리는 예배에서 들은 말씀이 한 주의 관계와 일상으로 이어지기를 소망합니다. 지역 이웃과 기쁨과 어려움을 함께 나누고, 각 사람에게 주신 부르심을 발견하도록 서로를 응원합니다.",
};

const response = await fetch(`${baseUrl}/items/site_settings`, { method: "PATCH", headers: { authorization: `Bearer ${session.access_token}`, "content-type": "application/json" }, body: JSON.stringify(copy) });
if (!response.ok) throw new Error((await response.text()) || "Church copy update failed.");
console.log("Outline-aligned church copy updated.");
