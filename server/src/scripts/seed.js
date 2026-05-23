import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedsDir = path.join(__dirname, '../../seeds');

async function seed() {
  console.log('Running seeds...');
  
  const files = fs.readdirSync(seedsDir).filter(f => f.endsWith('.sql')).sort();
  
  for (const file of files) {
    const sql = fs.readFileSync(path.join(seedsDir, file), 'utf-8');
    console.log(`  ▸ ${file}`);
    await query(sql);
  }
  
  console.log('✓ Seeding complete.');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
