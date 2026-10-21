export const contentAssetCollections = ["stories", "bulletins", "news_items"];

export function referencedContentFiles(content, allowedOrigins) {
  const ids = new Set();
  for (const item of content) {
    if (item.status !== "published") continue;
    for (const tag of (item.body ?? "").matchAll(/<(?:img|video|source)\b[^>]*>/gi)) {
      for (const attr of tag[0].matchAll(/\b(?:src|poster)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi)) {
        const value = (attr[1] ?? attr[2] ?? attr[3]).replaceAll("&amp;", "&");
        const match = /^(?:(https?:\/\/[^/]+))?\/assets\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?=[./?#]|$)/i.exec(value);
        if (match && (!match[1] || allowedOrigins.includes(match[1].toLowerCase()))) ids.add(match[2].toLowerCase());
      }
    }
  }
  return [...ids];
}

export function planContentAssets({ content, assets, files }, allowedOrigins) {
  const existingFiles = new Set(files.map((file) => file.id));
  const referenced = new Set(referencedContentFiles(content, allowedOrigins).filter((id) => existingFiles.has(id)));
  const registered = new Set();
  const updates = [];
  for (const asset of assets) {
    const file = typeof asset.file === "object" ? asset.file?.id : asset.file;
    registered.add(file);
    const status = referenced.has(file) ? "published" : "archived";
    if (asset.status !== status) updates.push({ id: asset.id, status });
  }
  const creates = [...referenced].filter((file) => !registered.has(file)).map((file) => ({ file, status: "published" }));
  // 빈 배열을 전달하면 일부 Directus 작업이 전체 항목 수정으로 해석할 수 있습니다.
  return { creates: creates.length ? creates : null, updates: updates.length ? updates : null };
}

export async function synchronizeContentAssets(request, allowedOrigins) {
  const content = [];
  for (const collection of contentAssetCollections) {
    content.push(...await request(`/items/${collection}?filter[status][_eq]=published&fields=body,status&limit=-1`));
  }
  const assets = await request("/items/content_assets?fields=id,file,status&limit=-1");
  const files = await request("/files?fields=id&limit=-1");
  const plan = planContentAssets({ content, assets, files }, allowedOrigins);
  if (plan.creates) await request("/items/content_assets", "POST", plan.creates);
  if (plan.updates) await request("/items/content_assets", "PATCH", plan.updates);
  return { created: plan.creates?.length ?? 0, updated: plan.updates?.length ?? 0 };
}
