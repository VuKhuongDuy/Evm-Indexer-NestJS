import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  get port(): number {
    return this.configService.get<number>('app.port');
  }

  get contractAddress(): string {
    return this.configService.get<string>('contract.address');
  }

  get nodeEnv(): string {
    return this.configService.get<string>('app.nodeEnv');
  }

  get apiPrefix(): string {
    return this.configService.get<string>('app.apiPrefix');
  }

  get corsOrigin(): string {
    return this.configService.get<string>('app.corsOrigin');
  }

  // Database configuration
  get databaseType(): string {
    return this.configService.get<string>('database.type');
  }

  get databaseHost(): string {
    return this.configService.get<string>('database.host');
  }

  get databasePort(): number {
    return this.configService.get<number>('database.port');
  }

  get databaseUsername(): string {
    return this.configService.get<string>('database.username');
  }

  get databasePassword(): string {
    return this.configService.get<string>('database.password');
  }

  get databaseName(): string {
    return this.configService.get<string>('database.database');
  }

  get databaseSynchronize(): boolean {
    return this.configService.get<boolean>('database.synchronize');
  }

  get databaseEntities(): any[] {
    return this.configService.get<any[]>('database.entities');
  }

  get networkRpcUrl(): string {
    return this.configService.get<string>('network.rpcUrl');
  }

  get networkChainId(): number {
    return this.configService.get<number>('network.chainId');
  }

  get jwtSecret(): string {
    return this.configService.get<string>('jwt.secret');
  }

  get redisHost(): string {
    return this.configService.get<string>('redis.host');
  }

  get redisPort(): number {
    return this.configService.get<number>('redis.port');
  }

  get logLevel(): string {
    return this.configService.get<string>('logging.level');
  }

  get rabbitmqHost(): string {
    return this.configService.get<string>('rabbitmq.host');
  }

  get rabbitmqPort(): number {
    return this.configService.get<number>('rabbitmq.port');
  }

  get rabbitmqUsername(): string {
    return this.configService.get<string>('rabbitmq.username');
  }

  get rabbitmqPassword(): string {
    return this.configService.get<string>('rabbitmq.password');
  }

  get rabbitmqVhost(): string {
    return this.configService.get<string>('rabbitmq.vhost');
  }

  get rabbitmqQueueLog(): string {
    return this.configService.get<string>('rabbitmq.queueLog');
  }

  get rabbitmqQueueProcessedEvents(): string {
    return this.configService.get<string>('rabbitmq.queueProcessedEvents');
  }

  get indexerBatchSize(): number {
    return this.configService.get<number>('indexer.batchSize');
  }

  // Helper method to get all configuration
  getAllConfig() {
    return {
      app: {
        port: this.port,
        nodeEnv: this.nodeEnv,
        apiPrefix: this.apiPrefix,
        corsOrigin: this.corsOrigin,
      },
      database: {
        type: this.databaseType,
        host: this.databaseHost,
        port: this.databasePort,
        username: this.databaseUsername,
        password: this.databasePassword,
        database: this.databaseName,
        synchronize: this.databaseSynchronize,
        entities: this.databaseEntities,
      },
      network: {
        rpcUrl: this.networkRpcUrl,
        chainId: this.networkChainId,
      },
      jwt: {
        secret: this.jwtSecret,
      },
      redis: {
        host: this.redisHost,
        port: this.redisPort,
      },
      logging: {
        level: this.logLevel,
      },
      contract: {
        address: this.contractAddress,
      },
      indexer: {
        batchSize: this.indexerBatchSize,
      },
      rabbitmq: {
        host: this.rabbitmqHost,
        port: this.rabbitmqPort,
        username: this.rabbitmqUsername,
        password: this.rabbitmqPassword,
        vhost: this.rabbitmqVhost,
        queueLog: this.rabbitmqQueueLog,
        queueProcessedEvents: this.rabbitmqQueueProcessedEvents,
      },
    };
  }
}
