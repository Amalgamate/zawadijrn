import { Request, Response } from 'express';
import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

// ── Config ────────────────────────────────────────────────────────────────────
const BACKUP_DIR = path.resolve(process.cwd(), '..', 'backups', 'db');
const RETENTION_DAYS = 14;

// ── Helpers ───────────────────────────────────────────────────────────────────
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

function getTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
    `_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`
  );
}

function parseConnectionString(dbUrl: string) {
  const url = new URL(dbUrl);
  return {
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    host: url.hostname,
    port: url.port || '5432',
    database: url.pathname.replace(/^\//, '').split('?')[0],
  };
}

function listBackupFiles() {
  ensureBackupDir();
  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith('zawadi_sms_') && (f.endsWith('.sql.gz') || f.endsWith('.sql')))
    .map((f) => {
      const fp = path.join(BACKUP_DIR, f);
      const stat = fs.statSync(fp);
      // Parse date from filename: zawadi_sms_YYYY-MM-DD_HH-MM-SS.sql.gz
      const match = f.match(/zawadi_sms_(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2})/);
      let createdAt = stat.mtime;
      if (match) {
        const [, datePart, timePart] = match;
        const isoStr = `${datePart}T${timePart.replace(/-/g, ':')}`;
        createdAt = new Date(isoStr);
      }
      return {
        id: f,
        filename: f,
        date: createdAt.toLocaleString('en-US', {
          month: 'short', day: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit', hour12: true,
        }),
        size: formatSize(stat.size),
        sizeBytes: stat.size,
        type: f.includes('_auto_') ? 'Auto' : 'Manual',
        createdAt: createdAt.toISOString(),
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return files;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function pruneOldBackups() {
  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith('zawadi_sms_'));
  for (const f of files) {
    const fp = path.join(BACKUP_DIR, f);
    if (fs.statSync(fp).mtimeMs < cutoff) {
      fs.unlinkSync(fp);
    }
  }
}

// ── Controller ────────────────────────────────────────────────────────────────
export class BackupController {
  /**
   * GET /api/backup
   * Returns list of all backup files + summary stats
   */
  async listBackups(_req: Request, res: Response) {
    try {
      const backups = listBackupFiles();
      const lastBackup = backups[0] ?? null;
      res.json({
        success: true,
        data: {
          backups,
          total: backups.length,
          lastBackupDate: lastBackup?.createdAt ?? null,
          lastBackupFormatted: lastBackup?.date ?? 'Never',
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/backup
   * Creates a new manual backup
   */
  async createBackup(req: Request, res: Response) {
    try {
      const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
      if (!dbUrl) {
        return res.status(500).json({ success: false, error: 'DATABASE_URL not configured' });
      }

      // Check pg_dump is available
      try {
        execSync('pg_dump --version', { stdio: 'pipe' });
      } catch {
        return res.status(500).json({
          success: false,
          error: 'pg_dump not found. Install PostgreSQL client tools on the server.',
        });
      }

      ensureBackupDir();

      const conn = parseConnectionString(dbUrl);
      const timestamp = getTimestamp();
      const filename = `zawadi_sms_${timestamp}.sql.gz`;
      const outputPath = path.join(BACKUP_DIR, filename);

      const cmd =
        `pg_dump -h ${conn.host} -p ${conn.port} -U ${conn.user} -d ${conn.database}` +
        ` --no-password --format=plain --no-acl --no-owner | gzip > "${outputPath}"`;

      const env = { ...process.env, PGPASSWORD: conn.password };
      const t0 = Date.now();

      await execAsync(cmd, { env });

      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      const stat = fs.statSync(outputPath);

      pruneOldBackups();

      const backup = {
        id: filename,
        filename,
        date: new Date().toLocaleString('en-US', {
          month: 'short', day: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit', hour12: true,
        }),
        size: formatSize(stat.size),
        sizeBytes: stat.size,
        type: 'Manual',
        createdAt: new Date().toISOString(),
      };

      res.json({ success: true, data: backup, message: `Backup created in ${elapsed}s` });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/backup/download/:filename
   * Streams a backup file to the client
   */
  async downloadBackup(req: Request, res: Response) {
    try {
      const { filename } = req.params;

      // Security: only allow valid backup filenames
      if (!/^zawadi_sms_[\w-]+(\.(sql|gz))+$/.test(filename)) {
        return res.status(400).json({ success: false, error: 'Invalid filename' });
      }

      const filePath = path.join(BACKUP_DIR, filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, error: 'Backup file not found' });
      }

      const stat = fs.statSync(filePath);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/gzip');
      res.setHeader('Content-Length', stat.size);

      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * DELETE /api/backup/:filename
   * Deletes a specific backup file
   */
  async deleteBackup(req: Request, res: Response) {
    try {
      const { filename } = req.params;

      if (!/^zawadi_sms_[\w-]+(\.(sql|gz))+$/.test(filename)) {
        return res.status(400).json({ success: false, error: 'Invalid filename' });
      }

      const filePath = path.join(BACKUP_DIR, filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, error: 'Backup file not found' });
      }

      fs.unlinkSync(filePath);
      res.json({ success: true, message: 'Backup deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/backup/restore
   * Restores from an uploaded .sql or .sql.gz file
   */
  async restoreBackup(req: Request, res: Response) {
    try {
      const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
      if (!dbUrl) {
        return res.status(500).json({ success: false, error: 'DATABASE_URL not configured' });
      }

      // File is expected to be uploaded via multipart (multer middleware)
      const file = (req as any).file;
      if (!file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
      }

      const conn = parseConnectionString(dbUrl);
      const filePath = file.path;
      const isGzip = file.originalname.endsWith('.gz');

      const env = { ...process.env, PGPASSWORD: conn.password };

      const psql =
        `psql -h ${conn.host} -p ${conn.port} -U ${conn.user} -d ${conn.database} --no-password`;

      const cmd = isGzip
        ? `gunzip -c "${filePath}" | ${psql}`
        : `${psql} -f "${filePath}"`;

      const t0 = Date.now();
      await execAsync(cmd, { env });
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

      // Clean up temp upload
      fs.unlinkSync(filePath);

      res.json({ success: true, message: `Database restored successfully in ${elapsed}s` });
    } catch (err: any) {
      // Clean up temp file if it exists
      const file = (req as any).file;
      if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      res.status(500).json({ success: false, error: err.message });
    }
  }
}
