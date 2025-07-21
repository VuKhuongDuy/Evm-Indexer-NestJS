import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RabbitMQService {
  constructor(private readonly configService: ConfigService) {}

  getConfig() {
    return this.configService.get('rabbitmq');
  }
}
