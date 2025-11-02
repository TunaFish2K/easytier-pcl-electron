import { ChildProcess, spawn, execSync } from 'child_process'
import { EventEmitter } from 'events'
import {
  generateInvitationCode,
  parseInvitationCode,
  getAvailableNodes,
  generateEasyTierArguments
} from 'easytier-pcl'
import { getEasyTierExecutablePath } from './binary-path'

/**
 * EasyTier 进程状态
 */
export enum EasyTierStatus {
  IDLE = 'idle', // 未启动
  STARTING = 'starting', // 启动中
  RUNNING = 'running', // 运行中
  STOPPING = 'stopping', // 停止中
  STOPPED = 'stopped', // 已停止
  ERROR = 'error' // 错误状态
}

/**
 * EasyTier 角色
 */
export type EasyTierRole = 'host' | 'client'

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
  role: EasyTierRole
  hostIp: string
  playerName?: string
  attachment?: string // 房间名称或其他附加信息
}

/**
 * EasyTier Manager 配置
 */
export interface EasyTierManagerConfig {
  /**
   * easytier-core 可执行文件路径
   * 如果不提供，将尝试从 PATH 中查找
   */
  executablePath?: string

  /**
   * 是否启用详细日志
   */
  verbose?: boolean

  /**
   * 最大日志条目数量（防止内存溢出）
   */
  maxLogEntries?: number

  /**
   * sudo 密码（仅用于 Unix 系统）
   * 如果提供，将使用 sudo 运行 easytier-core
   */
  sudoPassword?: string
}

/**
 * EasyTier Manager 事件
 */
export interface EasyTierManagerEvents {
  statusChange: (status: EasyTierStatus, previousStatus: EasyTierStatus) => void
  log: (entry: LogEntry) => void
  error: (error: Error) => void
  connected: () => void
  disconnected: () => void
}

/**
 * 生成5位随机字符串（0-9A-Z）
 */
function generateRandomId(): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let result = ''
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * EasyTier 管理器类
 * 负责管理 easytier-core 子进程的生命周期和状态
 */
export class EasyTierManager extends EventEmitter {
  private process: ChildProcess | null = null
  private status: EasyTierStatus = EasyTierStatus.IDLE
  private roomInfo: RoomInfo | null = null
  private logs: LogEntry[] = []
  private config: Omit<Required<EasyTierManagerConfig>, 'sudoPassword'> & {
    sudoPassword?: string
  }
  private sudoPassword: string | null = null

  // 默认配置
  private static readonly DEFAULT_CONFIG: Omit<
    Required<EasyTierManagerConfig>,
    'executablePath' | 'sudoPassword'
  > = {
    verbose: false,
    maxLogEntries: 1000
  }

  // 固定的房主 IP
  private static readonly HOST_IP = '10.114.114.114'

  constructor(config: EasyTierManagerConfig = {}) {
    super()

    // 如果没有提供 executablePath，使用自动检测的路径
    let executablePath = config.executablePath
    if (!executablePath) {
      try {
        executablePath = getEasyTierExecutablePath()
      } catch (error) {
        // 如果自动检测失败，抛出错误
        const errMsg = `Failed to locate EasyTier executable: ${error instanceof Error ? error.message : String(error)}`
        console.error(`[EasyTierManager] ${errMsg}`)
        throw new Error(errMsg)
      }
    }

    this.config = {
      ...EasyTierManager.DEFAULT_CONFIG,
      ...config,
      executablePath
    }

    if (config.sudoPassword) {
      this.sudoPassword = config.sudoPassword
    }

    // 延迟记录日志，确保 EventEmitter 已初始化
    setImmediate(() => {
      this.addLog(LogLevel.INFO, `Using EasyTier executable: ${executablePath}`, 'system')
    })
  }

  /**
   * 检测当前平台是否为 Unix (Linux/macOS)
   */
  private static isUnixPlatform(): boolean {
    return process.platform === 'linux' || process.platform === 'darwin'
  }

  /**
   * 检测是否需要 root 权限
   * 在 Unix 系统下，easytier-core 需要 root 权限来创建网络接口
   */
  static requiresRootPermission(): boolean {
    return EasyTierManager.isUnixPlatform()
  }

  /**
   * 设置 sudo 密码
   */
  setSudoPassword(password: string): void {
    this.sudoPassword = password
  }

