#!/bin/bash

# Backup Monitoring and Alerting Script
# Provides health monitoring and basic alerting for the backup system

set -e

# Configuration
BACKUP_DIR="/app/backups"
LOG_FILE="/app/backups/monitor.log"
HEALTH_CHECK_FILE="/app/backups/.health_status"
MAX_BACKUP_AGE_HOURS=26  # Alert if latest backup is older than 26 hours
MIN_BACKUP_SIZE_KB=1     # Minimum backup size in KB

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

log_debug() {
    log "DEBUG" "$*"
    echo -e "${BLUE}[DEBUG]${NC} $*"
}

# Check system health
check_system_health() {
    log_info "Checking system health for backup operations"

    # Check if backup directory exists and is writable
    if [ ! -d "$BACKUP_DIR" ]; then
        log_error "Backup directory does not exist: $BACKUP_DIR"
        return 1
    fi

    if [ ! -w "$BACKUP_DIR" ]; then
        log_error "Backup directory is not writable: $BACKUP_DIR"
        return 1
    fi

    # Check available disk space (alert if less than 100MB free)
    local available_space_kb=$(df "$BACKUP_DIR" | awk 'NR==2 {print $4}')
    local min_space_kb=102400  # 100MB in KB

    if [ "$available_space_kb" -lt "$min_space_kb" ]; then
        log_error "Low disk space: Only $(($available_space_kb / 1024))MB available in backup directory"
        return 1
    else
        log_info "Disk space OK: $(($available_space_kb / 1024))MB available"
    fi

    # Check if SQLite is available
    if ! command -v sqlite3 >/dev/null 2>&1; then
        log_warn "SQLite3 command not available - backups will use fallback copy method"
    else
        log_info "SQLite3 command available"
    fi

    return 0
}

# Check backup freshness
check_backup_freshness() {
    log_info "Checking backup freshness"

    local latest_backup=$(find "$BACKUP_DIR" -name "booking_backup_*.db" -type f -exec stat -f "%m %N" {} \; 2>/dev/null | sort -nr | head -1 | cut -d' ' -f2-)

    if [ -z "$latest_backup" ] || [ "$latest_backup" = "" ]; then
        log_error "No backup files found in $BACKUP_DIR"
        return 1
    fi

    local backup_timestamp=$(stat -f %m "$latest_backup" 2>/dev/null)
    local current_timestamp=$(date +%s)
    local age_hours=$(( (current_timestamp - backup_timestamp) / 3600 ))

    log_info "Latest backup: $(basename "$latest_backup")"
    log_info "Backup age: $age_hours hours"

    if [ "$age_hours" -gt "$MAX_BACKUP_AGE_HOURS" ]; then
        log_error "Latest backup is too old: $age_hours hours (threshold: $MAX_BACKUP_AGE_HOURS hours)"
        return 1
    else
        log_info "Backup freshness OK"
    fi

    # Check backup size
    local backup_size_kb=$(du -k "$latest_backup" | cut -f1)
    if [ "$backup_size_kb" -lt "$MIN_BACKUP_SIZE_KB" ]; then
        log_error "Latest backup is too small: ${backup_size_kb}KB (minimum: ${MIN_BACKUP_SIZE_KB}KB)"
        return 1
    else
        log_info "Backup size OK: ${backup_size_kb}KB"
    fi

    return 0
}

# Check backup integrity
check_backup_integrity() {
    log_info "Performing quick backup integrity check"

    local latest_backup=$(find "$BACKUP_DIR" -name "booking_backup_*.db" -type f -exec stat -f "%m %N" {} \; 2>/dev/null | sort -nr | head -1 | cut -d' ' -f2-)

    if [ -z "$latest_backup" ]; then
        log_error "No backup file found for integrity check"
        return 1
    fi

    if command -v sqlite3 >/dev/null 2>&1; then
        if sqlite3 "$latest_backup" "PRAGMA integrity_check;" | grep -q "ok"; then
            log_info "Latest backup integrity check passed"
            return 0
        else
            log_error "Latest backup failed integrity check"
            return 1
        fi
    else
        # Fallback: just check if file is readable and not empty
        if [ -r "$latest_backup" ] && [ -s "$latest_backup" ]; then
            log_info "Basic file check passed (SQLite not available for full integrity check)"
            return 0
        else
            log_error "Backup file is not readable or is empty"
            return 1
        fi
    fi
}

