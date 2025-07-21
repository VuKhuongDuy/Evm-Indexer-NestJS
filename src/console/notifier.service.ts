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

  @MessagePattern('indexer.processed_events.q')
  async handler(@Payload() event: any) {
    console.log('Notifier:');
    console.log(event);
    // TODO: Implement notifier
  }
}
