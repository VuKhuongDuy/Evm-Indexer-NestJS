import { ethers } from 'ethers';
import { RpcPoolConfig } from '@/rpcPool/rpc-pool.service';

export const rpcConfig: RpcPoolConfig = {
  providers: [
    {
      id: 'infura-sepolia',
      provider: new ethers.JsonRpcProvider(
        'https://sepolia.infura.io/v3/API_KEY',
      ),
      url: 'https://sepolia.infura.io/v3/API_KEY',
      weight: 1,
      maxErrors: 5,
    },
    {
      id: 'drpc-sepolia',
      provider: new ethers.JsonRpcProvider('https://sepolia.drpc.org'),
      url: 'https://sepolia.drpc.org',
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
  healthCheckInterval: 5000,
  errorThreshold: 5,
};
