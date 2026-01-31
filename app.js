/**
 * Auto Index - 基于文件系统约定的动态网站
 * 
 * 文件结构约定：
 * /pages/{path}/
 *   ├── config.json      # 页面配置
 *   ├── background.jpg   # 背景图（可选）
 *   ├── logo.png         # Logo（可选）
 *   └── images/          # 图片资源
 * 
 * config.json 格式：
 * {
 *   "title": "页面标题",
 *   "fontFamily": "Inter, sans-serif",   // 可选，自定义字体（会继承字重 400/600 等）
 *   "fontUrl": "https://...",            // 可选，字体 CSS 链接；不填且填了 fontFamily 则自动用 Google Fonts 拉取 400,500,600,700
 *   "background": "background.jpg",
 *   "logo": "logo.png",
 *   "buttons": [
 *     {
 *       "text": "按钮文字",
 *       "icon": "🎮",           // 可选图标
 *       "image": "images/pic.jpg",
 *       "link": "https://example.com?param={query}",
 *       "backgroundColor": "rgba(255,255,255,0.12)",  // 可选，按钮背景色
 *       "textColor": "#ffffff"                         // 可选，按钮文字色
 *     }
 *   ]
 * }
 * 
 * URL 格式：
 * - /{path}              访问页面
 * - /{path}?key=value    带参数访问
 * - /{path}/image/{idx}  查看第 idx 个按钮的图片
 */

class AutoIndex {
    constructor() {
        this.app = document.getElementById('app');
        this.basePath = '/pages';
        this.init();
    }

    async init() {
        // 检查是否有从 404 页面的重定向
        this.handleRedirect();
        
        const { pagePath, imageIndex, queryString } = this.parseURL();
        
        if (!pagePath) {
            this.renderError('404', '页面不存在');
            return;
        }

        try {
            const config = await this.loadConfig(pagePath);
            
            if (imageIndex !== null) {
                this.renderImagePage(pagePath, config, imageIndex, queryString);
            } else {
                this.renderButtonsPage(pagePath, config, queryString);
            }
        } catch (error) {
            console.error('Error loading page:', error);
            this.renderError('页面不存在', `找不到页面: ${pagePath}`);
        }
    }

    handleRedirect() {
        // 从 sessionStorage 恢复重定向路径
        const redirectPath = sessionStorage.getItem('redirect_path');
        if (redirectPath) {
            sessionStorage.removeItem('redirect_path');
            // 使用 history.replaceState 恢复正确的 URL
            window.history.replaceState(null, '', redirectPath);
        }
    }

    parseURL() {
        const path = window.location.pathname;
        const queryString = window.location.search.slice(1); // 去掉 ?
        
        // 解析路径: /pagePath 或 /pagePath/image/0
        const match = path.match(/^\/([^\/]+)(?:\/image\/(\d+))?$/);
        
        if (!match || match[1] === 'index.html') {
            return { pagePath: null, imageIndex: null, queryString };
        }

        return {
            pagePath: match[1],
            imageIndex: match[2] !== undefined ? parseInt(match[2]) : null,
            queryString
        };
    }

    async loadConfig(pagePath) {
        const response = await fetch(`${this.basePath}/${pagePath}/config.json`);
        if (!response.ok) {
            throw new Error(`Failed to load config for ${pagePath}`);
        }
        return response.json();
    }

    getResourcePath(pagePath, resource) {
        if (!resource) return null;
        if (resource.startsWith('http')) return resource;
        return `${this.basePath}/${pagePath}/${resource}`;
    }

