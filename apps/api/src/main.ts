import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  const port = parseInt(process.env.API_PORT || '3000', 10);
  await app.listen(port);

  console.log(`🚀 API is running on: http://localhost:${port}/api`);
}

bootstrap();
