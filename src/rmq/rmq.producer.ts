import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AppConfigService } from '@/config/config.service';
import { IndexerLogger } from '../logger.service';

@Injectable()
export class RabbitMQProducer {
  constructor(
    private readonly configService: AppConfigService,
    @Inject('RABBITMQ_SERVICE_RAW_LOGS')
    private readonly clientLogs: ClientProxy,
    @Inject('RABBITMQ_SERVICE_PROCESSED_EVENTS')
    private readonly clientProcessedEvents: ClientProxy,
    private readonly logger: IndexerLogger,
  ) {}

  async sendToRawLogsQueue(message: any) {
    try {
      return await this.clientLogs
        .send(this.configService.rabbitmqQueueLog, message)
        .subscribe();
    } catch (error) {
      this.logger.error(`Error sending to raw logs queue: ${error}`);
    }
  }

  async publishLogToEventsQueue(message: any) {
    try {
      return await this.clientProcessedEvents
        .send(this.configService.rabbitmqQueueProcessedEvents, message)
        .subscribe();
    } catch (error) {
      this.logger.error(`Error sending to processed events queue: ${error}`);
    }
  }
}
