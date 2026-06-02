import { Pool } from 'pg';
import dotenv from 'dotenv';

// 1. Load environment variables from .env
dotenv.config();

// 2. Create a connection pool using the variables
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 10,                     // maximum number of clients in the pool
  idleTimeoutMillis: 30000,    // close idle clients after 30 seconds
});

// 3. Optional: test the connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection failed:', err.stack);
  } else {
    console.log('✅ Connected to PostgreSQL');
    release();
  }
});

// 4. Export the pool so other files can run queries
export default pool;