# Mission: 熟悉 DeepSeek Harness 架构

## Why
通过真实包的职责、调用链和源码约束，建立能够独立阅读、调试和修改 DeepSeek Harness 的代码地图。

## Success looks like
- 能判断一个功能属于领域服务、消费方、传输层还是运行策略
- 能从公开方法追踪到 Session 事件、投影和恢复逻辑
- 能解释关键并发与持久化约束，并据此定位测试

## Constraints
- 以仓库当前源码、测试和维护文档为依据
- 由浅入深，并用具体事件序列和代码示例说明

## Out of scope
- 当前不展开 Goal Round driver、模型工具和 Web UI 的全部内部实现
