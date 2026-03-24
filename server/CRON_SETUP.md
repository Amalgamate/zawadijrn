# Zawadi SMS — Backup & Cron Setup Guide

## How It Works

| File | Purpose |
|---|---|
| `scripts/backup-db.js` | Standalone Node.js script — runs one backup and exits |
| `src/controllers/backup.controller.ts` | API controller — powers the Backup & Restore UI |
| `src/routes/backup.routes.ts` | Routes at `/api/backup` |
| `../backups/db/` | Where all backup files land (one level above `/server`) |
| `logs/backup.log` | Cron job output is appended here |

---

## Running a Backup Manually

```bash
cd "Zawadi SMS/server"

# Compressed (recommended — ~10x smaller)
node scripts/backup-db.js

# Plain SQL (no compression)
node scripts/backup-db.js --no-gzip

# Mark as an automatic/scheduled run (shows "Auto" badge in the UI)
node scripts/backup-db.js --auto
```

---

## Scheduling with Cron (Linux / macOS)

### 1. Open your crontab
```bash
crontab -e
```

### 2. Add this line — runs every day at 2:00 AM
```
0 2 * * * cd /FULL/PATH/TO/Zawadi\ SMS/server && node scripts/backup-db.js --auto >> logs/backup.log 2>&1
```

> Replace `/FULL/PATH/TO/Zawadi\ SMS/server` with the real absolute path.

### 3. Verify cron is running
```bash
# List active cron jobs
crontab -l

# Check the log after the first scheduled run
tail -f logs/backup.log
```

---

## Scheduling with Windows Task Scheduler

1. Open **Task Scheduler** → **Create Basic Task**
2. **Name**: `Zawadi SMS Backup`
3. **Trigger**: Daily at `02:00 AM`
4. **Action**: Start a Program
   - Program/script: `node`
   - Arguments: `scripts\backup-db.js --auto`
   - Start in: `C:\Amalgamate\Projects\Zawadi SMS\server`
5. Click **Finish**, then right-click the task → **Properties** → check **Run whether user is logged on or not**

> Logs won't capture automatically with Task Scheduler unless you add `>> logs\backup.log 2>&1` to the arguments and use `cmd /c` as the program. See the advanced note below.

**Advanced (captures logs)**:
- Program: `cmd`
- Arguments: `/c "node scripts\backup-db.js --auto >> logs\backup.log 2>&1"`
- Start in: `C:\Amalgamate\Projects\Zawadi SMS\server`

---

## Scheduling with pm2 (if you use pm2 to run the server)

Add this entry to `ecosystem.config.js`:

```js
{
  name: 'zawadi-backup',
  script: 'scripts/backup-db.js',
  args: '--auto',
  cron_restart: '0 2 * * *',
  watch: false,
  autorestart: false,
  out_file: 'logs/backup.log',
  error_file: 'logs/backup.log',
  merge_logs: true,
}
```

Then:
```bash
pm2 reload ecosystem.config.js
pm2 save
```

---

## Backup File Naming

```
zawadi_sms_2026-03-24_02-00-00.sql.gz      ← Manual (from UI or running script directly)
zawadi_sms_auto_2026-03-24_02-00-00.sql.gz ← Auto  (from cron, shows "Auto" badge in UI)
```

---

## Retention Policy

- Backups older than **14 days** are automatically deleted every time the script runs.
- Change the retention period by editing `retentionDays` in `scripts/backup-db.js` (for cron)
  or `RETENTION_DAYS` in `src/controllers/backup.controller.ts` (for the UI).

---

## Requirements

| Tool | How to install |
|---|---|
| `pg_dump` | Comes with PostgreSQL. Ubuntu: `sudo apt-get install postgresql-client` |
| `gzip` | Built into Linux/macOS. Windows: install Git for Windows or use WSL |
| `psql` | Needed for **restore**. Same package as `pg_dump` |

---

## Backup Storage Location

Backups are saved to:
```
Zawadi SMS/
├── backups/
│   └── db/
│       ├── zawadi_sms_auto_2026-03-24_02-00-00.sql.gz
│       └── zawadi_sms_2026-03-24_10-15-33.sql.gz
└── server/
    ├── scripts/
    │   └── backup-db.js   ← this script
    └── logs/
        └── backup.log     ← cron output
```

This folder is **outside** the `server/` directory so it won't interfere with deployments or builds.

---

## API Endpoints (for the UI)

All endpoints require authentication and `SUPER_ADMIN` or `ADMIN` role.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/backup` | List all backups + stats |
| `POST` | `/api/backup` | Create a manual backup |
| `GET` | `/api/backup/download/:filename` | Download a backup file |
| `DELETE` | `/api/backup/:filename` | Delete a backup |
| `POST` | `/api/backup/restore` | Restore from uploaded file |
