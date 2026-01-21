# Streaming Tracker - Backup System Documentation

## Overview

This backup system provides automated, local backups of your Neo4j database. Backups are stored outside Docker volumes to protect against accidental data loss.

## Features

✅ **Automated daily backups** using Neo4j APOC export
✅ **30-day retention** - Automatically deletes backups older than 30 days
✅ **JSON format** - Human-readable, portable backup format
✅ **Outside Docker volumes** - Backups survive `docker-compose down`
✅ **Easy restore** - One-command restoration from any backup
✅ **Logging** - All operations logged for troubleshooting

---

## Directory Structure

```
streaming-tracker/
├── backup.sh           # Backup script
├── restore.sh          # Restore script
└── backups/            # Backup storage (outside Docker volumes)
    ├── backup.log                          # Backup operation log
    ├── restore.log                         # Restore operation log
    ├── streaming-tracker-backup-20260119_030000.json
    ├── streaming-tracker-backup-20260120_030000.json
    └── ...
```

---

## Setup Instructions

### 1. Test the Backup System

Before setting up automation, test that backups work:

```bash
cd /home/sfeltner/Projects/streaming-tracker
./backup.sh
```

You should see output like:
```
[2026-01-19 22:23:49] =========================================
[2026-01-19 22:23:49] Starting Neo4j backup process
[2026-01-19 22:23:49] =========================================
[2026-01-19 22:23:49] Starting Neo4j database export to JSON...
[2026-01-19 22:23:49] ✓ Database export completed successfully
...
[2026-01-19 22:23:49] Backup completed successfully!
```

### 2. Set Up Nightly Cron Job

To run automatic backups every night at 3:00 AM:

```bash
# Open crontab editor
crontab -e
```

Add this line (choose one):

```bash
# Option 1: Run at 3:00 AM daily
0 3 * * * /home/sfeltner/Projects/streaming-tracker/backup.sh

# Option 2: Run at 2:00 AM daily
0 2 * * * /home/sfeltner/Projects/streaming-tracker/backup.sh

# Option 3: Run twice daily (2 AM and 2 PM)
0 2,14 * * * /home/sfeltner/Projects/streaming-tracker/backup.sh
```

Save and exit the editor.

### 3. Verify Cron Job

Check that your cron job was added:

```bash
crontab -l
```

You should see your backup job listed.

### 4. Test Cron Job

Wait for the scheduled time, or manually trigger it:

```bash
# Run the backup command that cron will execute
/home/sfeltner/Projects/streaming-tracker/backup.sh
```

Check the log to verify:

```bash
tail -f /home/sfeltner/Projects/streaming-tracker/backups/backup.log
```

---

## Manual Backup

To create a backup manually at any time:

```bash
cd /home/sfeltner/Projects/streaming-tracker
./backup.sh
```

---

## Restore from Backup

### Interactive Restore (Recommended)

```bash
cd /home/sfeltner/Projects/streaming-tracker
./restore.sh
```

You'll see a list of available backups:

```
Available backups:
==================
[1] streaming-tracker-backup-20260119_222349.json (68K, 2026-01-19 22:23)
[2] streaming-tracker-backup-20260119_222238.json (68K, 2026-01-19 22:22)

Enter backup number to restore (or 'q' to quit):
```

Enter the number of the backup you want to restore.

⚠️ **WARNING:** Restore will DELETE all current data and replace it with the backup!

### Direct Restore

If you know the exact backup filename:

```bash
cd /home/sfeltner/Projects/streaming-tracker
./restore.sh streaming-tracker-backup-20260119_222349.json
```

---

## Backup File Format

Backups are stored in **Newline-Delimited JSON (NDJSON)** format:

- **Line 1:** Header with metadata (nodes, relationships, properties count)
- **Line 2+:** Each line is a JSON object representing a node or relationship

Example:
```json
file, source, format, nodes, relationships, properties, time, rows...
{"type":"node","id":"0","labels":["User"],"properties":{...}}
{"type":"node","id":"1","labels":["Genre"],"properties":{...}}
{"type":"relationship","id":"0","type":"HAS_RATING","properties":{...}}
```

