import app from './app.js';
import { config } from './config/index.js';
import { initDb } from './database/db.js';
import { runMigrations } from './database/migrate.js';

async function startServer() {
  try {
    await initDb();
    await runMigrations();

    app.listen(config.port, () => {
      console.log(`🚀 RentLoop API Server running on port ${config.port} (${config.nodeEnv})`);
      console.log(`🔗 Health check available at: http://localhost:${config.port}/api/health`);
    });
  } catch (err) {
    console.error('Failed to start RentLoop server:', err);
    process.exit(1);
  }
}

startServer();
