import { RpcPoolService, RpcPoolConfig } from '@/rpcPool/rpc-pool.service';
import { ethers } from 'ethers';

const rpcPoolConfig: RpcPoolConfig = {
  providers: [
    {
      id: 'infura-mainnet',
      provider: new ethers.JsonRpcProvider(
        'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
      ),
      url: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
      weight: 2,
      maxErrors: 5,
    },
    {
      id: 'alchemy-mainnet',
      provider: new ethers.JsonRpcProvider(
        'https://eth-mainnet.alchemyapi.io/v2/YOUR_ALCHEMY_KEY',
      ),
      url: 'https://eth-mainnet.alchemyapi.io/v2/YOUR_ALCHEMY_KEY',
      weight: 1,
      maxErrors: 3,
    },
    {
      id: 'quicknode-mainnet',
      provider: new ethers.JsonRpcProvider(
        'https://your-endpoint.quiknode.pro/YOUR_KEY/',
      ),
      url: 'https://your-endpoint.quiknode.pro/YOUR_KEY/',
      weight: 1,
      maxErrors: 5,
    },
  ],
  retryConfig: {
    maxRetries: 10,
    baseDelay: 500,
    maxDelay: 30000,
    backoffMultiplier: 2,
  },
  healthCheckInterval: 30000,
  errorThreshold: 5,
};

export class ExampleService {
  private rpcPool: RpcPoolService;

  constructor() {
    this.rpcPool = new RpcPoolService(rpcPoolConfig);
  }

  async getCurrentBlockNumber(): Promise<number> {
    return await this.rpcPool.getBlockNumber();
  }

  async getLogs(
    fromBlock: number,
    toBlock: number,
    address: string,
  ): Promise<any[]> {
    const filter = {
      fromBlock,
      toBlock,
      address,
    };

    return await this.rpcPool.getLogs(filter);
  }

  async getBlock(blockNumber: number): Promise<any> {
    return await this.rpcPool.getBlock(blockNumber);
  }

  async callContract(
    contractAddress: string,
    abi: any[],
    method: string,
    args: any[] = [],
  ): Promise<any> {
    const contract = new ethers.Contract(contractAddress, abi);

    return await this.rpcPool.contractCall(contract, method, args);
  }

  getPoolStatus() {
    return this.rpcPool.getPoolStatus();
  }

  reactivateProvider(providerId: string): boolean {
    return this.rpcPool.reactivateProvider(providerId);
  }

  cleanup() {
    this.rpcPool.onModuleDestroy();
  }
}
