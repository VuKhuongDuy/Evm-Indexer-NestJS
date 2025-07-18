import { Config } from '../database/entities/config.entity';
import {
  databaseConfig,
  networkConfig,
  jwtConfig,
  loggingConfig,
  redisConfig,
  appConfig,
} from '../config/env.config';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IndexerService } from './indexer.service';
import { dbConfig } from '../database/dbconfig';
import { AppConfigService } from '../config/config.service';
import { DatabaseService } from '../database/database.service';
import { Order } from '../database/entities/order.entity';

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
      ],
    }),
  ],
  providers: [IndexerService, AppConfigService, DatabaseService],
})
export class ConsoleModule {}
