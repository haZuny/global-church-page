import assert from "node:assert/strict";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { contentAssetCollections, planContentAssets, referencedContentFiles, synchronizeContentAssets } from "../scripts/directus/content-assets.mjs";
import { contentAssetsFlow, installContentAssetsFlow } from "../scripts/directus/content-assets-flow.mjs";

const origins = ["https://cms.globalchurch.kr"];
const a = "742ddd6d-e72e-4d1c-bb79-72a3b1ca08c9";
const b = "4b81d3c6-0d52-4480-8c6f-9082a1c40193";
const photo = (id) => `<p><img src="${origins[0]}/assets/${id}.jpg?width=4032&amp;height=3024"></p>`;

function fixture() {
  const content = Object.fromEntries(contentAssetCollections.map((collection) => [collection, []]));
  const assets = [];
  const files = [{ id: a }, { id: b }];
  const writes = [];
  const request = async (path, method = "GET", body) => {
    if (method !== "GET") {
      writes.push({ path, method, body });
      if (method === "POST") assets.push(...body.map((item, index) => ({ ...item, id: assets.length + index + 1 })));
      if (method === "PATCH") for (const item of body) Object.assign(assets.find((asset) => asset.id === item.id), item);
      return [];
    }
    if (path.startsWith("/files?")) return files;
    if (path.startsWith("/items/content_assets?")) return assets;
    for (const collection of contentAssetCollections) if (path.startsWith(`/items/${collection}?`)) return content[collection].filter((item) => item.status === "published");
    throw new Error(`예상하지 못한 요청: ${path}`);
  };
  return { content, assets, files, writes, sync: () => synchronizeContentAssets(request, origins) };
}

for (const collection of contentAssetCollections) {
  test(`${collection}: 임시 저장·바로 게시·보관 후 재게시와 부분 수정`, async () => {
    const f = fixture();
    const post = { status: "draft", body: photo(a) };
    f.content[collection].push(post);
    await f.sync();
    assert.equal(f.assets.length, 0);
    post.status = "published";
    await f.sync();
    assert.equal(f.assets[0].status, "published");
    post.status = "archived";
    await f.sync();
    assert.equal(f.assets[0].status, "archived");
    post.status = "published";
    await f.sync();
    assert.equal(f.assets[0].status, "published");
    const direct = { status: "published", body: photo(b) };
    f.content[collection].push(direct);
    await f.sync();
    assert.equal(f.assets.find((asset) => asset.file === b).status, "published");
    const before = f.writes.length;
    post.title = "제목만 수정";
    await f.sync();
    assert.equal(f.writes.length, before);
  });
}

test("사진 추가·교체·삭제와 여러 글의 공유 참조", async () => {
  const f = fixture();
  const story = { status: "published", body: photo(a) };
  const bulletin = { status: "published", body: photo(a) };
  f.content.stories.push(story);
  f.content.bulletins.push(bulletin);
  await f.sync();
  assert.equal(f.assets.length, 1);
  story.body += photo(b);
  await f.sync();
  assert.equal(f.assets.length, 2);
  story.body = photo(b);
  await f.sync();
  assert.equal(f.assets.find((asset) => asset.file === a).status, "published");
  f.content.bulletins.length = 0;
  await f.sync();
  assert.equal(f.assets.find((asset) => asset.file === a).status, "archived");
  story.body = "사진 없는 글";
  await f.sync();
  assert.ok(f.assets.every((asset) => asset.status === "archived"));
});

test("기존 비공개 연결·중복 연결도 재게시 때 복구", async () => {
  const f = fixture();
  f.assets.push({ id: 1, file: a, status: "draft" }, { id: 2, file: a, status: "archived" });
  f.content.news_items.push({ status: "published", body: photo(a) });
  await f.sync();
  assert.equal(f.assets.length, 2);
  assert.ok(f.assets.every((asset) => asset.status === "published"));
});

