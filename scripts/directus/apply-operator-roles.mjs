import { readFile } from "node:fs/promises";

const env = Object.fromEntries((await readFile(new URL("../../.env", import.meta.url), "utf8")).split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#")).map((line) => line.split(/=(.*)/s)));
const baseUrl = env.DIRECTUS_URL ?? "http://127.0.0.1:8055";
const login = await fetch(`${baseUrl}/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD }) });
const { data: session } = await login.json();
if (!session) throw new Error("Directus login failed.");

const headers = { authorization: `Bearer ${session.access_token}`, "content-type": "application/json" };
const request = async (path, method = "GET", body) => {
  const response = await fetch(`${baseUrl}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const json = await response.json();
  if (!response.ok) throw new Error(json.errors?.[0]?.message ?? `${method} ${path} failed.`);
  return json.data;
};

const ensurePolicy = async ({ name, description }) => {
  const policies = await request("/policies");
  const existing = policies.find((policy) => policy.name === name);
  const body = { name, icon: "admin_panel_settings", description, admin_access: false, app_access: true };
  return existing ? request(`/policies/${existing.id}`, "PATCH", body) : request("/policies", "POST", body);
};

const managerPolicy = await ensurePolicy({
  name: "중간관리자 운영 정책",
  description: "콘텐츠·파일·사용자 운영 권한. 데이터 모델과 최고 관리자 권한은 변경할 수 없습니다.",
});
const viewerPolicy = await ensurePolicy({
  name: "보기 관리자 조회 정책",
  description: "통계와 콘텐츠 목록을 조회만 할 수 있습니다.",
});

const ensureRole = async ({ name, description, policyId, parent }) => {
  const roles = await request("/roles");
  const existing = roles.find((role) => role.name === name);
  const body = { name, icon: "group", description, policies: [{ policy: policyId }], parent };
  return existing ? request(`/roles/${existing.id}`, "PATCH", body) : request("/roles", "POST", body);
};

const managerRole = await ensureRole({
  name: "중간관리자",
  description: "콘텐츠·파일·사용자를 운영할 수 있는 관리자입니다.",
  policyId: managerPolicy.id,
  parent: null,
});
const viewerRole = await ensureRole({
  name: "보기 관리자",
  description: "통계와 콘텐츠를 조회만 할 수 있는 관리자입니다.",
  policyId: viewerPolicy.id,
  parent: null,
});

const contentCollections = ["stories", "story_media", "bulletins", "bulletin_media", "news_items", "sermons", "worship_services", "church_ministers", "site_settings"];
const statisticsCollections = ["directus_dashboards", "directus_panels", "directus_activity"];
const fileCollections = ["directus_files", "directus_folders"];
const operatorUserValidation = { role: { _in: [managerRole.id, viewerRole.id] } };
const operatorUserTarget = { role: { _in: [managerRole.id, viewerRole.id] } };

const permissions = await request("/permissions?limit=-1");
const upsertPermission = async (policyId, collection, action, body = {}) => {
  const existing = permissions.find((permission) => permission.policy === policyId && permission.collection === collection && permission.action === action);
  const payload = { collection, action, policy: policyId, fields: ["*"], permissions: {}, validation: {}, presets: {}, ...body };
  if (existing) await request(`/permissions/${existing.id}`, "PATCH", payload);
  else await request("/permissions", "POST", payload);
};

for (const collection of contentCollections) {
  for (const action of ["create", "read", "update", "delete"]) await upsertPermission(managerPolicy.id, collection, action);
  await upsertPermission(viewerPolicy.id, collection, "read");
}

for (const collection of fileCollections) {
  for (const action of ["create", "read", "update", "delete"]) await upsertPermission(managerPolicy.id, collection, action);
}

for (const collection of statisticsCollections) {
  await upsertPermission(managerPolicy.id, collection, "read");
  await upsertPermission(viewerPolicy.id, collection, "read");
}

for (const action of ["create", "read", "update", "delete"]) {
  const body = action === "read" || action === "delete"
    ? { permissions: operatorUserTarget }
    : { permissions: action === "update" ? operatorUserTarget : {}, validation: operatorUserValidation };
  await upsertPermission(managerPolicy.id, "directus_users", action, body);
}

console.log("Operator roles and policies applied.");
