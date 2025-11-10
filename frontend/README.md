# 分布式物流系统监控平台

基于 Next.js + React 的现代化物流监控系统，集成真实后端API和高德地图服务。

## 🚀 功能特性

- **实时监控**: 订单概览、车辆状态、系统健康监控
- **地图可视化**: 基于高德地图的车辆实时追踪
- **数据分析**: 趋势分析、区域分析、数据导出
- **告警管理**: 实时告警、告警确认、告警统计
- **健康监控**: 系统组件健康状态监控
- **模式切换**: 支持模拟模式和实时模式切换

## 📋 系统要求

- Node.js 18.0 或更高版本
- 后端API服务运行在 http://localhost:5793
- 高德地图API密钥（可选，用于地图功能）

## 🛠 安装步骤

### 1. 克隆项目
```bash
git clone <repository-url>
cd logistics-system
```

### 2. 安装依赖
```bash
npm install
# 或
yarn install
```

### 3. 配置环境变量
创建 `.env.local` 文件：
```bash
# API配置
NEXT_PUBLIC_API_BASE_URL=http://localhost:5793

# 高德地图API配置（可选）
NEXT_PUBLIC_AMAP_KEY=your-amap-api-key-here
NEXT_PUBLIC_AMAP_SECURITY_CODE=your-security-code-here
```

### 4. 启动开发服务器
```bash
npm run dev
# 或
yarn dev
```

### 5. 访问应用
打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 🔧 后端API要求

确保后端服务正常运行并提供以下接口：

- `GET /metrics/overview` - 订单概览
- `GET /vehicles/status` - 车辆状态
- `GET /alerts` - 告警列表
- `GET /health` - 健康检查
- `POST /mode` - 模式切换

详细API文档请参考接口文档。

## 📱 使用说明

### 主要功能模块

1. **实时监控**: 查看订单总数、处理中订单、延迟订单和准时率
2. **车辆追踪**: 监控所有车辆的实时位置和状态
3. **地图视图**: 在高德地图上查看车辆分布和轨迹
4. **数据分析**: 查看趋势数据和区域分析报告
5. **告警系统**: 管理系统告警和异常通知
6. **健康监控**: 监控系统各组件的健康状态

### 操作指南

- **刷新数据**: 点击右上角刷新按钮手动更新数据
- **模式切换**: 在API连接状态面板切换模拟/实时模式
- **告警处理**: 在告警系统中确认和处理告警
- **数据导出**: 在数据分析模块导出CSV或JSON格式数据

## 🗺 地图配置

### 获取高德地图API密钥

1. 访问 [高德开放平台](https://console.amap.com/)
2. 注册/登录账号
3. 创建新应用
4. 添加Web端Key
5. 配置域名白名单
6. 将API密钥添加到环境变量

### 地图功能

- 实时车辆位置显示
- 多种地图样式切换
- 交通流量图层
- 车辆轨迹显示
- 车辆状态可视化

## 🔍 故障排除

### 常见问题

1. **API连接失败**
   - 检查后端服务是否运行在 http://localhost:5793
   - 确认网络连接正常
   - 查看浏览器控制台错误信息

2. **地图无法加载**
   - 检查高德地图API密钥是否正确配置
   - 确认域名已添加到高德平台白名单
   - 检查网络是否能访问高德地图服务

3. **数据不更新**
   - 检查后端API是否正常返回数据
   - 尝试手动刷新数据
   - 检查浏览器网络面板的API请求状态

### 日志调试

开启浏览器开发者工具查看：
- Console 面板：查看JavaScript错误
- Network 面板：查看API请求状态
- Application 面板：查看本地存储数据

## 📦 构建部署

### 生产构建
```bash
npm run build
npm run start
```

### Docker部署
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

MIT License

这个完整的解决方案包含：

1. **完整的API客户端** - 支持所有后端接口
2. **类型安全** - 完整的TypeScript类型定义
3. **React Hooks** - 数据获取和状态管理
4. **实时更新** - 自动刷新和手动刷新功能
5. **错误处理** - 完善的错误处理和用户提示
6. **地图集成** - 高德地图可视化
7. **响应式设计** - 适配各种屏幕尺寸
8. **详细文档** - 完整的安装和使用说明

## 🚀 启动步骤总结

1. 确保后端API服务运行在 http://localhost:5793
2. 安装Node.js依赖：`npm install`
3. 配置环境变量（.env.local）
4. 启动开发服务器：`npm run dev`
5. 访问 http://localhost:3000

系统将自动连接后端API并显示实时数据！
