import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConsoleCommand } from './console.command';
import { AppConfigService } from './config/config.service';
import {
  appConfig,
  databaseConfig,
  networkConfig,
  jwtConfig,
  redisConfig,
  loggingConfig,
} from './config/env.config';

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
      ],
    }),
  ],
  controllers: [AppController],
  providers: [AppService, ConsoleCommand, AppConfigService],
})
export class AppModule {}
