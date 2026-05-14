import { describe, expect, it } from "vitest";

import { parseServerEnv } from "./env-schema";

const validEncryptionKey = Buffer.alloc(32, 1).toString("base64");

describe("parseServerEnv", () => {
  it("fails fast when required server variables are missing", () => {
    expect(() => parseServerEnv({})).toThrow(/Invalid server environment/);
  });

  it("requires the encryption key to decode to 32 bytes", () => {
    expect(() =>
      parseServerEnv({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
        SUPABASE_SERVICE_ROLE_KEY: "service-key",
        DATABASE_URL: "postgres://user:pass@localhost:5432/flowforge",
        APP_ENCRYPTION_KEY_BASE64: Buffer.alloc(16, 1).toString("base64"),
      }),
    ).toThrow(/APP_ENCRYPTION_KEY_BASE64/);
  });

  it("parses the complete server contract", () => {
    expect(
      parseServerEnv({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
        SUPABASE_SERVICE_ROLE_KEY: "service-key",
        DATABASE_URL: "postgres://user:pass@localhost:5432/flowforge",
        APP_ENCRYPTION_KEY_BASE64: validEncryptionKey,
      }),
    ).toMatchObject({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      SUPABASE_SERVICE_ROLE_KEY: "service-key",
      DATABASE_URL: "postgres://user:pass@localhost:5432/flowforge",
      APP_ENCRYPTION_KEY_BASE64: validEncryptionKey,
    });
  });
});
