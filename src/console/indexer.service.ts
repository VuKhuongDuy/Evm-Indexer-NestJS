import { Command, CommandRunner } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS } from '../shared/constant';
import { sleep } from '../shared/utils';
import { AppConfigService } from '../config/config.service';
import { DatabaseService } from '../database/database.service';

@Injectable()
@Command({
  name: 'run-indexer',
  description: 'Run the indexer',
})
export class IndexerService extends CommandRunner {
  public provider: ethers.JsonRpcProvider;
  public contractAddress: string;

  constructor(
    private readonly configService: AppConfigService,
    private readonly databaseService: DatabaseService,
  ) {
    super();
    this.provider = new ethers.JsonRpcProvider(
      this.configService.networkRpcUrl,
    );
    this.contractAddress = CONTRACT_ADDRESS;

    console.log(this.configService.networkRpcUrl);
  }

  async run(): Promise<void> {
    const fromBlockValue = await this.databaseService.getConfig('fromBlock');
    const startingBlock = parseInt(fromBlockValue || '0');
    if (!startingBlock) {
      throw new Error('Starting block not found in the database');
    }

    console.log('Starting block:', startingBlock);

    const batchSize = 100;
    let currentBlock = startingBlock;

    while (true) {
      const latestBlockNumber = await this.provider.getBlockNumber();

      const endBlock =
        latestBlockNumber - currentBlock < batchSize
          ? latestBlockNumber
          : currentBlock + batchSize;

      const logs = await this.provider.getLogs({
        fromBlock: currentBlock,
        toBlock: endBlock,
        address: [this.contractAddress],
      });

      if (logs.length > 0) {
        console.log(logs);
      }

      currentBlock = endBlock + 1;

      if (endBlock === latestBlockNumber) {
        await sleep(1000);
      }

      if (currentBlock - startingBlock >= batchSize) {
        await this.databaseService.setConfig(
          'fromBlock',
          currentBlock.toString(),
        );
      }
    }
  }
}
