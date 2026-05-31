import { execSync } from 'child_process';
import fs from 'fs';
import { dbPath, dumpPath, backupDir } from '../lib/config';

if (!fs.existsSync(backupDir))
{
  fs.mkdirSync(backupDir, { recursive: true });
}

if (!fs.existsSync(dbPath))
{
  console.error("Local database file not found to save.");
  process.exit(1);
}

try
{
  execSync(`sqlite3 ${dbPath} .dump > ${dumpPath}`);
  console.log(`Vault successfully backed up to ${dumpPath}.`);
}
catch (error)
{
  console.error("Failed to dump database:", error);
}
