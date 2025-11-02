import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { EasyTierManager, EasyTierIpcHandler } from './easytier'

// 全局 EasyTier 管理器和 IPC 处理器
let easyTierManager: EasyTierManager
let easyTierIpcHandler: EasyTierIpcHandler

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // 设置主窗口引用到 IPC 处理器
  easyTierIpcHandler.setMainWindow(mainWindow)

  // 当窗口关闭时，确保断开 EasyTier 连接
  mainWindow.on('closed', async () => {
    try {
      await easyTierManager.disconnect()
    } catch (error) {
      console.error('Failed to disconnect EasyTier on window close:', error)
    }
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('tunafish2k.zerotier-pcl')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 初始化 EasyTier 管理器和 IPC 处理器
  // 不传入 executablePath，让它自动检测
  try {
    easyTierManager = new EasyTierManager({
      verbose: is.dev // 开发模式下启用详细日志
    })
  } catch (error) {
    console.error('Failed to initialize EasyTierManager:', error)
    // 显示错误对话框
    const { dialog } = require('electron')
    dialog.showErrorBox(
      'EasyTier 初始化失败',
      `无法找到 EasyTier 可执行文件。\n\n` +
        `请确保已运行: npm run prepare:binaries\n\n` +
        `错误详情: ${error instanceof Error ? error.message : String(error)}`
    )
    app.quit()
    return
  }

  easyTierIpcHandler = new EasyTierIpcHandler(easyTierManager)

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()
})

// Quit when all windows are closed
app.on('window-all-closed', () => {
  app.quit()
})

// 在应用退出前清理资源
app.on('before-quit', async (event) => {
  event.preventDefault()

  try {
    // 断开 EasyTier 连接
    await easyTierManager.disconnect()
    // 清理 IPC 处理器
    easyTierIpcHandler.cleanup()
  } catch (error) {
    console.error('Error during cleanup:', error)
  } finally {
    // 允许应用退出
    app.exit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
