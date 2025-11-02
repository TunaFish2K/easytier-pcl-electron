# EasyTier 二进制文件依赖

此目录用于存放不同平台的 EasyTier 可执行文件压缩包。

## 目录结构

请将各平台的 EasyTier 压缩包放置在此目录下：

```
deps/
├── easytier-windows-x86_64-v2.4.5.zip  # Windows x86_64 版本
├── easytier-macos-x86_64-v2.4.5.zip    # macOS x86_64 版本
└── easytier-linux-x86_64-v2.4.5.zip    # Linux x86_64 版本
```

## 获取二进制文件

从 EasyTier 官方仓库下载对应平台的可执行文件：
https://github.com/EasyTier/EasyTier/releases

## 压缩包要求

所有平台都使用 **ZIP** 格式，可执行文件名如下：

### Windows
- 文件名: `easytier-windows-x86_64-v2.4.5.zip`
- 格式: ZIP
- 包含文件: `easytier-core.exe`

### macOS
- 文件名: `easytier-macos-x86_64-v2.4.5.zip`
- 格式: ZIP
- 包含文件: `easytier-core`

### Linux
- 文件名: `easytier-linux-x86_64-v2.4.5.zip`
- 格式: ZIP
- 包含文件: `easytier-core`

## 使用说明

### 开发环境

在开发时，运行以下命令会自动解压当前平台的二进制文件到系统临时目录：

```bash
npm run prepare:binaries
```

或者直接运行开发模式（会自动调用上述命令）：

```bash
npm run dev
```

### 构建打包

构建应用时，会自动解压所有平台的二进制文件并打包到应用中：

```bash
npm run build
```

特定平台构建：

```bash
npm run build:win    # Windows 安装包
npm run build:mac    # macOS 安装包
npm run build:linux  # Linux 安装包
```

## 配置

二进制文件的配置在项目根目录的 `easytier.json` 文件中定义。如需修改压缩包路径或可执行文件名，请编辑该文件。

## 版本更新

更新 EasyTier 版本时：

1. 下载新版本的压缩包
2. 将新文件放入 `deps/` 目录（使用新的版本号命名）
3. 更新 `easytier.json` 中的文件名
4. 删除旧版本的压缩包

## 注意事项

1. **不要将二进制文件提交到 Git 仓库**：这些文件较大，已添加到 `.gitignore`
2. **确保文件完整性**：解压时会检查可执行文件是否存在
3. **平台兼容性**：只支持 x86_64 架构（Windows/macOS/Linux）
4. **权限问题**：在 Unix 系统上，脚本会自动设置可执行权限（755）
