#!/bin/bash

# SQLite Database Backup Verification Script
# Verifies the integrity and completeness of backup files

set -e

# Configuration
BACKUP_DIR="/app/backups"
LOG_FILE="/app/backups/verify.log"
ALERT_THRESHOLD_DAYS=3  # Alert if no backup in X days

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

# Check if backup directory exists
check_backup_directory() {
    if [ ! -d "$BACKUP_DIR" ]; then
        log_error "Backup directory not found: $BACKUP_DIR"
        return 1
    fi
    log_info "Backup directory exists: $BACKUP_DIR"
}

# Check for recent backups
check_recent_backups() {
    log_info "Checking for recent backups (within $ALERT_THRESHOLD_DAYS days)"

    local recent_backups=$(find "$BACKUP_DIR" -name "booking_backup_*.db" -mtime -$ALERT_THRESHOLD_DAYS)
    local backup_count=$(echo "$recent_backups" | grep -c "booking_backup" || echo "0")

    if [ "$backup_count" -eq 0 ]; then
        log_error "No recent backups found within $ALERT_THRESHOLD_DAYS days!"
        return 1
    else
        log_info "Found $backup_count recent backup(s)"
        echo "$recent_backups" | while read -r backup; do
            if [ -n "$backup" ]; then
                local size=$(du -h "$backup" | cut -f1)
                local date=$(date -r "$backup" '+%Y-%m-%d %H:%M:%S')
                log_info "  - $(basename "$backup") (Size: $size, Modified: $date)"
            fi
        done
    fi
}

# Verify backup integrity
verify_backup_integrity() {
    log_info "Verifying backup file integrity"

    local failed_count=0
    local total_count=0

    find "$BACKUP_DIR" -name "booking_backup_*.db" -type f | head -5 | while read -r backup_file; do
        ((total_count++))

        if [ -f "$backup_file" ]; then
            log_info "Checking integrity of $(basename "$backup_file")"

            if sqlite3 "$backup_file" "PRAGMA integrity_check;" | grep -q "ok"; then
                log_info "  ✓ Integrity check passed"
            else
                log_error "  ✗ Integrity check failed for $(basename "$backup_file")"
                ((failed_count++))
            fi

            # Check if file is readable and has content
            local size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file" 2>/dev/null || echo "0")
            if [ "$size" -gt 0 ]; then
                log_info "  ✓ File size: $(du -h "$backup_file" | cut -f1)"
            else
                log_error "  ✗ File is empty or unreadable"
                ((failed_count++))
            fi
        fi
    done

    if [ "$failed_count" -gt 0 ]; then
        log_error "$failed_count backup(s) failed integrity checks"
        return 1
    else
        log_info "All checked backups passed integrity verification"
    fi
}

# Check backup schedule compliance
check_backup_schedule() {
    log_info "Checking backup schedule compliance"

    # Check if we have daily backups for the last week
    local days_to_check=7
    local missing_days=0

    for i in $(seq 1 $days_to_check); do
        local check_date=$(date -j -v-${i}d '+%Y%m%d' 2>/dev/null || date -d "$i days ago" '+%Y%m%d' 2>/dev/null)
        local backup_pattern="booking_backup_${check_date}_*.db"

        if ls "$BACKUP_DIR"/$backup_pattern 1> /dev/null 2>&1; then
            log_info "  ✓ Backup found for $check_date"
        else
            log_warn "  ⚠ No backup found for $check_date"
            ((missing_days++))
        fi
    done

    if [ "$missing_days" -gt 2 ]; then
        log_error "Too many missing daily backups ($missing_days out of $days_to_check days)"
        return 1
    elif [ "$missing_days" -gt 0 ]; then
        log_warn "$missing_days day(s) missing backups in the last week"
    else
        log_info "Daily backup schedule is compliant"
    fi
}

# Generate backup report
generate_backup_report() {
    log_info "Generating backup report"

    local total_backups=$(find "$BACKUP_DIR" -name "booking_backup_*.db" -type f | wc -l)
    local total_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1 || echo "Unknown")
    local oldest_backup=$(find "$BACKUP_DIR" -name "booking_backup_*.db" -type f -exec stat -f "%m %N" {} \; 2>/dev/null | sort -n | head -1 | cut -d' ' -f2- || echo "None found")
    local newest_backup=$(find "$BACKUP_DIR" -name "booking_backup_*.db" -type f -exec stat -f "%m %N" {} \; 2>/dev/null | sort -nr | head -1 | cut -d' ' -f2- || echo "None found")

    log_info "=== BACKUP REPORT ==="
    log_info "Total backups: $total_backups"
    log_info "Total size: $total_size"

    if [ "$oldest_backup" != "None found" ]; then
        local oldest_date=$(date -r "$oldest_backup" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo "Unknown")
        log_info "Oldest backup: $(basename "$oldest_backup") ($oldest_date)"
    fi

    if [ "$newest_backup" != "None found" ]; then
        local newest_date=$(date -r "$newest_backup" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo "Unknown")
        log_info "Newest backup: $(basename "$newest_backup") ($newest_date)"
    fi
}

# Main verification process
main() {
    log_info "=== Backup Verification Started ==="

    local exit_code=0

    if ! check_backup_directory; then
        exit_code=1
    fi

    if ! check_recent_backups; then
        exit_code=1
    fi

    if ! verify_backup_integrity; then
        exit_code=1
    fi

    if ! check_backup_schedule; then
        exit_code=1
    fi

    generate_backup_report

    if [ $exit_code -eq 0 ]; then
        log_info "=== Backup Verification Completed Successfully ==="
    else
        log_error "=== Backup Verification Completed with Issues ==="
    fi

    exit $exit_code
}

# Handle script termination
trap 'log_error "Backup verification interrupted"; exit 1' INT TERM

# Run main function
main "$@"