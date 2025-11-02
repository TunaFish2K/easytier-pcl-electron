import { createServer } from 'net'

/**
 * 获取一个可用的端口号（跨平台）
 * @param minPort 最小端口号（默认 10000）
 * @param maxPort 最大端口号（默认 60000）
 * @returns Promise<number> 可用的端口号
 */
export async function getAvailablePort(minPort: number = 10000, maxPort: number = 60000): Promise<number> {
  return new Promise((resolve, reject) => {
    // 使用端口 0 让系统自动分配一个可用端口
    const server = createServer()

    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (address && typeof address === 'object') {
        const port = address.port
        server.close(() => {
          // 确保端口在指定范围内
          if (port >= minPort && port <= maxPort) {
            resolve(port)
          } else {
            // 如果系统分配的端口不在范围内，重试
            getAvailablePort(minPort, maxPort).then(resolve).catch(reject)
          }
        })
      } else {
        server.close()
        reject(new Error('Failed to get server address'))
      }
    })

    server.on('error', (err) => {
      reject(err)
    })
  })
}

/**
 * 检查端口是否可用
 * @param port 要检查的端口号
 * @returns Promise<boolean> 端口是否可用
 */
export async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer()

    server.listen(port, '127.0.0.1', () => {
      server.close(() => {
        resolve(true)
      })
    })

    server.on('error', () => {
      resolve(false)
    })
  })
}