  /**
   * 清除 sudo 密码
   */
  clearSudoPassword(): void {
    this.sudoPassword = null
  }

  /**
   * 获取当前状态
   */
  getStatus(): EasyTierStatus {
    return this.status
  }

  /**
   * 获取房间信息
   */
  getRoomInfo(): RoomInfo | null {
    return this.roomInfo
  }

  /**
   * 获取日志
   */
  getLogs(): LogEntry[] {
    return [...this.logs]
  }

  /**
   * 清空日志
   */
  clearLogs(): void {
    this.logs = []
  }

  /**
   * 作为房主创建房间
   */
  async createRoom(port: number, roomName?: string): Promise<RoomInfo> {
    // 只有运行中、启动中、停止中状态不允许创建房间
    if (
      this.status === EasyTierStatus.RUNNING ||
      this.status === EasyTierStatus.STARTING ||
      this.status === EasyTierStatus.STOPPING
    ) {
      throw new Error(`Cannot create room: current status is ${this.status}`)
    }

    this.addLog(LogLevel.INFO, 'Creating room as host...', 'system')
    this.setStatus(EasyTierStatus.STARTING)

    try {
      // 生成邀请码，房间名称作为 attachment
      const invitationCode = generateInvitationCode(port, roomName ? `-${roomName}` : undefined)
      const codeData = parseInvitationCode(invitationCode)

      this.addLog(LogLevel.INFO, `Generated invitation code: ${invitationCode}`, 'system')
      if (roomName) {
        this.addLog(LogLevel.INFO, `Room name: ${roomName}`, 'system')
      }

      // 获取可用节点
      this.addLog(LogLevel.INFO, 'Fetching available nodes...', 'system')
      const nodes = await getAvailableNodes()
      this.addLog(LogLevel.INFO, `Found ${nodes.length} available nodes`, 'system')

      // 生成主机名：Server-${5位随机字符串}
      const hostname = `Server-${generateRandomId()}`
      this.addLog(LogLevel.INFO, `Host hostname: ${hostname}`, 'system')

      // 生成命令行参数
      const args = generateEasyTierArguments({
        invitationCode,
        nodes,
        role: 'host',
        hostname
      })

      // 保存房间信息
      this.roomInfo = {
        invitationCode,
        networkName: codeData.networkName,
        networkSecret: codeData.networkSecret,
        port: codeData.port,
        role: 'host',
        hostIp: EasyTierManager.HOST_IP,
        attachment: codeData.attachment
      }

      // 启动进程
      await this.startProcess(args)

      return this.roomInfo
    } catch (error) {
      this.setStatus(EasyTierStatus.ERROR)
      this.addLog(LogLevel.ERROR, `Failed to create room: ${error}`, 'system')
      throw error
    }
  }

  /**
   * 作为客户端加入房间
   */
  async joinRoom(invitationCode: string, playerName: string): Promise<RoomInfo> {
    // 只有运行中、启动中、停止中状态不允许加入房间
    if (
      this.status === EasyTierStatus.RUNNING ||
      this.status === EasyTierStatus.STARTING ||
      this.status === EasyTierStatus.STOPPING
    ) {
      throw new Error(`Cannot join room: current status is ${this.status}`)
    }

    this.addLog(LogLevel.INFO, 'Joining room as client...', 'system')
    this.setStatus(EasyTierStatus.STARTING)

    try {
      // 解析邀请码
      const codeData = parseInvitationCode(invitationCode)
      this.addLog(LogLevel.INFO, `Parsed invitation code: ${invitationCode}`, 'system')

      // 获取可用节点
      this.addLog(LogLevel.INFO, 'Fetching available nodes...', 'system')
      const nodes = await getAvailableNodes()
      this.addLog(LogLevel.INFO, `Found ${nodes.length} available nodes`, 'system')

      // 生成客户端主机名后缀：Client-${5位随机字符串}
      // playerName 已经是5位随机字符串（例如 "A1B2C"）
      const hostnameSuffix = `-${playerName}`
      this.addLog(LogLevel.INFO, `Client hostname suffix: ${hostnameSuffix}`, 'system')

      // 生成命令行参数
      const args = generateEasyTierArguments({
        invitationCode,
        nodes,
        role: 'client',
        hostnameSuffix,
        portToForward: codeData.port // 使用邀请码中的端口
      })

      // 保存房间信息
      this.roomInfo = {
        invitationCode,
        networkName: codeData.networkName,
        networkSecret: codeData.networkSecret,
        port: codeData.port,
        role: 'client',
        hostIp: EasyTierManager.HOST_IP,
        playerName,
        attachment: codeData.attachment
      }

      // 启动进程
      await this.startProcess(args)

      return this.roomInfo
    } catch (error) {
      this.setStatus(EasyTierStatus.ERROR)
      this.addLog(LogLevel.ERROR, `Failed to join room: ${error}`, 'system')
      throw error
    }
  }