test("여러 사진을 한 번에 게시하고 일부만 제거", async () => {
  const f = fixture();
  const post = { status: "published", body: photo(a) + photo(b) };
  f.content.stories.push(post);
  await f.sync();
  assert.equal(f.assets.length, 2);
  assert.equal(new Set(f.assets.map((asset) => asset.id)).size, 2);
  post.body = photo(b);
  await f.sync();
  assert.equal(f.assets.find((asset) => asset.file === a).status, "archived");
  assert.equal(f.assets.find((asset) => asset.file === b).status, "published");
});

test("로컬·상대 주소·확장자·크기 옵션·영상·포스터를 인식하고 외부 주소와 잘못된 ID는 제외", () => {
  const body = `${photo(a)}<video src='/assets/${b}' poster='/assets/${a}.webp'><source src="${origins[0]}/assets/${b}"></video><img src="https://other.example/assets/${a}"><img src="/assets/not-a-uuid"><p>/assets/${a}</p>`;
  assert.deepEqual(referencedContentFiles([{ status: "published", body }], origins), [a, b]);
  assert.deepEqual(referencedContentFiles([{ status: "draft", body }, { status: "archived", body }], origins), []);
  assert.deepEqual(planContentAssets({ content: [{ status: "published", body: photo(a) }], assets: [], files: [] }, origins), { creates: null, updates: null });
});

test("Directus에서 실행할 실제 스크립트가 같은 공개 상태를 계산", () => {
  const { operations, flow } = contentAssetsFlow(origins);
  const script = operations.find((operation) => operation.type === "exec").options.code;
  const context = { module: { exports: null } };
  runInNewContext(script, context);
  const data = { stories: [{ status: "published", body: photo(a) }], bulletins: [], news_items: [], files: [{ id: a }], assets: [{ id: 1, file: a, status: "archived" }] };
  assert.deepEqual(JSON.parse(JSON.stringify(context.module.exports(data))), { creates: null, updates: [{ id: 1, status: "published" }] });
  assert.deepEqual(flow.options.scope, ["items.create", "items.update", "items.delete"]);
  assert.deepEqual(flow.options.collections, contentAssetCollections);
  for (const operation of operations.filter((operation) => operation.type.startsWith("item-"))) {
    assert.equal(operation.options.permissions, "$trigger");
    assert.equal(operation.options.emitEvents, false);
  }
});

test("설치는 실행을 멈춘 뒤 후속 작업부터 등록하고 마지막에 활성화", async () => {
  const writes = [];
  const request = async (path, method = "GET", body) => {
    if (method === "GET") return [];
    writes.push({ path, method, body });
    return {};
  };
  await installContentAssetsFlow(request, origins);
  assert.equal(writes[0].body.status, "inactive");
  assert.equal(writes[0].body.operation, null);
  const installed = new Set();
  for (const write of writes.filter((write) => write.path === "/operations")) {
    if (write.body.resolve) assert.ok(installed.has(write.body.resolve));
    installed.add(write.body.id);
  }
  assert.equal(writes.at(-1).body.status, "active");
  assert.ok(installed.has(writes.at(-1).body.operation));
});

test("같은 플로우 재설치는 정상 게시 자동화를 중단하지 않음", async () => {
  const { flow, operations } = contentAssetsFlow(origins);
  const writes = [];
  await installContentAssetsFlow(async (path, method = "GET", body) => {
    if (method !== "GET") { writes.push(body); return {}; }
    return path.startsWith("/flows?") ? [flow] : operations;
  }, origins);
  assert.equal(writes.length, 0);
});

test("설치 실패 시 이전 플로우와 작업 구성을 복구", async () => {
  const previous = contentAssetsFlow(["https://old.example.com"]);
  const writes = [];
  let failed = false;
  await assert.rejects(installContentAssetsFlow(async (path, method = "GET", body) => {
    if (method === "GET") return path.startsWith("/flows?") ? [previous.flow] : previous.operations;
    if (path.startsWith("/operations/") && !failed) { failed = true; throw new Error("설치 오류"); }
    writes.push({ path, body });
    return {};
  }, origins), /설치 오류/);
  assert.deepEqual(writes.at(-1).body, previous.flow);
  assert.equal(writes.at(-1).body.status, "active");
});
