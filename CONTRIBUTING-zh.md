# 为 Prompt Booster 贡献代码

欢迎为 Prompt Booster 贡献代码！本文档提供了为项目贡献代码的指导原则。

## 开始前的准备

### 前置要求

在开始之前，请确保您已安装以下工具：
- Node.js 18.17.0 或更高版本
- PNPM 10.9.0 或更高版本
- Git

### Fork 和克隆

1. **Fork 仓库**
   - 访问 [https://github.com/hexart/prompt-booster](https://github.com/hexart/prompt-booster)
   - 点击右上角的 "Fork" 按钮
   - 这将在您的 GitHub 账户中创建仓库的副本

2. **克隆您的 Fork**
   ```bash
   git clone https://github.com/您的用户名/prompt-booster.git
   cd prompt-booster
   ```

3. **添加原始仓库为上游**
   ```bash
   git remote add upstream https://github.com/hexart/prompt-booster.git
   ```

### 开发环境设置

1. **安装依赖**
   ```bash
   pnpm install
   ```

2. **启动开发服务器**
   ```bash
   pnpm dev
   ```

3. **验证一切正常**
   - 打开浏览器并访问 `http://localhost:3000`
   - 确保应用程序正确加载

## 进行更改

### 创建分支

始终为您的更改创建新分支：

```bash
# 确保您在 main 分支上且代码是最新的
git checkout main
git pull upstream main

# 创建并切换到新分支
git checkout -b feature/您的功能名称
```

分支命名约定：
- `feature/功能名称` - 用于新功能
- `fix/错误描述` - 用于错误修复
- `docs/文档更新` - 用于文档更改
- `refactor/组件名称` - 用于代码重构
- `test/测试描述` - 用于添加或更新测试

### 进行更改

1. **在您的功能分支中进行更改**
2. **彻底测试您的更改**
   ```bash
   # 运行测试
   pnpm test
   
   # 构建以确保没有构建错误
   pnpm build
   
   # 检查代码风格
   pnpm lint
   ```

3. **提交您的更改**
   - 编写清晰、描述性的提交消息
   - 遵循约定式提交格式：
   ```bash
   git add .
   git commit -m "feat: 添加新的提示词优化算法"
   git commit -m "fix: 解决模板加载问题"
   git commit -m "docs: 更新API文档"
   ```

### 提交消息指南

我们遵循 [约定式提交](https://www.conventionalcommits.org/zh-hans/) 规范：

- `feat:` - 新功能
- `fix:` - 错误修复
- `docs:` - 仅文档更改
- `style:` - 不影响代码含义的更改（格式化等）
- `refactor:` - 既不修复错误也不添加功能的代码更改
- `test:` - 添加缺失的测试或修正现有测试
- `chore:` - 构建过程或辅助工具的更改

## 提交 Pull Request

### 提交前

1. **确保您的分支是最新的**
   ```bash
   git checkout main
   git pull upstream main
   git checkout 您的功能分支
   git rebase main
   ```

2. **推送您的更改**
   ```bash
   git push origin 您的功能分支
   ```

### 创建 Pull Request

1. **导航到原始仓库** 在 GitHub 上
2. **点击 "New Pull Request"**
3. **从"compare"下拉菜单中选择您的分支**
4. **填写 PR 模板** 包含以下信息：

#### Pull Request 模板

```markdown
## 描述
简要描述所做的更改。

## 更改类型
- [ ] 错误修复（不破坏现有功能的非破坏性更改）
- [ ] 新功能（添加功能的非破坏性更改）
- [ ] 破坏性更改（可能导致现有功能无法正常工作的修复或功能）
- [ ] 文档更新

## 如何测试？
描述您运行的测试以验证您的更改。

## 截图（如适用）
添加截图以帮助解释您的更改。

## 检查清单
- [ ] 我的代码遵循此项目的风格指南
- [ ] 我已对自己的代码进行了自审
- [ ] 我已对代码进行了注释，特别是在难以理解的区域
- [ ] 我已对文档进行了相应的更改
- [ ] 我的更改不会产生新的警告
- [ ] 我已添加了证明我的修复有效或我的功能正常工作的测试
- [ ] 新的和现有的单元测试在本地通过我的更改
```

### 提交后

1. **等待审查** - 维护者将审查您的 PR
2. **处理反馈** - 如需要，进行请求的更改
3. **保持 PR 更新** - 如果主分支有新提交，请进行 rebase

## 代码风格指南

### TypeScript/JavaScript
- 对所有新代码使用 TypeScript
- 遵循现有代码风格
- 使用有意义的变量和函数名
- 为公共 API 添加 JSDoc 注释

### React 组件
- 使用带有 hooks 的函数组件
- 遵循现有组件结构
- 为 props 使用适当的 TypeScript 类型

### CSS/样式
- 使用 TailwindCSS 实用程序类
- 遵循现有设计系统
- 确保响应式设计

## 测试

- 为新功能编写测试
- 确保现有测试通过
- 跨不同浏览器和设备测试
- 测试 Web 和桌面应用程序

## 文档

- 如需要，更新 README.md
- 为新函数添加 JSDoc 注释
- 为新端点更新 API 文档
- 为新功能包含示例

## 获取帮助

如果您需要帮助或有问题：

1. **检查现有问题和讨论**
2. **为错误或功能请求创建新问题**
3. **为一般问题开始讨论**
4. **通过 GitHub 联系维护者**

## 行为准则

请注意，此项目发布时附带了贡献者行为准则。通过参与此项目，您同意遵守其条款。

## 致谢

贡献者将在项目的 README.md 和发布说明中得到认可。

感谢您为 Prompt Booster 贡献代码！🚀