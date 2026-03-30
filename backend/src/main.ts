import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { ResponseTimeInterceptor } from './common/interceptors/response-time.interceptor';
import { SeedService } from './modules/seed/seed.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.use(helmet());
  app.use(compression());

  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  app.useGlobalInterceptors(new ResponseTimeInterceptor());

  const config = new DocumentBuilder()
    .setTitle('Store Analytics Dashboard API')
    .setDescription('Amboras take-home backend')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // --- SEED ON BOOT WIRING ---
  if (process.env.SEED_ON_BOOT === 'true') {
    logger.log('SEED_ON_BOOT is true. Running database seed...');
    const seedService = app.get(SeedService);
    await seedService.seed();
    logger.log('Database seeded successfully.');
  }

  const port = process.env.BACKEND_PORT || 3001;
  await app.listen(port);

  logger.log(`Backend running on http://localhost:${port}`);
  logger.log(`Swagger docs available at http://localhost:${port}/api/docs`);
}

bootstrap();
