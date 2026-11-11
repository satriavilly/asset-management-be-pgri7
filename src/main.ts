import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global API Prefix
  app.setGlobalPrefix("api/v1");

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // CORS
  app.enableCors({
    origin: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true,
  });

  // Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle("SMP PGRI 7 Bandung — Asset Management API")
    .setDescription("Sistem Informasi Manajemen Aset & Buku Induk Sarpras SMP PGRI 7 Bandung (REST API)")
    .setVersion("1.0.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 SMP PGRI 7 Asset Management API running on: http://localhost:${port}/api/v1`);
  console.log(`📖 Swagger API Documentation available at: http://localhost:${port}/api/docs`);
}

bootstrap();
