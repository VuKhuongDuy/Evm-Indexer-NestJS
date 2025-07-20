import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { RabbitMQService } from './rmq.service';
import { RabbitMQProducer } from './rmq.producer';
import { RabbitMQConsumer } from './rmq.consumer';
import { rabbitmqConfig } from './rmqConfig';

@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: 'RABBITMQ_SERVICE_RAW_LOGS',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) =>
          rabbitmqConfig(configService, 'indexer.raw_log.q'),
        inject: [ConfigService],
      },
      {
        name: 'RABBITMQ_SERVICE_PROCESSED_EVENTS',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) =>
          rabbitmqConfig(configService, 'indexer.processed_events.q'),
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [RabbitMQService, RabbitMQProducer, RabbitMQConsumer],
  exports: [RabbitMQService, RabbitMQProducer, RabbitMQConsumer, ClientsModule],
})
export class RabbitMQModule {}
