<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  visible: boolean
  message?: string
}

withDefaults(defineProps<Props>(), {
  message: 'EasyTier 需要 root 权限来在 Unix 系统上创建网络接口。'
})

const emit = defineEmits<{
  authorize: [password: string]
  cancel: []
}>()

const password = ref('')
const isAuthorizing = ref(false)

const handleAuthorize = () => {
  if (!password.value.trim()) {
    return
  }
  isAuthorizing.value = true
  emit('authorize', password.value)
  // Reset after a delay in case authorization fails
  setTimeout(() => {
    isAuthorizing.value = false
  }, 2000)
}

const handleCancel = () => {
  password.value = ''
  emit('cancel')
}
</script>

<template>
  <Transition name="modal">
    <div v-if="visible" class="permission-overlay" @click.self="handleCancel">
      <div class="permission-modal">
        <div class="modal-header">
          <h2>需要 Root 权限</h2>
          <button class="close-btn" @click="handleCancel" :disabled="isAuthorizing">×</button>
        </div>

        <div class="modal-body">
          <div class="warning-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          <p class="permission-message">{{ message }}</p>

          <div class="input-group">
            <label for="password">请输入密码以继续：</label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="密码"
              @keyup.enter="handleAuthorize"
              :disabled="isAuthorizing"
              autofocus
            />
          </div>

          <div class="info-text">
            <p>您的密码将用于执行需要提升权限的命令。</p>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-cancel" @click="handleCancel" :disabled="isAuthorizing">
            取消
          </button>
          <button
            class="btn btn-authorize"
            @click="handleAuthorize"
            :disabled="!password.trim() || isAuthorizing"
          >
            {{ isAuthorizing ? '授权中...' : '授权' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.permission-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--overlay-bg);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.2s ease-out;
}

.permission-modal {
  background: var(--bg-secondary);
  border-radius: 12px;
  box-shadow: var(--shadow-hover);
  width: 90%;
  max-width: 480px;
  overflow: hidden;
  animation: slideUp 0.3s ease-out;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  color: var(--text-tertiary);
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover:not(:disabled) {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.close-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-body {
  padding: 24px;
}

.warning-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  color: var(--status-warning);
}

.permission-message {
  text-align: center;
  color: var(--text-secondary);
  margin-bottom: 24px;
  line-height: 1.6;
}

.input-group {
  margin-bottom: 16px;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.input-group input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--input-border);
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
  background: var(--input-bg);
  color: var(--input-text);
}

.input-group input:focus {
  outline: none;
  border-color: var(--input-focus-border);
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.2);
}

.input-group input:disabled {
  background: var(--bg-tertiary);
  cursor: not-allowed;
}

.info-text {
  background: var(--bg-tertiary);
  padding: 12px;
  border-radius: 8px;
  font-size: 13px;
  color: var(--text-tertiary);
}

.info-text p {
  margin: 0;
  line-height: 1.5;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-tertiary);
}

.btn {
  flex: 1;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-focus);
}

.btn-cancel:hover:not(:disabled) {
  background: var(--bg-tertiary);
}

.btn-authorize {
  background: var(--btn-secondary);
  color: #FFFFFF;
}

.btn-authorize:hover:not(:disabled) {
  background: var(--btn-secondary-hover);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
