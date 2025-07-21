import { Controller } from '@nestjs/common';
import { ethers } from 'ethers';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AppConfigService } from '../config/config.service';
import { DatabaseService } from '../database/database.service';
import { marketAbi as CONTRACT_ABI } from '../config/market-abi';
import { RabbitMQProducer } from '@/rmq/rmq.producer';

@Controller()
export class DataUpdaterController {
  public provider: ethers.JsonRpcProvider;
  public contractAddress: string;
  public contract: ethers.Contract;

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
  async txHandler(@Payload() log: any) {
    console.log('Processing logs:');
    console.log(log);
    try {
      switch (log.name) {
        case 'OrderPlaced':
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
          await this.databaseService.createOrder(orderPlacedData);
          break;
        case 'OrderFilled':
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
          // Publish to RabbitMQ
          // await this.rabbitMQProducer.publishLog({
          //   ...eventFilledData,
          //   eventType: 'OrderFilled',
          //   blockNumber: log.blockNumber,
          //   transactionHash: log.transactionHash,
          // });
          break;
        case 'OrderCancelled':
          const orderCancelledData = {
            orderId: log.args.orderId.toString(),
            seller: log.args.seller,
          };
          await this.databaseService.deleteOrder(orderCancelledData.orderId);
          // Publish to RabbitMQ
          // await this.rabbitMQProducer.publishOrderCancelled({
          //   ...orderCancelledData,
          //   eventType: 'OrderCancelled',
          //   blockNumber: log.blockNumber,
          //   transactionHash: log.transactionHash,
          // });
          break;
        case 'OrderUpdated':
          const eventUpdatedData = {
            orderId: log.args.orderId.toString(),
            newPrice: log.args.newPrice.toString(),
            newMinOrderSize: log.args.newMinOrderSize.toString(),
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
          // Publish to RabbitMQ
          // await this.rabbitMQProducer.publishOrderUpdated({
          //   ...eventUpdatedData,
          //   eventType: 'OrderUpdated',
          //   blockNumber: log.blockNumber,
          //   transactionHash: log.transactionHash,
          // });
          break;
        default:
          console.log('Unknown event:', log.name);
      }
    } catch (error) {
      console.error('Error parsing log:', error);
    }
  }
}
