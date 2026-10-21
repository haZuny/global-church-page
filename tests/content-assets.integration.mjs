import assert from "node:assert/strict";
import { installContentAssetsFlow } from "../scripts/directus/content-assets-flow.mjs";
import { contentAssetCollections } from "../scripts/directus/content-assets.mjs";

const base = process.env.TEST_DIRECTUS_URL ?? "http://127.0.0.1:8059";
if (new URL(base).hostname !== "127.0.0.1") throw new Error("통합 검증은 별도 로컬 테스트 CMS에서만 실행합니다.");
const login = await fetch(`${base}/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "assets@example.com", password: "local-assets-test-password" }) });
assert.equal(login.status, 200, await login.clone().text());
let token = (await login.json()).data.access_token;
const request = async (path, method = "GET", body) => {
  const response = await fetch(`${base}${path}`, { method, headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const json = response.status === 204 ? {} : await response.json();
  if (!response.ok) throw new Error(`${method} ${path}: ${JSON.stringify(json)}`);
  return json.data;
};
const existing = new Set((await request("/collections")).map((item) => item.collection));
for (const collection of [...contentAssetCollections, "content_assets"]) {
  if (existing.has(collection)) continue;
  const fields = [{ field: "id", type: "integer", schema: { is_primary_key: true, has_auto_increment: true } }, { field: "status", type: "string" }];
  if (collection === "content_assets") fields.push({ field: "file", type: "uuid" });
  else fields.push({ field: "body", type: "text" });
  await request("/collections", "POST", { collection, schema: {}, fields });
}
const fields = await request("/fields/directus_files");
if (!fields.some((field) => field.field === "content_asset_files")) {
  await request("/fields/directus_files", "POST", { field: "content_asset_files", type: "alias", meta: { special: ["o2m"] } });
  await request("/relations", "POST", { collection: "content_assets", field: "file", related_collection: "directus_files", meta: { many_collection: "content_assets", many_field: "file", one_collection: "directus_files", one_field: "content_asset_files" }, schema: { on_delete: "CASCADE" } });
}
const publicPolicy = (await request("/policies")).find((policy) => policy.name === "$t:public_label");
for (const collection of [...contentAssetCollections, "content_assets", "directus_files"]) {
  const filter = collection === "directus_files" ? { content_asset_files: { _some: { status: { _eq: "published" } } } } : { status: { _eq: "published" } };
  const permissions = await request(`/permissions?filter[collection][_eq]=${collection}&filter[policy][_eq]=${publicPolicy.id}`);
  if (!permissions.length) await request("/permissions", "POST", { collection, action: "read", fields: ["*"], permissions: filter, policy: publicPolicy.id });
}
// 반복 실행 전 이전 검증 버전의 같은 이름 플로우가 중복 실행되지 않게 합니다.
const oldFlows = await request('/flows?filter[name][_eq]=게시%20본문%20파일%20공개%20동기화');
for (const flow of oldFlows) await request(`/flows/${flow.id}`, "PATCH", { status: "inactive" });
const flowId = await installContentAssetsFlow(request, [base]);
await installContentAssetsFlow(request, [base]);
assert.equal((await request(`/flows?filter[id][_eq]=${flowId}`)).length, 1);
assert.equal((await request(`/operations?filter[flow][_eq]=${flowId}&limit=-1`)).length, 8);

async function upload() {
  const form = new FormData();
  form.append("file", new Blob([Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a2S8AAAAASUVORK5CYII=", "base64")], { type: "image/png" }), "공개처리검증.png");
  const response = await fetch(`${base}/files`, { method: "POST", headers: { authorization: `Bearer ${token}` }, body: form });
  assert.equal(response.status, 200, await response.clone().text());
  return (await response.json()).data.id;
}
const image = (id) => `<p><img src="${base}/assets/${id}.png?width=1&amp;height=1"></p>`;
async function waitFile(id, status) {
  for (let i = 0; i < 60; i++) {
    const response = await fetch(`${base}/assets/${id}`, { method: "HEAD" });
    if (response.status === status) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`파일 ${id}: HTTP ${status} 상태를 확인하지 못했습니다.`);
}
for (const collection of contentAssetCollections) {
  const a = await upload(), b = await upload();
  await waitFile(a, 403);
  const post = await request(`/items/${collection}`, "POST", { status: "draft", body: image(a) });
  await waitFile(a, 403);
  await request(`/items/${collection}/${post.id}`, "PATCH", { status: "published" });
  await waitFile(a, 200);
  await request(`/items/${collection}/${post.id}`, "PATCH", { status: "archived" });
  await waitFile(a, 403);
  await request(`/items/${collection}/${post.id}`, "PATCH", { status: "published" });
  await waitFile(a, 200);
  await request(`/items/${collection}/${post.id}`, "PATCH", { body: image(a) + image(b) });
  await waitFile(b, 200);
  await request(`/items/${collection}/${post.id}`, "PATCH", { body: image(b) });
  await waitFile(a, 403);
  const c = await upload();
  const direct = await request(`/items/${collection}`, "POST", { status: "published", body: image(b) + image(c) });
  await waitFile(c, 200);
  await request(`/items/${collection}/${post.id}`, "PATCH", { status: "draft" });
  await waitFile(b, 200);
  await request(`/items/${collection}/${direct.id}`, "DELETE");
  await waitFile(b, 403);
  await waitFile(c, 403);
  const asset = (await request(`/items/content_assets?filter[file][_eq]=${a}`))[0];
  await request(`/items/content_assets/${asset.id}`, "PATCH", { status: "draft" });
  await request(`/items/${collection}/${post.id}`, "PATCH", { status: "published", body: image(a) });
  await waitFile(a, 200);
  console.log(`${collection}: 임시 저장→게시, 보관→게시, 사진 추가·교체, 바로 게시, 공유 파일, 글 삭제, 비공개 연결 복구 통과`);
}
const suffix = Date.now();
const policy = await request("/policies", "POST", { name: `파일 공개 검증 정책 ${suffix}`, admin_access: false, app_access: true });
const role = await request("/roles", "POST", { name: `파일 공개 검증 관리자 ${suffix}`, policies: [{ policy: policy.id }] });
for (const collection of [...contentAssetCollections, "content_assets", "directus_files"]) {
  const actions = ["read", ...(collection === "stories" || collection === "content_assets" ? ["create", "update"] : collection === "directus_files" ? ["create"] : [])];
  for (const action of actions) await request("/permissions", "POST", { policy: policy.id, collection, action, fields: ["*"], permissions: {} });
}
const email = `assets-${suffix}@example.com`;
await request("/users", "POST", { email, password: "local-assets-test-password", role: role.id, status: "active" });
const managerLogin = await fetch(`${base}/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password: "local-assets-test-password" }) });
assert.equal(managerLogin.status, 200);
token = (await managerLogin.json()).data.access_token;
const managerFile = await upload();
const managerPost = await request("/items/stories", "POST", { status: "published", body: image(managerFile) });
await waitFile(managerFile, 200);
await request(`/items/stories/${managerPost.id}`, "PATCH", { status: "archived" });
await waitFile(managerFile, 403);
console.log("최고 관리자 권한 없이 기존 콘텐츠·파일 권한만으로 게시·보관 처리 통과");
console.log("Directus 11.3.5 실제 이벤트·파일 권한 통합 검증 통과");
