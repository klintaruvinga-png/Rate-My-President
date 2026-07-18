require('dotenv').config();
const app = require('./app');
const { init, closeDatabase } = require('./db/client');

const PORT = process.env.PORT || 3001;

let server = null;

init().then(() => {
  server = app.listen(PORT, () => {
    console.log(`Rate My President API server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`API docs: http://localhost:${PORT}/`);
  });
}).catch(err => {
  console.error('Failed to initialize DB', err);
  process.exit(1);
});

function shutdown(signal) {
  console.log(`\n${signal} received, shutting down gracefully...`);

  if (server) {
    server.close((err) => {
      if (err) {
        console.error('Error closing server:', err);
      }

      try {
        closeDatabase();
        console.log('Database closed successfully');
        process.exit(err ? 1 : 0);
      } catch (dbErr) {
        console.error('Error closing database:', dbErr);
        process.exit(1);
      }
    });

    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  } else {
    try {
      closeDatabase();
      process.exit(0);
    } catch (dbErr) {
      console.error('Error closing database:', dbErr);
      process.exit(1);
    }
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
