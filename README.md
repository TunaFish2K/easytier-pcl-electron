# EasyTier PCL Electron

基于[EasyTier](https://github.com/EasyTier/EasyTier/blob/main/README_CN.md)和[PCL协议](https://github.com/Meloong-Git/PCL/wiki/%E7%AE%80%E6%B4%81%E8%81%94%E6%9C%BA%E6%A0%87%E8%AE%B0%E7%BA%A6%E5%AE%9A)的与[Plain Craft Launcher 2](https://github.com/Meloong-Git/PCL)兼容的联机工具。

## 安装

### Linux

下载 AppImage 文件后，添加可执行权限并运行：

```bash
chmod +x EasyTierPCL-x.x.x.AppImage
./EasyTierPCL-x.x.x.AppImage
```

### macOS

下载对应架构的 DMG 文件：

- Intel 芯片：`EasyTierPCL-x.x.x-x64.dmg`
- Apple Silicon (M1/M2)：`EasyTierPCL-x.x.x-arm64.dmg`

打开 DMG 文件，将应用拖入 Applications 文件夹即可。

### Windows

下载程序压缩包并解压，运行`easytier-pcl-electron.exe`。

### 其他平台

如果你的平台没有可用的构建，需要自行构建。  
构建时EasyTier的二进制文件会被打包，请编辑`easytier.json`为你的平台添加二进制文件的压缩包。

## 构建

### 前置要求

- Node.js 18 或更高版本
- npm 或其他包管理器

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 平台构建

#### Linux AppImage

```bash
npm run build:linux
```

生成文件：`dist/easytier-pcl-electron-1.0.0.AppImage`

#### macOS DMG (x64 + ARM64)

> [!IMPORTANT]  
> 只能在MacOS下编译。

```bash
npm run build:mac
```

生成文件：

- `dist/easytier-pcl-electron-1.0.0-x64.dmg`
- `dist/easytier-pcl-electron-1.0.0-arm64.dmg`

#### Windows Portable

> [!IMPORTANT]  
> 在非Windows平台下构建需要安装Wine，并安装依赖。  
> 没有在x86_64 linux 以外的平台测试过，  
> 作者使用了`winetricks -q comctl32ocx comdlg32ocx`安装依赖。

```bash
npm run build:win
```
