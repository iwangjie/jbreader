# 技博阅读 (TechStack.io - Tech Blog Reader)

**技博阅读 (Tech Blog Reader)** 是一款专为开发者与技术工作者设计的「双面」摸鱼 EPUB 阅读器。整个网页界面完美伪装成一个现代、前沿的英文技术博客（TechStack.io），具有出色的排版美学与丰富的视觉微交互，即使有人贴近屏幕也完全发现不了你正在看小说。

---

## 🎨 核心伪装与设计亮点

### 1. 四大高级伪装阅读主题 (Camouflage Themes)
在阅读 EPUB 电子书时，你可以通过「开发者控制台」一键切换四种截然不同的代码/博文排版样式：
* **Medium 博文模式 (Standard Blog)**：小说文字以衬线体渲染为标准的博客正文段落。主标题会自动伪装为真实的技术博客标题（如 *Deep Dive into Memory Allocation Footprints and GC Sweeps in Go*），真正的小说章节名称以极度模糊、半透明的形态缩影在作者信息栏中（悬停时还原）。
* **代码注释模式 (Code Comments)**：小说正文被切割并渲染在标准的 TypeScript 代码编辑器中，伪装为多行 `// 块级注释` 或 JSDoc 文档。注释段落之间交错插有实际运行的 `useState` 钩子、`useEffect` 逻辑和数据库初始化代码。
* **Git 代码提审模式 (Git PR Diff)**：小说文字作为绿色新增行 (`+ // ...`) 渲染在 GitHub 的 Pull Request 差异对比视图中。小说段落间夹有红色的修改行 (`- const ...`) 和灰色的代码上下文行，还原度极高。
* **API 文档模式 (API Docs)**：小说文字隐藏在标准的 API 接口定义列表与 `GET /v1/reader/chapters` 的 Response Payload 块中，右侧伴有深色高亮的 cURL 或 Node.js SDK 请求示例。

### 2. 双语混排文本穿插 (Bilingual Interleaving)
为避免在全英文的开发网页中突兀地出现大段纯中文的小说内容，阅读器会在渲染小说时，**自动在中文段落间穿插高拟真的英文技术描述和代码块**。
* 每两段中文插入一段关于“垃圾回收机制”、“序列化延迟”或“WebSocket 重连机制”的英文博文段落。
* 每三段中文插入一段完整的 JavaScript/Go/Rust 代码片段。
* 从远处看，屏幕上是英文、代码、中文字符的完美融合，极具专业技术翻译或对照解析博客的观感。

### 3. 三重瞬息安全护盾 (Panic Triggers)
当有人靠近屏幕时，你可以使用以下任意一种操作**瞬间切换回真实的英文技术博客页面（安全页面）**，切换为 0 毫秒延迟，无任何动效，不留痕迹：
* **急速滑动**：在鼠标滚轮或触控板上快速向任意方向滑动一下（当滚动速度 DeltaY 超过阈值时触发）。
* **键盘快捷键**：轻按 `Escape` 键（可在 Console 中更改）。
* **鼠标双击**：在文章背景任意空白处双击鼠标。
* **如何恢复**：在键盘上静默敲入解锁密码（默认：`read`），即可瞬间回到阅读状态，且自动记住刚才的阅读位置。

### 4. 离线沙箱与隐私安全 (Privacy-First)
* 本产品为 **100% 纯前端单页应用 (SPA)**，不含任何后端服务器。
* 电子书的解压、XML解析与图片 base64 转换均在本地浏览器内存中完成。
* 你的阅读进度、个性化配置（字体大小、行高、 panic 键）以及上传的 EPUB 电子书文件，全部使用浏览器原生的 **IndexedDB** 数据库安全加密并存储在你的电脑本地，绝不上传任何服务器，保证小说版权和阅读隐私。

---

## 🛠️ 本地运行与安装指南

### 依赖项
* [Node.js](https://nodejs.org/) (推荐 v18+)
* npm 或 yarn

### 运行步骤
1. **安装项目依赖**：
   ```bash
   npm install
   ```

2. **启动本地开发服务器**：
   ```bash
   npm run dev
   ```
   * 启动成功后，浏览器访问命令输出的地址即可（默认 `http://localhost:5173/` 或自适应 `http://localhost:5174/`）。

3. **打包生产静态资源**：
   ```bash
   npm run build
   ```
   * 打包生成的代码位于 `dist/` 文件夹中，你可以直接将其部署在 Vercel, Netlify, GitHub Pages 或公司内网静态服务器中。

---

## 📖 操作控制台 (DevTools Console) 指南
1. 点击顶部导航栏最右侧的 **Sliders（调节器）图标**（系统控制台悬浮提示为 Console Options），或者在页面任意位置输入密码 `read`。
2. 控制台功能：
   * **Camouflage Interface Layout**：切换四种伪装主题。
   * **Typography config**：调节字号大小（12px - 22px）与行高。
   * **Panic Instant Key**：捕获键盘任意按键设置为紧急避险键。
   * **Resume Passcode**：修改回到小说所需的敲击密码。
   * **Local Novel Library**：管理你上传的本地小说库，点击标题可瞬间切换小说，点击垃圾桶可清理本地 IndexedDB 缓存。
