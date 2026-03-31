// src/main.ts
import { bootstrapGRPC } from "./adapters/inbound/grpc/bootstrap.js";

bootstrapGRPC().catch((err) => {
  console.error("Fatal error during bootstrap:", err);
  process.exit(1);
});
