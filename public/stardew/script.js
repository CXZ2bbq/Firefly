// ==================== 全局配置和状态管理 ====================
const CONFIG = {
    RENDER_DELAY: 150,
    INITIAL_FONT_SIZE: 18,
    DEFAULT_MARGIN_TOP: 30,
    DEFAULT_MARGIN_BOTTOM: 60,
    DEFAULT_MARGIN_H: 20
};

const STATE = {
    mailImages: {},
    mailImageCache: {},
    giftImages: {},
    giftImageCache: {},
    colorPickers: {},
    giftSelectedKeys: []
};

// ==================== 字体管理模块 ====================
const FontManager = {
    async waitForLoad() {
        try {
            await document.fonts.load(`normal 16px "Kingnammm Maiyuan 2"`);
            await document.fonts.ready;
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.warn('字体加载等待失败:', error);
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    },

    async forceRender() {
        const testDiv = document.createElement('div');
        testDiv.style.cssText = `position: absolute; top: -9999px; left: -9999px; font-family: "Kingnammm Maiyuan 2" !important; font-size: 24px !important; opacity: 0;`;
        testDiv.textContent = '字体渲染测试 123 abc';
        document.body.appendChild(testDiv);
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        document.body.removeChild(testDiv);
    },

    getFontStyle(size, weight = 'normal') {
        return `normal ${weight} ${size}px "Kingnammm Maiyuan 2"`;
    }
};

// ==================== 图片管理模块 ====================
const ImageManager = {
    loadDefaults() {
        const mailFiles = ['cropped_image.png', 'cropped_image_1.png', 'cropped_image_2.png', 'cropped_image_3.png', 'cropped_image_4.png', 'JunimoNoteMobile.png', 'textBox.png'];
        const mailNames = { 'cropped_image': '普通信纸1', 'cropped_image_1': '普通信纸2', 'cropped_image_2': '普通信纸3', 'cropped_image_3': '普通信纸4', 'cropped_image_4': '普通信纸5', 'JunimoNoteMobile': 'Junimo笔记', 'textBox': '文本框' };
        
        mailFiles.forEach(file => {
            const key = file.replace('.png', '');
            STATE.mailImages[key] = { name: mailNames[key] || file.replace('.png', ''), path: `./images/${file}` };
            this.preloadImage(key, STATE.mailImages[key].path, STATE.mailImageCache);
        });

        const giftFiles = ['cake.png', 'ticket.png', 'Golden_Pumpkin.png', 'Orange.png', 'pumpkin.png', 'fish.png', 'Beer.png', 'book.png', 'beer1.png', 'chuansong.png', 'Clam.png', 'hanber.png', 'jinding.png', 'kutou.png', 'Secret_Note.png', 'shougu.png', 'shuijin.png', 'wucaisuipian.png', 'xie.png', 'yiding.png', 'zuanshi.png'];
        const giftNames = { 'cake': '蛋糕', 'ticket': '票券', 'Golden_Pumpkin': '黄金南瓜', 'Orange': '橙子', 'pumpkin': '南瓜', 'fish': '鱼', 'Beer': '啤酒', 'book': '书', 'beer1': '啤酒1', 'chuansong': '传送', 'Clam': '蛤蜊', 'hanber': '汉伯', 'jinding': '金锭', 'kutou': '骷髅头', 'Secret_Note': '秘密笔记', 'shougu': '手鼓', 'shuijin': '水晶', 'wucaisuipian': '五彩碎片', 'xie': '蟹', 'yiding': '铱锭', 'zuanshi': '钻石' };

        giftFiles.forEach(file => {
            const key = file.replace('.png', '').replace(/[\s\(\)]+/g, '_');
            STATE.giftImages[key] = { name: giftNames[key] || file.replace('.png', ''), path: `./images/${file}` };
            this.preloadImage(key, STATE.giftImages[key].path, STATE.giftImageCache);
        });

        STATE.giftImages['none'] = { name: '无', path: null };
    },

    preloadImage(key, path, cache) {
        if (!cache[key]) {
            const image = new Image();
            image.crossOrigin = "Anonymous";
            image.src = path;
            cache[key] = image;
        }
    },

    async loadCustom() {
        this.revokeBlobURLs(STATE.mailImages);
        Object.keys(STATE.mailImages).filter(k => k.startsWith('custom_')).forEach(k => delete STATE.mailImages[k]);
        Object.keys(STATE.mailImageCache).filter(k => k.startsWith('custom_')).forEach(k => delete STATE.mailImageCache[k]);

        try {
            const savedData = sessionStorage.getItem('custom_images');
            if (savedData) {
                const mailList = JSON.parse(savedData);
                mailList.forEach(img => {
                    STATE.mailImages[img.key] = { name: img.name, path: img.data };
                    this.preloadImage(img.key, img.data, STATE.mailImageCache);
                });
            }
        } catch (e) {
            console.log('无法从会话存储读取信纸:', e);
        }
    },

    async upload(type, file) {
        if (file.size > 5 * 1024 * 1024) {
            alert('单张图片不能超过5MB！');
            return null;
        }

        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const imageKey = `custom_${Date.now()}_${file.name}`;
                const imageName = file.name.split('.')[0];

                if (type === 'mail') {
                    STATE.mailImages[imageKey] = { name: imageName, path: event.target.result };
                    const savedData = sessionStorage.getItem('custom_images');
                    const mailList = savedData ? JSON.parse(savedData) : [];
                    mailList.push({ key: imageKey, name: imageName, data: event.target.result });
                    sessionStorage.setItem('custom_images', JSON.stringify(mailList));
                } else if (type === 'gift') {
                    STATE.giftImages[imageKey] = { name: imageName, path: event.target.result };
                }

                resolve(imageKey);
            };
            reader.readAsDataURL(file);
        });
    },

    async delete(type, key) {
        if (type === 'mail') {
            delete STATE.mailImages[key];
            delete STATE.mailImageCache[key];
            
            const savedData = sessionStorage.getItem('custom_images');
            if (savedData) {
                const mailList = JSON.parse(savedData);
                const updatedList = mailList.filter(img => img.key !== key);
                sessionStorage.setItem('custom_images', JSON.stringify(updatedList));
            }
        }
    },

    revokeBlobURLs(images) {
        Object.values(images).forEach(img => {
            if (img && img.path && img.path.startsWith('blob:')) {
                URL.revokeObjectURL(img.path);
            }
        });
    }
};

