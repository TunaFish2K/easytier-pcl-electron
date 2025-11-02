#!/usr/bin/env node

/**
 * 准备 EasyTier 二进制文件脚本
 *
 * 功能：
 * 1. 在开发时，解压到系统临时目录
 * 2. 在构建时，解压到 resources/binaries 供打包使用
 */

const fs = require('fs')
const path = require('path')
const os = require('os')
const { execSync } = require('child_process')

// 读取配置文件
const configPath = path.join(__dirname, '..', 'easytier.json')
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))

// 获取当前平台和架构
const platform = os.platform() // win32, darwin, linux
const arch = os.arch() // x64, arm64

// 映射 Node.js 平台名称到配置文件中的名称
const platformMap = {
  win32: 'windows',
  darwin: 'darwin',
  linux: 'linux'
}

// 映射架构名称
const archMap = {
  x64: 'x64',
  arm64: 'arm64'
}

// 判断是开发模式还是构建模式
const isBuild = process.argv.includes('--build')
const isAll = process.argv.includes('--all')

console.log(`准备 EasyTier 二进制文件...`)
console.log(`模式: ${isBuild ? '构建' : '开发'}`)
console.log(`平台: ${platform} (${arch})`)

/**
 * 解压压缩包
 */
function extractArchive(archivePath, targetDir) {
  // 确保目标目录存在
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true })
  }

  console.log(`  解压: ${archivePath} -> ${targetDir}`)

  try {
    // 所有平台都使用 ZIP 格式
    if (process.platform === 'win32') {
      // Windows 使用 PowerShell
      const cmd = `powershell -command "Expand-Archive -Path '${archivePath}' -DestinationPath '${targetDir}' -Force"`
      execSync(cmd, { stdio: 'inherit' })
    } else {
      // Unix 系统使用 unzip
      execSync(`unzip -o "${archivePath}" -d "${targetDir}"`, { stdio: 'inherit' })
    }
  } catch (error) {
    console.error(`  解压失败: ${error.message}`)
    throw error
  }
}

/**
 * 设置可执行权限（Unix 系统）
 */
function setExecutable(filePath) {
  if (process.platform !== 'win32') {
    try {
      fs.chmodSync(filePath, 0o755)
      console.log(`  设置可执行权限: ${filePath}`)
    } catch (error) {
      console.error(`  设置权限失败: ${error.message}`)
    }
  }
}

/**
 * 处理单个平台的二进制文件
 */
function processPlatform(platformName, archName) {
  const platformConfig = config.binaries[platformName]
  if (!platformConfig) {
    console.error(`  未找到平台配置: ${platformName}`)
    return
  }

  const archConfig = platformConfig[archName]
  if (!archConfig) {
    console.error(`  未找到架构配置: ${platformName}/${archName}`)
    return
  }

  const { archive, executable } = archConfig
  const archivePath = path.join(__dirname, '..', archive)

  // 检查压缩包是否存在
  if (!fs.existsSync(archivePath)) {
    console.warn(`  警告: 压缩包不存在: ${archivePath}`)
    return
  }

  // 确定目标目录
  let targetDir
  if (isBuild) {
    // 构建模式：解压到 resources/binaries/{platform}/{arch}
    targetDir = path.join(__dirname, '..', 'resources', 'binaries', platformName, archName)
  } else {
    // 开发模式：解压到系统临时目录
    const tempBase = path.join(os.tmpdir(), 'easytier-pcl-electron')
    targetDir = path.join(tempBase, platformName, archName)
  }

  console.log(`\n处理 ${platformName}/${archName}:`)

  // 清理目标目录（如果存在）
  if (fs.existsSync(targetDir)) {
    console.log(`  清理目录: ${targetDir}`)
    fs.rmSync(targetDir, { recursive: true, force: true })
  }

  // 解压
  extractArchive(archivePath, targetDir)

  // 查找可执行文件
  const executablePath = findExecutable(targetDir, executable)
  if (executablePath) {
    // 设置可执行权限
    setExecutable(executablePath)
    console.log(`  ✓ 准备完成: ${executablePath}`)
  } else {
    console.warn(`  警告: 未找到可执行文件: ${executable}`)
  }
}

/**
 * 在目录中查找可执行文件（递归）
 */
function findExecutable(dir, executableName) {
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
 * 主函数
 */
function main() {
  try {
    if (isAll && isBuild) {
      // 构建所有平台的二进制文件
      console.log('\n构建所有平台的二进制文件...\n')

      for (const [platformName, platformConfig] of Object.entries(config.binaries)) {
        for (const archName of Object.keys(platformConfig)) {
          processPlatform(platformName, archName)
        }
      }
    } else {
      // 只处理当前平台
      const mappedPlatform = platformMap[platform]
      const mappedArch = archMap[arch]

      if (!mappedPlatform || !mappedArch) {
        console.error(`不支持的平台或架构: ${platform}/${arch}`)
        process.exit(1)
      }

      processPlatform(mappedPlatform, mappedArch)
    }

    console.log('\n✓ 二进制文件准备完成!')
  } catch (error) {
    console.error(`\n✗ 错误: ${error.message}`)
    process.exit(1)
  }
}

// 执行
main()
