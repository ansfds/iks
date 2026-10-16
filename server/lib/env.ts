import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

export const env = {
  // Validate each integration when used so anonymous pages do not require OAuth.
  get appId() { return required("APP_ID"); },
  get appSecret() { return required("APP_SECRET"); },
  isProduction: process.env.NODE_ENV === "production",
  get databaseUrl() { return required("DATABASE_URL"); },
  get kimiAuthUrl() { return required("KIMI_AUTH_URL"); },
  get kimiOpenUrl() { return required("KIMI_OPEN_URL"); },
  ownerUnionId: process.env.OWNER_UNION_ID ?? "",
};
