import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class RabbitMQProducer {
  constructor(
    @Inject('RABBITMQ_SERVICE_RAW_LOGS')
    private readonly clientLogs: ClientProxy,
    @Inject('RABBITMQ_SERVICE_PROCESSED_EVENTS')
    private readonly clientProcessedEvents: ClientProxy,
  ) {}

  async sendToRawLogsQueue(message: any) {
    return await this.clientLogs.send('indexer.raw_log.q', message).subscribe();
  }

  async publishLogToEventsQueue(message: any) {
    return await this.clientProcessedEvents
      .send('indexer.processed_events.q', message)
      .toPromise();
  }
}
