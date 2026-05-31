import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../..');

interface AppConfig
{
  dataDir: string;
}

const configPath = path.join(PROJECT_ROOT, 'config.json');
const raw = fs.readFileSync(configPath, 'utf-8');
const appConfig: AppConfig = JSON.parse(raw);

export const dataDir = path.resolve(PROJECT_ROOT, appConfig.dataDir);
export const dbPath = path.join(dataDir, 'data', 'vault.db');
export const backupDir = path.join(dataDir, 'backup');
export const dumpPath = path.join(dataDir, 'backup', 'vault_dump.sql');
export const imagesDir = path.join(dataDir, 'cache', 'images');
