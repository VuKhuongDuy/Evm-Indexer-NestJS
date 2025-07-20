import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { rabbitmqConfig } from './rmq/rmqConfig';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Create microservice for RabbitMQ
  app.connectMicroservice(rabbitmqConfig(configService, 'indexer.raw_log.q'));
  app.connectMicroservice(
    rabbitmqConfig(configService, 'indexer.processed_events.q'),
  );
  await app.startAllMicroservices();

  // Enable CORS
  app.enableCors({
    origin: configService.get('app.corsOrigin'),
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix(configService.get('app.apiPrefix'));

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('EVM Indexer API')
    .setDescription('Simple API with Swagger')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = configService.get('app.port');
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/api`);
  console.log('RabbitMQ microservice is running');
}

bootstrap();