---

## Monitoring

### Check Backup Log

View recent backup activity:

```bash
tail -50 /home/sfeltner/Projects/streaming-tracker/backups/backup.log
```

### List All Backups

```bash
ls -lh /home/sfeltner/Projects/streaming-tracker/backups/*.json
```

### Check Backup Size

```bash
du -h /home/sfeltner/Projects/streaming-tracker/backups/
```

---

## Troubleshooting

### Backup Failed

1. **Check if Neo4j is running:**
   ```bash
   docker ps | grep neo4j
   ```

2. **Check the backup log:**
   ```bash
   tail -50 /home/sfeltner/Projects/streaming-tracker/backups/backup.log
   ```

3. **Verify APOC is enabled:**
   ```bash
   docker exec streaming-tracker-neo4j cypher-shell -u neo4j -p streamingtracker2026 \
     "RETURN apoc.version()"
   ```

### Restore Failed

1. **Check the restore log:**
   ```bash
   tail -50 /home/sfeltner/Projects/streaming-tracker/backups/restore.log
   ```

2. **Verify backup file is not corrupted:**
   ```bash
   head -10 /home/sfeltner/Projects/streaming-tracker/backups/streaming-tracker-backup-YYYYMMDD_HHMMSS.json
   ```

3. **Ensure Neo4j is healthy:**
   ```bash
   docker logs streaming-tracker-neo4j --tail 50
   ```

### Cron Job Not Running

1. **Check cron service is running:**
   ```bash
   systemctl status cron
   # or on some systems:
   systemctl status crond
   ```

2. **Check crontab:**
   ```bash
   crontab -l
   ```

3. **Check system logs:**
   ```bash
   grep CRON /var/log/syslog | tail -20
   # or
   journalctl -u cron | tail -20
   ```

---

## Backup Retention

- **Default:** 30 days
- **Change retention period:** Edit `RETENTION_DAYS` in `backup.sh`
- **Manual cleanup:** Delete old backups from `/backups/` directory

---

## Storage Requirements

- **Per backup:** ~65-100 KB (varies with data)
- **30 days:** ~2-3 MB total
- **Recommended free space:** At least 100 MB

---

## Security Notes

⚠️ **Backup files contain:**
- All user data (emails, password hashes)
- All titles, ratings, and lists
- Database structure

**Security recommendations:**
- Keep backups directory permissions restricted (already set to 755)
- Never commit backups to version control
- Consider encrypting backups for additional security
- Regularly test restore process

---

## Advanced Usage

### Change Backup Location

Edit `BACKUP_DIR` in both `backup.sh` and `restore.sh`:

```bash
BACKUP_DIR="/path/to/your/backup/location"
```

### Email Notifications

Add email notifications on backup failure:

```bash
# Install mailutils
sudo apt-get install mailutils

# Modify backup.sh to send email on failure
# Add at the end of functions that exit on error:
echo "Backup failed at $(date)" | mail -s "Backup Failed" your-email@example.com
```

### Backup to Remote Storage

After local backup completes, sync to remote storage:

```bash
# Add to backup.sh after successful backup:
rsync -avz ${BACKUP_DIR}/ user@remote-server:/backups/streaming-tracker/
```

---

## Quick Reference

| Task | Command |
|------|---------|
| **Manual backup** | `./backup.sh` |
| **List backups** | `./restore.sh` (then quit) or `ls backups/` |
| **Restore backup** | `./restore.sh` |
| **View backup log** | `tail -f backups/backup.log` |
| **View restore log** | `tail -f backups/restore.log` |
| **Check cron job** | `crontab -l` |
| **Edit cron job** | `crontab -e` |

---

## Support

If you encounter issues:

1. Check the relevant log file (`backup.log` or `restore.log`)
2. Verify Docker containers are running (`docker ps`)
3. Check Neo4j logs (`docker logs streaming-tracker-neo4j`)
4. Refer to the Troubleshooting section above

---

**Last Updated:** 2026-01-19
**Backup System Version:** 1.0
