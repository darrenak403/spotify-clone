// Maps a raw fetch error into one of a small set of UI-safe state tags so
// components never need to touch (or accidentally render) the raw error
// object, status code, or message.
export type RecommendationErrorTag = "guest" | "network-error" | "server-error" | "unknown-error";

const ERROR_STATE_TAGS: RecommendationErrorTag[] = ["network-error", "server-error", "unknown-error"];

// `MusicStore.error` stays a plain string so unrelated fetch actions can keep
// storing arbitrary messages — this guards against a stray non-tag string
// ever reaching a component that expects one of the known error tags.
export const asErrorStateTag = (
  error: string
): Exclude<RecommendationErrorTag, "guest"> =>
  (ERROR_STATE_TAGS as string[]).includes(error)
    ? (error as Exclude<RecommendationErrorTag, "guest">)
    : "unknown-error";

export const getRecommendationState = (error: any): RecommendationErrorTag => {
  const status = error?.response?.status ?? error?.status;

  if (status === 401) return "guest";
  if (typeof status === "number" && status >= 500) return "server-error";
  if (!error?.response) return "network-error";
  return "unknown-error";
};
