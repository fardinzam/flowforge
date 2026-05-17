import { parseServerEnv } from "@/server/env-schema";

export const workerEnv = parseServerEnv(process.env);
