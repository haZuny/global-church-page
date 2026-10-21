import { createHash } from "node:crypto";
import { contentAssetCollections, planContentAssets, referencedContentFiles } from "./content-assets.mjs";

export const contentAssetsFlowId = "78168e02-371b-46e9-93f5-1180394c9975";
const operationId = (key) => {
  const hex = createHash("sha256").update(`${contentAssetsFlowId}:${key}`).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
};

export function contentAssetsFlow(allowedOrigins) {
  const steps = contentAssetCollections.map((collection) => ({
    key: collection, name: `${collection} 게시 본문 조회`, type: "item-read",
    options: { collection, query: { filter: { status: { _eq: "published" } }, fields: ["body", "status"], limit: -1 }, permissions: "$trigger", emitEvents: false },
  }));
  steps.push(
    { key: "assets", name: "기존 공개 연결 조회", type: "item-read", options: { collection: "content_assets", query: { fields: ["id", "file", "status"], limit: -1 }, permissions: "$trigger", emitEvents: false } },
    { key: "files", name: "실제 파일 존재 확인", type: "item-read", options: { collection: "directus_files", query: { fields: ["id"], limit: -1 }, permissions: "$trigger", emitEvents: false } },
    { key: "plan", name: "게시 본문 기준 공개 연결 계산", type: "exec", options: { code: `module.exports = function(data) {\n${referencedContentFiles.toString()}\n${planContentAssets.toString()}\nreturn planContentAssets({content: [...data.stories, ...data.bulletins, ...data.news_items], assets: data.assets, files: data.files}, ${JSON.stringify(allowedOrigins)});\n};` } },
    { key: "create_assets", name: "새 파일 공개 연결 등록", type: "item-create", options: { collection: "content_assets", payload: "{{plan.creates}}", permissions: "$trigger", emitEvents: false } },
    { key: "update_assets", name: "재게시 및 비공개 상태 반영", type: "item-update", options: { collection: "content_assets", payload: "{{plan.updates}}", permissions: "$trigger", emitEvents: false } },
  );
  const operations = steps.map((step, index) => ({ ...step, id: operationId(step.key), flow: contentAssetsFlowId, position_x: index * 20, position_y: 1, resolve: steps[index + 1] ? operationId(steps[index + 1].key) : null, reject: null }));
  return {
    flow: { id: contentAssetsFlowId, name: "게시 본문 파일 공개 동기화", icon: "photo_library", description: "글 작성·수정·삭제 후 게시된 본문을 기준으로 파일 공개 연결을 갱신합니다. 임시 저장·보관 후 게시, 사진 추가·교체·공유를 처리합니다.", status: "active", trigger: "event", accountability: "activity", options: { type: "action", scope: ["items.create", "items.update", "items.delete"], collections: contentAssetCollections }, operation: operations[0].id },
    operations,
  };
}

export async function installContentAssetsFlow(request, origins) {
  const { flow, operations } = contentAssetsFlow(origins);
  const existing = await request(`/flows?filter[id][_eq]=${flow.id}`);
  const previous = await request(`/operations?filter[flow][_eq]=${flow.id}&limit=-1`);
  const mappedIds = new Map(operations.map((operation) => [operation.id, previous.find((item) => item.key === operation.key)?.id ?? operation.id]));
  flow.operation = mappedIds.get(flow.operation);
  const mappedOperations = operations.map((original) => ({ ...original, id: mappedIds.get(original.id), resolve: mappedIds.get(original.resolve) ?? null }));
  const pick = (value, keys) => Object.fromEntries(keys.map((key) => [key, value[key]]));
  const flowFields = Object.keys(flow);
  const operationFields = Object.keys(mappedOperations[0]);
  const equal = (left, right, keys) => keys.every((key) => JSON.stringify(left[key]) === JSON.stringify(right[key]));
  // 이미 같은 구성이면 재배포 중에도 정상 플로우를 끄지 않습니다.
  if (existing[0] && equal(existing[0], flow, flowFields) && mappedOperations.every((operation) => {
    const old = previous.find((item) => item.id === operation.id);
    return old && equal(old, operation, operationFields.filter((key) => !key.startsWith("position_")));
  })) return flow.id;
  const inactive = { ...flow, status: "inactive", operation: null };
  try {
    if (existing.length) await request(`/flows/${flow.id}`, "PATCH", inactive);
    else await request("/flows", "POST", inactive);
    // 후속 작업을 먼저 등록해 SQLite 외래 키 제약과 설치 도중 실행을 피합니다.
    for (const operation of [...mappedOperations].reverse()) {
      if (previous.some((item) => item.id === operation.id)) await request(`/operations/${operation.id}`, "PATCH", operation);
      else await request("/operations", "POST", operation);
    }
    await request(`/flows/${flow.id}`, "PATCH", flow);
  } catch (error) {
    if (existing[0]) {
      // 설치 실패가 기존 게시 자동화를 중단시키지 않도록 이전 구성을 복구합니다.
      for (const operation of previous) await request(`/operations/${operation.id}`, "PATCH", pick(operation, operationFields));
      await request(`/flows/${flow.id}`, "PATCH", pick(existing[0], flowFields));
    }
    throw error;
  }
  return flow.id;
}
