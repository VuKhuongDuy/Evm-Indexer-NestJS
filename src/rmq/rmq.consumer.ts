import { Injectable } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Injectable()
export class RabbitMQConsumer {
  @MessagePattern('nothing')
  async handleLogs(@Payload() data: any) {
    console.log('Processing logs:', data);
    // Add your processing logic here
    return { processed: true, event: 'logs' };
  }
}
