import { Command, CommandRunner } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS } from './shared/constant';
import { sleep } from './shared/utils';
import { AppConfigService } from './config/config.service';

@Injectable()
@Command({
  name: 'run-indexer',
  description: 'Run the indexer',
})
export class ConsoleCommand extends CommandRunner {
  public provider: ethers.JsonRpcProvider;
  public contractAddress: string;

  constructor(private readonly configService: AppConfigService) {
    super();
    this.provider = new ethers.JsonRpcProvider(
      this.configService.networkRpcUrl,
    );
    this.contractAddress = CONTRACT_ADDRESS;

    console.log(this.configService.networkRpcUrl);
  }

  async run(): Promise<void> {
    // TODO: Get from DB
    let fromBlock = 7342998;
    const batch = 5;

    while (true) {
      const latestBlock = await this.provider.getBlockNumber();
      const toBlock =
        latestBlock - fromBlock < batch ? latestBlock : fromBlock + batch;

      const data = await this.provider.getLogs({
        fromBlock,
        toBlock: toBlock,
        address: [this.contractAddress],
      });

      console.log(data);

      fromBlock = toBlock + 1;

      if (toBlock === latestBlock) {
        await sleep(1000);
      }

      // TODO: Save current block to DB each 1000 blocks
    }
  }
}