  /**
   * 断开连接（停止进程）
   */
  async disconnect(): Promise<void> {
    if (this.status === EasyTierStatus.IDLE || this.status === EasyTierStatus.STOPPED) {
      this.addLog(LogLevel.WARN, 'Already disconnected', 'system')
      return
    }

    this.addLog(LogLevel.INFO, 'Disconnecting...', 'system')
    this.setStatus(EasyTierStatus.STOPPING)

    try {
      await this.stopProcess()
      this.roomInfo = null
      this.setStatus(EasyTierStatus.STOPPED)
      this.emit('disconnected')
      this.addLog(LogLevel.INFO, 'Disconnected successfully', 'system')
    } catch (error) {
      this.setStatus(EasyTierStatus.ERROR)
      this.addLog(LogLevel.ERROR, `Failed to disconnect: ${error}`, 'system')
      throw error
    }
  }

  /**
   * 重置管理器（回到 IDLE 状态）
   */
  reset(): void {
    if (this.process) {
      this.process.kill('SIGKILL')
      this.process = null
    }

    // 确保清理所有 easytier-core 进程
    const needsRoot = EasyTierManager.requiresRootPermission()
    if (needsRoot) {
      try {
        execSync('pkill -9 easytier-core', { stdio: 'ignore' })
      } catch (err) {
        // 忽略错误
      }
    }

    // 清理临时文件
    try {
      const fs = require('fs')
      const path = require('path')
      const os = require('os')
      const tmpDir = path.join(os.tmpdir(), 'easytier-pcl-electron-runtime')
      const tmpExecutable = path.join(tmpDir, 'easytier-core')

      if (fs.existsSync(tmpExecutable)) {
        fs.unlinkSync(tmpExecutable)
      }

      if (fs.existsSync(tmpDir) && fs.readdirSync(tmpDir).length === 0) {
        fs.rmdirSync(tmpDir)
      }
    } catch (err) {
      // 忽略清理错误
    }

    this.status = EasyTierStatus.IDLE
    this.roomInfo = null
    this.clearLogs()
  }

  /**
   * 启动子进程
   */
  private async startProcess(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      // 检查是否需要 root 权限
      const needsRoot = EasyTierManager.requiresRootPermission()

      this.addLog(
        LogLevel.INFO,
        `Platform: ${process.platform}, Needs root: ${needsRoot}`,
        'system'
      )

      if (needsRoot && !this.sudoPassword) {
        const error = new Error('Root permission required but no sudo password provided')
        this.addLog(LogLevel.ERROR, error.message, 'system')
        reject(error)
        return
      }

      let command: string
      let commandArgs: string[]
      let executablePath = this.config.executablePath

      // 检查是否在 AppImage 环境中（路径包含 .mount_ 或 /tmp/.mount）
      const isAppImage = executablePath.includes('/.mount_') || executablePath.includes('/tmp/.mount')

      if (isAppImage && needsRoot) {
        this.addLog(
          LogLevel.INFO,
          'Detected AppImage environment with sudo requirement',
          'system'
        )

        // 在 AppImage 环境中，sudo 无法访问 FUSE 挂载的文件
        // 需要将可执行文件复制到真实文件系统
        const fs = require('fs')
        const path = require('path')
        const os = require('os')

        const tmpDir = path.join(os.tmpdir(), 'easytier-pcl-electron-runtime')
        const tmpExecutable = path.join(tmpDir, 'easytier-core')

        try {
          // 创建临时目录
          if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true })
            this.addLog(LogLevel.INFO, `Created temp directory: ${tmpDir}`, 'system')
          }

          // 复制可执行文件到临时目录
          fs.copyFileSync(executablePath, tmpExecutable)
          fs.chmodSync(tmpExecutable, 0o755)
          this.addLog(
            LogLevel.INFO,
            `Copied executable to: ${tmpExecutable}`,
            'system'
          )

