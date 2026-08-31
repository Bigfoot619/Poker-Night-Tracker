import { app } from '../backend/src/app.js';
import { migrationsReady } from '../backend/src/db/index.js';

export default async function handler(req, res) {
  await migrationsReady;
  app(req, res);
}
