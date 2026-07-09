// src/config/env.ts
import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const DATABASE_URL = process.env.DATABASE_URL;
export const GROQ_API_KEY = process.env.GROQ_API_KEY;
export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
export const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-me';
export const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';


// Optionally, validate required variables
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is missing');
  process.exit(1);
}