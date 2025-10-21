# 贡献指南

## 本地开发工作流

### 1. 安装依赖
```bash
npm install --legacy-peer-deps
```

### 2. 本地开发
```bash
npm run dev
```

### 3. 推送前检查

在推送代码前，系统会自动运行以下检查（通过 pre-push hook）：

- **Lint 检查** - 代码风格和质量检查
- **Build 检查** - 确保代码能成功编译
- **测试** - 运行所有单元测试

如果任何检查失败，推送将被阻止。请修复问题后重新推送。

### 4. 手动运行检查

```bash
# 运行 lint
npm run lint

# 修复 lint 问题
npm run lint -- --fix

# 构建项目
npm run build

# 运行测试
npm run test

# 运行 E2E 测试
npm run test:e2e
```

## GitHub Actions CI

所有推送和 PR 都会自动触发 GitHub Actions 工作流，包括：

- **Lint** - 代码质量检查
- **Build** - 编译检查
- **Test** - 单元测试

所有检查必须通过才能合并 PR。

## 常见问题

### Pre-push hook 失败

如果 pre-push hook 失败，请：

1. 查看错误信息
2. 修复相应的问题
3. 重新尝试推送

### 跳过 pre-push hook

如果需要临时跳过 hook（不推荐），可以使用：

```bash
git push --no-verify
```

但这样会跳过 GitHub Actions 的检查，可能导致 CI 失败。

## 最佳实践

1. **经常运行本地检查** - 在推送前运行 `npm run lint` 和 `npm run build`
2. **编写测试** - 为新功能添加测试
3. **保持代码整洁** - 使用 `npm run lint -- --fix` 自动修复问题
4. **查看 CI 日志** - 如果 GitHub Actions 失败，查看详细日志

