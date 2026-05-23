import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import { ValidationPipe } from 'node_modules/@nestjs/common/pipes';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // elimina propiedades no declaradas en el DTO
      forbidNonWhitelisted: true, // lanza error si vienen propiedades extra
      transform: true, // convierte tipos automáticamente (string → number, etc)
    }),
  );

  const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

  app.enableCors({
    origin: allowedOrigin,
    credentials: true,
  });
  app.use(express.json({ limit: '50mb', inflate: true }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  const config = new DocumentBuilder()
    .setTitle('TPV Corpus — API')
    .setDescription('API del Terminal Punto de Venta para la caseta de feria')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Bearer <JWT>',
        in: 'header',
      },
      'JWT-auth',
    )
    .addSecurityRequirements('JWT-auth')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };
  await app.listen(process.env.PORT || 8080);
}
bootstrap();

