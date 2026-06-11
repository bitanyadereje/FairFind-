import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is missing');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }, // required for Neon
});

pool.connect((err) => {
  if (err) console.error('❌ Database connection failed:', err);
  else console.log('✅ Connected to PostgreSQL');
});

export default pool;