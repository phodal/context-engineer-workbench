# CI/CD 设置说明

## 概述

本项目已配置了完整的 CI/CD 流程，包括：

1. **本地 Pre-push Hook** - 在推送前自动检查
2. **GitHub Actions** - 在 GitHub 上自动检查和验证

## 本地 Pre-push Hook

### 工作原理

当你执行 `git push` 时，会自动运行以下检查：

```
🔍 Running pre-push checks...
📝 Checking lint...
🔨 Building...
🧪 Running tests...
✅ All checks passed! Pushing...
```

### 检查内容

- **Lint** (`npm run lint`) - 代码风格和质量检查
- **Build** (`npm run build`) - 编译检查
- **Test** (`npm run test`) - 单元测试

### 如果检查失败

推送会被阻止，你需要：

1. 查看错误信息
2. 修复问题
3. 重新推送

### 跳过检查（不推荐）

```bash
git push --no-verify
```

**注意**：这样会跳过本地检查，但 GitHub Actions 仍会运行，可能导致 CI 失败。

## GitHub Actions 工作流

### 触发条件

工作流在以下情况下自动运行：

- 推送到 `main`、`master` 或 `develop` 分支
- 创建或更新 PR 到这些分支

### 工作流任务

#### 1. Lint 检查
- 运行 ESLint
- 检查代码风格和质量
- 失败会阻止合并

#### 2. Build 检查
- 运行 `npm run build`
- 确保代码能成功编译
- 失败会阻止合并

#### 3. 测试
- 运行 `npm run test`
- 执行所有单元测试
- 失败会阻止合并

### 查看工作流状态

1. 进入 GitHub 仓库
2. 点击 "Actions" 标签
3. 查看最新的工作流运行

### 工作流配置文件

配置文件位于：`.github/workflows/ci.yml`

## 最佳实践

### 1. 定期运行本地检查

```bash
# 在推送前手动运行
npm run lint
npm run build
npm run test
```

### 2. 修复 Lint 问题

```bash
# 自动修复可修复的问题
npm run lint -- --fix
```

### 3. 编写测试

为新功能添加测试，确保代码质量。

### 4. 查看 CI 日志

如果 GitHub Actions 失败，查看详细日志来了解问题。

## 故障排除

### Pre-push hook 不工作

确保 husky 已正确安装：

```bash
npm install
npm run prepare
```

### GitHub Actions 失败

1. 查看 Actions 标签中的详细日志
2. 本地重现问题
3. 修复后重新推送

### 依赖问题

如果遇到依赖冲突，使用：

```bash
npm install --legacy-peer-deps
```

## 配置修改

### 添加新的检查

编辑 `.github/workflows/ci.yml` 添加新的任务。

### 修改 Pre-push Hook

编辑 `.husky/pre-push` 修改本地检查。

### 修改 Lint 规则

编辑 `eslint.config.mjs` 修改代码风格规则。

## 相关文件

- `.github/workflows/ci.yml` - GitHub Actions 工作流配置
- `.husky/pre-push` - Pre-push hook 脚本
- `eslint.config.mjs` - ESLint 配置
- `jest.config.js` - Jest 测试配置
- `package.json` - NPM 脚本和依赖

