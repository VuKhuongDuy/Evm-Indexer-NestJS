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
    const metadata: MessageMetadata = {
      retryCount: originalMsg.properties.headers?.retryCount || 0,
      maxRetries: this.maxRetries,
      originalTimestamp:
        originalMsg.properties.headers?.originalTimestamp || Date.now(),
    };

    console.log(
      `Processing log (attempt ${metadata.retryCount + 1}/${this.maxRetries + 1}):`,
    );
    console.log(log);

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
          console.log('Unknown event:', log.name);
      }

      // Acknowledge the message only if all processing succeeds
      channel.ack(originalMsg);
      console.log('Message acknowledged successfully');
    } catch (error) {
      console.error('Error processing log:', error);

      // Check if we should retry or move to dead letter queue
      if (metadata.retryCount < this.maxRetries) {
        // Increment retry count and requeue with delay
        const updatedHeaders = {
          ...originalMsg.properties.headers,
          retryCount: metadata.retryCount + 1,
          originalTimestamp: metadata.originalTimestamp,
        };

        // Reject and requeue with updated headers
        channel.nack(originalMsg, false, true);
        console.log(
          `Message rejected and requeued (attempt ${metadata.retryCount + 1}/${this.maxRetries + 1})`,
        );

        // Optional: Add delay before next retry
        await this.delay(this.retryDelay);
      } else {
        // Max retries exceeded, move to dead letter queue
        channel.nack(originalMsg, false, false);
        console.log('Max retries exceeded, message moved to dead letter queue');

        // Log the failed message for manual inspection
        console.error('Failed message details:', {
          log,
          error: error.message,
          retryCount: metadata.retryCount,
          originalTimestamp: metadata.originalTimestamp,
        });
      }
    }
  }

  private async handleOrderPlaced(log: any): Promise<void> {
    const orderPlacedData = {
      orderId: log.args.orderId.toString(),
      seller: log.args.seller,
      tokenToSell: log.args.tokenToSell,
      tokenToPay: log.args.tokenToPay,
      amountToSell: log.args.amountToSell.toString(),
      amountRemaining: '0',
      pricePerToken: log.args.pricePerToken.toString(),
      minOrderSize: log.args.minOrderSize.toString(),
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
  }

  private async handleOrderFilled(log: any): Promise<void> {
    const eventFilledData = {
      orderId: log.args.orderId.toString(),
      buyer: log.args.buyer,
      amountFilled: log.args.amountFilled.toString(),
      paymentAmount: log.args.paymentAmount.toString(),
    };

    const existingOrder = await this.databaseService.getOrder(
      eventFilledData.orderId,
    );

    if (!existingOrder) {
      throw new Error(`Order not found: ${eventFilledData.orderId}`);
    }

    await this.databaseService.updateOrder({
      ...existingOrder,
      amountRemaining: (
        BigInt(existingOrder.amountToSell) -
        BigInt(eventFilledData.amountFilled)
      ).toString(),
    });

    // Publish to RabbitMQ (uncomment if needed)
    // await this.rabbitMQProducer.publishLog({
    //   ...eventFilledData,
    //   eventType: 'OrderFilled',
    //   blockNumber: log.blockNumber,
    //   transactionHash: log.transactionHash,
    // });
  }

  private async handleOrderCancelled(log: any): Promise<void> {
    const orderCancelledData = {
      orderId: log.args.orderId.toString(),
      seller: log.args.seller,
    };

    await this.databaseService.deleteOrder(orderCancelledData.orderId);

    // Publish to RabbitMQ (uncomment if needed)
    // await this.rabbitMQProducer.publishOrderCancelled({
    //   ...orderCancelledData,
    //   eventType: 'OrderCancelled',
    //   blockNumber: log.blockNumber,
    //   transactionHash: log.transactionHash,
    // });
  }

  private async handleOrderUpdated(log: any): Promise<void> {
    const eventUpdatedData = {
      orderId: log.args.orderId.toString(),
      newPrice: log.args.newPrice.toString(),
      newMinOrderSize: log.args.newMinOrderSize.toString(),
    };

    const order = await this.databaseService.getOrder(eventUpdatedData.orderId);

    if (!order) {
      throw new Error(`Order not found: ${eventUpdatedData.orderId}`);
    }

    await this.databaseService.updateOrder({
      ...order,
      pricePerToken: eventUpdatedData.newPrice,
      minOrderSize: eventUpdatedData.newMinOrderSize,
    });

    // Publish to RabbitMQ (uncomment if needed)
    // await this.rabbitMQProducer.publishOrderUpdated({
    //   ...eventUpdatedData,
    //   eventType: 'OrderUpdated',
    //   blockNumber: log.blockNumber,
    //   transactionHash: log.transactionHash,
    // });
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
