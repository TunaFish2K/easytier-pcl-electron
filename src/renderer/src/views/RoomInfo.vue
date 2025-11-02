<template>
  <div class="room-info-container">
    <div class="room-card">
      <div class="status-badge" :class="statusClass">{{ statusText }}</div>

      <h1>{{ isHost ? '房间管理' : '已加入房间' }}</h1>

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
        <button v-if="isHost" @click="copyToClipboard(roomInfo!.invitationCode)" class="btn btn-info"
          :disabled="isLoading || !roomInfo">复制邀请码</button>
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.room-card {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  max-width: 700px;
  width: 100%;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
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
  background: #c6f6d5;
  color: #22543d;
}

.status-inactive {
  background: #fed7d7;
  color: #742a2a;
}

h1 {
  color: #2d3748;
  margin-bottom: 2rem;
  text-align: center;
}

h2 {
  color: #4a5568;
  font-size: 1.2rem;
  margin-bottom: 1rem;
}

h3 {
  color: #4a5568;
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.info-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f7fafc;
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
  color: #718096;
  font-weight: 500;
  min-width: 100px;
}

.value {
  color: #2d3748;
  font-family: monospace;
  flex: 1;
  padding: 0.5rem;
  background: white;
  border-radius: 0.25rem;
}

.copy-btn {
  padding: 0.25rem 0.75rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.3s;
}

.copy-btn:hover {
  background: #5a67d8;
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
  background: white;
  border-radius: 0.25rem;
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
  border-bottom: 1px solid #e2e8f0;
}

.log-entry:last-child {
  border-bottom: none;
}

.log-time {
  color: #a0aec0;
  min-width: 80px;
}

.log-level {
  font-weight: bold;
  min-width: 60px;
}

.log-message {
  color: #2d3748;
  flex: 1;
  word-break: break-word;
}

.player-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: white;
  border-radius: 0.25rem;
}

.player-name {
  color: #2d3748;
  font-weight: 500;
}

.player-status {
  font-size: 0.85rem;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
}

.player-status.online {
  background: #c6f6d5;
  color: #22543d;
}

.player-status.offline {
  background: #e2e8f0;
  color: #718096;
}

.empty-state {
  text-align: center;
  color: #a0aec0;
  padding: 2rem;
}

.connection-status {
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f7fafc;
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
  color: #4a5568;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #cbd5e0;
}

.status-dot.active {
  background: #48bb78;
  box-shadow: 0 0 8px rgba(72, 187, 120, 0.6);
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
  background: #667eea;
  color: white;
}

.btn-info:hover:not(:disabled) {
  background: #5a67d8;
}

.btn-danger {
  background: #f56565;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #e53e3e;
}

.btn-secondary {
  background: #e2e8f0;
  color: #4a5568;
}

.btn-secondary:hover:not(:disabled) {
  background: #cbd5e0;
}

.message {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 0.5rem;
  text-align: center;
}

.message.success {
  background: #c6f6d5;
  color: #22543d;
}

.message.info {
  background: #bee3f8;
  color: #2c5282;
}

.message.error {
  background: #fed7d7;
  color: #c53030;
}
</style>
