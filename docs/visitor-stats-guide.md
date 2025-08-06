# 访客统计功能使用说明

## 概述

本访客统计系统为你的Jekyll个人网站添加了全面的访客追踪和展示功能，包括：

- ✅ 访客计数统计
- ✅ IP地理位置显示
- ✅ 在线人数模拟
- ✅ 响应式设计 (桌面端 + 移动端)
- ✅ 隐私保护
- ✅ 实时时间显示
- ✅ 交互式界面

## 功能特性

### 1. 统计数据显示

- **总访问量**: 累计访问次数 (30分钟内重复访问不重复计数)
- **今日访问**: 当天的访问次数
- **在线人数**: 基于时间算法的模拟在线用户数
- **访客位置**: 显示访客的地理位置 (城市, 地区, 国家)
- **IP信息**: 显示部分隐藏的IP地址 (保护隐私)

### 2. 响应式设计

- **桌面端**: 完整功能版本，包含详细统计和交互功能
- **移动端**: 简化版本，针对小屏幕优化
- **自适应**: 根据屏幕大小自动切换显示版本

### 3. 隐私保护

- IP地址部分隐藏 (例: 192.168.*.*** )
- 数据本地存储，不上传到服务器
- 支持 Do Not Track 浏览器设置
- 可配置的隐私级别

## 安装步骤

### 1. 文件结构

确保以下文件已添加到你的Jekyll网站：

```
_includes/
├── visitor-stats.html          # 主要统计组件
└── mobile-visitor-stats.html   # 移动端组件

_data/
└── visitor-stats-config.yml    # 配置文件

assets/js/
└── visitor-stats.js            # 高级统计脚本

_pages/
└── about.md                    # 主页 (已添加统计组件)
```

### 2. 在页面中使用

在你想要显示访客统计的页面中添加：

```liquid
{% include visitor-stats.html %}
{% include mobile-visitor-stats.html %}
```

## 配置选项

### 基本配置

编辑 `_data/visitor-stats-config.yml` 文件来自定义功能：

```yaml
visitor_stats:
  enabled: true
  display:
    total_visits: true     # 显示总访问量
    daily_visits: true     # 显示今日访问
    online_count: true     # 显示在线人数
    visitor_location: true # 显示访客位置
    visitor_ip: true       # 显示IP信息
```

### 隐私设置

```yaml
privacy:
  mask_ip: true              # 隐藏IP部分信息
  show_full_location: false  # 不显示完整地址
```

### 样式自定义

```yaml
theme:
  color_scheme: "gradient"   # gradient, solid, minimal
  primary_color: "#667eea"
  secondary_color: "#764ba2"
```

## API配置

### 默认API

系统默认使用 [ipapi.co](https://ipapi.co) 免费API，无需注册即可使用。

### 备用API

如果主API失败，系统会自动尝试备用API：
- freeipapi.com
- api.ipify.org

### 自定义API

你可以在配置文件中添加自己的API端点：

```yaml
api:
  primary_endpoint: "https://your-api.com/json/"
  backup_endpoints:
    - "https://backup-api1.com/json/"
    - "https://backup-api2.com/json/"
```

## 样式自定义

### 1. 修改颜色

在 `visitor-stats.html` 中找到样式部分，修改渐变色：

```css
.visitor-stats-box {
  background: linear-gradient(135deg, #your-color1 0%, #your-color2 100%);
}
```

### 2. 添加自定义CSS

在配置文件中添加自定义样式：

```yaml
custom_styles: |
  .visitor-stats-container {
    margin: 30px 0;
    max-width: 800px;
  }
```

### 3. 主题预设

系统提供几种预设主题：

- `gradient`: 渐变背景 (默认)
- `solid`: 纯色背景
- `minimal`: 简约风格

## 交互功能

### 桌面端

- **刷新按钮**: 点击右上角刷新图标重新获取位置信息
- **悬停效果**: 鼠标悬停统计卡片有动画效果
- **点击动画**: 点击统计项有反馈动画

### 移动端

- **双击刷新**: 双击统计框刷新数据
- **触摸反馈**: 触摸时有缩放反馈
- **紧凑布局**: 针对小屏幕优化的布局

## 数据存储

### 本地存储

所有统计数据存储在浏览器的 localStorage 中：

- `visitor_stats`: 主要统计数据
- `visitor_session`: 会话信息

### 数据结构

```javascript
{
  totalVisits: 123,
  dailyStats: {
    "2024-08-07": { visits: 5 }
  },
  sessions: [...],
  lastVisit: 1691234567890
}
```

### 数据清理

- 自动清理7天前的日统计数据
- 最多保留100个会话记录
- 30分钟会话超时

## 性能优化

### 1. 缓存策略

- 位置信息缓存24小时
- 统计数据每分钟更新一次
- 重试机制避免API失败

### 2. 懒加载

统计组件支持懒加载，减少初始页面加载时间。

### 3. 错误处理

- API失败时显示友好错误信息
- 自动重试机制
- 优雅降级到基本功能

## 问题排查

### 常见问题

1. **统计不显示**
   - 检查JavaScript是否正确加载
   - 确认浏览器支持localStorage
   - 查看浏览器控制台错误信息

2. **位置信息获取失败**
   - 检查网络连接
   - 确认API服务可用
   - 尝试手动刷新位置信息

3. **样式显示异常**
   - 检查CSS文件加载
   - 确认没有样式冲突
   - 验证响应式断点设置

### 调试模式

在配置文件中启用调试模式：

```yaml
advanced:
  debug_mode: true
  console_logging: true
```

## 浏览器兼容性

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+
- ❌ Internet Explorer (不支持)

## 隐私说明

本统计系统：

- 不收集个人身份信息
- 不上传数据到外部服务器
- 仅显示地理位置的城市级别信息
- IP地址进行部分隐藏处理
- 遵循浏览器的 Do Not Track 设置

## 更新日志

### v1.0.0 (2024-08-07)
- 首次发布
- 基础访客统计功能
- 响应式设计
- 地理位置显示
- 隐私保护

## 技术支持

如需技术支持或功能建议，请：

1. 检查本文档的问题排查部分
2. 查看浏览器控制台错误信息
3. 确认配置文件设置正确
4. 验证所有必要文件已正确安装

## 许可证

本访客统计系统基于 MIT 许可证开源。
