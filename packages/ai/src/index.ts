import { mistral } from "@ai-sdk/mistral";

// Mistral Small is free-tier friendly; used for both heavy and cheap tasks.
export const MODEL_HEAVY = process.env.MISTRAL_MODEL_HEAVY ?? "mistral-small-latest";
export const MODEL_CHEAP = process.env.MISTRAL_MODEL_CHEAP ?? "mistral-small-latest";

export const heavyModel = () => mistral(MODEL_HEAVY);
export const cheapModel = () => mistral(MODEL_CHEAP);

export const hasAIKey = () => Boolean(process.env.MISTRAL_API_KEY);

export * from "./prd";
export * from "./tasks";
export * from "./review";
