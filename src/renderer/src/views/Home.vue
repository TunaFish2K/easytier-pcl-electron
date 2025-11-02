<template>
  <div class="home-container">
    <h1>Minecraft 联机助手</h1>
    <p class="subtitle">基于 EasyTier 的 Minecraft 联机解决方案</p>

    <div class="button-group">
      <button @click="goToHost" class="btn btn-primary">
        <span class="icon">🏠</span>
        <span class="text">作为房主</span>
        <span class="desc">创建房间并邀请其他玩家</span>
      </button>

      <button @click="goToJoin" class="btn btn-secondary">
        <span class="icon">🚪</span>
        <span class="text">加入房间</span>
        <span class="desc">加入已有的游戏房间</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goToHost = () => {
  router.push('/host')
}

const goToJoin = () => {
  router.push('/join')
}
</script>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.subtitle {
  font-size: 1.2rem;
  margin-bottom: 3rem;
  opacity: 0.9;
}

.button-group {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
  justify-content: center;
}

.btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 3rem;
  border: none;
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 250px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.btn:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.2);
}

.btn-primary {
  background: #48bb78;
  color: white;
}

.btn-primary:hover {
  background: #38a169;
}

.btn-secondary {
  background: #4299e1;
  color: white;
}

.btn-secondary:hover {
  background: #3182ce;
}

.icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.text {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.desc {
  font-size: 0.9rem;
  opacity: 0.9;
  text-align: center;
}
</style>
