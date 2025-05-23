# Prompt Booster
![Prompt Booster](img/banner.png)

[English](README.md) [在线体验](https://hexart.github.io/prompt-booster/)

一个用于优化和增强多平台大型语言模型(LLMs)提示词的综合性单体仓库项目。

## 概述

Prompt Booster是一款专为帮助用户优化大型语言模型提示词而设计的专业工具。它利用多个AI提供商，实现跨平台的提示词优化、版本控制、A/B测试和模板管理。

该项目采用单体仓库架构，使用Turborepo和PNPM工作区，组织为包含共享代码的packages和特定平台应用的apps。

## 项目结构

```markdown
prompt-booster/
├── packages/                  # 跨平台共享代码
│   ├── core/                  # 核心业务逻辑和状态管理
│   ├── api/                   # 针对LLM提供商的API客户端实现
│   └── ui/                    # 共享UI组件
├── apps/                      # 特定平台实现
│   ├── web/                   # Web应用
│   └── desktop/               # Electron桌面应用
├── backend/                   # FastAPI后端服务（计划中）
├── docs/                      # 项目文档
├── docker/                    # Docker配置文件
│   ├── frontend.Dockerfile    # 前端容器构建文件
│   └── nginx.conf             # Nginx配置
└── docker-compose.yml         # Docker compose配置
```

## 核心包

### @prompt-booster/core

核心包作为基础，提供：

- 模型配置管理
- 带版本控制的提示词管理
- 用于提示词优化的模板系统
- 使用Zustand进行状态管理
- 存储实用工具

[查看核心包文档](packages/core/README-zh.md)

### @prompt-booster/api

一个用于与各种LLM服务交互的灵活客户端库：

- 多个LLM提供商的统一接口
- 支持OpenAI、Gemini、DeepSeek、Hunyuan、Siliconflow和Ollama
- 流式响应处理
- 错误管理
- 认证策略

[查看API包文档](packages/api/README-zh.md)

### @prompt-booster/ui

一个综合性UI组件库：

- 专业的提示词编辑组件
- 带有明/暗模式的主题系统
- 对话框和模态组件
- 带有语法高亮的Markdown渲染
- 用于流式内容的自动滚动组件

[查看UI包文档](packages/ui/README-zh.md)

## 应用

### Web应用

基于浏览器的提示词优化应用：

- 提示词增强和迭代
- 质量分析
- A/B测试
- 版本历史管理
- 模型配置

[查看Web应用文档](apps/web/README-zh.md)

### 桌面应用

使用Electron的原生桌面体验：

- 跨平台支持（Windows、macOS、Linux）
- 原生操作系统菜单和键盘快捷键
- 离线功能
- 与Web版本一致的UI

**重要说明**：桌面应用被有意设计为完全独立于主项目结构的包。与单体仓库中使用pnpm的其他包不同，由于pnpm与Electron Builder之间的兼容性问题，桌面包专门使用npm进行依赖管理。桌面客户端虽然使用编译后的web应用，但维护着自己的构建过程和依赖树。有关详细的编译和开发说明，请参阅[桌面应用文档](apps/desktop/README-zh.md)。

[查看桌面应用文档](apps/desktop/README-zh.md)

## 设置和开发

### 先决条件

- Node.js 18.17.0或更高版本
- PNPM 10.9.0或更高版本

### 安装

1. 安装 Node.js：

   - 从 [Node.js 官网](https://nodejs.org/) 下载并安装 Node.js 18.17.0 或更高版本
   - 在终端运行 `node -v` 和 `npm -v` 命令验证安装是否成功

2. 安装 pnpm：

   ```bash
   # 使用 npm 安装
   npm install -g pnpm
   
   # 或使用推荐的独立脚本安装
   curl -fsSL https://get.pnpm.io/install.sh | sh -
   
   # 验证安装
   pnpm --version
   ```

3. 克隆仓库：

   ```bash
   git clone https://github.com/hexart/prompt-booster.git
   cd prompt-booster
   ```

4. 安装依赖：

   ```bash
   pnpm install
   ```

### 开发工作流

启动Web应用的开发服务器：

```bash
# 构建包并以开发模式启动Web应用
pnpm dev
```

以开发模式运行桌面应用：

```bash
# 以开发模式启动桌面应用
cd apps/desktop
npm install
npm run dev
```

构建所有包和应用：

```bash
# 构建所有包和应用
pnpm build
```

清理项目：

```bash
# 清理构建产物
pnpm clean

# 深度清理（包括node_modules）
pnpm clean:all
```

### 桌面应用构建

为不同平台构建桌面应用包：

```bash
cd apps/desktop
# 为所有平台打包
npm run build

# 为macOS打包
npm run build:mac
```

## 部署

### Docker部署

#### 使用自动更新快速启动

使用以下命令拉取最新镜像并在容器中运行Prompt Booster。每次运行此命令时将自动更新到最新版本：

```bash
docker pull ghcr.io/hexart/prompt-booster:latest \
&& docker rm -f prompt-booster 2>/dev/null || true \
&& docker run -d \
    --name prompt-booster \
    --restart always \
    -p 8080:80 \
    ghcr.io/hexart/prompt-booster:latest
```

此命令：

- 从GitHub容器注册表拉取最新镜像
- 移除任何名为"prompt-booster"的现有容器
- 创建一个具有自动重启策略的新容器
- 将主机上的8080端口映射到容器中的80端口

#### 使用Docker Compose

项目还包括用于更高级部署的Docker Compose配置：

1. 构建并启动容器：

   ```bash
   docker-compose up -d
   ```

   这将：

   - 使用`docker/frontend.Dockerfile`构建前端容器
   - 使用`docker/nginx.conf`配置Nginx
   - 启动`docker-compose.yml`中定义的服务

2. 在`http://localhost:8080`访问应用

### 手动部署

对于Web应用的手动部署：

1. 构建项目：

   ```bash
   pnpm build
   ```

2. 构建文件将位于`apps/web/dist`

3. 将这些文件部署到任何静态Web服务器

## 当前开发状态

该项目目前正在积极开发中。根据开发路线图：

- 第1阶段（基础）和第2阶段（高级功能和桌面版）已完成
- 第3阶段（增强功能）目前正在进行中
- 第4-7阶段（后端和同步、移动端、微信小程序、完善和发布）计划在未来开发

## 项目文档

提供额外文档：

- [架构设计](docs/architecture-design.md)
- [后端架构](docs/backend-architecture.md)
- [数据库设计](docs/database-design.md)
- [开发路线图](docs/development-roadmap.md)

## 技术栈

- **语言**：TypeScript、Python（后端）
- **前端**：React 19.1、TailwindCSS 4.1
- **状态管理**：Zustand 5.0
- **构建工具**：Vite、Turborepo、PNPM
- **桌面**：Electron 36
- **后端**（计划）：FastAPI、PostgreSQL
- **容器化**：Docker

## 贡献

欢迎贡献！请参阅我们的[贡献指南](CONTRIBUTING-zh.md)获取如何为此项目贡献代码的详细说明。

- 📋 [贡献指南](CONTRIBUTING-zh.md) - 如何Fork、开发和提交Pull Request
- 🐛 [报告问题](https://github.com/hexart/prompt-booster/issues) - 报告错误或请求新功能

请遵循贡献指南中概述的现有代码风格和开发指导原则。

## 致谢

本项目的开发过程中受到了 [linshenkx](https://github.com/linshenkx) 开发的 [prompt-optimizer](https://github.com/linshenkx/prompt-optimizer) 项目的启发和参考。我们在此对linshenkx在提示词工程和优化领域的开创性工作表示衷心的感谢。他们在MIT许可下的开源贡献对Prompt Booster的开发起到了重要的促进作用。我们强烈推荐大家查看他们的原始项目。

## 许可证

本项目采用MIT许可证和Apache许可证2.0的双重许可，您可以选择使用其中任一许可。

- MIT许可证 ([LICENSE-MIT](LICENSE-MIT) 或 http://opensource.org/licenses/MIT)
- Apache许可证2.0 ([LICENSE-APACHE](LICENSE-APACHE) 或 http://www.apache.org/licenses/LICENSE-2.0)

© Hexart Studio 2025