#!/bin/bash
# SavdoAI daily backup — git state + .env + local DB dump (if exists)
set -u

DEST=/root/savdoai-backups
mkdir -p "$DEST"
DATE=$(date +%Y%m%d_%H%M%S)
TAR="$DEST/savdoai_backup_${DATE}.tar.gz"

cd /root/savdoai
tar -czf "$TAR" --ignore-failed-read \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='*.log' \
    --exclude='.venv' \
    .env .env.example scripts/ docs/ CHANGELOG.md \
    services/bot/config.py services/bot/.env.example \
    2>/dev/null || true

# Oxirgi 14 ta backup saqlansin
ls -1t "$DEST"/savdoai_backup_*.tar.gz 2>/dev/null | tail -n +15 | xargs -r rm -f

echo "$(date -Iseconds) backup: $TAR ($(du -h "$TAR" | cut -f1))"
