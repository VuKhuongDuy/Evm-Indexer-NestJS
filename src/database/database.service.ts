import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Config } from './entities/config.entity';
import { Order } from './entities/order.entity';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(
    @InjectRepository(Config)
    private readonly configRepository: Repository<Config>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async initializeDatabase(): Promise<void> {
    this.logger.log('Initializing database...');

    try {
      // Check if database is already initialized
      const existingConfig = await this.configRepository.findOne({
        where: { key: 'database_initialized' },
      });

      if (existingConfig) {
        this.logger.log('Database already initialized');
        return;
      }

      // Initialize default configuration
      await this.seedDefaultConfig();

      // Mark database as initialized
      await this.configRepository.save({
        key: 'database_initialized',
        value: new Date().toISOString(),
      });

      this.logger.log('Database initialization completed successfully');
    } catch (error) {
      this.logger.error('Failed to initialize database', error);
      throw error;
    }
  }

  private async seedDefaultConfig(): Promise<void> {
    const defaultConfigs = [
      { key: 'initializationBlock', value: '0' },
      { key: 'currentBlockHeight', value: '0' },
      { key: 'updateAt', value: new Date().toISOString() },
    ];

    for (const config of defaultConfigs) {
      const existing = await this.configRepository.findOne({
        where: { key: config.key },
      });

      if (!existing) {
        await this.configRepository.save(config);
        this.logger.log(`Created default config: ${config.key}`);
      }
    }
  }

  async resetDatabase(): Promise<void> {
    this.logger.log('Resetting database...');

    try {
      // Clear all config entries
      await this.configRepository.clear();
      this.logger.log('Database reset completed');
    } catch (error) {
      this.logger.error('Failed to reset database', error);
      throw error;
    }
  }

  async getConfig(key: string): Promise<string | null> {
    const config = await this.configRepository.findOne({
      where: { key },
    });
    return config?.value || null;
  }

  async setConfig(key: string, value: string): Promise<void> {
    await this.configRepository.save({ key, value });
  }

  async createOrder(order: Order): Promise<void> {
    const existingOrder = await this.orderRepository.findOne({
      where: { orderId: order.orderId },
    });
    if (!existingOrder) {
      await this.orderRepository.save(order);
    } else {
      throw new Error(`Order ${order.orderId} already exists`);
    }
  }

  async getOrders(
    limit?: number,
    offset?: number,
  ): Promise<{ orders: Order[]; total: number }> {
    // Using query builder to implement the logic from the SQL query
    // Adapted to current schema: using amountRemaining instead of amount, isActive instead of event_type

    // First, get the distinct orderIds that meet our criteria
    const distinctOrderIdsQuery = this.orderRepository
      .createQueryBuilder('order')
      .select('order.orderId')
      .where('order.isActive = :isActive', { isActive: true })
      // .andWhere('CAST(order.amountRemaining AS DECIMAL) > 0')
      .groupBy('order.orderId');

    // Get total count of distinct orders
    const total = await distinctOrderIdsQuery.getCount();

    // Use parameterized query to prevent SQL injection
    const orders = await this.orderRepository.query(
      `
      SELECT * FROM (
        SELECT DISTINCT ON (o."orderId") * 
        FROM public."order" o 
        ORDER BY o."orderId", o."createdAtBlockNumber" DESC
      ) latest_orders 
      WHERE "isActive" = $1 
      LIMIT $2 OFFSET $3
    `,
      [true, limit || 200, offset || 0],
    );

    return { orders, total };
  }

  async getOrder(orderId: string): Promise<Order | null> {
    return this.orderRepository.findOne({ where: { orderId: orderId } });
  }

  async updateOrder(order: Order): Promise<void> {
    const existingOrder = await this.orderRepository.findOne({
      where: { orderId: order.orderId },
    });
    if (existingOrder) {
      const updatedOrder = { ...existingOrder, ...order };
      await this.orderRepository.save(updatedOrder);
    }
  }

  async deleteOrder(orderId: string): Promise<void> {
    await this.orderRepository.delete(orderId);
  }

  async deleteManyOrders(fromHeight: number, toHeight: number): Promise<void> {
    await this.orderRepository.delete({
      createdAtBlockNumber: Between(fromHeight, toHeight),
    });
  }

  async clearOrders(): Promise<void> {
    await this.orderRepository.clear();
  }
}
