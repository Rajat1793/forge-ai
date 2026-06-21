import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@forge-ai/auth";

export const { GET, POST } = toNextJsHandler(auth);
