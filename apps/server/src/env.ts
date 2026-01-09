import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env from project root
config({ path: resolve(process.cwd(), '../../.env') });

export const env = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',

  // Validate required env vars
  validate() {
    if (!this.OPENAI_API_KEY) {
      console.error('ERROR: OPENAI_API_KEY is required in .env file');
      process.exit(1);
    }
    if (!this.OPENAI_API_KEY.startsWith('sk-')) {
      console.warn('WARNING: OPENAI_API_KEY does not start with sk- prefix');
    }
  }
};
