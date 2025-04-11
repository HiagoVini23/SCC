import dotenv from 'dotenv';
import path from 'path';

export function loadEnv(envFlag: string) {
  const envFile = `.env.${envFlag}`;
  const result = dotenv.config({ path: path.resolve(process.cwd(), envFile) });

  if (result.error) {
    console.warn(`⚠️  Could not load ${envFile}, falling back to default .env`);
    dotenv.config();
  } else {
    console.log(`✅ Loaded environment: ${envFile}`);
  }
}