# Generate health status report
generate_health_status() {
    local overall_status="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    cat > "$HEALTH_CHECK_FILE" << EOF
{
  "timestamp": "$timestamp",
  "status": "$overall_status",
  "backup_directory": "$BACKUP_DIR",
  "checks": {
    "system_health": "${system_health_status:-unknown}",
    "backup_freshness": "${backup_freshness_status:-unknown}",
    "backup_integrity": "${backup_integrity_status:-unknown}"
  },
  "metrics": {
    "latest_backup": "$(find "$BACKUP_DIR" -name "booking_backup_*.db" -type f -exec basename {} \; | sort | tail -1)",
    "total_backups": $(find "$BACKUP_DIR" -name "booking_backup_*.db" -type f | wc -l),
    "backup_directory_size": "$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1 || echo "Unknown")"
  }
}
EOF

    log_info "Health status written to $HEALTH_CHECK_FILE"
}

# Display current backup status
show_backup_status() {
    log_info "=== BACKUP SYSTEM STATUS ==="

    # Basic stats
    local total_backups=$(find "$BACKUP_DIR" -name "booking_backup_*.db" -type f | wc -l)
    local total_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1 || echo "Unknown")

    log_info "Total backups: $total_backups"
    log_info "Total backup size: $total_size"

    # Latest backup info
    local latest_backup=$(find "$BACKUP_DIR" -name "booking_backup_*.db" -type f -exec stat -f "%m %N" {} \; 2>/dev/null | sort -nr | head -1 | cut -d' ' -f2-)
    if [ -n "$latest_backup" ]; then
        local backup_date=$(date -r "$latest_backup" '+%Y-%m-%d %H:%M:%S')
        local backup_size=$(du -h "$latest_backup" | cut -f1)
        log_info "Latest backup: $(basename "$latest_backup") ($backup_size, $backup_date)"
    else
        log_warn "No backups found"
    fi

    # Recent backup activity (last 7 days)
    local recent_count=$(find "$BACKUP_DIR" -name "booking_backup_*.db" -type f -mtime -7 | wc -l)
    log_info "Backups in last 7 days: $recent_count"
}

# Run health check and monitoring
run_health_check() {
    log_info "Starting backup system health check"

    local exit_code=0

    # System health check
    if check_system_health; then
        system_health_status="healthy"
    else
        system_health_status="unhealthy"
        exit_code=1
    fi

    # Backup freshness check
    if check_backup_freshness; then
        backup_freshness_status="fresh"
    else
        backup_freshness_status="stale"
        exit_code=1
    fi

    # Backup integrity check
    if check_backup_integrity; then
        backup_integrity_status="valid"
    else
        backup_integrity_status="invalid"
        exit_code=1
    fi

    # Generate overall status
    local overall_status="healthy"
    if [ $exit_code -ne 0 ]; then
        overall_status="unhealthy"
    fi

    generate_health_status "$overall_status"
    show_backup_status

    if [ $exit_code -eq 0 ]; then
        log_info "=== Backup system health check PASSED ==="
    else
        log_error "=== Backup system health check FAILED ==="
    fi

    return $exit_code
}

# Main monitoring function
main() {
    case "${1:-health}" in
        "health"|"check")
            run_health_check
            ;;
        "status")
            show_backup_status
            ;;
        *)
            log_info "Usage: $0 [health|check|status]"
            log_info "  health|check: Run full health check (default)"
            log_info "  status: Show current backup status"
            exit 1
            ;;
    esac
}

# Handle script termination
trap 'log_error "Backup monitoring interrupted"; exit 1' INT TERM

# Run main function
main "$@"