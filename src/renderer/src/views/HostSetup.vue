<template>
  <div class="host-setup-container">
    <div class="setup-card">
      <h1>房主设置</h1>
      <p class="subtitle">创建一个新的游戏房间</p>

      <form @submit.prevent="handleCreateRoom" class="setup-form">
        <div class="form-group">
          <label for="serverPort">Minecraft 服务器端口</label>
          <input
            id="serverPort"
            v-model.number="formData.serverPort"
            type="number"
            placeholder="25565"
            min="1"
            max="65535"
            required
          />
          <small class="hint">请确保与你的 Minecraft 服务器端口一致</small>
        </div>

        <div class="form-group">
          <label for="roomName">
            房间名称（附加信息）
            <span class="optional-tag">可选</span>
          </label>
          <input
            id="roomName"
            v-model="formData.roomName"
            type="text"
            placeholder="例如：小明的生存服"
            maxlength="20"
          />
          <small class="hint">
            <strong>💡 此信息将附加在邀请码末尾</strong>，便于玩家识别房间
          </small>
        </div>

        <div class="button-group">
          <button type="submit" class="btn btn-primary" :disabled="loading">创建房间</button>
          <button type="button" @click="goBack" class="btn btn-secondary" :disabled="loading">
            返回
          </button>
        </div>
      </form>

      <div v-if="loading" class="loading">创建中...</div>
      <div v-if="error" class="error">{{ error }}</div>
    </div>

    <!-- 权限请求模态框 -->
    <PermissionRequest
      :visible="showPermissionModal"
      :message="permissionMessage"
      @authorize="handleAuthorize"
      @cancel="handlePermissionCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEasyTier } from '../composables/useEasyTier'
import PermissionRequest from '../components/PermissionRequest.vue'

const router = useRouter()
const { createRoom: createEasyTierRoom, requiresRoot, setSudoPassword } = useEasyTier()

const formData = ref({
  roomName: '',
  serverPort: 25565
})

const loading = ref(false)
const error = ref('')
const showPermissionModal = ref(false)
const needsPermission = ref(false)
const permissionMessage = ref(
  'EasyTier 需要 root 权限来在 Unix 系统上创建网络接口。'
)

// 检查是否需要权限
onMounted(async () => {
  try {
    needsPermission.value = await requiresRoot()
  } catch (err) {
    console.error('Failed to check root permission requirement:', err)
  }
})

// 处理创建房间请求
const handleCreateRoom = async () => {
  error.value = ''

  // 如果需要权限且尚未授权，显示权限请求模态框
  if (needsPermission.value) {
    showPermissionModal.value = true
  } else {
    await createRoom()
  }
}

// 处理权限授权
const handleAuthorize = async (password: string) => {
  try {
    // 设置 sudo 密码
    await setSudoPassword(password)
    showPermissionModal.value = false

    // 继续创建房间
    await createRoom()
  } catch (err) {
    error.value = '权限验证失败: ' + (err as Error).message
    showPermissionModal.value = false
  }
}

// 处理权限取消
const handlePermissionCancel = () => {
  showPermissionModal.value = false
  error.value = '需要 root 权限才能创建房间'
}

// 实际创建房间
const createRoom = async () => {
  loading.value = true
  error.value = ''

  try {
    // 调用 EasyTier 创建房间，传递房间名称作为 attachment
    const roomInfo = await createEasyTierRoom(
      formData.value.serverPort,
      formData.value.roomName || undefined
    )

    // 创建成功后跳转到房间信息页面
    router.push({
      name: 'room',
      query: {
        type: 'host'
      }
    })
  } catch (err) {
    error.value = '创建房间失败: ' + (err as Error).message
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/')
}
</script>

<style scoped>
.host-setup-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
}

.setup-card {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

h1 {
  color: #2d3748;
  margin-bottom: 0.5rem;
  text-align: center;
}

.subtitle {
  color: #718096;
  text-align: center;
  margin-bottom: 2rem;
}

.setup-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  color: #4a5568;
  font-weight: 500;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.optional-tag {
  font-size: 0.75rem;
  color: #718096;
  font-weight: 400;
  background: #edf2f7;
  padding: 0.15rem 0.5rem;
  border-radius: 0.25rem;
}

input {
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.3s;
}

input:focus {
  outline: none;
  border-color: #48bb78;
}

.hint {
  color: #718096;
  font-size: 0.85rem;
  margin-top: 0.25rem;
  line-height: 1.4;
}

.hint strong {
  color: #4a5568;
}

.button-group {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.btn {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: #48bb78;
  color: white;
}

.btn-primary:hover {
  background: #38a169;
}

.btn-secondary {
  background: #e2e8f0;
  color: #4a5568;
}

.btn-secondary:hover {
  background: #cbd5e0;
}

.loading {
  margin-top: 1rem;
  padding: 1rem;
  background: #bee3f8;
  color: #2c5282;
  border-radius: 0.5rem;
  text-align: center;
}

.error {
  margin-top: 1rem;
  padding: 1rem;
  background: #fed7d7;
  color: #c53030;
  border-radius: 0.5rem;
  text-align: center;
}
</style>
