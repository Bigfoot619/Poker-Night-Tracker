// Tests always run against a dedicated database so they never touch dev/prod data,
// regardless of what DATABASE_URL points to via .env.
process.env.DATABASE_URL = 'postgresql://postgres:poker@localhost:5432/poker_test';
