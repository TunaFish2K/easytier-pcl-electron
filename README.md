# Minecraft 联机助手

基于 EasyTier 和 Electron 的 Minecraft 联机解决方案，使用 PCL 协议实现简单快捷的联机体验。

## 功能特性

- 🏠 **房主模式**: 创建房间并生成邀请码
- 🚪 **加入模式**: 通过邀请码快速加入房间
- 📊 **实时监控**: 实时查看 EasyTier 连接状态和日志
- 🔒 **安全设计**: 基于 ChaCha20 加密，白名单端口控制
- 📋 **一键分享**: 快速复制邀请码和服务器地址

## 技术栈

- **框架**: Electron + Vue 3 + TypeScript
- **网络**: EasyTier (P2P 虚拟组网)
- **协议**: PCL (Pure Connect Labeling) 简洁联机标记约定
- **模块**: easytier-pcl (PCL 协议 Node.js 实现)

## 前置要求

1. **Node.js** >= 16.x
2. **EasyTier Core** 可执行文件
   - 下载地址: https://github.com/EasyTier/EasyTier/releases
   - 将 `easytier-core` 放在系统 PATH 中或项目目录

## 项目设置

### 安装依赖

使用 npm:
```bash
npm install
```

使用 cnpm (推荐国内用户):
```bash
cnpm i
```

### 开发模式

```bash
npm run dev
# 或
cnpm run dev
```

### 构建应用

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

## 使用指南

### 作为房主

1. 点击"作为房主"按钮
2. 填写房间信息：
   - 房间名称（可选）
   - 服务器端口（默认 25565）
   - 最大玩家数
3. 点击"创建房间"
4. 复制生成的邀请码分享给朋友
5. 在 Minecraft 中启动服务器，监听对应端口

### 作为玩家

1. 点击"加入房间"按钮
2. 输入房主提供的邀请码
3. 输入你的玩家名称
4. 点击"加入房间"
5. 在 Minecraft 中输入服务器地址 `10.114.114.114:端口` 即可加入

## 项目结构

```
src/
├── main/                   # 主进程
│   ├── easytier/          # EasyTier 管理模块
│   │   ├── manager.ts     # 核心管理器（进程管理、状态监控）
│   │   ├── ipc-handler.ts # IPC 通信处理器
│   │   └── index.ts       # 导出文件
│   └── index.ts           # 主进程入口
├── preload/               # 预加载脚本
└── renderer/              # 渲染进程
    ├── src/
    │   ├── views/         # 页面组件
    │   │   ├── Home.vue           # 主选择页面
    │   │   ├── HostSetup.vue      # 房主设置
    │   │   ├── JoinRoom.vue       # 加入房间
    │   │   └── RoomInfo.vue       # 房间信息
    │   ├── composables/   # 组合式函数
    │   │   └── useEasyTier.ts     # EasyTier API 封装
    │   ├── types/         # 类型定义
    │   │   └── easytier.ts        # EasyTier 类型
    │   ├── router/        # 路由配置
    │   └── App.vue        # 根组件
    └── index.html
```

## 核心模块说明

### EasyTierManager

位于 `src/main/easytier/manager.ts`，负责:
- EasyTier 子进程的生命周期管理
- 实时状态监控（IDLE, STARTING, RUNNING, STOPPING, STOPPED, ERROR）
- 日志收集和转发
- 房间创建和加入逻辑

主要方法:
```typescript
// 创建房间（房主）
await manager.createRoom(port: number): Promise<RoomInfo>

// 加入房间（客户端）
await manager.joinRoom(invitationCode: string, playerName: string): Promise<RoomInfo>

// 断开连接
await manager.disconnect(): Promise<void>

// 获取状态
manager.getStatus(): EasyTierStatus

// 获取日志
manager.getLogs(): LogEntry[]
```

事件:
- `statusChange` - 状态变化
- `log` - 新日志
- `error` - 错误
- `connected` - 连接成功
- `disconnected` - 断开连接

### useEasyTier

位于 `src/renderer/src/composables/useEasyTier.ts`，提供 Vue 组件使用的 API:
```typescript
const {
  status,        // 当前状态
  roomInfo,      // 房间信息
  logs,          // 日志列表
  error,         // 错误信息
  loading,       // 加载状态
  createRoom,    // 创建房间方法
  joinRoom,      // 加入房间方法
  disconnect     // 断开连接方法
} = useEasyTier()
```

## 配置说明

### EasyTier 可执行文件路径

在 `src/main/index.ts` 中配置:
```typescript
easyTierManager = new EasyTierManager({
  executablePath: 'easytier-core', // 或完整路径 '/path/to/easytier-core'
  verbose: is.dev
})
```

### PCL 协议参数

PCL 协议固定参数（由 easytier-pcl 管理）:
- 房主虚拟 IP: `10.114.114.114`
- 加密算法: `chacha20`
- 网络名称格式: `P[端口16进制]-[随机5字符]`
- 网络密钥: 随机5字符

## 常见问题

### 1. 找不到 easytier-core

确保 easytier-core 可执行文件在系统 PATH 中，或在配置中提供完整路径。

### 2. 连接失败

- 检查网络连接
- 确保邀请码正确
- 查看日志中的错误信息

### 3. Minecraft 无法连接服务器

- 确保房主已启动 Minecraft 服务器
- 服务器端口要与创建房间时填写的端口一致
- 客户端连接地址为 `10.114.114.114:端口`

## 开发相关

### 推荐 IDE

- [VSCode](https://code.visualstudio.com/)
- 扩展:
  - ESLint
  - Prettier
  - Volar (Vue 语言支持)

### 代码规范

项目使用 ESLint + Prettier 进行代码格式化:
```bash
# 格式化代码
npm run format

# 检查代码
npm run lint
```

### 类型检查

```bash
# 检查所有类型
npm run typecheck

# 仅检查主进程
npm run typecheck:node

# 仅检查渲染进程
npm run typecheck:web
```

## 许可证

MIT

## 相关链接

- [EasyTier](https://github.com/EasyTier/EasyTier) - P2P 虚拟组网工具
- [easytier-pcl](https://github.com/TunaFish2K/node-easytier-pcl) - PCL 协议 Node.js 实现
- [PCL 协议文档](https://github.com/Meloong-Git/PCL/wiki/简洁联机标记约定)

