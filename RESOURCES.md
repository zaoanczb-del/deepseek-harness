# DeepSeek Harness 架构学习资源

## Knowledge

- [DeepSeek Harness 架构](docs/architecture.zh.md)
  项目插件组合、Session 日志、Agent 生命周期和扩展点的权威总览。用于建立包之间的关系。
- [Goal 包说明](packages/goal/goal/README.zh.md)
  GoalService 的公开行为、生命周期、持久化规则和限制。用于确认对外约定。
- [GoalService 源码](packages/goal/goal/src/index.ts)
  Goal 写入、投影注册、activation 管理和 Remote 方法的实现来源。
- [Goal 严格折叠](packages/goal/goal/src/fold.ts)
  Session 事件的解码、状态转换和恢复校验规则。
- [Goal 测试](packages/goal/goal/tests/goal.spec.ts)
  生命周期、陈旧 revision、恢复、时间戳和错误状态的行为证据。

## Wisdom (Communities)

- 本仓库的 Pull Request 与 Agent Notes
  用于了解维护者如何评审事件格式、生命周期和并发语义；遇到设计取舍时优先追踪相应 Agent Note。
