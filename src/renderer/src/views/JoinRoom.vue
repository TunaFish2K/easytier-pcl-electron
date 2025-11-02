<template>
  <div class="join-room-container">
    <div class="join-card">
      <h1>加入房间</h1>
      <p class="subtitle">输入房间信息以加入游戏</p>

      <form @submit.prevent="handleJoinRoom" class="join-form">
        <div class="form-group">
          <label for="invitationCode">邀请码</label>
          <input
            id="invitationCode"
            v-model="formData.invitationCode"
            type="text"
            placeholder="输入房主提供的邀请码（例如: P639D-ABC12-DEF34）"
            required
          />
          <small class="hint">房主创建房间后会获得邀请码</small>
        </div>


        <div class="button-group">
          <button type="submit" class="btn btn-primary" :disabled="loading">加入房间</button>
          <button type="button" @click="goBack" class="btn btn-secondary" :disabled="loading">
            返回
          </button>
        </div>
      </form>

      <div v-if="loading" class="loading">连接中...</div>
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
const { joinRoom: joinEasyTierRoom, requiresRoot, setSudoPassword } = useEasyTier()

const formData = ref({
  invitationCode: ''
})

// 生成5位随机字符串（0-9A-Z）
const generateRandomSuffix = (): string => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let result = ''
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

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

// 处理加入房间请求
const handleJoinRoom = async () => {
  error.value = ''

  // 如果需要权限且尚未授权，显示权限请求模态框
  if (needsPermission.value) {
    showPermissionModal.value = true
  } else {
    await joinRoom()
  }
}

// 处理权限授权
const handleAuthorize = async (password: string) => {
  try {
    // 设置 sudo 密码
    await setSudoPassword(password)
    showPermissionModal.value = false

    // 继续加入房间
    await joinRoom()
  } catch (err) {
    error.value = '权限验证失败: ' + (err as Error).message
    showPermissionModal.value = false
  }
}

// 处理权限取消
const handlePermissionCancel = () => {
  showPermissionModal.value = false
  error.value = '需要 root 权限才能加入房间'
}

// 实际加入房间
const joinRoom = async () => {
  loading.value = true
  error.value = ''

  try {
    // 生成随机后缀
    const randomSuffix = generateRandomSuffix()

    // 调用 EasyTier 加入房间
    await joinEasyTierRoom(
      formData.value.invitationCode,
      randomSuffix
    )

    // 加入成功后跳转到房间信息页面
    router.push({
      name: 'room',
      query: {
        type: 'guest'
      }
    })
  } catch (err) {
    error.value = '加入房间失败: ' + (err as Error).message
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/')
}
</script>

<style scoped>
.join-room-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
}

.join-card {
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

.join-form {
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
  border-color: #4299e1;
}

.hint {
  color: #718096;
  font-size: 0.85rem;
  margin-top: 0.25rem;
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
  background: #4299e1;
  color: white;
}

.btn-primary:hover {
  background: #3182ce;
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
