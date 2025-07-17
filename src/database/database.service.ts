import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Config } from './entities/config.entity';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(
    @InjectRepository(Config)
    private readonly configRepository: Repository<Config>,
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
      { key: 'fromBlock', value: '0' },
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
}
