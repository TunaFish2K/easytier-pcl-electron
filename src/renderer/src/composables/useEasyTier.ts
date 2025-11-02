import { ref, onMounted, onUnmounted } from 'vue'
import type {
  RoomInfo,
  LogEntry,
  EasyTierStatus,
  StatusChangeEvent,
  ErrorEvent,
  ApiResponse
} from '../types/easytier'

// 全局单例状态
const status = ref<string>('idle')
const roomInfo = ref<RoomInfo | null>(null)
const logs = ref<LogEntry[]>([])
const error = ref<string | null>(null)
const loading = ref(false)

// 事件监听器引用计数
let listenerRefCount = 0
let unsubscribeStatusChange: (() => void) | null = null
let unsubscribeLog: (() => void) | null = null
let unsubscribeError: (() => void) | null = null
let unsubscribeConnected: (() => void) | null = null
let unsubscribeDisconnected: (() => void) | null = null

/**
 * EasyTier API 包装器（单例模式）
 * 提供与主进程 EasyTier 管理器通信的接口
 */
export function useEasyTier() {

  // IPC 调用辅助函数
  const invoke = async <T = any>(channel: string, ...args: any[]): Promise<T> => {
    return await window.electron.ipcRenderer.invoke(channel, ...args)
  }

  /**
   * 创建房间（作为房主）
   */
  const createRoom = async (port: number, roomName?: string, customNodes?: string[]): Promise<RoomInfo> => {
    loading.value = true
    error.value = null

    try {
      const response: ApiResponse<RoomInfo> = await invoke(
        'easytier:create-room',
        port,
        roomName,
        customNodes
      )

      if (!response.success) {
        throw new Error(response.error || 'Failed to create room')
      }

      roomInfo.value = response.data!
      return response.data!
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 检查是否需要 root 权限
   */
  const requiresRoot = async (): Promise<boolean> => {
    return await invoke<boolean>('easytier:requires-root')
  }

  /**
   * 设置 sudo 密码
   */
  const setSudoPassword = async (password: string): Promise<void> => {
    const response: ApiResponse = await invoke('easytier:set-sudo-password', password)

    if (!response.success) {
      throw new Error(response.error || 'Failed to set sudo password')
    }
  }

  /**
   * 加入房间（作为客户端）
   */
  const joinRoom = async (invitationCode: string, playerName: string, customNodes?: string[]): Promise<RoomInfo> => {
    loading.value = true
    error.value = null

    try {
      const response: ApiResponse<RoomInfo> = await invoke(
        'easytier:join-room',
        invitationCode,
        playerName,
        customNodes
      )

      if (!response.success) {
        throw new Error(response.error || 'Failed to join room')
      }

      roomInfo.value = response.data!
      return response.data!
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 断开连接
   */
  const disconnect = async (): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      const response: ApiResponse = await invoke('easytier:disconnect')

      if (!response.success) {
        throw new Error(response.error || 'Failed to disconnect')
      }

      roomInfo.value = null
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取当前状态
   */
  const getStatus = async (): Promise<EasyTierStatus> => {
    const currentStatus = await invoke<EasyTierStatus>('easytier:get-status')
    status.value = currentStatus
    return currentStatus
  }

  /**
   * 获取房间信息
   */
  const getRoomInfo = async (): Promise<RoomInfo | null> => {
    const info = await invoke<RoomInfo | null>('easytier:get-room-info')
    roomInfo.value = info
    return info
  }

  /**
   * 获取日志
   */
  const getLogs = async (): Promise<LogEntry[]> => {
    const allLogs = await invoke<LogEntry[]>('easytier:get-logs')
    logs.value = allLogs
    return allLogs
  }

  /**
   * 清空日志
   */
  const clearLogs = async (): Promise<void> => {
    await invoke('easytier:clear-logs')
    logs.value = []
  }

  /**
   * 重置管理器
   */
  const reset = async (): Promise<void> => {
    await invoke('easytier:reset')
    status.value = 'idle'
    roomInfo.value = null
    logs.value = []
    error.value = null
  }

  /**
   * 设置事件监听（只在第一次调用时设置）
   */
  const setupEventListeners = () => {
    if (listenerRefCount === 0) {
      console.log('[useEasyTier] Setting up event listeners')

      // 状态变化
      unsubscribeStatusChange = window.electron.ipcRenderer.on(
        'easytier:status-change',
        (_event, data: StatusChangeEvent) => {
          console.log('[useEasyTier] Status change:', data.status)
          status.value = data.status
        }
      )

      // 新日志
      unsubscribeLog = window.electron.ipcRenderer.on('easytier:log', (_event, entry: LogEntry) => {
        logs.value.push(entry)
        // 限制日志数量（防止内存溢出）
        if (logs.value.length > 1000) {
          logs.value.shift()
        }
      })

      // 错误
      unsubscribeError = window.electron.ipcRenderer.on('easytier:error', (_event, data: ErrorEvent) => {
        error.value = data.message
        console.error('[EasyTier Error]', data.message, data.stack)
      })

      // 连接成功
      unsubscribeConnected = window.electron.ipcRenderer.on(
        'easytier:connected',
        (_event, info: RoomInfo) => {
          console.log('[useEasyTier] Connected, room info:', info)
          roomInfo.value = info
        }
      )

      // 断开连接
      unsubscribeDisconnected = window.electron.ipcRenderer.on('easytier:disconnected', () => {
        console.log('[useEasyTier] Disconnected')
        roomInfo.value = null
      })
    }
    listenerRefCount++
  }

  /**
   * 清理事件监听（只在最后一个组件卸载时清理）
   */
  const cleanupEventListeners = () => {
    listenerRefCount--
    if (listenerRefCount === 0) {
      console.log('[useEasyTier] Cleaning up event listeners')
      unsubscribeStatusChange?.()
      unsubscribeLog?.()
      unsubscribeError?.()
      unsubscribeConnected?.()
      unsubscribeDisconnected?.()

      unsubscribeStatusChange = null
      unsubscribeLog = null
      unsubscribeError = null
      unsubscribeConnected = null
      unsubscribeDisconnected = null
    }
  }

  // 生命周期钩子
  onMounted(async () => {
    setupEventListeners()
    // 初始化时获取当前状态
    console.log('[useEasyTier] Component mounted, fetching initial state')
    try {
      await getStatus()
      await getRoomInfo()
    } catch (err) {
      console.error('[useEasyTier] Failed to fetch initial state:', err)
    }
  })

  onUnmounted(() => {
    cleanupEventListeners()
  })

  return {
    // 状态
    status,
    roomInfo,
    logs,
    error,
    loading,

    // 方法
    createRoom,
    joinRoom,
    disconnect,
    getStatus,
    getRoomInfo,
    getLogs,
    clearLogs,
    reset,
    requiresRoot,
    setSudoPassword
  }
}
