<template>
  <div class="room-info-container">
    <div class="room-card">
      <div class="status-badge" :class="statusClass">{{ statusText }}</div>

      <h1>{{ isHost ? '房间管理' : '已加入房间' }}</h1>

      <!-- 连接地址卡片 -->
      <div v-if="roomInfo && roomInfo.portForwarded" class="connection-address-card">
        <h2>本地连接地址</h2>
        <div class="address-display">
          <code class="address-text">127.0.0.1:{{ roomInfo.portForwarded }}</code>
          <button @click="copyConnectionAddress" class="copy-icon-btn" title="复制地址">
            📋
          </button>
        </div>
        <p class="address-hint">在 Minecraft 中使用此地址进行多人游戏连接</p>
      </div>

      <div class="info-section">
        <h2>房间信息</h2>
        <div v-if="isLoading" class="empty-state">正在加载房间信息...</div>
        <div v-else-if="!roomInfo && status === 'starting'" class="empty-state">正在建立连接...</div>
        <div v-else-if="roomInfo" class="info-grid">
          <div class="info-item">
            <span class="label">邀请码:</span>
            <span class="value">{{ roomInfo.invitationCode }}</span>
            <button @click="copyToClipboard(roomInfo.invitationCode)" class="copy-btn">
              复制
            </button>
          </div>

          <div v-if="roomInfo.attachment" class="info-item">
            <span class="label">房间名称:</span>
            <span class="value">{{ roomInfo.attachment.startsWith('-') ? roomInfo.attachment.slice(1) :
              roomInfo.attachment }}</span>
          </div>

          <div class="info-item">
            <span class="label">角色:</span>
            <span class="value">{{ roomInfo.role === 'host' ? '房主' : '客户端' }}</span>
          </div>

          <div v-if="!isHost && roomInfo.playerName" class="info-item">
            <span class="label">玩家名称:</span>
            <span class="value">{{ roomInfo.playerName }}</span>
          </div>
        </div>
        <div v-else class="empty-state">暂无房间信息</div>
      </div>

      <div class="info-section">
        <h2>连接日志</h2>
        <div class="logs-container">
          <div v-if="displayLogs.length > 0" class="logs-list">
            <div v-for="(log, index) in displayLogs" :key="index" class="log-entry">
              <span class="log-time">{{ formatTime(log.timestamp) }}</span>
              <span class="log-level" :style="{ color: getLevelColor(log.level) }">
                [{{ log.level.toUpperCase() }}]
              </span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>
          <div v-else class="empty-state">暂无日志</div>
        </div>
      </div>

      <div class="button-group">
        <!-- 大的复制连接地址按钮 -->
        <button
          v-if="roomInfo && roomInfo.portForwarded"
          @click="copyConnectionAddress"
          class="btn btn-info btn-large"
          :disabled="isLoading">
          📋 复制连接地址
        </button>
        <button @click="disconnect" class="btn btn-danger" :disabled="isLoading">{{ isHost ? '关闭房间' : '离开房间' }}</button>
      </div>

      <div v-if="message" class="message" :class="messageType">{{ message }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useEasyTier } from '../composables/useEasyTier'

const router = useRouter()
const route = useRoute()
const { roomInfo, status, logs, disconnect: disconnectEasyTier, getRoomInfo } = useEasyTier()

const isHost = computed(() => route.query.type === 'host')
const message = ref('')
const messageType = ref('info')
const isLoading = ref(true)

// 定时器引用
let refreshTimer: NodeJS.Timeout | null = null

// 监听 roomInfo 变化，当有数据时结束加载状态
watch(roomInfo, (newVal) => {
  if (newVal) {
    isLoading.value = false
    console.log('[RoomInfo] Room info loaded:', newVal)
  }
}, { immediate: true })

// 本地日志显示（限制显示最新的 50 条）
const displayLogs = computed(() => {
  return logs.value.slice(-50).reverse()
})

const statusClass = computed(() => {
  return status.value === 'running' ? 'status-active' : 'status-inactive'
})

const statusText = computed(() => {
  const statusMap = {
    idle: '未连接',
    starting: '启动中',
    running: '运行中',
    stopping: '停止中',
    stopped: '已停止',
    error: '错误'
  }
  return statusMap[status.value] || '未知'
})

/**
 * 开始定时刷新
 */
const startRefreshTimer = () => {
  // 每3秒刷新一次房间信息
  refreshTimer = setInterval(async () => {
    await getRoomInfo()
  }, 3000)
}

/**
 * 停止定时刷新
 */
const stopRefreshTimer = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

onMounted(() => {
  console.log('[RoomInfo] Component mounted, starting refresh timer')
  // useEasyTier 会自动在 onMounted 时调用 getRoomInfo()
  // 所以这里只需要启动定时刷新
  startRefreshTimer()

  // 设置一个超时，如果3秒后还没有数据，结束加载状态
  setTimeout(() => {
    if (!roomInfo.value) {
      console.log('[RoomInfo] Timeout: No room info after 3 seconds')
      isLoading.value = false
    }
  }, 3000)
})

onUnmounted(() => {
  console.log('[RoomInfo] Component unmounting, stopping refresh timer')
  // 清理定时器
  stopRefreshTimer()
})

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    message.value = '已复制到剪贴板'
    messageType.value = 'success'
    setTimeout(() => {
      message.value = ''
    }, 3000)
  })
}

