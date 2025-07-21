import { ClientProvider, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

// Configuration for producers (sending messages)
export const rabbitmqProducerConfig = (
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

// Configuration for consumers (receiving messages with ACK)
export const rabbitmqConsumerConfig = (
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
    // Consumer-specific settings
    noAck: false,
    prefetchCount: 1,
    persistent: true,
  },
});

// Legacy function for backward compatibility
export const rabbitmqConfig = rabbitmqProducerConfig;