    /**
     * 解析字体：若提供 fontUrl 则直接使用；若只提供 fontFamily 则自动生成 Google Fonts 链接（含 400,500,600,700 字重）
     */
    getFontUrl(config) {
        if (config.fontUrl) return config.fontUrl;
        if (!config.fontFamily) return null;
        const familyName = config.fontFamily.split(',')[0].trim();
        if (!familyName) return null;
        return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(familyName)}:wght@400;500;600;700&display=swap`;
    }

    ensureFont(config) {
        const fontUrl = this.getFontUrl(config);
        if (!fontUrl) return;
        let link = document.querySelector('link[data-custom-font]');
        if (!link) {
            link = document.createElement('link');
            link.rel = 'stylesheet';
            link.setAttribute('data-custom-font', 'true');
            document.head.appendChild(link);
        }
        if (link.href !== fontUrl) link.href = fontUrl;
    }

    replaceQueryPlaceholder(url, queryString) {
        // 替换 {query} 占位符
        let result = url.replace(/\{query\}/g, queryString || '');
        
        // 替换单个参数占位符 {paramName}
        if (queryString) {
            const params = new URLSearchParams(queryString);
            params.forEach((value, key) => {
                result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
            });
        }
        
        return result;
    }

    buildStyleVars(backgroundColor, textColor) {
        const styleParts = [];
        if (backgroundColor) {
            styleParts.push(`--btn-bg: ${backgroundColor}`);
        }
        if (textColor) {
            styleParts.push(`--btn-text: ${textColor}`);
        }
        return styleParts.length ? ` style="${styleParts.join('; ')}"` : '';
    }

    renderButtonsPage(pagePath, config, queryString) {
        this.ensureFont(config);
        const backgroundUrl = this.getResourcePath(pagePath, config.background);
        const logoUrl = this.getResourcePath(pagePath, config.logo);
        this.updatePageMeta(config.title || pagePath, config.description || '');
        const pageBackgroundColor = config.pageBackgroundColor || config.backgroundColor;
        const pageButtonBackgroundColor = config.pageButtonBackgroundColor || config.buttonBackgroundColor;
        const pageButtonTextColor = config.pageButtonTextColor || config.buttonTextColor;
        const backgroundStyleParts = [];
        if (backgroundUrl) {
            backgroundStyleParts.push(`background-image: url('${backgroundUrl}')`);
        }
        if (pageBackgroundColor) {
            backgroundStyleParts.push(`background-color: ${pageBackgroundColor}`);
        }
        if (config.fontFamily) {
            backgroundStyleParts.push(`font-family: ${config.fontFamily}`);
        }
        const containerStyle = backgroundStyleParts.join('; ');

        this.app.innerHTML = `
            <div class="page-container" style="${containerStyle}">
                <div class="page-overlay">
                    <header class="header">
                        ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="logo">` : ''}
                        <h1 class="page-title">${config.title || pagePath}</h1>
                        ${config.description ? `<p class="page-desc">${config.description}</p>` : ''}
                    </header>
                    <div class="buttons-list">
                        ${config.buttons.map((btn, idx) => {
                            const bg = btn.backgroundColor ?? pageButtonBackgroundColor;
                            const text = btn.textColor ?? pageButtonTextColor;
                            const btnStyle = this.buildStyleVars(bg, text);
                            return `
                            <div class="btn-card" data-index="${idx}"${btnStyle}>
                                <div class="btn-left">
                                    ${btn.icon ? `<div class="icon">${btn.icon}</div>` : ''}
                                    <div class="btn-titles">
                                        <div class="text">${btn.text}</div>
                                        ${btn.subtitle ? `<div class="subtitle">${btn.subtitle}</div>` : ''}
                                    </div>
                                </div>
                                <div class="btn-right">›</div>
                            </div>
                        `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;

        // 绑定点击事件
        this.app.querySelectorAll('.btn-card').forEach(card => {
            card.addEventListener('click', () => {
                const idx = card.dataset.index;
                const newPath = `/${pagePath}/image/${idx}${queryString ? '?' + queryString : ''}`;
                window.location.href = newPath;
            });
        });
    }

    renderImagePage(pagePath, config, imageIndex, queryString) {
        const button = config.buttons[imageIndex];
        
        if (!button) {
            this.renderError('图片不存在', `找不到索引为 ${imageIndex} 的按钮`);
            return;
        }

        const imageUrl = this.getResourcePath(pagePath, button.image);
        const finalLink = this.replaceQueryPlaceholder(button.link, queryString);
        const backUrl = `/${pagePath}${queryString ? '?' + queryString : ''}`;
        const imageTitle = button.text ? `${button.text} - ${config.title || pagePath}` : (config.title || pagePath);
        this.updatePageMeta(imageTitle, config.description || '');
        this.ensureFont(config);
        const imageBackgroundColor = config.imageBackgroundColor || config.backgroundColor;
        const imageButtonBackgroundColor = config.imageButtonBackgroundColor || config.buttonBackgroundColor;
        const imageButtonTextColor = config.imageButtonTextColor || config.buttonTextColor;
        const imagePageStyleParts = [];
        if (imageBackgroundColor) imagePageStyleParts.push(`background-color: ${imageBackgroundColor}`);
        if (config.fontFamily) imagePageStyleParts.push(`font-family: ${config.fontFamily}`);
        const imagePageStyle = imagePageStyleParts.length ? ` style="${imagePageStyleParts.join('; ')}"` : '';
        const btnBg = button.backgroundColor ?? imageButtonBackgroundColor;
        const btnText = button.textColor ?? imageButtonTextColor;
        const imageButtonVarsStyle = this.buildStyleVars(btnBg, btnText);

        this.app.innerHTML = `
            <div class="image-page"${imagePageStyle}>
                <button class="back-btn" aria-label="返回" onclick="window.location.href='${backUrl}'">←</button>
                <div class="image-scroll">
                    ${imageUrl ? `<img src="${imageUrl}" alt="${button.text}">` : ''}
                </div>
                <div class="image-link-float">
                    <a href="${finalLink}" class="btn-card image-link-btn is-compact"${imageButtonVarsStyle} target="_blank" rel="noopener">
                        <div class="link-icon">↓</div>
                        <div class="link-text">
                            ${button.icon ? `<span class="icon">${button.icon}</span>` : ''}
                            <span class="text">${button.linkText || button.text || '前往链接'}</span>
                        </div>
                        <div class="btn-right">›</div>
                    </a>
                </div>
            </div>
        `;

        this.setupImageScrollBehavior();
    }

    setupImageScrollBehavior() {
        const floatBtn = this.app.querySelector('.image-link-btn');
        const image = this.app.querySelector('.image-scroll img');
        if (!floatBtn) return;
        const threshold = 60;

        const applyState = (nearBottom) => {
            floatBtn.classList.toggle('is-ready', nearBottom);
            floatBtn.classList.toggle('is-compact', !nearBottom);
        };

        let ticking = false;
        const updateState = () => {
            const doc = document.documentElement;
            const distanceToBottom = doc.scrollHeight - (window.scrollY + window.innerHeight);
            applyState(distanceToBottom <= threshold);
            ticking = false;
        };
        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(updateState);
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });

        // 等图片加载完再做初次检测，避免高度不正确
        if (image && !image.complete) {
            image.addEventListener('load', () => setTimeout(updateState, 50));
        } else {
            setTimeout(updateState, 50);
        }
    }

    renderError(title, message) {
        this.updatePageMeta(title, message || '');
        this.app.innerHTML = `
            <div class="error-page">
                <h1>😕</h1>
                <h2>${title}</h2>
                <p>${message}</p>
                <a href="/">返回首页</a>
            </div>
        `;
    }

    updatePageMeta(title, description) {
        if (title) {
            document.title = title;
        }
        const meta = document.querySelector('meta[name="description"]');
        if (meta) {
            meta.setAttribute('content', description || '');
        }
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    new AutoIndex();
});
