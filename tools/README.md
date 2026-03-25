# Stanford Town

AI Agent 社会模拟实验台，基于 [AI Town (a16z)](https://github.com/a16z-infra/ai-town)。

## Quick Start

```bash
# 1. 初始化环境
./bootstrap.sh

# 2. 检查环境
python3 lab/lab.py preflight

# 3. 查看状态
python3 lab/lab.py status

# 4. 启动 AI Town
python3 lab/lab.py start ai-town

# 5. 打开浏览器
# http://localhost:5174/stanford-town

# 6. 停止
python3 lab/lab.py stop ai-town
```

## 目录结构

```
stanford-town/
├── lab/                    # 控制平面
│   ├── lab.py              # CLI 控制器
│   ├── projects.json       # 项目元数据
│   ├── status.json         # 运行时状态（自动生成）
│   ├── dashboard/          # Web 运维总览
│   ├── env/                # 环境变量
│   ├── logs/               # 运行日志
│   └── run/                # PID 文件
├── bootstrap.sh            # 环境初始化
└── projects/
    └── ai-town/            # AI Town 前后端代码
```

## 基础设施

- **Convex 后端** (端口 3210): Docker 自托管，`projects/ai-town/docker-compose.yml`

## 端口分配

| 服务 | 端口 |
|------|------|
| AI Town 前端 | 5174 |
| Convex 后端 | 3210 |
| Dashboard | 4000 |
