<template>
  <div class="settings-container">
    <div class="settings-card">
      <div class="header">
        <button @click="goBack" class="back-btn" title="返回">
          ← 返回
        </button>
        <h1>设置</h1>
      </div>

      <div class="section">
        <h2>自定义节点</h2>
        <p class="description">
          添加自定义的 EasyTier 节点。节点格式：<code>tcp://地址:端口</code>
        </p>

        <!-- 启用开关 -->
        <div class="enable-section">
          <div class="toggle-group">
            <label class="toggle-label">
              <input
                type="checkbox"
                v-model="enabled"
                @change="handleToggleEnabled"
                class="toggle-checkbox"
              />
              <span class="toggle-slider"></span>
            </label>
            <div class="toggle-info">
              <strong>启用自定义节点</strong>
              <p class="toggle-desc">
                {{ enabled ? '仅使用自定义节点' : '使用 API 获取的默认节点' }}
              </p>
            </div>
          </div>
          <div v-if="enabled && customNodes.length === 0" class="warning-box">
            ⚠️ 已启用自定义节点但列表为空，创建或加入房间时可能会失败
          </div>
        </div>

        <!-- 添加节点表单 -->
        <div class="add-node-form">
          <input
            v-model="nodeInput"
            type="text"
            placeholder="tcp://example.com:11010"
            class="node-input"
            @keyup.enter="addNode"
          />
          <button @click="addNode" class="btn btn-primary">添加节点</button>
        </div>

        <!-- 错误/成功消息 -->
        <div v-if="message" class="message" :class="messageType">
          {{ message }}
        </div>

        <!-- 节点列表 -->
        <div class="nodes-section">
          <div class="nodes-header">
            <h3>已添加的节点 ({{ customNodes.length }})</h3>
            <button
              v-if="customNodes.length > 0"
              @click="clearAllNodes"
              class="btn btn-danger-small"
            >
              清空所有
            </button>
          </div>

          <div v-if="customNodes.length === 0" class="empty-state">
            暂无自定义节点
          </div>

          <div v-else class="nodes-list">
            <div v-for="(node, index) in customNodes" :key="index" class="node-item">
              <code class="node-address">{{ node }}</code>
              <button @click="removeNode(node)" class="btn-remove" title="删除">
                🗑️
              </button>
            </div>
          </div>
        </div>

        <div class="info-box">
          <strong>提示：</strong>
          <ul>
            <li>启用后，将<strong>仅使用自定义节点</strong>，不会使用 EasyTier Uptime API 获取的默认节点</li>
            <li>禁用后，将使用 EasyTier Uptime API 获取的默认节点</li>
            <li>节点地址格式必须为 <code>tcp://地址:端口</code></li>
            <li>例如：<code>tcp://192.168.1.100:11010</code></li>
            <li>删除后重新添加可起到修改的作用</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCustomNodes } from '../composables/useCustomNodes'

const router = useRouter()
const { customNodes, enabled, setEnabled, addNode: addNodeToStore, removeNode: removeNodeFromStore, clearNodes } = useCustomNodes()

const nodeInput = ref('')
const message = ref('')
const messageType = ref<'success' | 'error'>('success')

let messageTimeout: NodeJS.Timeout | null = null

const showMessage = (msg: string, type: 'success' | 'error') => {
  message.value = msg
  messageType.value = type

  // 清除之前的定时器
  if (messageTimeout) {
    clearTimeout(messageTimeout)
  }

  // 3秒后自动清除消息
  messageTimeout = setTimeout(() => {
    message.value = ''
  }, 3000)
}

const handleToggleEnabled = () => {
  setEnabled(enabled.value)
  if (enabled.value) {
    showMessage('已启用自定义节点，将仅使用自定义节点列表', 'success')
  } else {
    showMessage('已禁用自定义节点，将使用 API 获取的默认节点', 'success')
  }
}

const addNode = () => {
  const node = nodeInput.value.trim()

  if (!node) {
    showMessage('请输入节点地址', 'error')
    return
  }

  const result = addNodeToStore(node)

  if (result.success) {
    showMessage('节点添加成功', 'success')
    nodeInput.value = ''
  } else {
    showMessage(result.error || '添加失败', 'error')
  }
}

const removeNode = (node: string) => {
  removeNodeFromStore(node)
  showMessage('节点已删除', 'success')
}

const clearAllNodes = () => {
  if (confirm('确定要清空所有自定义节点吗？')) {
    clearNodes()
    showMessage('已清空所有节点', 'success')
  }
}

