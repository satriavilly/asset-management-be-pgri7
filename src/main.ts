import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { configureApp } from "./app.setup";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);

  const port = process.env.PORT || 4000;
  await app.listen(port, "0.0.0.0");
  console.log(
    `🚀 SMP PGRI 7 Asset Management API running on: http://localhost:${port}/api/v1`,
  );
  console.log(
    `📖 Swagger API Documentation available at: http://localhost:${port}/api/docs`,
  );
}

bootstrap();
