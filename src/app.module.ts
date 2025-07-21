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
} from './config/env.config';
import { ConsoleModule } from './console/console.module';
import { OrderModule } from './order/order.module';

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
      ],
    }),
    DatabaseModule,
    ConsoleModule,
    OrderModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppConfigService],
  exports: [AppConfigService],
})
export class AppModule {}
