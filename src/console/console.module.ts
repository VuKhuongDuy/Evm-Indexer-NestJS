import { Config } from '../database/entities/config.entity';
import {
  databaseConfig,
  networkConfig,
  jwtConfig,
  loggingConfig,
  redisConfig,
  appConfig,
  rabbitmqConfig,
  indexerConfig,
} from '../config/env.config';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScannerService } from './scanner.service';
import { dbConfig } from '../database/dbconfig';
import { AppConfigService } from '../config/config.service';
import { DatabaseService } from '../database/database.service';
import { Order } from '../database/entities/order.entity';
import { RabbitMQModule } from '../rmq/rmq.module';
import { DataUpdaterController } from './dataUpdater.service';
import { NotifierController } from './notifier.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => dbConfig(configService),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Config, Order]),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        networkConfig,
        jwtConfig,
        redisConfig,
        loggingConfig,
        rabbitmqConfig,
        indexerConfig,
      ],
    }),
    RabbitMQModule,
  ],
  providers: [ScannerService, AppConfigService, DatabaseService],
  controllers: [DataUpdaterController, NotifierController],
})
export class ConsoleModule {}
