import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { rabbitmqConsumerConfig } from './rmq/rmqConfig';
import { IndexerLogger } from './logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Create microservice for RabbitMQ
  app.connectMicroservice(
    rabbitmqConsumerConfig(
      configService,
      configService.get('rabbitmq.queueLog'),
    ),
  );
  app.connectMicroservice(
    rabbitmqConsumerConfig(
      configService,
      configService.get('rabbitmq.queueProcessedEvents'),
    ),
  );
  await app.startAllMicroservices();

  // Enable CORS
  app.enableCors({
    origin: configService.get('app.corsOrigin'),
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix(configService.get('app.apiPrefix'));

  const logger = new IndexerLogger();
  app.useLogger(logger);

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
