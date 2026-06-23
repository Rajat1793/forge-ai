import { openai } from "@ai-sdk/openai";

export const MODEL_HEAVY = process.env.OPENAI_MODEL_HEAVY ?? "gpt-4o";
export const MODEL_CHEAP = process.env.OPENAI_MODEL_CHEAP ?? "gpt-4o-mini";

export const heavyModel = () => openai(MODEL_HEAVY);
export const cheapModel = () => openai(MODEL_CHEAP);

export const hasAIKey = () => Boolean(process.env.OPENAI_API_KEY);

export * from "./prd";
export * from "./tasks";
export * from "./review";
