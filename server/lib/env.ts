import { config } from 'dotenv';
config({ path: ['.env.local', '.env'], quiet: true });

export const env = {
  // Public pages remain available when an optional integration is unconfigured.
  isProduction: process.env.NODE_ENV === "production",
};
