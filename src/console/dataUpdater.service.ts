import { Controller } from '@nestjs/common';
import { ethers } from 'ethers';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AppConfigService } from '../config/config.service';
import { DatabaseService } from '../database/database.service';
import { marketAbi as CONTRACT_ABI } from '../config/market-abi';

@Controller()
export class DataUpdaterController {
  public provider: ethers.JsonRpcProvider;
  public contractAddress: string;
  public contract: ethers.Contract;

  constructor(
    private readonly configService: AppConfigService,
    private readonly databaseService: DatabaseService,
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
  async txHandler(@Payload() data: any) {
    console.log('Processing logs:');
    console.log(data);
    // for (const log of data) {
    // try {
    // const parsedLog = this.contract.interface.parseLog(log);
    // // Publish to RabbitMQ
    // await this.rabbitMQProducer.publishLog({
    //   ...parsedLog,
    //   blockNumber: log.blockNumber,
    //   transactionHash: log.transactionHash,
    // });
    // switch (parsedLog.name) {
    //   case 'OrderPlaced':
    //     const orderPlacedData = {
    //       orderId: parsedLog.args.orderId.toString(),
    //       seller: parsedLog.args.seller,
    //       tokenToSell: parsedLog.args.tokenToSell,
    //       tokenToPay: parsedLog.args.tokenToPay,
    //       amountToSell: parsedLog.args.amountToSell.toString(),
    //       amountRemaining: '0',
    //       pricePerToken: parsedLog.args.pricePerToken.toString(),
    //       minOrderSize: parsedLog.args.minOrderSize.toString(),
    //       isActive: true,
    //       createdAtBlockNumber: log.blockNumber,
    //     };
    //     // Publish to RabbitMQ
    //     await this.rabbitMQProducer.publishLog({
    //       ...orderPlacedData,
    //       eventType: parsedLog.name,
    //       blockNumber: log.blockNumber,
    //       transactionHash: log.transactionHash,
    //     });
    //     break;
    //   case 'OrderFilled':
    //     const eventFilledData = {
    //       orderId: parsedLog.args.orderId.toString(),
    //       buyer: parsedLog.args.buyer,
    //       amountFilled: parsedLog.args.amountFilled.toString(),
    //       paymentAmount: parsedLog.args.paymentAmount.toString(),
    //     };
    //     const existingOrder = await this.databaseService.getOrder(
    //       eventFilledData.orderId,
    //     );
    //     if (!existingOrder) {
    //       console.log('Order not found:', eventFilledData.orderId);
    //       break;
    //     }
    //     await this.databaseService.updateOrder({
    //       ...existingOrder,
    //       amountRemaining: (
    //         BigInt(existingOrder.amountToSell) -
    //         BigInt(eventFilledData.amountFilled)
    //       ).toString(),
    //     });
    //     // Publish to RabbitMQ
    //     await this.rabbitMQProducer.publishLog({
    //       ...eventFilledData,
    //       eventType: 'OrderFilled',
    //       blockNumber: log.blockNumber,
    //       transactionHash: log.transactionHash,
    //     });
    //     break;
    //   case 'OrderCancelled':
    //     const orderCancelledData = {
    //       orderId: parsedLog.args.orderId.toString(),
    //       seller: parsedLog.args.seller,
    //     };
    //     console.log('OrderCancelled id:', orderCancelledData.orderId);
    //     await this.databaseService.deleteOrder(orderCancelledData.orderId);
    //     // Publish to RabbitMQ
    //     await this.rabbitMQProducer.publishOrderCancelled({
    //       ...orderCancelledData,
    //       eventType: 'OrderCancelled',
    //       blockNumber: log.blockNumber,
    //       transactionHash: log.transactionHash,
    //     });
    //     break;
    //   case 'OrderUpdated':
    //     const eventUpdatedData = {
    //       orderId: parsedLog.args.orderId.toString(),
    //       newPrice: parsedLog.args.newPrice.toString(),
    //       newMinOrderSize: parsedLog.args.newMinOrderSize.toString(),
    //     };
    //     const order = await this.databaseService.getOrder(
    //       eventUpdatedData.orderId,
    //     );
    //     if (!order) {
    //       console.log('Order not found:', eventUpdatedData.orderId);
    //       break;
    //     }
    //     await this.databaseService.updateOrder({
    //       ...order,
    //       pricePerToken: eventUpdatedData.newPrice,
    //       minOrderSize: eventUpdatedData.newMinOrderSize,
    //     });
    //     // Publish to RabbitMQ
    //     await this.rabbitMQProducer.publishOrderUpdated({
    //       ...eventUpdatedData,
    //       eventType: 'OrderUpdated',
    //       blockNumber: log.blockNumber,
    //       transactionHash: log.transactionHash,
    //     });
    //     break;
    //   default:
    //     console.log('Unknown event:', parsedLog.name);
    // }
    // } catch (error) {
    //   console.error('Error parsing log:', error);
    // }
    // }
  }
}
