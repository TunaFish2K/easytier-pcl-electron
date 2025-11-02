import { ipcMain, BrowserWindow } from 'electron'
import { EasyTierManager, EasyTierStatus, type LogEntry } from './manager'

/**
 * EasyTier IPC 处理器
 * 负责处理渲染进程与 EasyTier 管理器之间的通信
 */
export class EasyTierIpcHandler {
  private manager: EasyTierManager
  private mainWindow: BrowserWindow | null = null

  constructor(manager: EasyTierManager) {
    this.manager = manager
    this.setupIpcHandlers()
    this.setupEventForwarding()
  }

  /**
   * 设置主窗口引用（用于发送事件）
   */
  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window
  }

  /**
   * 设置 IPC 处理器
   */
  private setupIpcHandlers(): void {
    // 检查是否需要 root 权限
    ipcMain.handle('easytier:requires-root', () => {
      return EasyTierManager.requiresRootPermission()
    })

    // 设置 sudo 密码
    ipcMain.handle('easytier:set-sudo-password', (_, password: string) => {
      try {
        this.manager.setSudoPassword(password)
        return { success: true }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        }
      }
    })

    // 创建房间（房主）
    ipcMain.handle('easytier:create-room', async (_, port: number, roomName?: string, customNodes?: string[]) => {
      try {
        const roomInfo = await this.manager.createRoom(port, roomName, customNodes)
        return { success: true, data: roomInfo }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        }
      }
    })

    // 加入房间（客户端）
    ipcMain.handle(
      'easytier:join-room',
      async (_, invitationCode: string, playerName: string, customNodes?: string[]) => {
        try {
          const roomInfo = await this.manager.joinRoom(invitationCode, playerName, customNodes)
          return { success: true, data: roomInfo }
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
          }
        }
      }
    )

    // 断开连接
    ipcMain.handle('easytier:disconnect', async () => {
      try {
        await this.manager.disconnect()
        return { success: true }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        }
      }
    })

    // 获取当前状态
    ipcMain.handle('easytier:get-status', () => {
      return this.manager.getStatus()
    })

    // 获取房间信息
    ipcMain.handle('easytier:get-room-info', () => {
      return this.manager.getRoomInfo()
    })

    // 获取日志
    ipcMain.handle('easytier:get-logs', () => {
      return this.manager.getLogs()
    })

    // 清空日志
    ipcMain.handle('easytier:clear-logs', () => {
      this.manager.clearLogs()
      return { success: true }
    })

    // 重置管理器
    ipcMain.handle('easytier:reset', () => {
      this.manager.reset()
      return { success: true }
    })
  }

  /**
   * 设置事件转发（将 Manager 事件转发到渲染进程）
   */
  private setupEventForwarding(): void {
    // 状态变化
    this.manager.on('statusChange', (status: EasyTierStatus, previousStatus: EasyTierStatus) => {
      this.sendToRenderer('easytier:status-change', { status, previousStatus })
    })

    // 日志
    this.manager.on('log', (entry: LogEntry) => {
      this.sendToRenderer('easytier:log', entry)
    })

    // 错误
    this.manager.on('error', (error: Error) => {
      this.sendToRenderer('easytier:error', {
        message: error.message,
        stack: error.stack
      })
    })

    // 连接成功
    this.manager.on('connected', () => {
      this.sendToRenderer('easytier:connected', this.manager.getRoomInfo())
    })

    // 断开连接
    this.manager.on('disconnected', () => {
      this.sendToRenderer('easytier:disconnected')
    })
  }

  /**
   * 发送消息到渲染进程
   */
  private sendToRenderer(channel: string, data?: any): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data)
    }
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    // 移除所有 IPC 监听器
    ipcMain.removeHandler('easytier:requires-root')
    ipcMain.removeHandler('easytier:set-sudo-password')
    ipcMain.removeHandler('easytier:create-room')
    ipcMain.removeHandler('easytier:join-room')
    ipcMain.removeHandler('easytier:disconnect')
    ipcMain.removeHandler('easytier:get-status')
    ipcMain.removeHandler('easytier:get-room-info')
    ipcMain.removeHandler('easytier:get-logs')
    ipcMain.removeHandler('easytier:clear-logs')
    ipcMain.removeHandler('easytier:reset')
  }
}
