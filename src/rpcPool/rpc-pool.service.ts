import { Injectable, Logger } from '@nestjs/common';
import { sleep } from '../shared/utils';

const RETRYABLE_ERRORS = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR_429: { code: 'SERVER_ERROR', status: 429 },
  TIMEOUT: 'TIMEOUT',
  RATE_LIMIT: 'RATE_LIMIT',
};

export interface RpcRetryConfig {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

export interface RpcProvider {
  id: string;
  provider: any;
  url: string;
  isActive: boolean;
  lastUsed: number;
  errorCount: number;
  maxErrors: number;
  weight: number;
}

export interface RpcPoolConfig {
  providers: Array<{
    id: string;
    provider: any;
    url: string;
    weight?: number;
    maxErrors?: number;
  }>;
  retryConfig?: RpcRetryConfig;
  healthCheckInterval?: number;
  errorThreshold?: number;
}

const DEFAULT_RETRY_CONFIG: Required<RpcRetryConfig> = {
  maxRetries: 10,
  baseDelay: 500,
  maxDelay: 30000,
  backoffMultiplier: 2,
};

const DEFAULT_POOL_CONFIG = {
  healthCheckInterval: 5000, // 30 seconds
  errorThreshold: 5,
};

@Injectable()
export class RpcPoolService {
  private readonly logger = new Logger(RpcPoolService.name);
  private providers: RpcProvider[] = [];
  private currentProviderIndex = 0;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private retryConfig: Required<RpcRetryConfig>;

  constructor(config: RpcPoolConfig) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config.retryConfig };

    this.providers = config.providers.map((providerConfig) => ({
      id: providerConfig.id,
      provider: providerConfig.provider,
      url: providerConfig.url,
      isActive: true,
      lastUsed: 0,
      errorCount: 0,
      maxErrors: providerConfig.maxErrors || DEFAULT_POOL_CONFIG.errorThreshold,
      weight: providerConfig.weight || 1,
    }));

