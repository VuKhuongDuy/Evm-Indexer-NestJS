import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { RabbitMQService } from './rmq.service';
import { RabbitMQProducer } from './rmq.producer';
import { RabbitMQConsumer } from './rmq.consumer';
import { rabbitmqConfig as rabbitmqConfigEnv } from '@/config/env.config';
import { rabbitmqConfig } from './rmqConfig';
import { AppConfigService } from '@/config/config.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [rabbitmqConfigEnv],
    }),
    ClientsModule.registerAsync([
      {
        name: 'RABBITMQ_SERVICE_RAW_LOGS',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) =>
          rabbitmqConfig(configService, configService.get('rabbitmq.queueLog')),
        inject: [ConfigService],
      },
      {
        name: 'RABBITMQ_SERVICE_PROCESSED_EVENTS',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) =>
          rabbitmqConfig(
            configService,
            configService.get('rabbitmq.queueProcessedEvents'),
          ),
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [
    RabbitMQService,
    RabbitMQProducer,
    RabbitMQConsumer,
    AppConfigService,
  ],
  exports: [RabbitMQService, RabbitMQProducer, RabbitMQConsumer, ClientsModule],
})
export class RabbitMQModule {}
