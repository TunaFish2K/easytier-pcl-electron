/**
 * EasyTier 状态枚举
 */
export enum EasyTierStatus {
  IDLE = 'idle',
  STARTING = 'starting',
  RUNNING = 'running',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  ERROR = 'error'
}

/**
 * 日志级别
 */
export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  DEBUG = 'debug'
}

/**
 * 日志条目
 */
export interface LogEntry {
  timestamp: Date
  level: LogLevel
  message: string
  source: 'stdout' | 'stderr' | 'system'
}

/**
 * 房间信息
 */
export interface RoomInfo {
  invitationCode: string
  networkName: string
  networkSecret: string
  port: number
  role: 'host' | 'client'
  hostIp: string
  playerName?: string
  attachment?: string // 房间名称或其他附加信息
}

/**
 * API 响应
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

/**
 * 状态变化事件数据
 */
export interface StatusChangeEvent {
  status: EasyTierStatus
  previousStatus: EasyTierStatus
}

/**
 * 错误事件数据
 */
export interface ErrorEvent {
  message: string
  stack?: string
}
