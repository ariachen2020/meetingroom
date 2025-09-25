import cron from 'node-cron'
import { backupManager } from './index'

export class BackupScheduler {
  private isScheduled = false
  private tasks: cron.ScheduledTask[] = []

  start() {
    if (this.isScheduled) {
      return
    }

    const schedule = process.env.BACKUP_SCHEDULE || '0 2 * * *'
    
    console.log(`Starting backup scheduler with schedule: ${schedule}`)
    
    const task = cron.schedule(schedule, async () => {
      console.log('Running scheduled backup...')
      
      try {
        const backupResult = await backupManager.createBackup()
        
        if (backupResult.success) {
          console.log('Scheduled backup completed:', backupResult.filename)
          
          const cleanupResult = await backupManager.cleanupOldBackups()
          console.log('Backup cleanup completed:', cleanupResult.message)
        } else {
          console.error('Scheduled backup failed:', backupResult.message)
        }
      } catch (error) {
        console.error('Scheduled backup error:', error)
      }
    }, {
      scheduled: false
    })

    task.start()
    this.tasks.push(task)
    this.isScheduled = true
    console.log('Backup scheduler started')
  }

  stop() {
    this.tasks.forEach(task => task.stop())
    this.tasks = []
    this.isScheduled = false
    console.log('Backup scheduler stopped')
  }
}

export const backupScheduler = new BackupScheduler()