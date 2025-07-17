-- Database initialization script for EVM Indexer
-- This script runs when PostgreSQL container starts for the first time

-- Create config table if it doesn't exist
CREATE TABLE IF NOT EXISTS config (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT NOT NULL
);

-- Insert default configuration values
INSERT INTO config (key, value) VALUES
    ('fromBlock', '0'),
    ('lastProcessedBlock', '0'),
    ('indexerStatus', 'stopped'),
    ('createdAt', NOW()::TEXT),
    ('database_initialized', NOW()::TEXT)
ON CONFLICT (key) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_config_key ON config(key);

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'Database initialization completed successfully';
END $$; 