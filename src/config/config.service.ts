import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  get port(): number {
    return this.configService.get<number>('app.port');
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

  get databaseUrl(): string {
    return this.configService.get<string>('database.url');
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
        url: this.databaseUrl,
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
    };
  }
}
