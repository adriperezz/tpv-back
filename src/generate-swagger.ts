import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';

async function generateSwaggerJson() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('NestJS + Prisma API')
    .setDescription('API for the NestJS + Prisma project')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const sortedDocument = JSON.stringify(document, null, 2);

  const apiDocsDir = path.join(__dirname, '..', 'api-docs');
  if (!fs.existsSync(apiDocsDir)) {
    fs.mkdirSync(apiDocsDir, { recursive: true });
  }

  fs.writeFileSync(path.join(apiDocsDir, 'swagger.json'), sortedDocument);

  await app.close();
}

generateSwaggerJson();