          // 使用临时目录中的文件
          executablePath = tmpExecutable
        } catch (error) {
          const errMsg = `Failed to copy executable to temp directory: ${error}`
          this.addLog(LogLevel.ERROR, errMsg, 'system')
          reject(new Error(errMsg))
          return
        }
      }

      if (needsRoot && this.sudoPassword) {
        // 在 Unix 系统上使用 sudo
        command = 'sudo'
        commandArgs = ['-S', executablePath, ...args]

        this.addLog(
          LogLevel.INFO,
          `Starting EasyTier with sudo: sudo -S ${executablePath} ${args.join(' ')}`,
          'system'
        )
      } else {
        // 在其他系统上直接运行
        command = executablePath
        commandArgs = args

        this.addLog(
          LogLevel.INFO,
          `Starting EasyTier: ${executablePath} ${args.join(' ')}`,
          'system'
        )
      }

      // 检查可执行文件是否存在
      const fs = require('fs')
      if (!fs.existsSync(executablePath)) {
        const error = new Error(`Executable not found: ${executablePath}`)
        this.addLog(LogLevel.ERROR, error.message, 'system')
        reject(error)
        return
      }

      this.addLog(
        LogLevel.INFO,
        `Executable exists at: ${executablePath}`,
        'system'
      )

      try {
        this.addLog(LogLevel.INFO, `Spawning process: ${command}`, 'system')
        this.addLog(LogLevel.INFO, `Arguments: ${commandArgs.join(' ')}`, 'system')

        this.process = spawn(command, commandArgs, {
          stdio: ['pipe', 'pipe', 'pipe']
        })

        this.addLog(LogLevel.INFO, `Process spawned with PID: ${this.process.pid}`, 'system')

        // 如果使用 sudo，写入密码到 stdin
        if (needsRoot && this.sudoPassword && this.process.stdin) {
          this.process.stdin.write(this.sudoPassword + '\n')
          this.process.stdin.end()
          this.addLog(LogLevel.DEBUG, 'Sudo password sent to stdin', 'system')
        }

        // 监听 stdout
        this.process.stdout?.on('data', (data: Buffer) => {
          const message = data.toString().trim()
          if (message) {
            this.addLog(LogLevel.INFO, message, 'stdout')
          }
        })

        // 监听 stderr
        this.process.stderr?.on('data', (data: Buffer) => {
          const message = data.toString().trim()
          if (message) {
            // 过滤 sudo 密码提示
            if (!message.includes('[sudo]') && !message.includes('password')) {
              // EasyTier 有时会把普通信息也输出到 stderr，所以这里用 WARN 而不是 ERROR
              this.addLog(LogLevel.WARN, message, 'stderr')
            }
          }
        })

        // 监听进程错误
        this.process.on('error', (error: Error) => {
          this.addLog(LogLevel.ERROR, `Process error: ${error.message}`, 'system')
          this.addLog(LogLevel.ERROR, `Error stack: ${error.stack}`, 'system')
          this.setStatus(EasyTierStatus.ERROR)
          this.emit('error', error)
          reject(error)
        })

        // 监听进程退出
        this.process.on('exit', (code: number | null, signal: string | null) => {
          const message = `Process exited with code ${code}, signal ${signal}`
          this.addLog(LogLevel.INFO, message, 'system')

          if (this.status === EasyTierStatus.STOPPING) {
            this.setStatus(EasyTierStatus.STOPPED)
          } else if (code !== 0) {
            // 检查是否为 sudo 密码错误
            if (code === 1 && needsRoot) {
              this.addLog(
                LogLevel.ERROR,
                'Sudo authentication failed. Please check your password.',
                'system'
              )
              const authError = new Error('Sudo authentication failed')
              this.emit('error', authError)
            }
            this.setStatus(EasyTierStatus.ERROR)
          } else {
            this.setStatus(EasyTierStatus.STOPPED)
          }

          this.process = null
        })

        // 等待一小段时间确保进程启动成功
        setTimeout(() => {
          if (this.process && !this.process.killed) {
            this.setStatus(EasyTierStatus.RUNNING)
            this.emit('connected')
            this.addLog(LogLevel.INFO, 'EasyTier started successfully', 'system')
            resolve()
          } else {
            reject(new Error('Process failed to start'))
          }
        }, 1000)
      } catch (error) {
        this.addLog(LogLevel.ERROR, `Failed to spawn process: ${error}`, 'system')
        reject(error)
      }
    })
  }

  /**
   * 停止子进程
   */
  private async stopProcess(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.process) {
        resolve()
        return
      }

      const needsRoot = EasyTierManager.requiresRootPermission()

      const timeout = setTimeout(() => {
        if (this.process && !this.process.killed) {
          this.addLog(LogLevel.WARN, 'Process did not exit gracefully, killing...', 'system')
          this.process.kill('SIGKILL')

          // 如果是通过 sudo 启动的，额外确保 easytier-core 进程被终止
          if (needsRoot) {
            try {
              // 使用 pkill 强制终止所有 easytier-core 进程
              execSync('pkill -9 easytier-core', { stdio: 'ignore' })
              this.addLog(LogLevel.INFO, 'Forcefully killed easytier-core processes', 'system')
            } catch (err) {
              // pkill 可能会因为没有找到进程而失败，这是正常的
              this.addLog(LogLevel.DEBUG, 'pkill command failed (process may already be dead)', 'system')
            }
          }
        }
      }, 5000)

      this.process.once('exit', () => {
        clearTimeout(timeout)

        // 进程退出后，再次确保没有遗留的 easytier-core 进程
        if (needsRoot) {
          setTimeout(() => {
            try {
              execSync('pkill -9 easytier-core', { stdio: 'ignore' })
            } catch (err) {
              // 忽略错误
            }
          }, 500)
        }

        // 清理临时文件（如果在 AppImage 中创建过）
        try {
          const fs = require('fs')
          const path = require('path')
          const os = require('os')
          const tmpDir = path.join(os.tmpdir(), 'easytier-pcl-electron-runtime')
          const tmpExecutable = path.join(tmpDir, 'easytier-core')

          if (fs.existsSync(tmpExecutable)) {
            fs.unlinkSync(tmpExecutable)
            this.addLog(LogLevel.DEBUG, `Cleaned up temp executable: ${tmpExecutable}`, 'system')
          }

          // 尝试删除临时目录（如果为空）
          if (fs.existsSync(tmpDir) && fs.readdirSync(tmpDir).length === 0) {
            fs.rmdirSync(tmpDir)
            this.addLog(LogLevel.DEBUG, `Removed temp directory: ${tmpDir}`, 'system')
          }
        } catch (err) {
          // 忽略清理错误
          this.addLog(LogLevel.DEBUG, `Failed to clean temp files: ${err}`, 'system')
        }

        resolve()
      })

      // 尝试优雅退出
      this.process.kill('SIGTERM')

      // 如果是通过 sudo 启动的，也尝试终止 easytier-core 进程
      if (needsRoot) {
        setTimeout(() => {
          try {
            execSync('pkill easytier-core', { stdio: 'ignore' })
            this.addLog(LogLevel.INFO, 'Sent SIGTERM to easytier-core processes', 'system')
          } catch (err) {
            // pkill 可能会因为没有找到进程而失败，这是正常的
          }
        }, 100)
      }
    })
  }

  /**
   * 设置状态
   */
  private setStatus(newStatus: EasyTierStatus): void {
    const oldStatus = this.status
    if (oldStatus !== newStatus) {
      this.status = newStatus
      this.addLog(LogLevel.INFO, `Status changed: ${oldStatus} -> ${newStatus}`, 'system')
      this.emit('statusChange', newStatus, oldStatus)
    }
  }

  /**
   * 添加日志
   */
  private addLog(level: LogLevel, message: string, source: 'stdout' | 'stderr' | 'system'): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      source
    }

    this.logs.push(entry)

    // 限制日志数量
    if (this.logs.length > this.config.maxLogEntries) {
      this.logs.shift()
    }

    this.emit('log', entry)

    // 始终输出日志到控制台（包括生产环境）
    const timestamp = entry.timestamp.toLocaleTimeString('zh-CN')
    const prefix = `[EasyTier ${level.toUpperCase()}] [${source}] ${timestamp}`

    switch (level) {
      case LogLevel.ERROR:
        console.error(prefix, message)
        break
      case LogLevel.WARN:
        console.warn(prefix, message)
        break
      case LogLevel.DEBUG:
        console.debug(prefix, message)
        break
      default:
        console.log(prefix, message)
    }
  }
}
