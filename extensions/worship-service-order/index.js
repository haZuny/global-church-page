const collection = "worship_services";

export default ({ action }) => {
  const normalizeOrder = async (meta, { database }) => {
    if (meta.collection !== collection || meta.payload.sort === undefined || meta.payload.sort === null) return;

    const requestedPosition = Math.max(1, Number(meta.payload.sort));
    if (!Number.isFinite(requestedPosition)) return;

    await database.transaction(async (trx) => {
      const existing = await trx(collection)
        .select("id")
        .whereNot("id", meta.key)
        .orderByRaw("CASE WHEN sort IS NULL THEN 1 ELSE 0 END")
        .orderBy("sort", "asc")
        .orderBy("id", "asc");
      const position = Math.min(requestedPosition, existing.length + 1);
      const ordered = [...existing];
      ordered.splice(position - 1, 0, { id: meta.key });

      await Promise.all(ordered.map((item, index) => trx(collection).where("id", item.id).update({ sort: index + 1 })));
    });
  };

  action("items.create", normalizeOrder);
  action("items.update", normalizeOrder);
};