// ==================== UI管理模块 ====================
const UIManager = {
    async initialize() {
        this.initializeValueSpans();
        ImageManager.loadDefaults();
        await ImageManager.loadCustom();
        this.setupEventListeners();
        this.setupRangeInputs();
        this.initializeUIState();
    },

    initializeValueSpans() {
        const valueSpans = document.querySelectorAll('#margin-top-value, #margin-bottom-value, #margin-h-value, #textbox-font-size-value');
        valueSpans.forEach(span => {
            if (span) span.textContent = span.id === 'textbox-font-size-value' ? CONFIG.INITIAL_FONT_SIZE : '';
        });
    },

    setupEventListeners() {
        const inputs = ['body', 'body-letter', 'title', 'signature', 'gift-text', 'margin-top', 'margin-bottom', 'margin-h', 'gift-icon-size', 'gift-font-size'];
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', () => Renderer.updatePreview());
        });

        ['gift-text-before', 'gift-text-after'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', () => Renderer.updatePreview());
        });

        const signatureAlign = document.getElementById('signature-align-left');
        if (signatureAlign) signatureAlign.addEventListener('change', () => Renderer.updatePreview());

        const saveBtn = document.getElementById('save-btn');
        if (saveBtn) saveBtn.addEventListener('click', Renderer.saveImage);

        this.setupContactModal();

        window.addEventListener('resize', () => this.adjustCanvasSize());

        const mailSelect = document.getElementById('mail-img');
        if (mailSelect) {
            mailSelect.addEventListener('change', () => this.handleMailSelectChange());
        }
    },

    setupContactModal() {
        const contactBtn = document.getElementById('contact-link');
        const contactModal = document.getElementById('contact-modal');
        const closeModal = document.getElementById('close-modal');

        if (contactBtn) {
            contactBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (contactModal) contactModal.style.display = 'flex';
            });
        }

        if (closeModal) {
            closeModal.addEventListener('click', () => {
                if (contactModal) contactModal.style.display = 'none';
            });
        }

        if (contactModal) {
            window.addEventListener('click', (e) => {
                if (e.target === contactModal) contactModal.style.display = 'none';
            });
        }
    },

    handleMailSelectChange() {
        // 重置用户标记
        const marginInputs = document.querySelectorAll('#margin-top, #margin-bottom, #margin-h');
        marginInputs.forEach(input => {
            if (input) {
                delete input.dataset.userSet;
            }
        });

        this.updateUIForMailType();
        Renderer.updatePreview();
        this.adjustMarginsForCurrentMail();

        const mailSelect = document.getElementById('mail-img');
        if (mailSelect && mailSelect.value === 'textBox') {
            const fontSizeInput = document.getElementById('textbox-font-size');
            const valueSpan = document.getElementById('textbox-font-size-value');
            if (fontSizeInput) fontSizeInput.value = CONFIG.INITIAL_FONT_SIZE;
            if (valueSpan) valueSpan.textContent = CONFIG.INITIAL_FONT_SIZE;
            this.unlockMarginInputs();
        } else {
            this.lockMarginInputs();
        }
    },

    unlockMarginInputs() {
        const allMarginTopInputs = document.querySelectorAll('#margin-top');
        const allMarginHInputs = document.querySelectorAll('#margin-h');

        allMarginTopInputs.forEach(input => {
            if (input) {
                input.min = '10';
                input.max = '150';
                input.disabled = false;
                input.value = CONFIG.DEFAULT_MARGIN_TOP;
                const valueSpan = input.parentElement?.querySelector('#margin-top-value');
                if (valueSpan) valueSpan.textContent = '';
            }
        });

        allMarginHInputs.forEach(input => {
            if (input) {
                input.value = CONFIG.DEFAULT_MARGIN_H;
                const valueSpan = input.parentElement?.querySelector('#margin-h-value');
                if (valueSpan) valueSpan.textContent = '';
            }
        });
    },

    lockMarginInputs() {
        const allMarginTopInputs = document.querySelectorAll('#margin-top');
        allMarginTopInputs.forEach(input => {
            if (input) {
                input.min = '20';
                input.max = '150';
                input.disabled = false;
                if (parseInt(input.value) < 20) {
                    input.value = '30';
                    const valueSpan = input.parentElement?.querySelector('#margin-top-value');
                    if (valueSpan) valueSpan.textContent = '';
                }
            }
        });
    },

    setupRangeInputs() {
        const rangeInputIds = ['margin-top', 'margin-bottom', 'margin-h', 'textbox-font-size'];

        rangeInputIds.forEach(id => {
            const inputs = document.querySelectorAll(`#${id}`);
            inputs.forEach(input => {
                if (!input) return;

                const valueSpan = input.parentElement?.querySelector(`#${id}-value`);
                if (!valueSpan) return;

                valueSpan.textContent = (id === 'textbox-font-size' && input.value) ? input.value : '';

                input.addEventListener('input', () => {
                    valueSpan.textContent = input.value;
                    
                    // 标记为用户已设置
                    input.dataset.userSet = 'true';
                    
                    if (['margin-top', 'margin-bottom', 'margin-h'].includes(id)) {
                        document.querySelectorAll(`#${id}`).forEach(otherInput => {
                            if (otherInput !== input) {
                                otherInput.value = input.value;
                                otherInput.dataset.userSet = 'true';
                                const otherSpan = otherInput.parentElement?.querySelector(`#${id}-value`);
                                if (otherSpan) otherSpan.textContent = input.value;
                            }
                        });
                    }
                    
                    Renderer.updatePreview();
                });

                input.addEventListener('change', () => {
                    // 标记为用户已设置
                    input.dataset.userSet = 'true';
                    Renderer.updatePreview();
                });
            });
        });
    },

    initializeUIState() {
        this.updateUIForMailType();

        const mailSelect = document.getElementById('mail-img');
        if (mailSelect && mailSelect.value === 'cropped_image') {
            this.adjustMarginsForCurrentMail();
            this.updateUIForMailType();
            setTimeout(() => Renderer.updatePreview(), 100);
        } else {
            setTimeout(() => Renderer.updatePreview(), 100);
        }
    },

    updateUIForMailType() {
        const mailKey = document.getElementById('mail-img')?.value;
        if (!mailKey) return;

        const isTextBox = mailKey === 'textBox';
        const dialogSection = document.getElementById('dialog-section');
        const letterSection = document.getElementById('letter-section');
        const giftSection = document.getElementById('gift-section');
        const saveBtn = document.getElementById('save-btn');

        if (isTextBox) {
            if (dialogSection) dialogSection.style.display = 'block';
            if (letterSection) letterSection.style.display = 'none';
            if (giftSection) giftSection.style.display = 'none';
            if (saveBtn) saveBtn.textContent = '💾 保存对话图片';
        } else {
            if (dialogSection) dialogSection.style.display = 'none';
            if (letterSection) letterSection.style.display = 'block';
            if (giftSection) giftSection.style.display = 'block';
            if (saveBtn) saveBtn.textContent = '💾 保存信件图片';
        }

        this.bindContentListeners();
    },

    bindContentListeners() {
        const mailKey = document.getElementById('mail-img')?.value;
        const isTextBox = mailKey === 'textBox';

        const elements = ['body', 'body-letter', 'title', 'signature', 'gift-text', 'gift-font-size', 'gift-icon-size'];
        elements.forEach(id => {
            const el = document.getElementById(id);
            if (el && el._updateListener) {
                el.removeEventListener('input', el._updateListener);
                el._updateListener = null;
            }
        });

        ['gift-text-before', 'gift-text-after'].forEach(id => {
            const el = document.getElementById(id);
            if (el && el._changeListener) {
                el.removeEventListener('change', el._changeListener);
                el._changeListener = null;
            }
        });

        if (isTextBox) {
            const body = document.getElementById('body');
            if (body) {
                body._updateListener = () => Renderer.updatePreview();
                body.addEventListener('input', body._updateListener);
            }
        } else {
            const inputIds = ['body-letter', 'title', 'signature', 'gift-text', 'gift-font-size', 'gift-icon-size'];
            inputIds.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el._updateListener = () => Renderer.updatePreview();
                    el.addEventListener('input', el._updateListener);
                }
            });

            ['gift-text-before', 'gift-text-after'].forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el._changeListener = () => Renderer.updatePreview();
                    el.addEventListener('change', el._changeListener);
                }
            });

            this.setupGiftSelector();
        }

        const unifiedColorBtn = document.getElementById('unified-color-btn');
        if (unifiedColorBtn) {
            if (unifiedColorBtn._clickListener) {
                unifiedColorBtn.removeEventListener('click', unifiedColorBtn._clickListener);
            }
            unifiedColorBtn._clickListener = (e) => {
                e.stopPropagation();
                this.showUnifiedColorPicker(unifiedColorBtn);
            };
            unifiedColorBtn.addEventListener('click', unifiedColorBtn._clickListener);
        }
    },

    setupGiftSelector() {
        const giftImgList = document.getElementById('gift-img-list');
        if (!giftImgList) return;

        giftImgList.innerHTML = '';

        const noneDiv = document.createElement('div');
        noneDiv.className = 'gift-img-item';
        noneDiv.setAttribute('data-key', 'none');
        noneDiv.title = '无';
        noneDiv.innerHTML = '<span style="font-size:22px;color:#bbb;">无</span>';
        giftImgList.appendChild(noneDiv);

        Object.entries(STATE.giftImages).forEach(([key, img]) => {
            if (key === 'none') return;

            const div = document.createElement('div');
            div.className = 'gift-img-item';
            div.setAttribute('data-key', key);
            div.title = img.name;
            div.style.position = 'relative';

            let inner = '';
            if (img.path) {
                inner += `<img src="${img.path}" alt="${img.name}" style="width:100%;height:100%;object-fit:contain;">`;
            } else {
                inner += `<span style="font-size:22px;color:#bbb;">${img.name || '无图'}</span>`;
            }
            inner += `<div class="gift-img-barrier" style="display:none;position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:10;background:rgba(90,122,43,0.7);border:3px solid #5a7a2b;box-sizing:border-box;"></div>`;
            if (key.startsWith('custom_')) {
                inner += `<div class="delete-gift-btn" title="删除">×</div>`;
            }

            div.innerHTML = inner;
            giftImgList.appendChild(div);
        });

        giftImgList.onclick = (e) => {
            const deleteBtn = e.target.closest('.delete-gift-btn');
            if (deleteBtn) {
                const parent = deleteBtn.closest('.gift-img-item');
                const key = parent.getAttribute('data-key');
                ImageManager.delete('gift', key).then(() => {
                    ImageManager.loadCustom().then(() => {
                        this.setupGiftSelector();
                        Renderer.updatePreview();
                    });
                });
                e.stopPropagation();
                return;
            }

            let target = e.target;
            while (target && !target.classList.contains('gift-img-item')) {
                target = target.parentElement;
            }
            if (target) {
                const key = target.getAttribute('data-key');
                if (key === 'none') {
                    STATE.giftSelectedKeys = [];
                    Array.from(giftImgList.children).forEach(item => {
                        item.classList.remove('selected');
                        const barrier = item.querySelector('.gift-img-barrier');
                        if (barrier) barrier.style.display = 'none';
                    });
                } else if (!STATE.giftSelectedKeys.includes(key)) {
                    STATE.giftSelectedKeys.push(key);
                    target.classList.add('selected');
                    const barrier = target.querySelector('.gift-img-barrier');
                    if (barrier) barrier.style.display = 'block';
                } else {
                    STATE.giftSelectedKeys = STATE.giftSelectedKeys.filter(k => k !== key);
                    target.classList.remove('selected');
                    const barrier = target.querySelector('.gift-img-barrier');
                    if (barrier) barrier.style.display = 'none';
                }
                Renderer.updatePreview();
            }
        };

        STATE.giftSelectedKeys.forEach(key => {
            const item = giftImgList.querySelector(`[data-key="${key}"]`);
            if (item) {
                item.classList.add('selected');
                const barrier = item.querySelector('.gift-img-barrier');
                if (barrier) barrier.style.display = 'block';
            }
        });
    },

    showUnifiedColorPicker(button) {
        if (!STATE.colorPickers['unified']) {
            const colorPicker = document.createElement('div');
            colorPicker.classList.add('color-picker');
            colorPicker.innerHTML = '<input type="color" value="#3c281e" />';
            STATE.colorPickers['unified'] = colorPicker;
            document.body.appendChild(colorPicker);

            colorPicker.querySelector('input').addEventListener('input', (e) => {
                this.applyColorToAll(e.target.value);
            });
        }

        const rect = button.getBoundingClientRect();
        STATE.colorPickers['unified'].style.top = `${rect.bottom + window.scrollY + 5}px`;
        STATE.colorPickers['unified'].style.left = `${rect.left + window.scrollX}px`;
        STATE.colorPickers['unified'].style.display = 'block';
    },

    applyColorToAll(color) {
        const mailKey = document.getElementById('mail-img')?.value;
        const isTextBox = mailKey === 'textBox';

        if (isTextBox) {
            const body = document.getElementById('body');
            if (body) body.setAttribute('data-color', color);
        } else {
            ['title', 'body-letter', 'signature', 'gift-text'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.setAttribute('data-color', color);
            });
        }

        Renderer.updatePreview();
    },

    adjustMarginsForCurrentMail() {
        const mailKey = document.getElementById('mail-img')?.value;
        if (!mailKey) return;

        const mailImg = STATE.mailImages[mailKey];
        if (!mailImg) return;

        let mailImage = STATE.mailImageCache[mailKey];
        if (!mailImage) {
            mailImage = new Image();
            mailImage.crossOrigin = "Anonymous";
            mailImage.src = mailImg.path;
            STATE.mailImageCache[mailKey] = mailImage;
        }

        if (mailImage.complete) {
            this.applyAutoMargins(mailImage.width, mailImage.height, mailKey);
        } else {
            mailImage.onload = () => this.applyAutoMargins(mailImage.width, mailImage.height, mailKey);
        }
    },

    applyAutoMargins(width, height, mailKey) {
        const autoMargins = Renderer.calculateAutoMargins(width, height, mailKey);
        const marginInputs = {
            top: document.querySelectorAll('#margin-top'),
            bottom: document.querySelectorAll('#margin-bottom'),
            h: document.querySelectorAll('#margin-h')
        };

        Object.entries(marginInputs).forEach(([type, inputs]) => {
            inputs.forEach(input => {
                if (!input) return;
                // 只有当用户没有手动设置值时才应用自动边距
                const currentVal = input.value;
                const defaultValue = Math.round(autoMargins[type === 'h' ? 'horizontal' : type]);
                
                // 如果当前值为空或者等于之前的默认值，才更新
                if (!currentVal || currentVal == '' || input.dataset.userSet !== 'true') {
                    input.value = defaultValue;
                    const valueSpan = input.parentElement?.querySelector(`#margin-${type}-value`);
                    if (valueSpan) valueSpan.textContent = '';
                }
            });
        });
    },

    adjustCanvasSize() {
        const canvas = document.getElementById('preview-canvas');
        if (!canvas) return;

        const container = canvas.parentElement;
        const containerWidth = container.clientWidth - 50;

        if (canvas.width > 0) {
            const ratio = canvas.height / canvas.width;
            if (containerWidth < canvas.width) {
                canvas.style.width = containerWidth + 'px';
                canvas.style.height = (containerWidth * ratio) + 'px';
            } else {
                canvas.style.width = canvas.width + 'px';
                canvas.style.height = canvas.height + 'px';
            }
        }
    }
};

