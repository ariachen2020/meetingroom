import fs from 'fs/promises'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export interface BackupInfo {
  filename: string
  size: number
  createdAt: string
  path: string
}

const BACKUP_DIR = process.env.NODE_ENV === 'production' ? '/app/backups' : './backups'
const DATABASE_PATH = './data/booking.db'
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '30')

export class BackupManager {
  private async ensureBackupDir() {
    try {
      await fs.access(BACKUP_DIR)
    } catch {
      await fs.mkdir(BACKUP_DIR, { recursive: true })
    }
  }

  async createBackup(): Promise<{ success: boolean; message: string; filename?: string }> {
    try {
      await this.ensureBackupDir()

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                       new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('Z')[0]
      const filename = `booking_backup_${timestamp}.db`
      const backupPath = path.join(BACKUP_DIR, filename)

      try {
        await fs.access(DATABASE_PATH)
      } catch {
        return {
          success: false,
          message: '資料庫檔案不存在'
        }
      }

      await fs.copyFile(DATABASE_PATH, backupPath)

      const stats = await fs.stat(backupPath)
      
      return {
        success: true,
        message: '備份建立成功',
        filename: filename
      }
    } catch (error) {
      console.error('Backup creation error:', error)
      return {
        success: false,
        message: '備份建立失敗：' + (error instanceof Error ? error.message : '未知錯誤')
      }
    }
  }

  async getBackupList(): Promise<BackupInfo[]> {
    try {
      await this.ensureBackupDir()
      const files = await fs.readdir(BACKUP_DIR)
      
      const backupFiles = files.filter(file => 
        file.startsWith('booking_backup_') && file.endsWith('.db')
      )

      const backupInfos: BackupInfo[] = []

      for (const file of backupFiles) {
        try {
          const filePath = path.join(BACKUP_DIR, file)
          const stats = await fs.stat(filePath)
          
          backupInfos.push({
            filename: file,
            size: stats.size,
            createdAt: stats.birthtime.toISOString(),
            path: filePath
          })
        } catch (error) {
          console.error(`Error reading backup file ${file}:`, error)
        }
      }

      return backupInfos.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    } catch (error) {
      console.error('Error getting backup list:', error)
      return []
    }
  }

  async cleanupOldBackups(): Promise<{ success: boolean; message: string; deletedCount?: number }> {
    try {
      const backups = await this.getBackupList()
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS)

      const oldBackups = backups.filter(backup => 
        new Date(backup.createdAt) < cutoffDate
      )

      let deletedCount = 0
      for (const backup of oldBackups) {
        try {
          await fs.unlink(backup.path)
          deletedCount++
        } catch (error) {
          console.error(`Failed to delete backup ${backup.filename}:`, error)
        }
      }

      return {
        success: true,
        message: `清理完成，刪除了 ${deletedCount} 個舊備份`,
        deletedCount
      }
    } catch (error) {
      console.error('Backup cleanup error:', error)
      return {
        success: false,
        message: '清理失敗：' + (error instanceof Error ? error.message : '未知錯誤')
      }
    }
  }

  async restoreBackup(filename: string): Promise<{ success: boolean; message: string }> {
    try {
      const backupPath = path.join(BACKUP_DIR, filename)
      
      try {
        await fs.access(backupPath)
      } catch {
        return {
          success: false,
          message: '備份檔案不存在'
        }
      }

      const tempPath = DATABASE_PATH + '.temp'
      await fs.copyFile(DATABASE_PATH, tempPath)

      try {
        await fs.copyFile(backupPath, DATABASE_PATH)
        await fs.unlink(tempPath)
        
        return {
          success: true,
          message: '資料庫復原成功'
        }
      } catch (error) {
        await fs.copyFile(tempPath, DATABASE_PATH)
        await fs.unlink(tempPath)
        throw error
      }
    } catch (error) {
      console.error('Backup restore error:', error)
      return {
        success: false,
        message: '復原失敗：' + (error instanceof Error ? error.message : '未知錯誤')
      }
    }
  }

  formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }
}

export const backupManager = new BackupManager()