import { Command, CommandRunner } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { sleep } from '../shared/utils';
import { getBlockNumberWithRetry, getLogsWithRetry } from '../shared/rpc-utils';
import { AppConfigService } from '../config/config.service';
import { DatabaseService } from '../database/database.service';
import { marketAbi as CONTRACT_ABI } from '../config/market-abi';
import { RabbitMQProducer } from '../rmq/rmq.producer';
import { IndexerLogger } from '../logger.service';

@Injectable()
@Command({
  name: 'run-scanner',
  description: 'Run the scanner',
})
export class ScannerService extends CommandRunner {
  public provider: ethers.JsonRpcProvider;
  public contractAddress: string;
  public contract: ethers.Contract;

  constructor(
    private readonly configService: AppConfigService,
    private readonly databaseService: DatabaseService,
    private readonly rabbitMQProducer: RabbitMQProducer,
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

  async run(): Promise<void> {
    const batchSize = this.configService.indexerBatchSize;
    const startingBlockStr =
      await this.databaseService.getConfig('currentBlockHeight');
    if (!startingBlockStr) {
      throw new Error('Starting block not found in the database');
    }

    let startingBlock = parseInt(startingBlockStr);
    let latestBlockNumber;

    while (true) {
      // Get the latest block number if needed from Database.
      latestBlockNumber = await this.getLatestBlockNumberIfNeeded(
        latestBlockNumber,
        startingBlock,
        batchSize,
      );

      const endBlock = this.calculateEndBlock(
        latestBlockNumber,
        startingBlock,
        batchSize,
      );

      // Fetch logs from startingBlock to endBlock via RPC blockchain endpoint.
      const logs = await this.fetchLogs(startingBlock, endBlock);

      // Push logs to queue then dataUpdater service will handle them.
      // Handle exception if any log not pushed to queue.
      let failedBlockNumber;
      if (logs.length > 0) {
        this.logger.log(
          `Found logs From block ${startingBlock} to ${endBlock}`,
        );
        failedBlockNumber = await this.pushLogsToQueue(logs);
      }
      if (failedBlockNumber) {
        startingBlock = failedBlockNumber;
      } else {
        startingBlock = endBlock + 1;
      }
      await this.databaseService.setConfig(
        'currentBlockHeight',
        startingBlock.toString(),
      );

      // If indexer updated to the latest block, sleep 1 second.
      if (endBlock >= latestBlockNumber) {
        await sleep(1000);
      }
    }
  }

  private async getLatestBlockNumberIfNeeded(
    latestBlockNumber: number | undefined,
    startingBlock: number,
    batchSize: number,
  ): Promise<number> {
    if (
      latestBlockNumber === undefined ||
      latestBlockNumber - startingBlock < batchSize
    ) {
      // Use getBlockNumberWithRetry to handle exception if network error.
      return await getBlockNumberWithRetry(this.provider);
    }
    return latestBlockNumber;
  }

  private calculateEndBlock(
    latestBlockNumber: number,
    startingBlock: number,
    batchSize: number,
  ): number {
    return latestBlockNumber - startingBlock < batchSize
      ? latestBlockNumber
      : startingBlock + batchSize;
  }

  private async fetchLogs(fromBlock: number, toBlock: number): Promise<any[]> {
    // Use getLogsWithRetry to handle exception if network error.
    return await getLogsWithRetry(this.provider, {
      fromBlock,
      toBlock,
      address: [this.contractAddress],
    });
  }

  async pushLogsToQueue(logs: any[]): Promise<void | number> {
    for (const log of logs) {
      try {
        const parsedLog = this.contract.interface.parseLog(log);
        let logData = {};
        switch (parsedLog.name) {
          case 'OrderPlaced':
            logData = {
              orderId: parsedLog.args.orderId.toString(),
              seller: parsedLog.args.seller,
              tokenToSell: parsedLog.args.tokenToSell,
              tokenToPay: parsedLog.args.tokenToPay,
              amountToSell: parsedLog.args.amountToSell.toString(),
              amountRemaining: '0',
              pricePerToken: parsedLog.args.pricePerToken.toString(),
              minOrderSize: parsedLog.args.minOrderSize.toString(),
              isActive: true,
              createdAtBlockNumber: log.blockNumber,
            };
            break;
          case 'OrderFilled':
            logData = {
              orderId: parsedLog.args.orderId.toString(),
              buyer: parsedLog.args.buyer,
              amountFilled: parsedLog.args.amountFilled.toString(),
              paymentAmount: parsedLog.args.paymentAmount.toString(),
            };
            break;
          case 'OrderCancelled':
            logData = {
              orderId: parsedLog.args.orderId.toString(),
              seller: parsedLog.args.seller,
            };
            break;
          case 'OrderUpdated':
            logData = {
              orderId: parsedLog.args.orderId.toString(),
              newPrice: parsedLog.args.newPrice.toString(),
              newMinOrderSize: parsedLog.args.newMinOrderSize.toString(),
            };
            break;
          default:
            this.logger.warn(`Unknown event: ${parsedLog.name}`);
            break;
        }

        // Publish to RabbitMQ
        await this.rabbitMQProducer.sendToRawLogsQueue({
          name: parsedLog.name,
          ...logData,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
        });
      } catch (error) {
        this.logger.error(`Error parsing log: ${error}`);
        return log.blockNumber;
      }
    }
  }
}
