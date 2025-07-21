import { Command, CommandRunner } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { sleep } from '../shared/utils';
import { AppConfigService } from '../config/config.service';
import { DatabaseService } from '../database/database.service';
import { marketAbi as CONTRACT_ABI } from '../config/market-abi';
import { RabbitMQProducer } from '../rmq/rmq.producer';

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
    const fromBlockValue = await this.databaseService.getConfig('fromBlock'); // Get the last indexed block from the database
    const startingBlock = parseInt(fromBlockValue || '0');
    if (!startingBlock) {
      throw new Error('Starting block not found in the database');
    }

    const batchSize = 10;
    let currentBlock = startingBlock;

    while (true) {
      const latestBlockNumber = await this.provider.getBlockNumber();
      const startTime = Date.now();

      const endBlock =
        latestBlockNumber - currentBlock < batchSize
          ? latestBlockNumber
          : currentBlock + batchSize;
      if (endBlock < currentBlock) {
        currentBlock = endBlock;
      }

      console.log({ fromBlock: currentBlock, toBlock: endBlock });
      const logs = await this.provider.getLogs({
        fromBlock: currentBlock,
        toBlock: endBlock,
        address: [this.contractAddress],
      });

      if (logs.length > 0) {
        await this.pushLogsToQueue(logs);
      }

      currentBlock = endBlock + 1;

      if (endBlock >= latestBlockNumber - 1) {
        await sleep(1000);
      }

      if (currentBlock - startingBlock >= batchSize) {
        await this.databaseService.setConfig(
          'fromBlock',
          currentBlock.toString(),
        );
      }

      const timeTaken = Date.now() - startTime;
      if (logs.length > 0) {
        console.log(
          `Time taken to handle ${logs.length} logs: ${timeTaken} ms`,
        );
      }
    }
  }

  async pushLogsToQueue(logs: any[]): Promise<void> {
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
            console.log('Unknown event:', parsedLog.name);
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
        console.error('Error parsing log:', error);
      }
    }
  }
}
