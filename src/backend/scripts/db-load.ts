import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { dbPath, dumpPath, backupDir } from '../lib/config';

if (!fs.existsSync(backupDir))
{
  fs.mkdirSync(backupDir, { recursive: true });
}

if (!fs.existsSync(dumpPath))
{
  console.log("No existing dump found. Ready for fresh database initialization.");
  process.exit(0);
}

try
{
  if (fs.existsSync(dbPath))
  {
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `vault_backup_${ts}.db`);
    fs.copyFileSync(dbPath, backupPath);
    console.log(`Live database backed up to ${path.basename(backupPath)} before restore.`);
    fs.unlinkSync(dbPath);
  }
  execSync(`sqlite3 ${dbPath} < ${dumpPath}`);
  console.log("Vault binary successfully hydrated from SQL history.");
}
catch (error)
{
  console.error("Failed to load database from dump:", error);
}
