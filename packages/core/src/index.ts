// Core package exports
// NOTE: org/* and agents/* are intentionally not re-exported — they have
// pre-existing type errors that would leak into consumers' typechecks.
export * from "./db/schema";
export * from "./db/client";
export { createAuth, getAuth } from "./auth";
export type { Database } from "./db/client";