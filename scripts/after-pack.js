const fs = require('fs')
const path = require('path')

/**
 * afterPack hook
 * 确保打包后的二进制文件具有可执行权限
 */
exports.default = async function (context) {
  const { appOutDir, electronPlatformName } = context

  console.log('Running afterPack hook...')
  console.log('Platform:', electronPlatformName)
  console.log('Output directory:', appOutDir)

  // 仅在 Unix 系统（Linux/macOS）上处理
  if (electronPlatformName === 'linux' || electronPlatformName === 'darwin') {
    const binariesDir = path.join(appOutDir, 'resources', 'binaries')

    if (!fs.existsSync(binariesDir)) {
      console.warn('Binaries directory not found:', binariesDir)
      return
    }

    // 递归查找所有 easytier-core 文件并设置可执行权限
    function setExecutablePermissions(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)

        if (entry.isDirectory()) {
          setExecutablePermissions(fullPath)
        } else if (entry.name === 'easytier-core' || entry.name === 'easytier-core.exe') {
          try {
            fs.chmodSync(fullPath, 0o755)
            console.log('Set executable permission for:', fullPath)
          } catch (err) {
            console.error('Failed to set permission for', fullPath, err)
          }
        }
      }
    }

    setExecutablePermissions(binariesDir)
    console.log('AfterPack hook completed')
  }
}
