import { Module, DynamicModule } from '@nestjs/common';
import { RpcPoolService, RpcPoolConfig } from './rpc-pool.service';

@Module({})
export class RpcPoolModule {
  static forRoot(config: RpcPoolConfig): DynamicModule {
    return {
      module: RpcPoolModule,
      providers: [
        {
          provide: RpcPoolService,
          useFactory: () => new RpcPoolService(config),
        },
      ],
      exports: [RpcPoolService],
    };
  }

  static forFeature(): DynamicModule {
    return {
      module: RpcPoolModule,
      providers: [RpcPoolService],
      exports: [RpcPoolService],
    };
  }
}
