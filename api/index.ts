import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import express from "express";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/app.setup";

const server = express();
let isInitialized = false;

async function ensureApp() {
  if (isInitialized) return;
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  configureApp(app);
  await app.init();
  isInitialized = true;
}

export default async function handler(req: any, res: any) {
  await ensureApp();
  server(req, res);
}
