import { Controller } from '@nestjs/common';
import { ethers } from 'ethers';
import {
  MessagePattern,
  Payload,
  Ctx,
  RmqContext,
} from '@nestjs/microservices';
import { AppConfigService } from '../config/config.service';
import { DatabaseService } from '../database/database.service';
import { marketAbi as CONTRACT_ABI } from '../config/market-abi';
import { RabbitMQProducer } from '@/rmq/rmq.producer';
import { IndexerLogger } from '../logger.service';

interface MessageMetadata {
  retryCount?: number;
  maxRetries?: number;
  originalTimestamp?: number;
}

@Controller()
export class DataUpdaterController {
  public provider: ethers.JsonRpcProvider;
  public contractAddress: string;
  public contract: ethers.Contract;
  private readonly maxRetries = 3;
  private readonly retryDelay = 5000; // 5 seconds

  constructor(
    private readonly configService: AppConfigService,
    private readonly databaseService: DatabaseService,
    private readonly rabbitMQProducer: RabbitMQProducer,
    private readonly logger: IndexerLogger,
  ) {
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

  @MessagePattern('indexer.raw_log.q')
  async txHandler(@Payload() log: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    // Extract message metadata
    let metadata: MessageMetadata = {
      retryCount: originalMsg.properties.headers?.retryCount || 0,
      maxRetries: this.maxRetries,
      originalTimestamp:
        originalMsg.properties.headers?.originalTimestamp || Date.now(),
    };

    this.logger.log(
      `Processing log (attempt ${metadata.retryCount + 1}/${this.maxRetries + 1}):`,
    );

    try {
      switch (log.name) {
        case 'OrderPlaced':
          await this.handleOrderPlaced(log);
          break;
        case 'OrderFilled':
          await this.handleOrderFilled(log);
          break;
        case 'OrderCancelled':
          await this.handleOrderCancelled(log);
          break;
        case 'OrderUpdated':
          await this.handleOrderUpdated(log);
          break;
        default:
          this.logger.warn(`Unknown event: ${log.name}`);
      }

      // Acknowledge the message only if all processing succeeds
      channel.ack(originalMsg);
      this.logger.log('Message acknowledged successfully');
    } catch (error) {
      this.logger.error(`Error processing log: ${error}`);

      // Check if we should retry or move to dead letter queue
      if (metadata.retryCount < this.maxRetries) {
        // Increment retry count and requeue with delay
        metadata = {
          ...originalMsg.properties.headers,
          retryCount: metadata.retryCount + 1,
          originalTimestamp: metadata.originalTimestamp,
        };

        // Reject and requeue with updated headers
        channel.nack(originalMsg, false, true);
        this.logger.log(
          `Message rejected and requeued (attempt ${metadata.retryCount + 1}/${this.maxRetries + 1})`,
        );

        // Optional: Add delay before next retry
        await this.delay(this.retryDelay);
      } else {
        // Max retries exceeded, move to dead letter queue
        channel.nack(originalMsg, false, false);
        this.logger.log(
          'Max retries exceeded, message moved to dead letter queue',
        );

        // Log the failed message for manual inspection
        this.logger.error(
          `Failed message details: ${JSON.stringify({
            log,
            error: error.message,
            retryCount: metadata.retryCount,
            originalTimestamp: metadata.originalTimestamp,
          })}`,
        );
      }
    }
  }

  private async handleOrderPlaced(log: any): Promise<void> {
    const orderPlacedData = {
      orderId: log.orderId.toString(),
      seller: log.seller,
      tokenToSell: log.tokenToSell,
      tokenToPay: log.tokenToPay,
      amountToSell: log.amountToSell.toString(),
      amountRemaining: '0',
      pricePerToken: log.pricePerToken.toString(),
      minOrderSize: log.minOrderSize.toString(),
      isActive: true,
      createdAtBlockNumber: log.blockNumber,
    };

    // Publish to RabbitMQ
    await this.rabbitMQProducer.publishLogToEventsQueue({
      orderId: orderPlacedData.orderId,
      seller: orderPlacedData.seller,
      transactionHash: log.transactionHash,
    });

    // Save to database
    await this.databaseService.createOrder(orderPlacedData);
    this.logger.log(
      `Block ${log.blockNumber} handled. Order placed data saved to database`,
    );
  }

  private async handleOrderFilled(log: any): Promise<void> {
    const eventFilledData = {
      orderId: log.orderId.toString(),
      buyer: log.buyer,
      amountFilled: log.amountFilled.toString(),
      paymentAmount: log.paymentAmount.toString(),
    };

    const existingOrder = await this.databaseService.getOrder(
      eventFilledData.orderId,
    );

    if (!existingOrder) {
      throw new Error(`Order not found: ${eventFilledData.orderId}`);
    }

    await this.databaseService.createOrder({
      ...existingOrder,
      amountRemaining: (
        BigInt(existingOrder.amountToSell) -
        BigInt(eventFilledData.amountFilled)
      ).toString(),
      createdAtBlockNumber: log.blockNumber,
    });

    await this.rabbitMQProducer.publishLogToEventsQueue({
      orderId: eventFilledData.orderId,
      seller: existingOrder.seller,
      transactionHash: log.transactionHash,
    });
    this.logger.log(
      `Block ${log.blockNumber} handled. Order filled data saved to database`,
    );
  }

  private async handleOrderCancelled(log: any): Promise<void> {
    const existingOrder = await this.databaseService.getOrder(
      log.orderId.toString(),
    );

    await this.databaseService.createOrder({
      ...existingOrder,
      isActive: false,
      createdAtBlockNumber: log.blockNumber,
    });

    await this.rabbitMQProducer.publishLogToEventsQueue({
      orderId: log.orderId.toString(),
      seller: existingOrder.seller,
      transactionHash: log.transactionHash,
    });
    this.logger.log(
      `Block ${log.blockNumber} handled. Order cancelled data saved to database`,
    );
  }

  private async handleOrderUpdated(log: any): Promise<void> {
    const eventUpdatedData = {
      orderId: log.orderId.toString(),
      newPrice: log.newPrice.toString(),
      newMinOrderSize: log.newMinOrderSize.toString(),
    };

    const order = await this.databaseService.getOrder(eventUpdatedData.orderId);

    if (!order) {
      throw new Error(`Order not found: ${eventUpdatedData.orderId}`);
    }

    await this.databaseService.createOrder({
      ...order,
      pricePerToken: eventUpdatedData.newPrice,
      minOrderSize: eventUpdatedData.newMinOrderSize,
      createdAtBlockNumber: log.blockNumber,
    });

    await this.rabbitMQProducer.publishLogToEventsQueue({
      orderId: eventUpdatedData.orderId,
      seller: order.seller,
      transactionHash: log.transactionHash,
    });
    this.logger.log(
      `Block ${log.blockNumber} handled. Order updated data saved to database`,
    );
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
