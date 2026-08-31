import { app } from './app.js';
import { migrationsReady } from './db/index.js';

const PORT = process.env.PORT || 4000;

migrationsReady
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Poker Night Tracker API listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to run database migrations:', err);
    process.exit(1);
  });
