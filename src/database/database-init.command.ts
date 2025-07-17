import { Command, CommandRunner } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Injectable()
@Command({
  name: 'init-db',
  description: 'Initialize the database with default configuration',
})
export class DatabaseInitCommand extends CommandRunner {
  constructor(private readonly databaseService: DatabaseService) {
    super();
  }

  async run(): Promise<void> {
    console.log('Starting database initialization...');
    try {
      await this.databaseService.initializeDatabase();
      console.log('Database initialization completed successfully!');
    } catch (error) {
      console.log('Database initialization failed:', error);
      process.exit(1);
    }
  }
} 