import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AppConfigService } from '@/config/config.service';

@Injectable()
export class RabbitMQProducer {
  constructor(
    private readonly configService: AppConfigService,
    @Inject('RABBITMQ_SERVICE_RAW_LOGS')
    private readonly clientLogs: ClientProxy,
    @Inject('RABBITMQ_SERVICE_PROCESSED_EVENTS')
    private readonly clientProcessedEvents: ClientProxy,
  ) {}

  async sendToRawLogsQueue(message: any) {
    return await this.clientLogs
      .send(this.configService.rabbitmqQueueLog, message)
      .subscribe();
  }

  async publishLogToEventsQueue(message: any) {
    return await this.clientProcessedEvents
      .send(this.configService.rabbitmqQueueProcessedEvents, message)
      .subscribe();
  }
}
