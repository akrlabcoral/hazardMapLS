import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, '../../migrations');

async function migrate() {
  console.log('Running migrations...');
  
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    console.log(`  ▸ ${file}`);
    await query(sql);
  }
  
  console.log('✓ Migrations complete.');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
