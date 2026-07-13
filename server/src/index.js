require('dotenv').config();
const app = require('./app');
const { init } = require('./db/client');

const PORT = process.env.PORT || 3001;

init().then(() => {
  app.listen(PORT, () => {
    console.log(`Rate My President API server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`API docs: http://localhost:${PORT}/`);
  });
}).catch(err => {
  console.error('Failed to initialize DB', err);
  process.exit(1);
});
