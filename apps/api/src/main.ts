import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Run migrations on startup (prod + dev)
  const dataSource = app.get(DataSource);
  await dataSource.runMigrations();
  console.log('✅ Migrations completed');

  // HTTP Request logging middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const method = req.method;
    const url = req.url;
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const status = res.statusCode;
      console.log(`[${method}] ${url} -> ${status} (${duration}ms)`);
    });
    
    next();
  });

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

  console.log(`API is running on: http://localhost:${port}/api`);
}

bootstrap();
