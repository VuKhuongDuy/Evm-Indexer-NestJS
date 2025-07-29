import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database/database.service';

@Injectable()
export class AppService {
  constructor(private readonly databaseService: DatabaseService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getOrders(limit: number = 200, offset: number = 0) {
    return this.databaseService.getOrders(limit, offset);
  }
}
