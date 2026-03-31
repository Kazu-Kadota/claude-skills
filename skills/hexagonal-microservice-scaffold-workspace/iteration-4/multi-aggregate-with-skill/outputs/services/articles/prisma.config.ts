import { defineConfig } from "prisma/config";
import { config } from "./src/infrastructure/config.js";

export default defineConfig({
  earlyAccess: true,
  schema: "./prisma/schema.prisma",
});
