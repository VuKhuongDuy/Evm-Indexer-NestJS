import { ConfigService } from '@nestjs/config';
import { Config } from './entities/config.entity';

export const dbConfig = (configService: ConfigService) => ({
  type: configService.get('database.type'),
  host: configService.get('database.host'),
  port: configService.get('database.port'),
  username: configService.get('database.username'),
  password: configService.get('database.password'),
  database: configService.get('database.database'),
  entities: [Config],
  synchronize: configService.get('database.synchronize'),
});
