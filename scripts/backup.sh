#!/bin/bash

# SQLite Database Backup Script
# This script creates timestamped backups of the booking database

set -e

# Configuration
DB_PATH="${DB_PATH:-/app/data/booking.db}"
BACKUP_DIR="${BACKUP_DIR:-/app/backups}"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="booking_backup_${TIMESTAMP}.db"
LOG_FILE="${LOG_FILE:-/app/backups/backup.log}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

log_info() {
    log "INFO" "$*"
    echo -e "${GREEN}[INFO]${NC} $*"
}

log_warn() {
    log "WARN" "$*"
    echo -e "${YELLOW}[WARN]${NC} $*"
}

log_error() {
    log "ERROR" "$*"
    echo -e "${RED}[ERROR]${NC} $*"
}

# Create backup directory if it doesn't exist
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        log_info "Created backup directory: $BACKUP_DIR"
    fi
}

# Check if database exists
check_database() {
    if [ ! -f "$DB_PATH" ]; then
        log_error "Database file not found: $DB_PATH"
        exit 1
    fi

    local db_size=$(du -h "$DB_PATH" | cut -f1)
    log_info "Database found: $DB_PATH (Size: $db_size)"
}

# Create database backup
create_backup() {
    local backup_path="$BACKUP_DIR/$BACKUP_FILE"

    log_info "Starting backup: $BACKUP_FILE"

    # Use SQLite .backup command for consistent backup
    if command -v sqlite3 >/dev/null 2>&1; then
        sqlite3 "$DB_PATH" ".backup '$backup_path'"

        if [ $? -eq 0 ] && [ -f "$backup_path" ]; then
            local backup_size=$(du -h "$backup_path" | cut -f1)
            log_info "Backup created successfully: $backup_path (Size: $backup_size)"

            # Verify backup integrity
            if sqlite3 "$backup_path" "PRAGMA integrity_check;" | grep -q "ok"; then
                log_info "Backup integrity verified"
                return 0
            else
                log_error "Backup integrity check failed"
                rm -f "$backup_path"
                return 1
            fi
        else
            log_error "Failed to create backup"
            return 1
        fi
    else
        # Fallback to simple copy
        log_warn "sqlite3 command not found, using cp as fallback"
        cp "$DB_PATH" "$backup_path"

        if [ $? -eq 0 ]; then
            local backup_size=$(du -h "$backup_path" | cut -f1)
            log_info "Backup created using cp: $backup_path (Size: $backup_size)"
            return 0
        else
            log_error "Failed to create backup using cp"
            return 1
        fi
    fi
}

# Clean old backups
cleanup_old_backups() {
    log_info "Cleaning up backups older than $RETENTION_DAYS days"

    local deleted_count=0

    # Find and delete old backup files
    find "$BACKUP_DIR" -name "booking_backup_*.db" -type f -mtime +$RETENTION_DAYS -print0 | while IFS= read -r -d '' file; do
        rm -f "$file"
        log_info "Deleted old backup: $(basename "$file")"
        ((deleted_count++))
    done

    # Clean old log entries (keep last 1000 lines)
    if [ -f "$LOG_FILE" ]; then
        local temp_log="/tmp/backup_log_temp"
        tail -n 1000 "$LOG_FILE" > "$temp_log" && mv "$temp_log" "$LOG_FILE"
    fi

    log_info "Cleanup completed"
}

# Show backup statistics
show_backup_stats() {
    local backup_count=$(find "$BACKUP_DIR" -name "booking_backup_*.db" -type f | wc -l)
    local total_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1 || echo "0B")

    log_info "Backup statistics:"
    log_info "  - Total backups: $backup_count"
    log_info "  - Total size: $total_size"
    log_info "  - Retention: $RETENTION_DAYS days"
}

# Main backup process
main() {
    log_info "=== Database Backup Started ==="

    create_backup_dir
    check_database

    if create_backup; then
        cleanup_old_backups
        show_backup_stats
        log_info "=== Database Backup Completed Successfully ==="
        exit 0
    else
        log_error "=== Database Backup Failed ==="
        exit 1
    fi
}

# Handle script termination
trap 'log_error "Backup script interrupted"; exit 1' INT TERM

# Run main function
main "$@"