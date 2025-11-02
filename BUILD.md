# 构建说明

## 平台构建

### Linux AppImage
```bash
npm run build:linux
```
生成：`dist/easytier-pcl-electron-1.0.0.AppImage`

### macOS DMG (x64 + ARM64)
```bash
npm run build:mac
```
生成：
- `dist/easytier-pcl-electron-1.0.0-x64.dmg`
- `dist/easytier-pcl-electron-1.0.0-arm64.dmg`

### Windows (推荐在 Windows 系统上构建)

#### 在 Windows 上构建：
```bash
npm run build
npx electron-builder --win
```

#### 在 Linux 上构建 Windows 应用（需要安装 wine）：

**方法 1: 安装完整的 wine 环境**
```bash
# Ubuntu/Debian
sudo dpkg --add-architecture i386
sudo apt update
sudo apt install wine wine32 wine64

# Arch Linux
sudo pacman -S wine wine-mono wine-gecko

# 然后构建
npm run build
npx electron-builder --win
```

**方法 2: 跳过 Windows 构建**

在 Linux 上只构建 Linux 和 macOS 应用：
```bash
npm run build:linux
npm run build:mac  # macOS DMG 可以在 Linux 上构建
```

## 构建所有平台

```bash
# 仅在 Windows 或安装了 wine 的 Linux 上有效
npm run build:all
```

## 常见问题

### wine/rcedit 错误

如果看到类似错误：
```
⨯ cannot execute  cause=exit status 53 errorOut=... wine: could not load kernel32.dll
```

这是因为在 Linux 上构建 Windows 应用需要 wine。解决方案：
1. 安装完整的 wine 环境（见上文）
2. 或者在 Windows 系统上构建 Windows 应用
3. 或者只构建 Linux/macOS 版本

### dmg-license 警告

dmg-license 是可选依赖，安装失败不影响构建。