const copyConnectionAddress = () => {
  if (roomInfo.value && roomInfo.value.portForwarded) {
    const address = `127.0.0.1:${roomInfo.value.portForwarded}`
    copyToClipboard(address)
  }
}

const disconnect = async () => {
  message.value = isHost.value ? '正在关闭房间...' : '正在离开房间...'
  messageType.value = 'info'

  // 停止定时刷新
  stopRefreshTimer()

  try {
    await disconnectEasyTier()
    router.push('/')
  } catch (error) {
    message.value = '断开连接失败: ' + (error as Error).message
    messageType.value = 'error'
  }
}

const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const getLevelColor = (level: string) => {
  const colors = {
    info: '#4299e1',
    warn: '#ed8936',
    error: '#f56565',
    debug: '#9f7aea'
  }
  return colors[level] || '#718096'
}
</script>

<style scoped>
.room-info-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, var(--bg-gradient-room-start) 0%, var(--bg-gradient-room-end) 100%);
}

.room-card {
  background: var(--bg-secondary);
  border-radius: 1rem;
  padding: 2rem;
  max-width: 700px;
  width: 100%;
  box-shadow: var(--shadow-lg);
  position: relative;
}

.status-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-active {
  background: var(--status-success);
  color: #FFFFFF;
}

.status-inactive {
  background: var(--status-error);
  color: #FFFFFF;
}

h1 {
  color: var(--text-primary);
  margin-bottom: 2rem;
  text-align: center;
}

h2 {
  color: var(--text-secondary);
  font-size: 1.2rem;
  margin-bottom: 1rem;
}

h3 {
  color: var(--text-secondary);
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.info-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--bg-tertiary);
  border-radius: 0.5rem;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.label {
  color: var(--text-tertiary);
  font-weight: 500;
  min-width: 100px;
}

.value {
  color: var(--text-primary);
  font-family: monospace;
  flex: 1;
  padding: 0.5rem;
  background: var(--bg-secondary);
  border-radius: 0.25rem;
  border: 1px solid var(--border-color);
}

.copy-btn {
  padding: 0.25rem 0.75rem;
  background: var(--btn-secondary);
  color: var(--text-inverse);
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.3s;
}

.copy-btn:hover {
  background: var(--btn-secondary-hover);
}

.player-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
}

.logs-container {
  max-height: 300px;
  overflow-y: auto;
  background: var(--bg-secondary);
  border-radius: 0.25rem;
  border: 1px solid var(--border-color);
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.log-entry {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
  font-family: monospace;
  font-size: 0.85rem;
  border-bottom: 1px solid var(--border-color);
}

.log-entry:last-child {
  border-bottom: none;
}

.log-time {
  color: var(--text-tertiary);
  min-width: 80px;
}

.log-level {
  font-weight: bold;
  min-width: 60px;
}

.log-message {
  color: var(--text-primary);
  flex: 1;
  word-break: break-word;
}

.player-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: 0.25rem;
  border: 1px solid var(--border-color);
}

.player-name {
  color: var(--text-primary);
  font-weight: 500;
}

.player-status {
  font-size: 0.85rem;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
}

.player-status.online {
  background: var(--status-success);
  color: #FFFFFF;
}

.player-status.offline {
  background: var(--bg-tertiary);
  color: var(--text-tertiary);
}

.empty-state {
  text-align: center;
  color: var(--text-tertiary);
  padding: 2rem;
}

.connection-status {
  margin-bottom: 2rem;
  padding: 1rem;
  background: var(--bg-tertiary);
  border-radius: 0.5rem;
}

.status-items {
  display: flex;
  gap: 2rem;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--border-color);
}

.status-dot.active {
  background: var(--status-success);
  box-shadow: 0 0 8px var(--status-success);
}

.connection-address-card {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(66, 153, 225, 0.1), rgba(72, 187, 120, 0.1));
  border-radius: 0.75rem;
  border: 2px solid var(--border-focus);
}

.connection-address-card h2 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.address-display {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  border: 1px solid var(--border-color);
  margin-bottom: 0.75rem;
}

.address-text {
  flex: 1;
  font-family: 'Courier New', Courier, monospace;
  font-size: 1.25rem;
  font-weight: bold;
  color: var(--text-primary);
  user-select: all;
}

.copy-icon-btn {
  padding: 0.5rem 0.75rem;
  background: var(--btn-secondary);
  color: #FFFFFF;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 1.25rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.copy-icon-btn:hover {
  background: var(--btn-secondary-hover);
  transform: scale(1.1);
}

.address-hint {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-tertiary);
  text-align: center;
}

.btn-large {
  font-size: 1.1rem;
  font-weight: 600;
}

.button-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn {
  flex: 1;
  min-width: 150px;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-info {
  background: var(--btn-secondary);
  color: #FFFFFF;
}

.btn-info:hover:not(:disabled) {
  background: var(--btn-secondary-hover);
}

.btn-danger {
  background: var(--btn-danger);
  color: #FFFFFF;
}

.btn-danger:hover:not(:disabled) {
  background: var(--btn-danger-hover);
}

.btn-secondary {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-focus);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--bg-tertiary);
}

.message {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 0.5rem;
  text-align: center;
}

.message.success {
  background: var(--status-success);
  color: #FFFFFF;
}

.message.info {
  background: var(--status-info);
  color: #FFFFFF;
}

.message.error {
  background: var(--status-error);
  color: #FFFFFF;
}
</style>
