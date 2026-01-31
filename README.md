# Auto Index

基于 GitHub Pages 和文件系统约定的动态网站生成器。

## 特性

- 📁 基于文件系统约定配置页面
- 🎨 支持自定义背景图和 Logo
- 🔗 支持 URL 参数传递到跳转链接
- 📱 响应式设计，支持移动端

## 快速开始

### 1. 部署到 GitHub Pages

1. Fork 或克隆此仓库
2. 进入仓库设置 → Pages
3. Source 选择 `main` 分支，目录选择 `/ (root)`
4. 保存后等待部署完成

### 2. 创建新页面

在 `pages/` 目录下创建新文件夹，例如 `pages/mypage/`：

```
pages/mypage/
├── config.json      # 必须：页面配置
├── background.jpg   # 可选：背景图
├── logo.png         # 可选：Logo
└── images/          # 可选：图片资源
    ├── pic1.jpg
    └── pic2.jpg
```

### 3. 配置 config.json

```json
{
  "title": "我的页面",
  "fontFamily": "Inter, sans-serif",
  "fontUrl": "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
  "backgroundColor": "#111827",
  "pageBackgroundColor": "#0b0f19",
  "imageBackgroundColor": "#0a0a0a",
  "buttonBackgroundColor": "rgba(255,255,255,0.12)",
  "pageButtonBackgroundColor": "rgba(255,255,255,0.12)",
  "imageButtonBackgroundColor": "rgba(255,255,255,0.14)",
  "buttonTextColor": "#ffffff",
  "pageButtonTextColor": "#ffffff",
  "imageButtonTextColor": "#ffffff",
  "description": "这里是一段简短描述",
  "background": "background.jpg",
  "logo": "logo.png",
  "buttons": [
    {
      "text": "按钮名称",
      "subtitle": "可选的副标题",
      "icon": "🎮",
      "image": "images/pic1.jpg",
      "link": "https://example.com?ref={ref}&channel={channel}",
      "linkText": "前往",
      "backgroundColor": "rgba(255,255,255,0.12)",
      "textColor": "#ffffff"
    }
  ]
}
```

每个按钮可单独设置 `backgroundColor`、`textColor`，未设置时使用页面级 `pageButtonBackgroundColor`、`pageButtonTextColor`。

### 自定义字体

- **fontFamily**：字体族名，会应用到整页（标题、描述、按钮文字等），页面已有字重（400、600 等）会自动匹配。
- **fontUrl**：字体 CSS 链接（如 Google Fonts 的链接）。若不填但填了 `fontFamily`，会自动用 Google Fonts 拉取该字体的 400、500、600、700 字重。

示例：只填 `"fontFamily": "Noto Sans SC, sans-serif"` 即可使用思源黑体，无需自己写链接。

## URL 格式

| URL | 说明 |
|-----|------|
| `/mypage` | 访问 mypage 页面 |
| `/mypage?ref=abc` | 带参数访问 |
| `/mypage/image/0` | 查看第 1 个按钮的图片页 |
| `/mypage/image/0?ref=abc` | 带参数的图片页 |

## 参数传递

在 `link` 中使用占位符，访问时会自动替换：

- `{query}` - 完整的查询字符串，如 `ref=abc&channel=123`
- `{ref}` - 单个参数值，对应 URL 中的 `?ref=xxx`
- `{channel}` - 另一个参数值

**示例：**

配置：
```json
{
  "link": "https://store.com/app?source={ref}&from={channel}"
}
```

访问 `/mypage?ref=google&channel=ad1`，点击按钮后跳转到：
```
https://store.com/app?source=google&from=ad1
```

## 文件结构

```
/
├── index.html          # 主入口
├── 404.html            # SPA 路由支持
├── app.js              # 核心逻辑
├── style.css           # 样式
├── pages/
│   ├── demo/           # 示例页面
│   │   ├── config.json
│   │   ├── background.svg
│   │   ├── logo.svg
│   │   └── images/
│   └── [your-page]/    # 你的页面
│       └── ...
```

## 本地开发

```bash
# 使用任意静态服务器
npx serve .
# 或
python -m http.server 8000
```

## License

MIT
