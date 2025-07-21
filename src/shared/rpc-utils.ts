import { sleep } from './utils';

/**
 * RPC error types that should trigger retry logic
 */
const RETRYABLE_ERRORS = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR_429: { code: 'SERVER_ERROR', status: 429 },
  TIMEOUT: 'TIMEOUT',
  RATE_LIMIT: 'RATE_LIMIT',
};

/**
 * Configuration for RPC retry behavior
 */
export interface RpcRetryConfig {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: Required<RpcRetryConfig> = {
  maxRetries: 10,
  baseDelay: 500,
  maxDelay: 30000,
  backoffMultiplier: 2,
};

/**
 * Checks if an error is retryable based on error type and code
 */
function isRetryableError(error: any): boolean {
  if (!error) return false;

  // Check for network errors
  if (error.code === RETRYABLE_ERRORS.NETWORK_ERROR) {
    return true;
  }

  // Check for server errors with 429 status (rate limit)
  if (
    error.code === RETRYABLE_ERRORS.SERVER_ERROR_429.code &&
    error.status === RETRYABLE_ERRORS.SERVER_ERROR_429.status
  ) {
    return true;
  }

  // Check for timeout errors
  if (error.code === RETRYABLE_ERRORS.TIMEOUT) {
    return true;
  }

  // Check for rate limit errors
  if (error.code === RETRYABLE_ERRORS.RATE_LIMIT) {
    return true;
  }

  // Check for connection errors
  if (
    error.message?.includes('connection') ||
    error.message?.includes('network')
  ) {
    return true;
  }

  return false;
}

/**
 * Calculates delay with exponential backoff
 */
function calculateDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  backoffMultiplier: number,
): number {
  const delay = baseDelay * Math.pow(backoffMultiplier, attempt);
  return Math.min(delay, maxDelay);
}

/**
 * Executes an RPC function with automatic retry logic for network errors
 * @param rpcFunction - The RPC function to execute
 * @param config - Retry configuration
 * @returns Promise with the result of the RPC function
 */
export async function executeWithRetry<T>(
  rpcFunction: () => Promise<T>,
  config: RpcRetryConfig = {},
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: any;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await rpcFunction();
    } catch (error) {
      lastError = error;

      // If it's the last attempt or not a retryable error, throw the error
      if (attempt === finalConfig.maxRetries || !isRetryableError(error)) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = calculateDelay(
        attempt,
        finalConfig.baseDelay,
        finalConfig.maxDelay,
        finalConfig.backoffMultiplier,
      );

      console.warn(
        `RPC request failed (attempt ${attempt + 1}/${finalConfig.maxRetries + 1}):`,
        error.message || error,
        `Retrying in ${delay}ms...`,
      );

      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript requires it
  throw lastError;
}

/**
 * Wrapper for provider.getBlockNumber with retry logic
 */
export async function getBlockNumberWithRetry(
  provider: any,
  config?: RpcRetryConfig,
): Promise<number> {
  return executeWithRetry(() => provider.getBlockNumber(), config);
}

/**
 * Wrapper for provider.getLogs with retry logic
 */
export async function getLogsWithRetry(
  provider: any,
  filter: any,
  config?: RpcRetryConfig,
): Promise<any[]> {
  return executeWithRetry(() => provider.getLogs(filter), config);
}

/**
 * Wrapper for provider.getBlock with retry logic
 */
export async function getBlockWithRetry(
  provider: any,
  blockHashOrBlockTag: string | number,
  config?: RpcRetryConfig,
): Promise<any> {
  return executeWithRetry(() => provider.getBlock(blockHashOrBlockTag), config);
}

/**
 * Wrapper for contract calls with retry logic
 */
export async function contractCallWithRetry<T>(
  contract: any,
  method: string,
  args: any[] = [],
  config?: RpcRetryConfig,
): Promise<T> {
  return executeWithRetry(() => contract[method](...args), config);
}