// ==================== 渲染器模块 ====================
const Renderer = {
    async updatePreview() {
        await this.performRender();
        await new Promise(resolve => setTimeout(resolve, CONFIG.RENDER_DELAY));
        await this.performRender();
    },

    async performRender() {
        const canvas = document.getElementById('preview-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const mailKey = document.getElementById('mail-img')?.value;
        const mailImg = STATE.mailImages[mailKey];

        if (!mailImg || !mailImg.path) {
            this.renderEmptyCanvas(canvas, ctx);
            return;
        }

        let mailImage = STATE.mailImageCache[mailKey];
        if (!mailImage) {
            mailImage = new Image();
            mailImage.crossOrigin = "Anonymous";
            mailImage.src = mailImg.path;
            STATE.mailImageCache[mailKey] = mailImage;
        }

        if (mailImage.complete) {
            this.renderCanvas(canvas, ctx, mailImage);
        } else {
            mailImage.onload = () => {
                this.renderCanvas(canvas, ctx, mailImage);
            };
            mailImage.onerror = () => {
                this.renderErrorCanvas(canvas, ctx, mailImg.path);
            };
        }
    },

    renderEmptyCanvas(canvas, ctx) {
        canvas.width = 800;
        canvas.height = 600;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#999';
        ctx.font = FontManager.getFontStyle(20);
        ctx.textAlign = 'center';
        ctx.fillText('请选择信纸', canvas.width / 2, canvas.height / 2);
    },

    renderErrorCanvas(canvas, ctx, path) {
        canvas.width = 800;
        canvas.height = 600;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffebee';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#c62828';
        ctx.font = FontManager.getFontStyle(16);
        ctx.textAlign = 'center';
        ctx.fillText('信纸图片加载失败: ' + path, canvas.width / 2, canvas.height / 2);
        ctx.fillText('请检查图片路径是否正确', canvas.width / 2, canvas.height / 2 + 30);
    },

    renderCanvas(canvas, ctx, mailImage) {
        canvas.width = mailImage.width;
        canvas.height = mailImage.height;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(mailImage, 0, 0);

        const mailKey = document.getElementById('mail-img')?.value;
        const isTextBox = mailKey === 'textBox';

        const margins = this.getMargins(mailImage, mailKey);
        const fontSize = this.getFontSize(mailImage, mailKey);

        if (isTextBox) {
            this.renderTextBox(canvas, ctx, margins, fontSize);
        } else {
            this.renderLetter(canvas, ctx, margins, fontSize, mailKey);
        }
    },

    renderTextBox(canvas, ctx, margins, fontSize) {
        const body = document.getElementById('body')?.value || '';
        const bodyColor = document.getElementById('body')?.getAttribute('data-color') || '#3c281e';
        
        ctx.font = FontManager.getFontStyle(fontSize);
        ctx.fillStyle = bodyColor;

        const bodyLines = this.wrapText(ctx, body, canvas.width - 2 * margins.h);
        let y = margins.top;

        bodyLines.forEach(line => {
            ctx.fillText(line, margins.h, y);
            y += fontSize + 4;
        });
    },

    renderLetter(canvas, ctx, margins, fontSize, mailKey) {
        const title = document.getElementById('title')?.value || '';
        const titleColor = document.getElementById('title')?.getAttribute('data-color') || '#3c281e';
        ctx.font = FontManager.getFontStyle(fontSize);
        ctx.fillStyle = titleColor;

        const titleLines = this.wrapText(ctx, title, canvas.width - 2 * margins.h);
        let y = margins.top;

        titleLines.forEach(line => {
            ctx.fillText(line, margins.h, y);
            y += fontSize + 4;
        });

        const body = document.getElementById('body-letter')?.value || '';
        const bodyColor = document.getElementById('body-letter')?.getAttribute('data-color') || '#3c281e';
        ctx.fillStyle = bodyColor;

        const bodyLines = this.wrapText(ctx, body, canvas.width - 2 * margins.h);
        y += 10;

        bodyLines.forEach(line => {
            ctx.fillText(line, margins.h, y);
            y += fontSize + 4;
        });

        const signature = document.getElementById('signature')?.value || '';
        const signatureColor = document.getElementById('signature')?.getAttribute('data-color') || '#3c281e';
        ctx.fillStyle = signatureColor;

        if (signature) {
            const signatureLines = this.wrapText(ctx, signature, canvas.width - 2 * margins.h);
            const alignLeft = document.getElementById('signature-align-left')?.checked;
            ctx.textAlign = alignLeft ? 'left' : 'right';
            const signatureX = alignLeft ? margins.h : canvas.width - margins.h;
            const signY = canvas.height - margins.bottom - 80;

            signatureLines.forEach((line, i) => {
                ctx.fillText(line, signatureX, signY + i * (fontSize + 4));
            });
            ctx.textAlign = 'left';
        }

        this.renderGifts(canvas, ctx, margins, fontSize, mailKey);
    },

    async renderGifts(canvas, ctx, margins, fontSize, mailKey) {
        if (!STATE.giftSelectedKeys || STATE.giftSelectedKeys.length === 0) return;

        const giftText = document.getElementById('gift-text')?.value || '';
        const giftTextColor = document.getElementById('gift-text')?.getAttribute('data-color') || '#3c281e';
        ctx.fillStyle = giftTextColor;

        const giftFontSize = this.getGiftFontSize(fontSize, mailKey);
        ctx.font = FontManager.getFontStyle(giftFontSize);

        const giftIconSize = parseInt(document.getElementById('gift-icon-size')?.value || 45);
        const gap = 10;

        const loadPromises = STATE.giftSelectedKeys.map(async (key) => {
            const giftImg = STATE.giftImages[key];
            if (!giftImg || !giftImg.path) return { key, w: giftIconSize, h: giftIconSize };

            let imgObj = STATE.giftImageCache[key];
            if (!imgObj) {
                imgObj = new Image();
                imgObj.crossOrigin = "Anonymous";
                imgObj.src = giftImg.path;
                STATE.giftImageCache[key] = imgObj;
            }

            if (!imgObj.complete) {
                await new Promise((resolve) => {
                    imgObj.onload = resolve;
                    imgObj.onerror = resolve;
                });
            }

            const h = (imgObj.height / imgObj.width) * giftIconSize || giftIconSize;
            return { key, w: giftIconSize, h, img: imgObj };
        });

        const gifts = await Promise.all(loadPromises);

        let totalWidth = 0;
        gifts.forEach((gift, idx) => {
            totalWidth += gift.w;
            if (idx < gifts.length - 1) totalWidth += gap;
        });

        const textWidth = giftText ? ctx.measureText(giftText).width : 0;
        const giftTextBefore = document.getElementById('gift-text-before')?.checked;

        if (giftText) {
            totalWidth += giftTextBefore ? textWidth + gap : gap + textWidth;
        }

        let x = (canvas.width - totalWidth) / 2;
        const yGift = canvas.height - margins.bottom - 30;

        if (giftText && giftTextBefore) {
            ctx.fillText(giftText, x, yGift + gifts[0].h / 2 + giftFontSize / 3);
            x += textWidth + gap;
        }

        gifts.forEach((gift, idx) => {
            if (gift.img) {
                ctx.drawImage(gift.img, x, yGift, gift.w, gift.h);
            }

            if (giftText && !giftTextBefore && idx === gifts.length - 1) {
                ctx.fillText(giftText, x + gift.w + gap, yGift + gift.h / 2 + giftFontSize / 3);
            }
            x += gift.w + gap;
        });
    },

    getMargins(mailImage, mailKey) {
        const autoMargins = this.calculateAutoMargins(mailImage.width, mailImage.height, mailKey);
        const marginTopInput = document.getElementById('margin-top');
        const marginBottomInput = document.getElementById('margin-bottom');
        const marginHInput = document.getElementById('margin-h');

        return {
            top: parseInt(marginTopInput?.value || autoMargins.top),
            bottom: parseInt(marginBottomInput?.value || autoMargins.bottom),
            h: parseInt(marginHInput?.value || autoMargins.horizontal)
        };
    },

    getFontSize(mailImage, mailKey) {
        const fixedSizeMailKeys = ['cropped_image', 'cropped_image_1', 'cropped_image_2', 'cropped_image_3', 'cropped_image_4'];
        
        if (fixedSizeMailKeys.includes(mailKey)) {
            return 30;
        }

        if (mailKey === 'textBox') {
            const input = document.getElementById('textbox-font-size');
            return input ? parseInt(input.value) : 18;
        }

        if (mailImage.width < 400) return 24;
        if (mailImage.width > 800) return 50;
        return 36;
    },

    getGiftFontSize(fontSize, mailKey) {
        const fixedSizeMailKeys = ['cropped_image', 'cropped_image_1', 'cropped_image_2', 'cropped_image_3', 'cropped_image_4'];
        if (fixedSizeMailKeys.includes(mailKey)) return 18;
        return Math.max(14, Math.min(24, fontSize * 0.5));
    },

    calculateAutoMargins(width, height, mailKey) {
        if (mailKey === 'textBox') {
            return { top: 30, bottom: 60, horizontal: 20 };
        }
        return { top: 30, bottom: 60, horizontal: 20 };
    },

    wrapText(context, text, maxWidth) {
        const lines = [];
        const paragraphs = text.split('\n');

        paragraphs.forEach(paragraph => {
            let currentLine = '';

            for (let i = 0; i < paragraph.length; i++) {
                const char = paragraph[i];
                const testLine = currentLine + char;
                const testWidth = context.measureText(testLine).width;

                if (testWidth > maxWidth && currentLine !== '') {
                    lines.push(currentLine);
                    currentLine = char;
                } else {
                    currentLine = testLine;
                }
            }

            lines.push(currentLine);
        });

        return lines;
    },

    saveImage() {
        const canvas = document.getElementById('preview-canvas');
        if (!canvas) return;

        const mailKey = document.getElementById('mail-img')?.value;
        const isTextBox = mailKey === 'textBox';

        const link = document.createElement('a');
        link.download = isTextBox ? '星露谷对话.png' : '星露谷信件.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }
};

// ==================== 上传处理模块 ====================
const UploadHandler = {
    async upload(type) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/png, image/jpeg';

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const imageKey = await ImageManager.upload(type, file);
            if (!imageKey) return;

            UIManager.setupGiftSelector();
            const mailSelect = document.getElementById('mail-img');
            
            if (type === 'mail' && mailSelect) {
                mailSelect.value = imageKey;
                UIManager.handleMailSelectChange();
            } else if (type === 'gift') {
                if (!STATE.giftSelectedKeys.includes(imageKey)) {
                    STATE.giftSelectedKeys.push(imageKey);
                }
                UIManager.setupGiftSelector();
            }

            Renderer.updatePreview();
        };

        input.click();
    }
};

// ==================== 初始化 ====================
window.addEventListener('DOMContentLoaded', () => {
    UIManager.initialize();
});

// 兼容旧的handleUpload函数
window.handleUpload = (type) => UploadHandler.upload(type);

// 兼容HTML中的保存函数
window.handleSave = () => Renderer.saveImage();
