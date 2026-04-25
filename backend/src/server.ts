import 'dotenv/config';
import app from './app';

const PORT = parseInt(process.env.PORT ?? '3001', 10);

const server = app.listen(PORT, () => {
  console.log(`[server] Running on http://localhost:${PORT}`);
  console.log(`[server] Environment: ${process.env.NODE_ENV ?? 'development'}`);
});

// Graceful shutdown
const shutdown = (signal: string) => {
  console.log(`\n[server] Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('[server] HTTP server closed.');
    process.exit(0);
  });
  // Force exit after 10 seconds if connections remain open
  setTimeout(() => process.exit(1), 10_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
