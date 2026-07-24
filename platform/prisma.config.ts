import { defineConfig, env } from "prisma/config";

try {
  process.loadEnvFile();
} catch {
  // .env is optional (e.g. when DATABASE_URL is set some other way)
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
