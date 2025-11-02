import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { app } from 'electron'

/**
 * 二进制文件路径解析工具
 */

// 读取配置文件
let config: any = null

function loadConfig() {
  if (!config) {
    const configPath = path.join(__dirname, '../../easytier.json')
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
  }
  return config
}

// 平台映射
const platformMap: Record<string, string> = {
  win32: 'windows',
  darwin: 'darwin',
  linux: 'linux'
}

// 架构映射
const archMap: Record<string, string> = {
  x64: 'x64',
  arm64: 'arm64'
}

/**
 * 获取当前平台的可执行文件名
 */
function getExecutableName(): string {
  const cfg = loadConfig()
  const platform = platformMap[process.platform]
  const arch = archMap[process.arch]

  if (!platform || !arch) {
    throw new Error(`Unsupported platform or architecture: ${process.platform}/${process.arch}`)
  }

  const platformConfig = cfg.binaries[platform]
  if (!platformConfig) {
    throw new Error(`No configuration found for platform: ${platform}`)
  }

  const archConfig = platformConfig[arch]
  if (!archConfig) {
    throw new Error(`No configuration found for architecture: ${platform}/${arch}`)
  }

  return archConfig.executable
}

/**
 * 查找可执行文件（递归）
 */
function findExecutable(dir: string, executableName: string): string | null {
  // 先在当前目录查找
  const directPath = path.join(dir, executableName)
  if (fs.existsSync(directPath)) {
    return directPath
  }

  // 递归查找子目录
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const found = findExecutable(path.join(dir, entry.name), executableName)
        if (found) return found
      } else if (entry.name === executableName) {
        return path.join(dir, entry.name)
      }
    }
  } catch (error) {
    // 忽略错误
  }

  return null
}

/**
 * 获取 EasyTier 可执行文件路径
 *
 * 开发环境：从系统临时目录获取
 * 生产环境：从 app.asar.unpacked/resources 获取
 */
export function getEasyTierExecutablePath(): string {
  const platform = platformMap[process.platform]
  const arch = archMap[process.arch]
  const executableName = getExecutableName()

  if (!platform || !arch) {
    throw new Error(`Unsupported platform or architecture: ${process.platform}/${process.arch}`)
  }

  let searchDir: string

  if (app.isPackaged) {
    // 生产环境：从 resources/binaries 获取
    searchDir = path.join(process.resourcesPath, 'binaries', platform, arch)
  } else {
    // 开发环境：从系统临时目录获取
    const tempBase = path.join(os.tmpdir(), 'easytier-pcl-electron')
    searchDir = path.join(tempBase, platform, arch)
  }

  // 查找可执行文件
  const executablePath = findExecutable(searchDir, executableName)

  if (!executablePath) {
    throw new Error(
      `EasyTier executable not found. ` +
        `Please run 'npm run prepare:binaries' first. ` +
        `Search directory: ${searchDir}, ` +
        `Executable name: ${executableName}`
    )
  }

  if (!fs.existsSync(executablePath)) {
    throw new Error(`EasyTier executable not found at: ${executablePath}`)
  }

  return executablePath
}

/**
 * 检查二进制文件是否已准备好
 */
export function isBinaryReady(): boolean {
  try {
    const executablePath = getEasyTierExecutablePath()
    return fs.existsSync(executablePath)
  } catch (error) {
    return false
  }
}
