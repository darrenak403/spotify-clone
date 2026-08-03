// The frontend (out of scope for this migration) still reads Mongoose's
// `_id` field name everywhere. Prisma returns `id`, so every response that
// used to carry Mongo documents gets its primary key renamed back to `_id`
// (recursively, for nested relations like Album.songs) to keep the API
// response shape unchanged, per this migration's response-shape contract.
export const toClientShape = (data) => {
  if (Array.isArray(data)) return data.map(toClientShape);
  if (data instanceof Date) return data;
  if (data !== null && typeof data === "object") {
    const {id, ...rest} = data;
    const mapped = id !== undefined ? {_id: id} : {};
    for (const [key, value] of Object.entries(rest)) {
      mapped[key] = toClientShape(value);
    }
    return mapped;
  }
  return data;
};