    if (this.providers.length > 1) {
      this.startHealthCheck(
        config.healthCheckInterval || DEFAULT_POOL_CONFIG.healthCheckInterval,
      );
    }
  }

  /**
   * Get the next available provider using round-robin with weights
   */
  public getNextProvider(): RpcProvider | null {
    const activeProviders = this.providers.filter((p) => p.isActive);
    if (activeProviders.length === 0) {
      return null;
    }

    // Simple round-robin for now, can be enhanced with weighted selection
    const provider =
      activeProviders[this.currentProviderIndex % activeProviders.length];
    this.currentProviderIndex =
      (this.currentProviderIndex + 1) % activeProviders.length;

    provider.lastUsed = Date.now();
    return provider;
  }

  private markProviderError(providerId: string): void {
    const provider = this.providers.find((p) => p.id === providerId);
    if (provider) {
      provider.errorCount++;

      if (provider.errorCount >= provider.maxErrors) {
        provider.isActive = false;
        this.logger.warn(
          `Provider ${providerId} marked as inactive due to too many errors`,
        );
      }
    }
  }

  private markProviderSuccess(providerId: string): void {
    const provider = this.providers.find((p) => p.id === providerId);
    if (provider) {
      provider.errorCount = 0;
      if (!provider.isActive) {
        provider.isActive = true;
        this.logger.log(`Provider ${providerId} reactivated`);
      }
    }
  }

  private startHealthCheck(interval: number): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, interval);
  }

  private async performHealthCheck(): Promise<void> {
    for (const provider of this.providers) {
      try {
        await provider.provider.getBlockNumber();
        this.markProviderSuccess(provider.id);
      } catch (error) {
        this.logger.warn(
          `Health check failed for provider ${provider.id}: ${error.message}`,
        );
        this.markProviderError(provider.id);
      }
    }
  }

  public stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  private isRetryableError(error: any): boolean {
    if (!error) return false;

    if (error.code === RETRYABLE_ERRORS.NETWORK_ERROR) {
      return true;
    }

    if (
      error.code === RETRYABLE_ERRORS.SERVER_ERROR_429.code &&
      error.status === RETRYABLE_ERRORS.SERVER_ERROR_429.status
    ) {
      return true;
    }

    if (error.code === RETRYABLE_ERRORS.TIMEOUT) {
      return true;
    }

    if (error.code === RETRYABLE_ERRORS.RATE_LIMIT) {
      return true;
    }

    if (
      error.message?.includes('connection') ||
      error.message?.includes('network')
    ) {
      return true;
    }

    return false;
  }

  private calculateDelay(
    attempt: number,
    baseDelay: number,
    maxDelay: number,
    backoffMultiplier: number,
  ): number {
    const delay = baseDelay * Math.pow(backoffMultiplier, attempt);
    return Math.min(delay, maxDelay);
  }

  /**
   * Executes an RPC function with automatic retry logic and provider failover
   * @param rpcFunction - Function that takes a provider and returns a promise
   * @param config - Retry configuration
   * @returns Promise with the result of the RPC function
   */
  public async executeWithRetry<T>(
    rpcFunction: (provider: any) => Promise<T>,
    config: RpcRetryConfig = {},
  ): Promise<T> {
    const finalConfig = { ...this.retryConfig, ...config };
    let lastError: any;

    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
      const provider = this.getNextProvider();

      if (!provider) {
        throw new Error('No active RPC providers available');
      }

      try {
        const result = await rpcFunction(provider.provider);
        this.markProviderSuccess(provider.id);
        return result;
      } catch (error) {
        lastError = error;
        if (error.code === 429) {
          this.markProviderError(provider.id);
        }

        // If it's the last attempt or not a retryable error, throw the error
        if (
          attempt === finalConfig.maxRetries ||
          !this.isRetryableError(error)
        ) {
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateDelay(
          attempt,
          finalConfig.baseDelay,
          finalConfig.maxDelay,
          finalConfig.backoffMultiplier,
        );

        this.logger.warn(
          `RPC request failed (attempt ${attempt + 1}/${finalConfig.maxRetries + 1}) on provider ${provider.id}:`,
          error.message || error,
          `Retrying in ${delay}ms...`,
        );

        await sleep(delay);
      }
    }

    // This should never be reached, but TypeScript requires it
    throw lastError;
  }

  public async getBlockNumber(config?: RpcRetryConfig): Promise<number> {
    return this.executeWithRetry(
      (provider) => provider.getBlockNumber(),
      config,
    );
  }

  public async getLogs(filter: any, config?: RpcRetryConfig): Promise<any[]> {
    return this.executeWithRetry(
      (provider) => provider.getLogs(filter),
      config,
    );
  }

  public async getBlock(
    blockHashOrBlockTag: string | number,
    config?: RpcRetryConfig,
  ): Promise<any> {
    return this.executeWithRetry(
      (provider) => provider.getBlock(blockHashOrBlockTag),
      config,
    );
  }

  /**
   * Contract call with retry logic and provider failover
   */
  public async contractCall<T>(
    contract: any,
    method: string,
    args: any[] = [],
    config?: RpcRetryConfig,
  ): Promise<T> {
    return this.executeWithRetry(() => contract[method](...args), config);
  }

  public getPoolStatus(): {
    totalProviders: number;
    activeProviders: number;
    providers: Array<{
      id: string;
      url: string;
      isActive: boolean;
      errorCount: number;
      lastUsed: number;
    }>;
  } {
    return {
      totalProviders: this.providers.length,
      activeProviders: this.providers.filter((p) => p.isActive).length,
      providers: this.providers.map((p) => ({
        id: p.id,
        url: p.url,
        isActive: p.isActive,
        errorCount: p.errorCount,
        lastUsed: p.lastUsed,
      })),
    };
  }

  /**
   * Manually reactivate a provider
   */
  public reactivateProvider(providerId: string): boolean {
    const provider = this.providers.find((p) => p.id === providerId);
    if (provider) {
      provider.isActive = true;
      provider.errorCount = 0;
      this.logger.log(`Provider ${providerId} manually reactivated`);
      return true;
    }
    return false;
  }

  /**
   * Cleanup resources
   */
  public onModuleDestroy(): void {
    this.stopHealthCheck();
  }
}
