import { Command, CommandRunner } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { sleep } from '../shared/utils';
import { AppConfigService } from '../config/config.service';
import { DatabaseService } from '../database/database.service';
import { marketAbi as CONTRACT_ABI } from '../config/market-abi';

@Injectable()
@Command({
  name: 'run-indexer',
  description: 'Run the indexer',
})
export class IndexerService extends CommandRunner {
  public provider: ethers.JsonRpcProvider;
  public contractAddress: string;
  public contract: ethers.Contract;

  constructor(
    private readonly configService: AppConfigService,
    private readonly databaseService: DatabaseService,
  ) {
    super();
    this.provider = new ethers.JsonRpcProvider(
      this.configService.networkRpcUrl,
    );
    this.contractAddress = this.configService.contractAddress;
    this.contract = new ethers.Contract(
      this.contractAddress,
      CONTRACT_ABI,
      this.provider,
    );
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
        await this.txHandler(logs);
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

  async txHandler(logs: any[]): Promise<void> {
    for (const log of logs) {
      try {
        const parsedLog = this.contract.interface.parseLog(log);

        switch (parsedLog.name) {
          case 'OrderPlaced':
            const orderPlacedData = {
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
            console.log('OrderPlaced id:', orderPlacedData.orderId);
            await this.databaseService.createOrder(orderPlacedData);
            break;

          case 'OrderFilled':
            const eventFilledData = {
              orderId: parsedLog.args.orderId.toString(),
              buyer: parsedLog.args.buyer,
              amountFilled: parsedLog.args.amountFilled.toString(),
              paymentAmount: parsedLog.args.paymentAmount.toString(),
            };
            console.log('OrderFilled id:', eventFilledData.orderId);
            const existingOrder = await this.databaseService.getOrder(
              eventFilledData.orderId,
            );
            if (!existingOrder) {
              console.log('Order not found:', eventFilledData.orderId);
              break;
            }
            await this.databaseService.updateOrder({
              ...existingOrder,
              amountRemaining: (
                BigInt(existingOrder.amountToSell) -
                BigInt(eventFilledData.amountFilled)
              ).toString(),
            });

            break;

          case 'OrderCancelled':
            const orderCancelledData = {
              orderId: parsedLog.args.orderId.toString(),
              seller: parsedLog.args.seller,
            };
            console.log('OrderCancelled id:', orderCancelledData.orderId);
            await this.databaseService.deleteOrder(orderCancelledData.orderId);
            break;

          case 'OrderUpdated':
            const eventUpdatedData = {
              orderId: parsedLog.args.orderId.toString(),
              newPrice: parsedLog.args.newPrice.toString(),
              newMinOrderSize: parsedLog.args.newMinOrderSize.toString(),
            };
            const order = await this.databaseService.getOrder(
              eventUpdatedData.orderId,
            );
            if (!order) {
              console.log('Order not found:', eventUpdatedData.orderId);
              break;
            }
            await this.databaseService.updateOrder({
              ...order,
              pricePerToken: eventUpdatedData.newPrice,
              minOrderSize: eventUpdatedData.newMinOrderSize,
            });
            break;

          default:
            console.log('Unknown event:', parsedLog.name);
        }
      } catch (error) {
        console.error('Error parsing log:', error);
      }
    }
  }
}
