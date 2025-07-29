import { Command, CommandRunner } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { getBlockNumberWithRetry } from '../shared/rpc-utils';
import { AppConfigService } from '../config/config.service';
import { DatabaseService } from '../database/database.service';
import { marketAbi as CONTRACT_ABI } from '../config/market-abi';
import { IndexerLogger } from '@/logger.service';

@Injectable()
@Command({
  name: 'reindex',
  description: 'Run the scanner',
  arguments: '<reindexBlockHeight>',
})
export class ReindexService extends CommandRunner {
  public provider: ethers.JsonRpcProvider;
  public contractAddress: string;
  public contract: ethers.Contract;

  constructor(
    private readonly configService: AppConfigService,
    private readonly databaseService: DatabaseService,
    private readonly logger: IndexerLogger,
  ) {
    super();
    this.provider = new ethers.JsonRpcProvider(
      this.configService.networkRpcUrl,
    ); // Init Blockchain RPC Provider
    this.contractAddress = this.configService.contractAddress; // P2P Market smart contract address
    this.contract = new ethers.Contract(
      this.contractAddress,
      CONTRACT_ABI,
      this.provider,
    );
  }

  /**
   * reindexBlockHeight: is the start block height to reindex from.
   * initializationBlock --> currentBlockHeight --> latestBlockHeight
   * There are 3 cases:
   * 1. reindexBlockHeight > currentBlockHeight
   * 2. reindexBlockHeight < initializationBlock
   * 3. initializationBlock < reindexBlockHeight < currentBlockHeight
   * @param passedParams
   */
  async run(passedParams: string[]): Promise<void> {
    const reindexBlockHeight = parseInt(passedParams[0], 10);
    if (isNaN(reindexBlockHeight)) {
      throw new Error('Invalid reindexBlockHeight argument');
    }

    this.logger.log(`Reindex service started from block ${reindexBlockHeight}`);
    const latestBlockHeight = await getBlockNumberWithRetry(this.provider);
    const currentBlockHeight = parseInt(
      await this.databaseService.getConfig('currentBlockHeight'),
      10,
    );
    const initializationBlock = parseInt(
      await this.databaseService.getConfig('initializationBlock'),
      10,
    );

    // Case 1
    if (reindexBlockHeight > currentBlockHeight) {
      this.logger.error(
        `reindexBlockHeight ${reindexBlockHeight} is greater than currentBlockHeight ${currentBlockHeight}`,
      );
      throw new Error(
        `reindexBlockHeight ${reindexBlockHeight} is greater than currentBlockHeight ${currentBlockHeight}`,
      );
    }

    /**
     * Case 2
     * Clear all data
     * Update config currentBlockHeight = initializationBlock
     */
    if (reindexBlockHeight < initializationBlock) {
      await this.databaseService.clearOrders();
      this.logger.log(`All orders have been deleted`);
      await this.databaseService.setConfig(
        'currentBlockHeight',
        initializationBlock.toString(),
      );
      this.logger.log(`Current block height updated to ${initializationBlock}`);
      this.logger.log(`Reindex service completed`);
      return;
    }

    /**
     * Case 3
     * Delete orders from reindexBlockHeight to currentBlockHeight
     * Update config currentBlockHeight = reindexBlockHeight
     */
    await this.databaseService.deleteManyOrders(
      reindexBlockHeight,
      latestBlockHeight,
    );
    this.logger.log(
      `Orders have been deleted from ${reindexBlockHeight} to ${latestBlockHeight}`,
    );
    await this.databaseService.setConfig(
      'currentBlockHeight',
      reindexBlockHeight.toString(),
    );
    this.logger.log(`Current block height updated to ${reindexBlockHeight}`);
    this.logger.log(`Reindex service completed`);
  }
}
