import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AppConfigService } from '@/config/config.service';
import { IndexerLogger } from '../logger.service';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class RabbitMQProducer {
  constructor(
    private readonly configService: AppConfigService,
    @Inject('RABBITMQ_SERVICE_RAW_LOGS')
    private readonly clientLogs: ClientProxy,
    @Inject('RABBITMQ_SERVICE_PROCESSED_EVENTS')
    private readonly clientProcessedEvents: ClientProxy,
    private readonly logger: IndexerLogger,
    private readonly metricsService: MetricsService,
  ) {}

  async sendToRawLogsQueue(message: any) {
    try {
      const result = await this.clientLogs
        .send(this.configService.rabbitmqQueueLog, message)
        .subscribe();
      const randomInt = Math.floor(Math.random() * 100); // Generates a random number between 0 and 99
      this.metricsService.setLogsQueueSize(randomInt);
      return result;
    } catch (error) {
      this.logger.error(`Error sending to raw logs queue: ${error}`);
    }
  }

  async publishLogToEventsQueue(message: any) {
    try {
      const result = await this.clientProcessedEvents
        .send(this.configService.rabbitmqQueueProcessedEvents, message)
        .subscribe();
      const randomInt = Math.floor(Math.random() * 100); // Generates a random number between 0 and 99
      this.metricsService.setBacklogQueueSize(randomInt);
      return result;
    } catch (error) {
      this.logger.error(`Error sending to processed events queue: ${error}`);
    }
  }
}
