<template>
  <div class="home-container">
    <h1>EasyTier PCL</h1>

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
  background: linear-gradient(135deg, var(--bg-gradient-home-start) 0%, var(--bg-gradient-home-end) 100%);
  color: var(--text-primary);
}

h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  color: var(--text-primary);
}

.subtitle {
  font-size: 1.2rem;
  margin-bottom: 3rem;
  opacity: 0.9;
  color: var(--text-primary);
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
  box-shadow: var(--shadow-md);
}

.btn:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-hover);
}

.btn-primary {
  background: var(--btn-primary);
  color: #FFFFFF;
}

.btn-primary:hover {
  background: var(--btn-primary-hover);
}

.btn-secondary {
  background: var(--btn-secondary);
  color: #FFFFFF;
}

.btn-secondary:hover {
  background: var(--btn-secondary-hover);
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
