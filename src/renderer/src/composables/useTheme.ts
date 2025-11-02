import { ref, onMounted, onUnmounted } from 'vue'

export type Theme = 'light' | 'dark'

// 主题颜色配置 - 使用 Material Design 规范
const themes = {
  light: {
    // 背景色 - 浅色主题
    '--bg-primary': '#FAFAFA',
    '--bg-secondary': '#FFFFFF',
    '--bg-tertiary': '#F5F5F5',

    // 主页渐变背景 - 浅紫色
    '--bg-gradient-home-start': '#E8EAF6',
    '--bg-gradient-home-end': '#C5CAE9',

    // 房主页面渐变背景 - 浅绿色
    '--bg-gradient-host-start': '#E8F5E9',
    '--bg-gradient-host-end': '#C8E6C9',

    // 加入房间页面渐变背景 - 浅蓝色
    '--bg-gradient-join-start': '#E3F2FD',
    '--bg-gradient-join-end': '#BBDEFB',

    // 房间信息页面渐变背景 - 浅靛蓝
    '--bg-gradient-room-start': '#E8EAF6',
    '--bg-gradient-room-end': '#C5CAE9',

    // 文字颜色 - 深色文字
    '--text-primary': '#212121',
    '--text-secondary': '#757575',
    '--text-tertiary': '#9E9E9E',
    '--text-inverse': '#FFFFFF',

    // 边框颜色
    '--border-color': '#E0E0E0',
    '--border-focus': '#BDBDBD',

    // 按钮颜色 - 浅一些的亮色
    '--btn-primary': '#66BB6A',
    '--btn-primary-hover': '#4CAF50',
    '--btn-secondary': '#42A5F5',
    '--btn-secondary-hover': '#2196F3',
    '--btn-danger': '#EF5350',
    '--btn-danger-hover': '#F44336',

    // 卡片阴影
    '--shadow-sm': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    '--shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    '--shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    '--shadow-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',

    // 输入框
    '--input-bg': '#FFFFFF',
    '--input-border': '#E0E0E0',
    '--input-focus-border': '#42A5F5',
    '--input-text': '#212121',

    // 状态颜色 - 浅一些的亮色
    '--status-success': '#66BB6A',
    '--status-warning': '#FFB74D',
    '--status-error': '#EF5350',
    '--status-info': '#42A5F5',

    // 遮罩层
    '--overlay-bg': 'rgba(0, 0, 0, 0.5)',
  },
  dark: {
    // 背景色 - Material Design Dark Theme
    '--bg-primary': '#121212',
    '--bg-secondary': '#1E1E1E',
    '--bg-tertiary': '#2C2C2C',

    // 主页渐变背景 - 深紫灰
    '--bg-gradient-home-start': '#1a1a1a',
    '--bg-gradient-home-end': '#0a0a0a',

    // 房主页面渐变背景 - 深灰带绿色调
    '--bg-gradient-host-start': '#1a1f1a',
    '--bg-gradient-host-end': '#0f140f',

    // 加入房间页面渐变背景 - 深灰带蓝色调
    '--bg-gradient-join-start': '#1a1d22',
    '--bg-gradient-join-end': '#0f1216',

    // 房间信息页面渐变背景 - 纯深灰
    '--bg-gradient-room-start': '#1c1c1c',
    '--bg-gradient-room-end': '#0d0d0d',

    // 文字颜色 - Material Design 白色规范
    '--text-primary': '#FFFFFF',
    '--text-secondary': 'rgba(255, 255, 255, 0.7)',
    '--text-tertiary': 'rgba(255, 255, 255, 0.5)',
    '--text-inverse': '#000000',

    // 边框颜色
    '--border-color': 'rgba(255, 255, 255, 0.12)',
    '--border-focus': 'rgba(255, 255, 255, 0.3)',

    // 按钮颜色
    '--btn-primary': '#4CAF50',
    '--btn-primary-hover': '#66BB6A',
    '--btn-secondary': '#2196F3',
    '--btn-secondary-hover': '#42A5F5',
    '--btn-danger': '#F44336',
    '--btn-danger-hover': '#EF5350',

    // 卡片阴影
    '--shadow-sm': '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
    '--shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
    '--shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
    '--shadow-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',

    // 输入框
    '--input-bg': '#2C2C2C',
    '--input-border': 'rgba(255, 255, 255, 0.12)',
    '--input-focus-border': '#2196F3',
    '--input-text': '#FFFFFF',

    // 状态颜色
    '--status-success': '#4CAF50',
    '--status-warning': '#FF9800',
    '--status-error': '#F44336',
    '--status-info': '#2196F3',

    // 遮罩层
    '--overlay-bg': 'rgba(0, 0, 0, 0.8)',
  }
}

const currentTheme = ref<Theme>('light')
let mediaQuery: MediaQueryList | null = null

// 应用主题到文档
const applyTheme = (theme: Theme) => {
  const root = document.documentElement
  const themeColors = themes[theme]

  Object.entries(themeColors).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })

  // 添加主题类名到 html 元素
  root.classList.remove('light', 'dark')
  root.classList.add(theme)

  currentTheme.value = theme
}

// 检测系统主题偏好
const detectSystemTheme = (): Theme => {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

// 监听系统主题变化
const handleThemeChange = (e: MediaQueryListEvent) => {
  const newTheme = e.matches ? 'dark' : 'light'
  applyTheme(newTheme)
}

export function useTheme() {
  onMounted(() => {
    // 初始化主题
    const systemTheme = detectSystemTheme()
    applyTheme(systemTheme)

    // 监听系统主题变化
    if (window.matchMedia) {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      // 使用 addEventListener 而不是 addListener (更现代的 API)
      mediaQuery.addEventListener('change', handleThemeChange)
    }
  })

  onUnmounted(() => {
    // 清理监听器
    if (mediaQuery) {
      mediaQuery.removeEventListener('change', handleThemeChange)
    }
  })

  // 手动切换主题
  const setTheme = (theme: Theme) => {
    applyTheme(theme)
  }

  // 切换主题
  const toggleTheme = () => {
    const newTheme = currentTheme.value === 'light' ? 'dark' : 'light'
    applyTheme(newTheme)
  }

  return {
    currentTheme,
    setTheme,
    toggleTheme
  }
}
