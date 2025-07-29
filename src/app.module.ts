import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigService } from './config/config.service';
import { DatabaseModule } from './database/database.module';
import {
  appConfig,
  databaseConfig,
  networkConfig,
  jwtConfig,
  redisConfig,
  loggingConfig,
  contractConfig,
  rabbitmqConfig,
} from './config/env.config';
import { ConsoleModule } from './console/console.module';
import { RabbitMQModule } from './rmq/rmq.module';
import { OrderModule } from './order/order.module';
import { IndexerLogger } from './logger.service';
import { MetricsModule } from './metrics/metrics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        networkConfig,
        jwtConfig,
        redisConfig,
        loggingConfig,
        contractConfig,
        rabbitmqConfig,
      ],
    }),
    DatabaseModule,
    ConsoleModule,
    RabbitMQModule,
    OrderModule,
    MetricsModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppConfigService, IndexerLogger],
  exports: [AppConfigService, IndexerLogger],
})
export class AppModule {}
