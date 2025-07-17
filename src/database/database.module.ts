import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Config } from './entities/config.entity';
import { DatabaseService } from './database.service';
import { DatabaseInitCommand } from './database-init.command';
import { dbConfig } from './dbconfig';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => dbConfig(configService),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Config]),
  ],
  providers: [DatabaseService, DatabaseInitCommand],
  exports: [TypeOrmModule, DatabaseService],
})
export class DatabaseModule {}
