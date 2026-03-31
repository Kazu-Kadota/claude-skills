// src/adapters/inbound/http/nest/bootstrap.ts

import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ProductModule } from "./product.module.js";
import { config } from "../../../../infrastructure/config.js";

export async function bootstrapNest() {
  const app = await NestFactory.create(ProductModule);
  app.useGlobalPipes(new ValidationPipe());
  app.enableShutdownHooks();
  await app.listen(config.app.port, () => {
    console.log(`${config.app.name} service on :${config.app.port}`);
  });
}
