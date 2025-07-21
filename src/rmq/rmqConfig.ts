import { ClientProvider, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

export const rabbitmqConfig = (
  configService: ConfigService,
  queueName: string,
): ClientProvider => ({
  transport: Transport.RMQ,
  options: {
    urls: [
      `amqp://${configService.get('rabbitmq.username')}:${configService.get('rabbitmq.password')}@${configService.get('rabbitmq.host')}:${configService.get('rabbitmq.port')}/${configService.get('rabbitmq.vhost')}`,
    ],
    queue: queueName,
    queueOptions: {
      durable: true,
    },
  },
});
