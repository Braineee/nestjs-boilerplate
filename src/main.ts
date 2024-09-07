import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const { port, appName, swaggerApiRoot } = configService.get('common');

  const PRODUCT_NAME = 'Toyerealty';
  const PRODUCT_TAG = 'toyerealty';
  const PRODUCT_VERSION = '1.0.0';

  // Determine the allowed origins
  const whitelist = configService
    .get<string>('CORS_WHITELIST')
    .split(',')
    .map((pattern) => new RegExp(pattern));

  // Enable localhost on dev/staging servers only
  if ([undefined, 'development', 'localhost'].includes(process.env.NODE_ENV)) {
    whitelist.push(/http(s)?:\/\/localhost:/);
  }

  Logger.log(`Approved domains: ${whitelist.join(',')}`);

  // Set cors options
  const options = {
    origin: whitelist,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cache-control',
    ],
    credentials: true,
  };
  app.enableCors(options);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const swaggerOptions = new DocumentBuilder()
    .setTitle(`${PRODUCT_NAME} API Documentation`)
    .setDescription('List of all the APIs for Duplo API.')
    .setVersion(PRODUCT_VERSION)
    .addTag(PRODUCT_TAG)
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerOptions);
  SwaggerModule.setup(swaggerApiRoot, app, document);

  await app.listen(port);
  Logger.log(
    `${PRODUCT_NAME} core service running on port ${port}: visit http://localhost:${port}/${swaggerApiRoot}`,
  );
}

bootstrap();
