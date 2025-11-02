import { ref, watch } from 'vue'

const STORAGE_KEY = 'easytier-custom-nodes'
const ENABLED_KEY = 'easytier-custom-nodes-enabled'

/**
 * 自定义节点管理
 */
export function useCustomNodes() {
  const customNodes = ref<string[]>([])
  const enabled = ref<boolean>(false)

  /**
   * 从 localStorage 加载自定义节点
   */
  const loadNodes = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        customNodes.value = JSON.parse(stored)
      }

      const enabledStored = localStorage.getItem(ENABLED_KEY)
      if (enabledStored) {
        enabled.value = enabledStored === 'true'
      }
    } catch (error) {
      console.error('Failed to load custom nodes:', error)
      customNodes.value = []
      enabled.value = false
    }
  }

  /**
   * 保存自定义节点到 localStorage
   */
  const saveNodes = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customNodes.value))
      localStorage.setItem(ENABLED_KEY, String(enabled.value))
    } catch (error) {
      console.error('Failed to save custom nodes:', error)
    }
  }

  /**
   * 设置是否启用自定义节点
   */
  const setEnabled = (value: boolean) => {
    enabled.value = value
    saveNodes()
  }

  /**
   * 添加节点
   * @param node 节点地址，格式：tcp://addr:port
   * @returns 是否添加成功
   */
  const addNode = (node: string): { success: boolean; error?: string } => {
    // 验证格式
    if (!node.trim()) {
      return { success: false, error: '节点地址不能为空' }
    }

    // 验证是否为 tcp:// 开头
    if (!node.startsWith('tcp://')) {
      return { success: false, error: '节点地址必须以 tcp:// 开头' }
    }

    // 验证格式：tcp://addr:port
    const urlPattern = /^tcp:\/\/.+:\d+$/
    if (!urlPattern.test(node)) {
      return { success: false, error: '节点地址格式不正确，应为 tcp://addr:port' }
    }

    // 检查是否已存在
    if (customNodes.value.includes(node)) {
      return { success: false, error: '该节点已存在' }
    }

    // 添加节点
    customNodes.value.push(node)
    saveNodes()
    return { success: true }
  }

  /**
   * 删除节点
   * @param node 要删除的节点地址
   */
  const removeNode = (node: string) => {
    const index = customNodes.value.indexOf(node)
    if (index > -1) {
      customNodes.value.splice(index, 1)
      saveNodes()
    }
  }

  /**
   * 清空所有自定义节点
   */
  const clearNodes = () => {
    customNodes.value = []
    saveNodes()
  }

  /**
   * 获取所有自定义节点
   */
  const getNodes = () => {
    return [...customNodes.value]
  }

  // 初始化时加载节点
  loadNodes()

  return {
    customNodes,
    enabled,
    setEnabled,
    addNode,
    removeNode,
    clearNodes,
    getNodes
  }
}
