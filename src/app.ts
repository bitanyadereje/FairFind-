import express from 'express';
import cron from 'node-cron';
import { exec } from 'child_process';
import productRoutes from './routes/api/products.routes';
import { errorHandler } from './middleware/error.middleware';
import authRoutes from './routes/api/auth.routes';

const app = express();

// Middleware
app.use(express.json());

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);        // <-- Add this line
app.use('/api/products', productRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'FairFind API is running.',
    endpoints: {
      products: '/api/products',
      search: '/api/products?q=...',
      health: '/health',
    },
  });
});

// ---------- Cron Jobs (Automated Scraping & Processing) ----------

// Run the scraper every 30 minutes
cron.schedule('*/30 * * * *', () => {
  console.log(`[${new Date().toISOString()}] 🔄 Running Telegram scraper...`);
  exec('npx ts-node src/scrapers/telegram-web-scraper.ts', (error, stdout, stderr) => {
    if (error) {
      console.error(`[${new Date().toISOString()}] ❌ Scraper error:`, error.message);
      return;
    }
    if (stderr) console.warn(`[${new Date().toISOString()}] ⚠️ Scraper stderr:`, stderr);
    console.log(`[${new Date().toISOString()}] ✅ Scraper finished`);
  });
});

// Run the processor every 10 minutes
cron.schedule('*/10 * * * *', () => {
  console.log(`[${new Date().toISOString()}] 🔄 Running product processor...`);
  exec('npx ts-node src/scripts/process-raw-feeds.ts', (error, stdout, stderr) => {
    if (error) {
      console.error(`[${new Date().toISOString()}] ❌ Processor error:`, error.message);
      return;
    }
    if (stderr) console.warn(`[${new Date().toISOString()}] ⚠️ Processor stderr:`, stderr);
    console.log(`[${new Date().toISOString()}] ✅ Processor finished`);
  });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;