const goBack = () => {
  router.push('/')
}
</script>

<style scoped>
.settings-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, var(--bg-gradient-home-start) 0%, var(--bg-gradient-home-end) 100%);
}

.settings-card {
  background: var(--bg-secondary);
  border-radius: 1rem;
  padding: 2rem;
  max-width: 800px;
  width: 100%;
  box-shadow: var(--shadow-lg);
}

.header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.back-btn {
  padding: 0.5rem 1rem;
  background: var(--btn-secondary);
  color: var(--text-inverse);
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.3s;
}

.back-btn:hover {
  background: var(--btn-secondary-hover);
}

h1 {
  color: var(--text-primary);
  margin: 0;
  flex: 1;
}

.section {
  margin-bottom: 2rem;
}

h2 {
  color: var(--text-primary);
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

h3 {
  color: var(--text-secondary);
  font-size: 1.2rem;
  margin: 0;
}

.description {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.description code {
  background: var(--bg-tertiary);
  padding: 0.2rem 0.5rem;
  border-radius: 0.25rem;
  font-family: monospace;
  color: var(--text-primary);
}

.enable-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--bg-tertiary);
  border-radius: 0.75rem;
  border: 1px solid var(--border-color);
}

.toggle-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.toggle-label {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
  cursor: pointer;
}

.toggle-checkbox {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--border-color);
  transition: 0.4s;
  border-radius: 34px;
}

.toggle-slider:before {
  position: absolute;
  content: '';
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

.toggle-checkbox:checked + .toggle-slider {
  background-color: var(--btn-primary);
}

.toggle-checkbox:checked + .toggle-slider:before {
  transform: translateX(26px);
}

.toggle-info {
  flex: 1;
}

.toggle-info strong {
  color: var(--text-primary);
  font-size: 1.1rem;
}

.toggle-desc {
  margin: 0.25rem 0 0 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.warning-box {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(255, 193, 7, 0.1);
  border-left: 4px solid #FFC107;
  border-radius: 0.375rem;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.add-node-form {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.node-input {
  flex: 1;
  padding: 0.75rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  color: var(--text-primary);
  font-size: 1rem;
  font-family: monospace;
  transition: border-color 0.3s;
}

.node-input:focus {
  outline: none;
  border-color: var(--border-focus);
}

.node-input::placeholder {
  color: var(--text-tertiary);
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.btn-primary {
  background: var(--btn-primary);
  color: #FFFFFF;
}

.btn-primary:hover {
  background: var(--btn-primary-hover);
}

.btn-danger-small {
  padding: 0.5rem 1rem;
  background: var(--btn-danger);
  color: #FFFFFF;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-danger-small:hover {
  background: var(--btn-danger-hover);
}

.message {
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  text-align: center;
}

.message.success {
  background: var(--status-success);
  color: #FFFFFF;
}

.message.error {
  background: var(--status-error);
  color: #FFFFFF;
}

.nodes-section {
  margin-top: 2rem;
}

.nodes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.empty-state {
  text-align: center;
  color: var(--text-tertiary);
  padding: 3rem;
  background: var(--bg-tertiary);
  border-radius: 0.5rem;
}

.nodes-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.node-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: var(--bg-tertiary);
  border-radius: 0.5rem;
  border: 1px solid var(--border-color);
  transition: border-color 0.3s;
}

.node-item:hover {
  border-color: var(--border-focus);
}

.node-address {
  flex: 1;
  font-family: 'Courier New', Courier, monospace;
  color: var(--text-primary);
  font-size: 1rem;
}

.btn-remove {
  padding: 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  opacity: 0.7;
  transition: all 0.2s;
}

.btn-remove:hover {
  opacity: 1;
  transform: scale(1.2);
}

.info-box {
  margin-top: 2rem;
  padding: 1.5rem;
  background: var(--bg-tertiary);
  border-left: 4px solid var(--btn-primary);
  border-radius: 0.5rem;
  color: var(--text-secondary);
}

.info-box strong {
  color: var(--text-primary);
}

.info-box ul {
  margin: 0.5rem 0 0 0;
  padding-left: 1.5rem;
}

.info-box li {
  margin: 0.5rem 0;
}

.info-box code {
  background: var(--bg-secondary);
  padding: 0.2rem 0.5rem;
  border-radius: 0.25rem;
  font-family: monospace;
  color: var(--text-primary);
}
</style>
