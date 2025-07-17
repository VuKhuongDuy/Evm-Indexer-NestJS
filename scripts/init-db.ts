import { Client } from 'pg';

async function initializeDatabase(): Promise<void> {
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    user: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'evm_indexer',
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected to database successfully');

    // Check if the config table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'config'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.log(
        'Config table does not exist. Database needs initialization.',
      );
      process.exit(1); // Exit with error code to trigger initialization
    }

    // Check if database is already initialized
    const initCheck = await client.query(`
      SELECT value FROM config WHERE key = 'database_initialized'
    `);

    if (initCheck.rows.length === 0) {
      console.log('Database not initialized. Needs initialization.');
      process.exit(1); // Exit with error code to trigger initialization
    }

    console.log('Database is already initialized.');
    process.exit(0); // Exit successfully
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

initializeDatabase(); 