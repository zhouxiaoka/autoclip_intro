# 🎬 自动切片工具

一个端到端的视频自动切片推荐系统，通过多轮大模型推理实现智能视频内容分析与切片生成。

## ✨ 功能特性

- **多项目支持**: 支持同时管理多个处理项目，数据完全隔离
- **智能分析**: 6步流水线处理，从大纲提取到视频切割
- **双前端架构**: Streamlit快速原型 + React生产环境
- **统一配置**: 支持环境变量和配置文件管理
- **错误处理**: 完善的错误处理和重试机制
- **安全存储**: API密钥加密存储和管理

## 🏗️ 项目架构

### 双前端架构
- **Streamlit界面**: 用于快速原型开发和测试
- **React界面**: 用于生产环境的完整功能界面

### 后端架构
- **FastAPI后端**: 提供RESTful API服务，支持React前端
- **命令行工具**: 支持直接命令行处理
- **多项目隔离**: 每个项目独立的数据目录和配置

## 🚀 快速开始

### 1. 环境准备

```bash
# 克隆项目
git clone <repository-url>
cd auto_clips_demo

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或
venv\Scripts\activate     # Windows

# 安装依赖
pip install -r requirements.txt

# 以下bilitool安装步骤已移除
# python install_bilitool.py
# pip install bilitool
```

### 2. 配置API密钥

```bash
# 方式1: 环境变量
export DASHSCOPE_API_KEY="your_api_key_here"

# 方式2: 命令行参数
python main.py --api-key "your_api_key_here"

# 方式3: Streamlit界面输入
```

### 3. 运行方式

#### 命令行模式

```bash
# 创建新项目并处理
python main.py --video input.mp4 --srt input.srt --project-name "我的项目"

# 列出所有项目
python main.py --list-projects

# 处理现有项目
python main.py --project-id <project_id>

# 删除项目
python main.py --delete-project <project_id>

# 运行单个步骤
python main.py --project-id <project_id> --step 1
```

#### Streamlit界面

```bash
# 启动Streamlit应用
streamlit run app.py

# 或使用启动脚本
python streamlit_app.py
```

#### React前端

```bash
cd frontend
npm install
npm start
```

## 📋 处理流程

系统采用6步流水线处理：

1. **📖 大纲提取**: 从字幕文件中提取结构性大纲
2. **⏰ 时间定位**: 基于SRT定位话题时间区间
3. **🔥 内容评分**: 多维度评估片段质量与传播潜力
4. **📝 标题生成**: 为高分片段生成爆点标题
5. **📦 主题聚类**: 将相关片段聚合为合集推荐
6. **✂️ 视频切割**: 生成切片与合集视频

## 📁 数据结构

每个项目都有独立的数据结构：

```
uploads/{project_id}/
├── input/                 # 输入文件
│   ├── input.mp4         # 视频文件
│   ├── input.srt         # 字幕文件
│   └── input.txt         # 文本文件（可选）
├── output/               # 输出文件
│   ├── clips/            # 切片视频
│   ├── collections/      # 合集视频
│   └── metadata/         # 元数据
│       ├── project_metadata.json      # 项目元数据
│       ├── clips_metadata.json        # 切片元数据
│       ├── collections_metadata.json  # 合集元数据
│       ├── step1_result.json          # 步骤1结果
│       ├── step2_result.json          # 步骤2结果
│       └── ...                        # 其他步骤结果
├── logs/                 # 日志文件
└── temp/                 # 临时文件
```

## ⚙️ 配置管理

### 环境变量

```bash
# API配置
DASHSCOPE_API_KEY=your_api_key
MODEL_NAME=qwen-plus

# 处理参数
CHUNK_SIZE=5000
MIN_SCORE_THRESHOLD=0.7
MAX_CLIPS_PER_COLLECTION=5
MAX_RETRIES=3
TIMEOUT_SECONDS=30

# 路径配置
PROJECT_ROOT=/path/to/project
UPLOADS_DIR=/path/to/uploads
PROMPT_DIR=/path/to/prompt
TEMP_DIR=/path/to/temp

# 日志配置
LOG_LEVEL=INFO
LOG_FILE=auto_clips.log
```

### 配置文件

支持通过`data/settings.json`进行配置：

```json
{
  "api": {
    "model_name": "qwen-plus",
    "max_tokens": 4096
  },
  "processing": {
    "chunk_size": 5000,
    "min_score_threshold": 0.7,
    "max_clips_per_collection": 5
  },
}
```

## 🧪 测试

```bash
# 运行所有测试
python run_tests.py

# 运行特定测试
python -m pytest tests/test_config.py
python -m pytest tests/test_error_handler.py
```

## 📚 文档

- [后端架构设计](BACKEND_ARCHITECTURE.md)
- [项目总结](项目总结.md)


## 🔧 开发

### 项目结构说明

- **Streamlit**: 用于快速原型开发和演示
- **React**: 用于生产环境的前端界面
- **多项目架构**: 确保数据隔离和并发处理
- **统一配置**: 支持多种配置方式
- **错误处理**: 完善的异常处理和重试机制

### 添加新功能

1. 在`src/pipeline/`中添加新的处理步骤
2. 在`src/utils/`中添加工具函数
3. 更新配置和错误处理
4. 添加相应的测试
5. 更新文档

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License

## 📞 支持

如有问题，请提交Issue或联系开发团队。

## 项目文件说明

### 核心文件
- `index.html` - 项目主页
- `server.py` - 本地开发服务器
- `项目介绍文档.md` - 项目详细介绍

### 图片资源
- `main.png` - 主界面截图
- `multi_input.png` - 多输入界面截图
- `task.png` - 任务管理截图
- `collection.png` - 合集预览截图
- `preview.png` - 视频预览截图

### 联系方式二维码（需要添加）
- `qq_qr.jpg` - QQ二维码
- `feishu_qr.jpg` - 飞书二维码

### 视频演示文件（需要添加）
- `demo.mp4` - 产品演示视频（推荐格式）
- `demo.webm` - 产品演示视频（WebM格式）
- `demo.ogg` - 产品演示视频（OGG格式）

## 本地开发

```bash
# 启动本地服务器
python server.py

# 访问 http://localhost:8000
```

## 功能特性

- 智能视频切片
- 智能合集推荐
- 自动标题生成
- 内容质量评估
- 多项目管理（开发中）
- B站自动上传（计划中）

## 联系方式

扫描二维码添加开发者：
- QQ：`qq_qr.jpg`
- 飞书：`feishu_qr.jpg`

请备注"AutoClip"以便快速通过好友申请。