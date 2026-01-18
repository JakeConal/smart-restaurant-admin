import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  // Set system timezone to UTC
  process.env.TZ = 'UTC';

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(cookieParser());
  app.use(compression());
  app.set('trust proxy', 1); // Trust the first proxy (e.g. Nginx, Load Balancer)

  app.enableCors({
    origin: [
      process.env.ADMIN_FRONTEND_URL || 'http://localhost:3000',
      process.env.CUSTOMER_FRONTEND_URL || 'http://localhost:4000',
    ],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
}
bootstrap();
